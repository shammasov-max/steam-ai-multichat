/**
 * Main entry point for the dummy-front package
 *
 * This file initializes the Redux store with Effect-saga middleware,
 * loads test data using scenario builders, and provides utilities
 * for headless testing and browser debugging.
 */

import { Effect, Runtime, Layer, Console, Logger } from 'effect'
import { createScenario, ScenarioBuilder } from './test-utils/scenario-builder'
import { withStore, type TestStore, type RootState } from './store/store-factory'
import { StoreService, ActionStream, StoreLayer } from './store/store-factory'
import { ConfigService } from './store/config'
import { runSagaTest, matchers, effects } from './saga-tests/test-runner'

// Global state for browser access
let globalStore: TestStore | null = null
let globalRuntime: Runtime.Runtime<never> | null = null

/**
 * Initialize the Redux store with Effect-saga middleware
 */
export const initializeStore = Effect.gen(function* () {
    yield* Effect.log('🚀 Initializing dummy-front store...')

    const store = yield* StoreService
    const { stream, emit } = yield* ActionStream

    // Store globally for browser access
    globalStore = store

    yield* Effect.log(`✅ Store initialized with ${Object.keys(store.getState()).length} slices`)

    return { store, stream, emit }
})

/**
 * Load test data scenarios into the store
 */
export const loadTestData = (scenario: 'simple' | 'complex' | 'custom' = 'complex') =>
    Effect.gen(function* () {
        yield* Effect.log(`📊 Loading test data scenario: ${scenario}`)

        const store = yield* StoreService
        let actions: any[] = []
        let metadata: any = {}

        switch (scenario) {
            case 'simple':
                const simple = createScenario.simpleAccount()
                actions = simple.actions
                metadata = { accountId: simple.accountId, type: 'simple' }
                break

            case 'complex':
                const complex = createScenario.fullSystem()
                actions = complex.actions
                metadata = { accountIds: complex.accountIds, type: 'complex' }
                break

            case 'custom':
                const builder = new ScenarioBuilder()
                builder.configureSystem({
                    rateLimitPerMinute: 30,
                    maxDialogsPerAccount: 5,
                })

                // Create multiple accounts with different states
                const connectedAccounts = Array.from({ length: 3 }, () => builder.connectedAccount())
                const failedAccount = builder.accountWithFailedAuth('Invalid 2FA code')

                // Create dialogs for connected accounts
                connectedAccounts.forEach((accountId, index) => {
                    builder.createDialog({
                        accountId,
                        messageCount: 5 + index * 3,
                        withAssessment: true,
                        continuationScore: 0.8 - index * 0.1,
                    })

                    if (index === 1) {
                        builder.dialogWithAlert(accountId)
                    }
                })

                actions = builder.getActions()
                metadata = {
                    connectedAccounts,
                    failedAccount,
                    type: 'custom',
                }
                break
        }

        // Dispatch all actions
        yield* Effect.log(`📦 Dispatching ${actions.length} actions...`)
        for (const action of actions) {
            store.dispatch(action)
            yield* Effect.sleep(5) // Small delay to ensure ordering
        }

        const finalState = store.getState()
        const accountCount = Object.keys(finalState.accounts.entities).length
        const dialogCount = Object.keys(finalState.dialogs.entities).length

        yield* Effect.log(`✅ Test data loaded: ${accountCount} accounts, ${dialogCount} dialogs`)

        return {
            actions,
            metadata,
            state: finalState,
            counts: { accounts: accountCount, dialogs: dialogCount },
        }
    })

/**
 * Setup global test utilities for browser/console access
 */
export const setupGlobalUtilities = Effect.gen(function* () {
    yield* Effect.log('🛠️ Setting up global test utilities...')

    const store = yield* StoreService
    const { stream, emit } = yield* ActionStream
    const config = yield* ConfigService

    // Global utilities object
    const utilities = {
        // Store access
        store,
        getState: () => store.getState(),
        dispatch: (action: any) => {
            console.log('🔄 Dispatching:', action.type, action)
            store.dispatch(action)
        },

        // Scenario builders
        scenarios: {
            simple: () => createScenario.simpleAccount(),
            complex: () => createScenario.fullSystem(),
            accountWithDialog: () => createScenario.accountWithDialog(),
            failedAuth: () => createScenario.accountWithFailedAuth(),
            nearingLimit: () => createScenario.dialogNearingLimit(),
        },

        // Test runners
        runTest: (name: string, testFn: any) => {
            console.log(`🧪 Running test: ${name}`)
            return Runtime.runPromise(
                globalRuntime || Runtime.defaultRuntime,
                runSagaTest(name, testFn).pipe(
                    Effect.provide(StoreLayer),
                    Effect.provide(Layer.succeed(ConfigService, config))
                )
            )
        },

        // Action matchers
        matchers,

        // Effect helpers for console
        effects: {
            ...effects,
            waitFor: (predicate: any, timeout = 5000) => {
                console.log(`⏳ Waiting for action (${timeout}ms)...`)
                return new Promise((resolve, reject) => {
                    const timer = setTimeout(() => reject(new Error('Timeout')), timeout)
                    const subscription = stream.pipe(
                        Effect.runSync
                    )
                    // Note: This is simplified for demo - real implementation would use proper Stream subscription
                })
            },
        },

        // Debugging helpers
        debug: {
            logState: () => {
                const state = store.getState()
                console.log('📊 Current State:', state)
                return state
            },
            logAccounts: () => {
                const accounts = store.getState().accounts.entities
                console.log('👥 Accounts:', accounts)
                return accounts
            },
            logDialogs: () => {
                const dialogs = store.getState().dialogs.entities
                console.log('💬 Dialogs:', dialogs)
                return dialogs
            },
            logActions: (count = 10) => {
                console.log(`📜 Last ${count} actions would be shown here`)
                // In a real implementation, this would show recent actions
            },
        },

        // Configuration
        config,
    }

    // Expose globally for browser console access
    if (typeof window !== 'undefined') {
        ;(window as any).dummyFront = utilities
        yield* Effect.log('🌐 Global utilities exposed as window.dummyFront')
    }

    if (typeof global !== 'undefined') {
        ;(global as any).dummyFront = utilities
        yield* Effect.log('🌍 Global utilities exposed as global.dummyFront')
    }

    yield* Effect.log('✅ Global test utilities ready')

    return utilities
})

/**
 * Setup action logging for visibility
 */
export const setupActionLogging = Effect.gen(function* () {
    const { stream } = yield* ActionStream

    yield* Effect.log('📝 Setting up action logging...')

    // Note: In a real implementation, this would set up a proper stream subscription
    // For now, we just log that it's configured
    yield* Effect.log('✅ Action logging configured (stream subscription would be here)')

    return stream
})

/**
 * Main initialization function
 */
export const initializeDummyFront = (
    options: {
        loadData?: 'simple' | 'complex' | 'custom' | false
        setupGlobals?: boolean
        enableLogging?: boolean
    } = {}
) =>
    Effect.gen(function* () {
        const {
            loadData = 'complex',
            setupGlobals = true,
            enableLogging = true,
        } = options

        yield* Effect.log('🎯 Starting dummy-front initialization...')

        // Initialize store
        const { store } = yield* initializeStore

        // Setup action logging if enabled
        if (enableLogging) {
            yield* setupActionLogging
        }

        // Load test data if requested
        let testData = null
        if (loadData) {
            testData = yield* loadTestData(loadData)
        }

        // Setup global utilities if requested
        let utilities = null
        if (setupGlobals) {
            utilities = yield* setupGlobalUtilities
        }

        yield* Effect.log('🎉 Dummy-front initialization complete!')

        return {
            store,
            testData,
            utilities,
            state: store.getState(),
        }
    })

/**
 * Console output for headless runs
 */
export const logHeadlessStatus = (result: any) => {
    console.log('\n🤖 DUMMY-FRONT HEADLESS STATUS')
    console.log('================================')
    console.log(`✅ Store initialized: ${!!result.store}`)
    console.log(`📊 Test data loaded: ${!!result.testData}`)
    console.log(`🛠️ Utilities available: ${!!result.utilities}`)

    if (result.testData) {
        console.log(`📈 Accounts: ${result.testData.counts.accounts}`)
        console.log(`💬 Dialogs: ${result.testData.counts.dialogs}`)
        console.log(`🎭 Scenario: ${result.testData.metadata.type}`)
    }

    console.log('\n🔗 Access utilities via: global.dummyFront or window.dummyFront')
    console.log('📚 Available commands:')
    console.log('  - dummyFront.debug.logState()')
    console.log('  - dummyFront.scenarios.simple()')
    console.log('  - dummyFront.runTest("test-name", testFn)')
    console.log('  - dummyFront.dispatch(action)')
    console.log('================================\n')
}

/**
 * Create the Effect runtime and start initialization
 */
const createMainRuntime = () => {
    const config = {
        enableDevTools: true,
        debug: true,
        sagaTimeout: 5000,
    }

    const mainLayer = StoreLayer.pipe(
        Layer.provide(Layer.succeed(ConfigService, config))
    )

    return Runtime.make(mainLayer)
}

/**
 * Main execution function
 */
export const main = async (options?: Parameters<typeof initializeDummyFront>[0]) => {
    try {
        const runtime = await Effect.runPromise(createMainRuntime())
        globalRuntime = runtime

        const result = await Runtime.runPromise(
            runtime,
            initializeDummyFront(options)
        )

        // Log status for headless runs
        logHeadlessStatus(result)

        return result
    } catch (error) {
        console.error('❌ Failed to initialize dummy-front:', error)
        throw error
    }
}

// Auto-initialize if this is the main module
if (typeof window !== 'undefined' || typeof process !== 'undefined') {
    // Browser or Node.js environment
    main().catch(console.error)
}

// Export key utilities for external use
export {
    globalStore,
    createScenario,
    ScenarioBuilder,
    runSagaTest,
    matchers,
    effects,
}

// Export types
export type { TestStore, RootState }