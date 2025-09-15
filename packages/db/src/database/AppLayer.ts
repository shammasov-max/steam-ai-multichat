import { Layer, Effect, Runtime, Config, ConfigProvider } from 'effect'
import { MongoConnectionLive } from '../connection/MongoConnectionLive'
import { EventStoreLive } from '../event-store/EventStoreLive'
import { AccountRepositoryLive } from '../repository/implementations/AccountRepositoryLive'
import { DialogRepositoryLive } from '../repository/implementations/DialogRepositoryLive'
import { SystemRepositoryLive } from '../repository/implementations/SystemRepositoryLive'
import { RepositoryFacadeLive } from './RepositoryFacade'
import { LoggerLayer } from '@packages/isomorphic'
import { ConfigService, EnvConfigProvider, TestConfigProvider } from '@packages/isomorphic'
import { ConfigLive } from '@packages/isomorphic'

// ============================================================================
// Environment Types
// ============================================================================

export type AppEnvironment = 'development' | 'test' | 'production'

// ============================================================================
// Individual Repository Layers
// ============================================================================

/**
 * Individual repository layers that can be used independently
 */
export const AccountRepoLayer = AccountRepositoryLive.pipe(
    Layer.provide(MongoConnectionLive)
)

export const DialogRepoLayer = DialogRepositoryLive.pipe(
    Layer.provide(MongoConnectionLive)
)

export const SystemRepoLayer = SystemRepositoryLive.pipe(
    Layer.provide(MongoConnectionLive)
)

export const EventStoreLayer = EventStoreLive.pipe(
    Layer.provide(MongoConnectionLive)
)

// ============================================================================
// Database Layer Compositions
// ============================================================================

/**
 * Complete database layer with all repositories
 */
export const DatabaseLayer = Layer.mergeAll(
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
export const CoreServicesLayer = Layer.mergeAll(
    LoggerLayer('App'),
    ConfigLive
)

/**
 * Create environment-specific configuration layer
 */
const createConfigLayer = (env: AppEnvironment) => {
    switch (env) {
        case 'test':
            return Layer.succeed(ConfigService, new TestConfigProvider())
        case 'production':
            return Layer.succeed(ConfigService, new EnvConfigProvider())
        case 'development':
        default:
            return Layer.succeed(ConfigService, new EnvConfigProvider())
    }
}

// ============================================================================
// Application Layers by Environment
// ============================================================================

/**
 * Development environment layer
 */
export const DevAppLayer = Layer.mergeAll(
    CoreServicesLayer,
    createConfigLayer('development'),
    DatabaseLayer
).pipe(
    Layer.provide(LoggerLayer('DevApp'))
)

/**
 * Test environment layer
 */
export const TestAppLayer = Layer.mergeAll(
    CoreServicesLayer,
    createConfigLayer('test'),
    TestDatabaseLayer
).pipe(
    Layer.provide(LoggerLayer('TestApp'))
)

/**
 * Production environment layer
 */
export const ProdAppLayer = Layer.mergeAll(
    CoreServicesLayer,
    createConfigLayer('production'),
    DatabaseLayer
).pipe(
    Layer.provide(LoggerLayer('ProdApp'))
)

// ============================================================================
// Main Application Layer
// ============================================================================

/**
 * Complete application layer that includes all repositories and services
 * This can be used as a drop-in replacement for the old createCompleteMongoDB
 */
export const AppLayer = Layer.mergeAll(
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
    const environment = env || (process.env.NODE_ENV as AppEnvironment) || 'development'
    
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
 */
export const createFullAppLayer = async (env?: AppEnvironment) => {
    // Dynamic imports to avoid circular dependencies
    const [
        { ReduxServiceLive },
        { ServerServiceLive },
        { DialogManagerLive },
        dialogServices
    ] = await Promise.all([
        import('@packages/isomorphic/effect-redux/ReduxService'),
        import('@packages/server/ServerService'),
        import('@packages/dialogs/DialogManagerEffect'),
        import('@packages/dialogs/services')
    ])
    
    const runtime = Runtime.defaultRuntime
    const baseLayer = createAppLayer(env)
    
    const DialogServicesLayer = Layer.mergeAll(
        dialogServices.AIServiceEffectLive,
        dialogServices.ScoringEngineEffectLive,
        dialogServices.ContextCompressorEffectLive,
        dialogServices.LanguageDetectorLive,
        DialogManagerLive
    )
    
    return Layer.mergeAll(
        baseLayer,
        DialogServicesLayer,
        ReduxServiceLive(runtime),
        ServerServiceLive
    )
}

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
    return Layer.mergeAll(
        LoggerLayer('Minimal'),
        createConfigLayer('test'),
        ...layers
    )
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
export const runWithApp = <A, E>(
    effect: Effect.Effect<A, E, any>,
    env?: AppEnvironment
) => {
    const layer = createAppLayer(env)
    return Effect.provide(effect, layer).pipe(
        Runtime.runPromise(Runtime.defaultRuntime)
    )
}

// ============================================================================
// Service Access Helpers
// ============================================================================

/**
 * Helper to access database services in a single effect
 */
export const withDatabaseServices = Effect.gen(function* () {
    const { MongoDB } = yield* import('./MongoDB')
    const { RepositoryFacade } = yield* import('./RepositoryFacade')
    const { EventStore } = yield* import('../event-store/EventStore')
    const { AccountRepository } = yield* import('../repository/AccountRepository')
    const { DialogRepository } = yield* import('../repository/DialogRepository')
    const { SystemRepository } = yield* import('../repository/SystemRepository')
    
    return {
        db: yield* MongoDB,
        repos: yield* RepositoryFacade,
        events: yield* EventStore,
        accounts: yield* AccountRepository,
        dialogs: yield* DialogRepository,
        system: yield* SystemRepository
    }
})

// ============================================================================
// Export Types
// ============================================================================

export type DatabaseServices = Effect.Effect.Success<typeof withDatabaseServices>
export type AppLayerType = ReturnType<typeof createAppLayer>
export type AppRuntime = Effect.Effect.Success<ReturnType<typeof createAppRuntime>>