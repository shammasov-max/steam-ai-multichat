import { Effect, Context, Layer, Data } from 'effect'

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

export type LogMetadata = Record<string, unknown>

export type LogEntry<TMetadata extends LogMetadata = LogMetadata> = {
    timestamp: string
    level: LogLevel
    service: string
    message: string
    error?: string
    stack?: string
} & TMetadata

// Error types for Logger
export class LoggerError extends Data.TaggedError('LoggerError')<{
    readonly message: string
    readonly cause?: unknown
}> {}

export interface LoggerService {
    readonly debug: <TMetadata extends LogMetadata = LogMetadata>(
        message: string,
        metadata?: TMetadata
    ) => Effect.Effect<void, LoggerError>

    readonly info: <TMetadata extends LogMetadata = LogMetadata>(
        message: string,
        metadata?: TMetadata
    ) => Effect.Effect<void, LoggerError>

    readonly warn: <TMetadata extends LogMetadata = LogMetadata>(
        message: string,
        error?: Error,
        metadata?: TMetadata
    ) => Effect.Effect<void, LoggerError>

    readonly error: <TMetadata extends LogMetadata = LogMetadata>(
        message: string,
        error?: Error,
        metadata?: TMetadata
    ) => Effect.Effect<void, LoggerError>

    readonly timer: (
        operation: string
    ) => Effect.Effect<() => Effect.Effect<void, LoggerError>, LoggerError>
}

export class Logger extends Context.Tag('Logger')<Logger, LoggerService>() {}

// Implementation
export const createLoggerService = (serviceName: string): LoggerService => {
    const log = <TMetadata extends LogMetadata = LogMetadata>(
        level: LogLevel,
        message: string,
        error?: Error,
        metadata: TMetadata = {} as TMetadata
    ): Effect.Effect<void, LoggerError> =>
        Effect.sync(() => {
            const entry: LogEntry<TMetadata> = {
                timestamp: new Date().toISOString(),
                level,
                service: serviceName,
                message,
                ...(error ? { error: error.message, stack: error.stack } : {}),
                ...metadata,
            } as LogEntry<TMetadata>

            console.log(JSON.stringify(entry))
        }).pipe(
            Effect.catchAll(cause =>
                Effect.fail(
                    new LoggerError({
                        message: `Failed to log message: ${message}`,
                        cause,
                    })
                )
            )
        )

    return {
        serviceName,

        debug: <TMetadata extends LogMetadata = LogMetadata>(
            message: string,
            metadata: TMetadata = {} as TMetadata
        ) => log('DEBUG', message, undefined, metadata),

        info: <TMetadata extends LogMetadata = LogMetadata>(
            message: string,
            metadata: TMetadata = {} as TMetadata
        ) => log('INFO', message, undefined, metadata),

        warn: <TMetadata extends LogMetadata = LogMetadata>(
            message: string,
            error?: Error,
            metadata: TMetadata = {} as TMetadata
        ) => log('WARN', message, error, metadata),

        error: <TMetadata extends LogMetadata = LogMetadata>(
            message: string,
            error?: Error,
            metadata: TMetadata = {} as TMetadata
        ) => log('ERROR', message, error, metadata),

        timer: (operation: string) =>
            Effect.sync(() => {
                const start = Date.now()
                return () =>
                    Effect.sync(() => {
                        const duration = Date.now() - start
                        const entry: LogEntry = {
                            timestamp: new Date().toISOString(),
                            level: 'INFO',
                            service: serviceName,
                            message: `${operation} completed`,
                            duration,
                            operation,
                        }
                        console.log(JSON.stringify(entry))
                    }).pipe(
                        Effect.catchAll(cause =>
                            Effect.fail(
                                new LoggerError({
                                    message: `Failed to log timer for operation: ${operation}`,
                                    cause,
                                })
                            )
                        )
                    )
            }).pipe(
                Effect.catchAll(cause =>
                    Effect.fail(
                        new LoggerError({
                            message: `Failed to create timer for operation: ${operation}`,
                            cause,
                        })
                    )
                )
            ),
    }
}

// Layer factory
export const LoggerLayer = (serviceName: string) =>
    Layer.succeed(Logger, createLoggerService(serviceName))

// Helper function to create a logger effect
export const createLogger = (serviceName: string) =>
    Effect.provideService(Logger, createLoggerService(serviceName))

// Convenience functions for use within Effect programs
export const logDebug = <TMetadata extends LogMetadata = LogMetadata>(
    message: string,
    metadata?: TMetadata
) => Effect.flatMap(Logger, logger => logger.debug(message, metadata))

export const logInfo = <TMetadata extends LogMetadata = LogMetadata>(
    message: string,
    metadata?: TMetadata
) => Effect.flatMap(Logger, logger => logger.info(message, metadata))

export const logWarn = <TMetadata extends LogMetadata = LogMetadata>(
    message: string,
    error?: Error,
    metadata?: TMetadata
) => Effect.flatMap(Logger, logger => logger.warn(message, error, metadata))

export const logError = <TMetadata extends LogMetadata = LogMetadata>(
    message: string,
    error?: Error,
    metadata?: TMetadata
) => Effect.flatMap(Logger, logger => logger.error(message, error, metadata))

export const logTimer = (operation: string) =>
    Effect.flatMap(Logger, logger => logger.timer(operation))
