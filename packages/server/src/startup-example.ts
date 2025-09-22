import { Effect, Layer, pipe } from 'effect'
import { configureStore } from '@reduxjs/toolkit'
import {
    Env,
    EnvLive,
    SystemStateService,
    SystemStateServiceLive,
    ReduxStore,
    initializeSystemState,
    LoggerLayer,
    systemReducer
} from '@packages/isomorphic'
import {
    MongoConnection,
    MongoConnectionLive,
    SystemRepository,
    SystemRepositoryLive
} from '@packages/db'

/**
 * Example startup sequence showing the new configuration approach
 *
 * 1. Load minimal env vars (MONGODB_URL, NODE_ENV)
 * 2. Connect to MongoDB
 * 3. Load system state from database
 * 4. Initialize Redux store with system state
 * 5. Provide SystemStateService to all services
 */
export const startApplication = Effect.gen(function* () {
    // 1. Get environment configuration
    const env = yield* Env
    yield* Effect.log(`Starting application in ${env.nodeEnv} mode`)

    // 2. Initialize system state from database
    const systemRepo = yield* SystemRepository
    const systemState = yield* systemRepo.initialize()
    yield* Effect.log('System state loaded from database')

    // 3. Create Redux store
    const store = configureStore({
        reducer: {
            system: systemReducer,
            // Add other slices here
        },
        devTools: env.nodeEnv !== 'production'
    })

    // 4. Initialize Redux with system state
    yield* initializeSystemState(store, systemState)
    yield* Effect.log('Redux store initialized with system state')

    // 5. Provide store to SystemStateService
    yield* Effect.provideService(ReduxStore, store)(Effect.void)

    // 6. Access configuration through SystemStateService
    const systemStateService = yield* SystemStateService
    const config = systemStateService.get()

    yield* Effect.log('Application configured:', {
        database: {
            poolSize: config.database.poolSize,
            cacheCapacity: config.database.cache.capacity
        },
        openai: {
            enabled: config.openai.enabled,
            model: config.openai.model
        },
        server: {
            port: config.server.port,
            host: config.server.host
        }
    })

    // 7. Subscribe to configuration changes
    yield* systemStateService.subscribe((newConfig) => {
        console.log('Configuration updated:', newConfig)
    })

    return { store, systemState }
})

/**
 * Complete application layer composition
 */
export const AppStartupLayer = pipe(
    // Base layers
    Layer.mergeAll(
        LoggerLayer,
        EnvLive,
        MongoConnectionLive,
        SystemRepositoryLive
    ),
    // Add SystemStateService that depends on Redux store
    Layer.provideMerge(SystemStateServiceLive)
)

/**
 * Run the application
 */
export const runApp = () =>
    pipe(
        startApplication,
        Effect.provide(AppStartupLayer),
        Effect.runPromise
    )

// Example of runtime configuration update
export const updateConfiguration = (store: any, patch: any) =>
    Effect.gen(function* () {
        const systemStateService = yield* SystemStateService

        // Update configuration
        yield* systemStateService.update(patch)

        // Save to database
        const systemRepo = yield* SystemRepository
        const newState = systemStateService.get()
        yield* systemRepo.save(newState)

        yield* Effect.log('Configuration updated and saved to database')
    })