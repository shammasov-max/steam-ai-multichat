import { Effect } from 'effect'
import {
    LogLevel,
    LogMetadata,
    LogEntry,
    createLoggerService,
    type LoggerService,
} from './LoggerService'

export type { LogLevel, LogMetadata, LogEntry }

/**
 * Backward-compatible SimpleLogger wrapper around Effect-based LoggerService
 * This class provides synchronous API for gradual migration
 */
export class SimpleLogger {
    private loggerService: LoggerService

    constructor(private serviceName: string) {
        // Create the Effect service instance directly
        this.loggerService = createLoggerService(serviceName)
    }

    debug<TMetadata extends LogMetadata = LogMetadata>(
        message: string,
        metadata: TMetadata = {} as TMetadata
    ): void {
        Effect.runSync(this.loggerService.debug(message, metadata))
    }

    info<TMetadata extends LogMetadata = LogMetadata>(
        message: string,
        metadata: TMetadata = {} as TMetadata
    ): void {
        Effect.runSync(this.loggerService.info(message, metadata))
    }

    warn<TMetadata extends LogMetadata = LogMetadata>(
        message: string,
        error?: Error,
        metadata: TMetadata = {} as TMetadata
    ): void {
        Effect.runSync(this.loggerService.warn(message, error, metadata))
    }

    error<TMetadata extends LogMetadata = LogMetadata>(
        message: string,
        error?: Error,
        metadata: TMetadata = {} as TMetadata
    ): void {
        Effect.runSync(this.loggerService.error(message, error, metadata))
    }

    timer(operation: string): () => void {
        const timerEffect = Effect.runSync(this.loggerService.timer(operation))
        return () => {
            Effect.runSync(timerEffect())
        }
    }
}

export const createLogger = (serviceName: string): SimpleLogger => new SimpleLogger(serviceName)
