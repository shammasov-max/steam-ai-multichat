import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { Effect, Runtime, Logger, LogLevel, Layer, Context } from 'effect'
import { NoSuchElementException } from 'effect/Cause'

// Import services for testing
import { ConfigService, TestLoggerLayer, type DummyFrontConfig } from './store/config'
import { StoreLayer, StoreService, ActionStream } from './store/store-factory'

/**
 * Test runtime configuration
 */
export interface TestRuntimeConfig extends DummyFrontConfig {
    /** Suppress console output during tests */
    silentConsole: boolean
    /** Enable test debugging */
    testDebug: boolean
    /** Override saga timeout for tests */
    testSagaTimeout: number
}

/**
 * Default test configuration
 */
const testConfig: TestRuntimeConfig = {
    enableDevTools: false, // Disabled in tests
    debug: false, // Disabled by default, can be enabled per test
    silentConsole: !process.env.VITEST_VERBOSE,
    testDebug: Boolean(process.env.TEST_DEBUG),
    startupDelay: 0, // No delay in tests
    sagaTimeout: 3000, // Shorter timeout for tests
    testSagaTimeout: 3000,
}

/**
 * Test configuration service
 */
export class TestConfigService extends Context.Tag('TestConfigService')<
    TestConfigService,
    TestRuntimeConfig
>() {}

/**
 * Test configuration layer
 */
export const TestConfigLayer = Layer.succeed(TestConfigService, testConfig)

/**
 * Silent console for tests
 */
const createSilentConsole = () => ({
    log: () => {},
    warn: () => {},
    error: () => {},
    info: () => {},
    debug: () => {},
    trace: () => {},
    clear: () => {},
    count: () => {},
    countReset: () => {},
    dir: () => {},
    dirxml: () => {},
    group: () => {},
    groupCollapsed: () => {},
    groupEnd: () => {},
    table: () => {},
    time: () => {},
    timeEnd: () => {},
    timeLog: () => {},
    timeStamp: () => {},
    profile: () => {},
    profileEnd: () => {},
    assert: () => {},
})

/**
 * Test logger layer with conditional silence
 */
export const TestLoggerLayer = Layer.unwrapEffect(
    Effect.gen(function* () {
        const config = yield* TestConfigService

        if (config.silentConsole) {
            // Silent logger for tests
            return Logger.replace(
                Logger.defaultLogger,
                Logger.make(() => {
                    // Silent implementation
                })
            ).pipe(Layer.merge(Logger.minimumLogLevel(LogLevel.None)))
        } else {
            // Verbose logger for debugging
            return Logger.replace(
                Logger.defaultLogger,
                Logger.make(({ logLevel, message, annotations }) => {
                    const timestamp = new Date().toISOString()
                    const level = logLevel.label.toUpperCase()
                    console.log(`[${timestamp}] [TEST:${level}] ${message}`, annotations)
                })
            ).pipe(Layer.merge(Logger.minimumLogLevel(LogLevel.Debug)))
        }
    })
)

/**
 * Test runtime with all necessary layers
 */
export const TestRuntime = Runtime.defaultRuntime.pipe(
    Runtime.provideLayer(
        Layer.mergeAll(
            TestConfigLayer,
            TestLoggerLayer
        )
    )
)

/**
 * Test store runtime with full application context
 */
export const TestStoreRuntime = Runtime.defaultRuntime.pipe(
    Runtime.provideLayer(
        Layer.mergeAll(
            TestConfigLayer,
            TestLoggerLayer,
            StoreLayer.pipe(
                Layer.provide(
                    Layer.succeed(ConfigService, {
                        enableDevTools: false,
                        debug: testConfig.testDebug,
                        sagaTimeout: testConfig.testSagaTimeout,
                    })
                )
            )
        )
    )
)

/**
 * Global test state
 */
let globalRuntime: Runtime.Runtime<never> | null = null
let originalConsole: Console | null = null

/**
 * Setup function for Effect-based tests
 */
export const setupEffectTest = () => {
    return Effect.gen(function* () {
        const config = yield* TestConfigService

        if (config.silentConsole && typeof console !== 'undefined') {
            originalConsole = console
            Object.assign(console, createSilentConsole())
        }

        yield* Effect.log('Test setup completed')
    })
}

/**
 * Cleanup function for Effect-based tests
 */
export const cleanupEffectTest = () => {
    return Effect.gen(function* () {
        // Restore console if it was silenced
        if (originalConsole) {
            Object.assign(console, originalConsole)
            originalConsole = null
        }

        yield* Effect.log('Test cleanup completed')
    })
}

/**
 * Helper to run effects in tests with proper runtime
 */
export const runTestEffect = <A, E>(
    effect: Effect.Effect<A, E, any>
): Promise<A> => {
    return Effect.runPromise(
        effect.pipe(
            Effect.provide(TestConfigLayer),
            Effect.provide(TestLoggerLayer)
        )
    )
}

/**
 * Helper to run store effects in tests
 */
export const runStoreTestEffect = <A, E>(
    effect: Effect.Effect<A, E, StoreService | ActionStream | TestConfigService>
): Promise<A> => {
    return Effect.runPromise(
        effect.pipe(
            Effect.provide(TestStoreRuntime)
        )
    )
}

/**
 * Helper to create isolated test runtime
 */
export const createTestRuntime = (config?: Partial<TestRuntimeConfig>) => {
    const mergedConfig = { ...testConfig, ...config }

    return Runtime.defaultRuntime.pipe(
        Runtime.provideLayer(
            Layer.mergeAll(
                Layer.succeed(TestConfigService, mergedConfig),
                TestLoggerLayer
            )
        )
    )
}

/**
 * Helper to catch expected Effect errors
 */
export const expectEffectError = <E>(errorType: new (...args: any[]) => E) => ({
    toThrow: async <A>(effect: Effect.Effect<A, E, any>) => {
        try {
            await runTestEffect(effect)
            throw new Error(`Expected effect to throw ${errorType.name} but it succeeded`)
        } catch (error) {
            if (error instanceof errorType) {
                return error
            }
            throw new Error(`Expected ${errorType.name} but got ${error?.constructor?.name || error}`)
        }
    }
})

/**
 * Helper to wait for effect with timeout
 */
export const waitForEffect = <A, E>(
    effect: Effect.Effect<A, E, any>,
    timeoutMs = 5000
) => {
    return Effect.timeout(effect, timeoutMs).pipe(
        Effect.catchTag('TimeoutException', () =>
            Effect.fail(new Error(`Effect timed out after ${timeoutMs}ms`))
        )
    )
}

/**
 * Mock console utility for capturing console output
 */
export const createMockConsole = () => {
    const messages: string[] = []

    const mockConsole = {
        log: (message: string) => messages.push(message),
        warn: (message: string) => messages.push(`warn: ${message}`),
        error: (message: string) => messages.push(`error: ${message}`),
        info: (message: string) => messages.push(`info: ${message}`),
        debug: (message: string) => messages.push(`debug: ${message}`),
        trace: (message: string) => messages.push(`trace: ${message}`),
        clear: () => messages.splice(0, messages.length),
        count: () => {},
        countReset: () => {},
        dir: () => {},
        dirxml: () => {},
        group: () => {},
        groupCollapsed: () => {},
        groupEnd: () => {},
        table: () => {},
        time: () => {},
        timeEnd: () => {},
        timeLog: () => {},
        timeStamp: () => {},
        profile: () => {},
        profileEnd: () => {},
        assert: () => {},
    }

    return { mockConsole, messages }
}

// Global setup and teardown
beforeAll(async () => {
    globalRuntime = TestRuntime

    // Run global setup effect
    await runTestEffect(setupEffectTest())
})

afterAll(async () => {
    // Run global cleanup effect
    await runTestEffect(cleanupEffectTest())

    globalRuntime = null
})

// Per-test cleanup
beforeEach(() => {
    // Clear any test-specific state if needed
})

afterEach(() => {
    // Cleanup any test-specific resources
})

/**
 * Export test utilities
 */
export {
    TestRuntime,
    TestStoreRuntime,
    TestConfigService,
    TestConfigLayer,
}

/**
 * Type exports for test utilities
 */
export type { TestRuntimeConfig }