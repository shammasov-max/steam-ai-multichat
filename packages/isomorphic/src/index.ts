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
    SimpleLogger,
    createSimpleLogger,
    type SimpleLogLevel,
    type SimpleLogEntry,
    // Effect-based logger
    Logger,
    LoggerLayer,
    LoggerError,
    createLogger,
    logDebug,
    logInfo,
    logWarn,
    logError,
    logTimer,
    type LogLevel,
    type LogMetadata,
    type LogEntry,
    type LoggerService,
} from './utils'

// ============= Configuration =============
export * from './config/index'

// ============= Effect-Redux Integration =============
export * from './effect-redux/index'
