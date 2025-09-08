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

export class SimpleLogger {
    constructor(private serviceName: string) {}

    private log<TMetadata extends LogMetadata = LogMetadata>(
        level: LogLevel, 
        message: string, 
        error?: Error, 
        metadata: TMetadata = {} as TMetadata
    ): void {
        const entry: LogEntry<TMetadata> = {
            timestamp: new Date().toISOString(),
            level,
            service: this.serviceName,
            message,
            ...(error ? { error: error.message, stack: error.stack } : {}),
            ...metadata
        } as LogEntry<TMetadata>

        console.log(JSON.stringify(entry))
    }

    debug<TMetadata extends LogMetadata = LogMetadata>(message: string, metadata: TMetadata = {} as TMetadata): void {
        this.log('DEBUG', message, undefined, metadata)
    }

    info<TMetadata extends LogMetadata = LogMetadata>(message: string, metadata: TMetadata = {} as TMetadata): void {
        this.log('INFO', message, undefined, metadata)
    }

    warn<TMetadata extends LogMetadata = LogMetadata>(message: string, error?: Error, metadata: TMetadata = {} as TMetadata): void {
        this.log('WARN', message, error, metadata)
    }

    error<TMetadata extends LogMetadata = LogMetadata>(message: string, error?: Error, metadata: TMetadata = {} as TMetadata): void {
        this.log('ERROR', message, error, metadata)
    }

    timer(operation: string): () => void {
        const start = Date.now()
        return () => {
            const duration = Date.now() - start
            this.info(`${operation} completed`, { duration, operation })
        }
    }
}

export const createLogger = (serviceName: string): SimpleLogger => new SimpleLogger(serviceName)