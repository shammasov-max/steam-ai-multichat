import { Effect, Runtime, Layer, Logger, LogLevel, Config } from 'effect'
import { JSDOM } from 'jsdom'
import type { UnknownAction } from '@reduxjs/toolkit'

// Import store and test utilities
import { createTestStore, withStore, type RootState } from '../store/store-factory'
import { ConfigService, defaultConfig } from '../store/config'
import { ScenarioBuilder } from '../test-utils/scenario-builder'
import { runSagaTest, type SagaTestContext } from '../saga-tests/test-runner'

/**
 * Node.js test runner for CI/CD environments
 *
 * This provides a pure Node.js execution environment for running
 * Redux/Effect-saga tests without browser overhead.
 */

/**
 * Runner configuration
 */
export interface NodeRunnerConfig {
    /** Enable verbose logging */
    verbose?: boolean
    /** Test timeout in milliseconds */
    timeout?: number
    /** Enable Redux DevTools (requires remotedev-server) */
    devTools?: boolean
    /** Parallel test execution */
    parallel?: boolean
    /** Maximum parallel tests */
    maxConcurrency?: number
}

/**
 * Test result structure
 */
export interface TestResult {
    name: string
    passed: boolean
    duration: number
    error?: Error
    logs: string[]
}

/**
 * Node runner service
 */
export class NodeRunner extends Context.Tag('NodeRunner')<
    NodeRunner,
    {
        readonly config: NodeRunnerConfig
        readonly results: TestResult[]
        readonly addResult: (result: TestResult) => Effect.Effect<void>
    }
>() {}

/**
 * Create Node runner layer
 */
export const NodeRunnerLayer = (config: NodeRunnerConfig = {}) =>
    Layer.sync(NodeRunner, () => {
        const results: TestResult[] = []

        return {
            config: {
                verbose: config.verbose ?? false,
                timeout: config.timeout ?? 10000,
                devTools: config.devTools ?? false,
                parallel: config.parallel ?? false,
                maxConcurrency: config.maxConcurrency ?? 4,
            },
            results,
            addResult: (result: TestResult) =>
                Effect.sync(() => {
                    results.push(result)
                }),
        }
    })

/**
 * Setup Node.js environment with minimal DOM polyfills
 */
export const setupNodeEnvironment = Effect.gen(function* () {
    // Create minimal DOM environment for Redux DevTools compatibility
    if (typeof window === 'undefined') {
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost:3000',
            pretendToBeVisual: true,
            resources: 'usable',
        })

        // Add minimal globals
        ;(global as any).window = dom.window
        ;(global as any).document = dom.window.document
        ;(global as any).navigator = dom.window.navigator
        ;(global as any).requestAnimationFrame = (callback: Function) => {
            return setTimeout(callback, 0)
        }
        ;(global as any).cancelAnimationFrame = clearTimeout

        yield* Effect.log('Node environment setup with JSDOM polyfills')
    }
})

/**
 * Run a single test in Node environment
 */
export const runNodeTest = <A, E>(
    name: string,
    test: (ctx: SagaTestContext) => Effect.Effect<A, E, never>
) =>
    Effect.gen(function* () {
        const runner = yield* NodeRunner
        const startTime = Date.now()
        const logs: string[] = []

        // Custom logger to capture test output
        const TestLogger = Logger.make(({ logLevel, message }) => {
            const log = `[${logLevel.label}] ${message}`
            logs.push(log)
            if (runner.config.verbose) {
                console.log(log)
            }
        })

        try {
            // Run test with custom logger
            const result = yield* pipe(
                runSagaTest(name, test),
                Effect.provide(
                    Layer.mergeAll(
                        ConfigLayer,
                        Logger.replace(Logger.defaultLogger, TestLogger)
                    )
                ),
                Effect.timeout(runner.config.timeout)
            )

            const testResult: TestResult = {
                name,
                passed: true,
                duration: Date.now() - startTime,
                logs,
            }

            yield* runner.addResult(testResult)
            yield* Effect.log(`✅ Test passed: ${name}`)

            return result
        } catch (error) {
            const testResult: TestResult = {
                name,
                passed: false,
                duration: Date.now() - startTime,
                error: error as Error,
                logs,
            }

            yield* runner.addResult(testResult)
            yield* Effect.log(`❌ Test failed: ${name}`)

            throw error
        }
    })

/**
 * Run multiple tests in parallel
 */
export const runParallelTests = <A, E>(
    tests: Array<{
        name: string
        test: (ctx: SagaTestContext) => Effect.Effect<A, E, never>
    }>
) =>
    Effect.gen(function* () {
        const runner = yield* NodeRunner

        if (!runner.config.parallel) {
            // Run sequentially
            for (const { name, test } of tests) {
                yield* runNodeTest(name, test)
            }
        } else {
            // Run in parallel with concurrency limit
            yield* Effect.forEach(
                tests,
                ({ name, test }) => runNodeTest(name, test),
                { concurrency: runner.config.maxConcurrency }
            )
        }

        return runner.results
    })

/**
 * Test suite runner
 */
export class TestSuite {
    private tests: Array<{
        name: string
        test: (ctx: SagaTestContext) => Effect.Effect<any, any, never>
    }> = []

    /**
     * Add a test to the suite
     */
    test(name: string, test: (ctx: SagaTestContext) => Effect.Effect<any, any, never>) {
        this.tests.push({ name, test })
        return this
    }

    /**
     * Run all tests in the suite
     */
    run(config?: NodeRunnerConfig) {
        return Effect.gen(function* () {
            yield* Effect.log(`Running test suite with ${this.tests.length} tests`)
            yield* setupNodeEnvironment

            const results = yield* runParallelTests(this.tests).pipe(
                Effect.provide(NodeRunnerLayer(config))
            )

            // Print summary
            const passed = results.filter((r) => r.passed).length
            const failed = results.filter((r) => !r.passed).length
            const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

            yield* Effect.log(`
Test Suite Summary:
==================
Total: ${results.length}
Passed: ${passed} ✅
Failed: ${failed} ❌
Duration: ${totalDuration}ms

${results
    .map(
        (r) =>
            `${r.passed ? '✅' : '❌'} ${r.name} (${r.duration}ms)${
                r.error ? `\n   Error: ${r.error.message}` : ''
            }`
    )
    .join('\n')}
            `)

            if (failed > 0) {
                yield* Effect.fail(new Error(`${failed} test(s) failed`))
            }

            return results
        }.bind(this))
    }
}

/**
 * Quick test runner for CI
 */
export const runCI = (config?: NodeRunnerConfig) => {
    const suite = new TestSuite()

    // Add standard test scenarios
    suite
        .test('Account Connection Flow', (ctx) =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()
                const accountId = builder.connectedAccount()

                for (const action of builder.getActions()) {
                    yield* ctx.dispatch(action)
                }

                const state = yield* ctx.getState()
                const account = state.accounts.entities[accountId]

                return account?.status === 'connected'
            })
        )
        .test('Dialog Creation and Messaging', (ctx) =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()
                const accountId = builder.connectedAccount()
                const dialogId = builder.createDialog({ accountId, messageCount: 5 })

                for (const action of builder.getActions()) {
                    yield* ctx.dispatch(action)
                }

                const state = yield* ctx.getState()
                const dialog = state.dialogs.entities[dialogId]

                return dialog?.messages.length === 5
            })
        )
        .test('Complex System Scenario', (ctx) =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()
                const scenario = builder.complexScenario()

                for (const action of scenario.actions) {
                    yield* ctx.dispatch(action)
                }

                const state = yield* ctx.getState()
                return scenario.accountIds.length > 0
            })
        )

    return Runtime.runPromise(Runtime.defaultRuntime)(suite.run(config))
}

/**
 * Export for direct CLI usage
 */
if (require.main === module) {
    runCI({
        verbose: process.env.CI === 'true',
        parallel: true,
        maxConcurrency: 4,
    })
        .then(() => {
            console.log('✅ All tests passed')
            process.exit(0)
        })
        .catch((error) => {
            console.error('❌ Tests failed:', error)
            process.exit(1)
        })
}