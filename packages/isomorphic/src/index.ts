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
export { sliceReducers, sliceActions, sliceSelectors, type RootState } from './slices/index'

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
    type AccountId as AccountIdType,
    type DialogId as DialogIdType,
    type SystemId as SystemIdType,
    type SteamID64 as SteamID64Type,
} from './types/branded'

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
} from './utils'

// ============= Configuration =============
export * from './config/index'

// ============= Effect-Redux Integration =============
export * from './effect-redux/index'

// ============= Effect Patterns =============
export {
    tag,
    serviceTag,
    schema,
    timestamped,
    entityAction,
    serviceLayer,
    syncLayer,
    factoryLayer,
    repositoryTag,
    inMemoryRepository,
    error,
    mockService,
    mockLayer,
    stateService,
    type Op,
    type ServiceOps,
    type OpsOf,
    type Repository,
    type DeepPartial,
    type SuccessOf,
    type ErrorOf,
    type ContextOf,
    type RequireKeys
} from './effect-patterns/type-utils'

export * from './effect-patterns/index'
