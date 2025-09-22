import { Layer, Effect, Runtime, Config, ConfigProvider } from 'effect'
import { ConfigError } from '@packages/isomorphic'
import { MongoError } from '../errors/MongoError'
import { LoggerError } from '@packages/isomorphic'
import { MongoConnectionLive } from '../connection/MongoConnectionLive'
import { EventStoreLive } from '../event-store/EventStoreLive'
import {
    AccountRepositoryLive,
    DialogRepositoryLive,
    SystemRepositoryLive,
} from '../repository/SimplifiedRepositories'
import { RepositoryFacadeLive } from './RepositoryFacade'
import { LoggerLayer } from '@packages/isomorphic'
import {
    ConfigService,
    EnvConfigProvider,
    TestConfigProvider,
    makeConfigService,
} from '@packages/isomorphic'
import { ConfigLive } from '@packages/isomorphic'
// Note: Repository type now defined locally in SimplifiedRepositories.ts to avoid import issues

// ============================================================================
// Environment Types
// ============================================================================

export type AppEnvironment = 'development' | 'test' | 'production'

// ============================================================================
// Individual Repository Layers
// ============================================================================

/**
 * Individual repository layers using simplified pattern
 * Each repository is now just 3 lines in SimplifiedRepositories.ts
 */
export const AccountRepoLayer: Layer.Layer<any, ConfigError | MongoError | LoggerError, any> =
    AccountRepositoryLive.pipe(Layer.provide(MongoConnectionLive))

export const DialogRepoLayer: Layer.Layer<any, ConfigError | MongoError | LoggerError, any> =
    DialogRepositoryLive.pipe(Layer.provide(MongoConnectionLive))

export const SystemRepoLayer: Layer.Layer<any, ConfigError | MongoError | LoggerError, any> =
    SystemRepositoryLive.pipe(Layer.provide(MongoConnectionLive))

export const EventStoreLayer = EventStoreLive.pipe(Layer.provide(MongoConnectionLive))

// ============================================================================
// Database Layer Compositions
// ============================================================================

/**
 * Complete database layer with simplified repositories
 * Reduced from ~450 lines to ~30 lines total
 */
export const DatabaseLayer: Layer.Layer<any, ConfigError | MongoError | LoggerError, any> =
    Layer.mergeAll(
        MongoConnectionLive,
        AccountRepoLayer,
        DialogRepoLayer,
        SystemRepoLayer,
        EventStoreLayer,
        RepositoryFacadeLive
    )

/**
 * Minimal database layer for testing
 */
export const TestDatabaseLayer = Layer.mergeAll(
    MongoConnectionLive,
    EventStoreLayer,
    RepositoryFacadeLive
)

// ============================================================================
// Core Service Layers
// ============================================================================

/**
 * Core services that are always required
 */
export const CoreServicesLayer = Layer.mergeAll(LoggerLayer('App'), ConfigLive)

/**
 * Create environment-specific configuration layer
 */
const createConfigLayer = (env: AppEnvironment) => {
    switch (env) {
        case 'test':
            return Layer.effect(ConfigService, makeConfigService(new TestConfigProvider()))
        case 'production':
            return Layer.effect(ConfigService, makeConfigService(new EnvConfigProvider()))
        case 'development':
        default:
            return Layer.effect(ConfigService, makeConfigService(new EnvConfigProvider()))
    }
}

// ============================================================================
// Application Layers by Environment
// ============================================================================

/**
 * Development environment layer
 */
export const DevAppLayer: Layer.Layer<any, ConfigError | MongoError | LoggerError, any> =
    Layer.mergeAll(CoreServicesLayer, createConfigLayer('development'), DatabaseLayer).pipe(
        Layer.provide(LoggerLayer('DevApp'))
    )

/**
 * Test environment layer
 */
export const TestAppLayer = Layer.mergeAll(
    CoreServicesLayer,
    createConfigLayer('test'),
    TestDatabaseLayer
).pipe(Layer.provide(LoggerLayer('TestApp')))

/**
 * Production environment layer
 */
export const ProdAppLayer: Layer.Layer<any, ConfigError | MongoError | LoggerError, any> =
    Layer.mergeAll(CoreServicesLayer, createConfigLayer('production'), DatabaseLayer).pipe(
        Layer.provide(LoggerLayer('ProdApp'))
    )

// ============================================================================
// Main Application Layer
// ============================================================================

/**
 * Complete application layer that includes all repositories and services
 * This can be used as a drop-in replacement for the old createCompleteMongoDB
 */
export const AppLayer: Layer.Layer<any, ConfigError | MongoError | LoggerError, any> =
    Layer.mergeAll(
        MongoConnectionLive,
        AccountRepoLayer,
        DialogRepoLayer,
        SystemRepoLayer,
        EventStoreLayer,
        RepositoryFacadeLive
    )

/**
 * Main application layer that selects the appropriate environment
 * based on NODE_ENV or configuration
 */
export const createAppLayer = (env?: AppEnvironment) => {
    const environment = env || (process.env.NODE_ENV as AppEnvironment)

    switch (environment) {
        case 'test':
            return TestAppLayer
        case 'production':
            return ProdAppLayer
        case 'development':
        default:
            return DevAppLayer
    }
}

// ============================================================================
// Extended Application Layers (with external services)
// ============================================================================

/**
 * Create a full application layer with all services
 * This requires importing external packages and should be used at the app level
 * Note: Commented out due to missing @packages/server package exports
 */
// export const createFullAppLayer = async (env?: AppEnvironment) => {
//     // Dynamic imports to avoid circular dependencies
//     const [
//         isomorphicModule,
//         serverModule,
//         dialogsModule
//     ] = await Promise.all([
//         import('@packages/isomorphic'),
//         import('@packages/server'),
//         import('@packages/dialogs')
//     ])
//
//     const runtime = Runtime.defaultRuntime
//     const baseLayer = createAppLayer(env)
//
//     const DialogServicesLayer = Layer.mergeAll(
//         dialogsModule.AIServiceLive,
//         dialogsModule.ScoringEngineLive,
//         dialogsModule.ContextCompressorLive,
//         dialogsModule.LanguageDetectorLive,
//         dialogsModule.DialogManagerLive
//     )
//
//     return Layer.mergeAll(
//         baseLayer,
//         DialogServicesLayer,
//         isomorphicModule.ReduxServiceLive(runtime),
//         serverModule.ServerServiceLive
//     )
// }

// ============================================================================
// Layer Utilities
// ============================================================================

/**
 * Create a custom application layer with specific service overrides
 */
export const createCustomAppLayer = (
    overrides: {
        config?: Layer.Layer<ConfigService, never, never>
        logger?: Layer.Layer<any, never, never>
        database?: Layer.Layer<any, never, never>
    } = {}
) => {
    const baseLayer = Layer.mergeAll(
        overrides.logger || LoggerLayer('CustomApp'),
        overrides.config || createConfigLayer('development'),
        overrides.database || DatabaseLayer
    )

    return baseLayer
}

/**
 * Create a minimal layer for specific service testing
 */
export const createMinimalLayer = (...layers: Layer.Layer<any, any, any>[]) => {
    return Layer.mergeAll(LoggerLayer('Minimal'), createConfigLayer('test'), ...layers)
}

// ============================================================================
// Runtime Creation
// ============================================================================

/**
 * Create a runtime with the application layer
 */
export const createAppRuntime = (env?: AppEnvironment) =>
    Effect.gen(function* () {
        const layer = createAppLayer(env)
        return yield* Layer.toRuntime(layer)
    })

/**
 * Run an effect with the application layer
 */
export const runWithApp = <A, E>(effect: Effect.Effect<A, E, any>, env?: AppEnvironment) => {
    const layer = createAppLayer(env)
    const runtime = Runtime.defaultRuntime
    return Runtime.runPromise(runtime)(Effect.provide(effect, layer) as Effect.Effect<A, E, never>)
}

// ============================================================================
// Service Access Helpers
// ============================================================================

/**
 * Helper to access database services in a single effect
 */
export const withDatabaseServices = Effect.gen(function* () {
    const mongoModule = yield* Effect.promise(() => import('./MongoDB'))
    const repoFacadeModule = yield* Effect.promise(() => import('./RepositoryFacade'))
    const eventStoreModule = yield* Effect.promise(() => import('../event-store/EventStore'))
    const accountRepoModule = yield* Effect.promise(() => import('../repository/AccountRepository'))
    const dialogRepoModule = yield* Effect.promise(() => import('../repository/DialogRepository'))
    const systemRepoModule = yield* Effect.promise(() => import('../repository/SystemRepository'))

    return {
        db: yield* mongoModule.MongoDB,
        repos: yield* repoFacadeModule.RepositoryFacade,
        events: yield* eventStoreModule.EventStore,
        accounts: yield* accountRepoModule.AccountRepository,
        dialogs: yield* dialogRepoModule.DialogRepository,
        system: yield* systemRepoModule.SystemRepository,
    }
})

// ============================================================================
// Export Types
// ============================================================================

export type DatabaseServices = Effect.Effect.Success<typeof withDatabaseServices>
export type AppLayerType = ReturnType<typeof createAppLayer>
export type AppRuntime = Effect.Effect.Success<ReturnType<typeof createAppRuntime>>
