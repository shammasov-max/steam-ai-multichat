// Export Effect-based logger service
export {
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
} from './LoggerService'

// Export backward-compatible wrapper
export { SimpleLogger, createLogger } from './LoggerServiceBackcompat'

// Aliases for backward compatibility
export { createLogger as createSimpleLogger } from './LoggerServiceBackcompat'

import type { LogLevel, LogEntry } from './LoggerService'

export type SimpleLogLevel = LogLevel
export type SimpleLogEntry = LogEntry
