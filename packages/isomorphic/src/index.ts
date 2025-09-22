// ============= Effect Patterns =============
export * as effectPatterns from './effect-patterns'
// Re-export Effect types to fix TS4023 errors
export type { Channel } from 'effect/Channel'
export type { Sink } from 'effect/Sink'
export type { Stream } from 'effect/Stream'
export type { NodeInspectSymbol } from 'effect/Inspectable'

// ============= Entity Definition =============
export { defineEntity } from './define-entity'
export {
    entities,
    Account,
    Dialog,
    System,
    createRootReducer,
    AllRepositoriesLayer,
    mocks,
    type AccountEntity,
    type DialogEntity,
    type SystemEntity,
} from './entities'

// ============= Base utilities =============
export {
    createEntitySlice,
    addEntity,
    removeEntity,
    updateEntity,
    isEntityWithId,
    type EntityWithId,
    type EntityState,
    type EntityActionPayload,
    type EntityReducer,
    type EntityReducersMap,
    type CreateEntitySliceConfig,
} from './base/createEntitySlice'

// ============= Entity Slices =============
export * from './slices/index'

// ============= Store setup helpers =============
export {
    sliceReducers,
    sliceActions,
    sliceSelectors,
    rootReducer,
    type RootState,
} from './slices/index'

// ============= Events =============
export * from './events/meta'

// ============= Branded Types =============
export {
    AccountId,
    DialogId,
    SystemId,
    SteamID64,
    createAccountId,
    createDialogId,
    getSystemId,
    isAccountId,
    isDialogId,
    isSystemId,
} from './types/branded'

// ============= Configuration =============
export { Env, EnvLive, EnvTest, type EnvConfig } from './config'
export {
    SystemStateService,
    SystemStateServiceLive,
    ReduxStore,
    initializeSystemState,
} from './system-state-service'

// ============= Utils =============
export {
    // Effect-based logger
    Logger,
    LoggerLayer,
    LoggerError,
    createLoggerService,
    logDebug,
    logInfo,
    logWarn,
    logError,
    logTimer,
    type LogLevel,
    type LogMetadata,
    type LogEntry,
    type LoggerService,
    // Resilience patterns
    exponentialBackoff,
    linearBackoff,
    fibonacciBackoff,
    CircuitBreaker,
    withResilience,
    retryWithExponentialBackoff,
    CircuitBreakerError,
    RetryExhaustedError,
    QueueFullError,
    RateLimitError,
    TimeoutError,
    // Error factories
    createServiceError,
    createValidationError,
    createNotFoundError,
    AIServiceError,
    SteamServiceError,
    DatabaseServiceError,
    LoggerServiceError,
    toStructuredError,
    isServiceError,
    isValidationError,
    isNotFoundError,
} from './utils'

// ============= Effect-Redux Integration =============
export * from './effect-redux/index'
export { ReduxService, createReduxLayer } from './effect-redux/ReduxService'

// ============= Effect Patterns =============
export {
    tag,
    entityAction,
    brandedId,
    indexed,
    defineService,
    serviceLayer,
    error,
    mockService,
    stateService,
    retry,
    resilient,
    quick,
    logged,
    withTimeout,
    createCircuitBreaker,
    createRateLimiter,
    testLayer,
    type ServiceDefinition,
    type CircuitBreakerConfig,
    type Op,
} from './patterns'

// Re-export Effect types directly from Effect (already exported by patterns.ts)
export type {
    Effect,
    Context,
    Layer,
    Data,
    Ref,
} from 'effect'
