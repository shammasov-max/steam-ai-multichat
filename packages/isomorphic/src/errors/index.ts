import { Data } from 'effect'

// ============================================================================
// Generic Error Factory
// ============================================================================

/**
 * Creates a tagged error class with standard fields
 */
export const createError = <T extends string>(
    tag: T,
    defaultMessage?: string
) => {
    return class extends Data.TaggedError(tag)<{
        readonly message: string
        readonly cause?: unknown
        readonly metadata?: Record<string, unknown>
    }> {
        static create(
            message: string = defaultMessage ?? `${tag} error occurred`,
            cause?: unknown,
            metadata?: Record<string, unknown>
        ) {
            return new this({ 
                message, 
                cause,
                ...(metadata !== undefined && { metadata })
            })
        }

        static fromError(error: unknown, metadata?: Record<string, unknown>) {
            if (error instanceof Error) {
                return new this({
                    message: error.message,
                    cause: error,
                    ...(metadata !== undefined && { metadata })
                })
            }
            return new this({
                message: String(error),
                cause: error,
                ...(metadata !== undefined && { metadata })
            })
        }
    }
}

// ============================================================================
// Common Error Types
// ============================================================================

export const ServiceError = createError('ServiceError')
export const ValidationError = createError('ValidationError')
export const NetworkError = createError('NetworkError')
export const TimeoutError = createError('TimeoutError')
export const RateLimitError = createError('RateLimitError')
export const AuthenticationError = createError('AuthenticationError')
export const AuthorizationError = createError('AuthorizationError')
export const ResourceNotFoundError = createError('ResourceNotFoundError')
export const ResourceConflictError = createError('ResourceConflictError')
export const InvalidStateError = createError('InvalidStateError')
export const CircuitBreakerError = createError('CircuitBreakerError')
export const QueueFullError = createError('QueueFullError')

// ============================================================================
// Domain-Specific Error Factories
// ============================================================================

/**
 * Creates a service-specific error with operation context
 */
export const createServiceError = <T extends string>(serviceName: T) => {
    const tag = `${serviceName}Error` as const
    return class extends Data.TaggedError(tag)<{
        readonly operation: string
        readonly message: string
        readonly cause?: unknown
        readonly context?: Record<string, unknown>
    }> {
        static create(
            operation: string,
            message: string,
            cause?: unknown,
            context?: Record<string, unknown>
        ) {
            return new this({ 
                operation, 
                message, 
                cause,
                ...(context !== undefined && { context })
            })
        }
    }
}

/**
 * Creates a repository error with entity context
 */
export const createRepositoryError = <T extends string>(entityName: T) => {
    const tag = `${entityName}RepositoryError` as const
    return class extends Data.TaggedError(tag)<{
        readonly operation: 'find' | 'save' | 'delete' | 'update'
        readonly entityId?: string
        readonly message: string
        readonly cause?: unknown
    }> {
        static notFound(entityId: string) {
            return new this({
                operation: 'find',
                entityId,
                message: `${entityName} not found: ${entityId}`
            })
        }

        static saveFailed(entityId: string, cause?: unknown) {
            return new this({
                operation: 'save',
                entityId,
                message: `Failed to save ${entityName}: ${entityId}`,
                cause
            })
        }

        static deleteFailed(entityId: string, cause?: unknown) {
            return new this({
                operation: 'delete',
                entityId,
                message: `Failed to delete ${entityName}: ${entityId}`,
                cause
            })
        }
    }
}

/**
 * Creates an API error with HTTP context
 */
export const createApiError = <T extends string>(apiName: T) => {
    const tag = `${apiName}ApiError` as const
    return class extends Data.TaggedError(tag)<{
        readonly endpoint: string
        readonly method: string
        readonly statusCode?: number
        readonly message: string
        readonly response?: unknown
    }> {
        static fromResponse(
            endpoint: string,
            method: string,
            statusCode: number,
            response?: unknown
        ) {
            return new this({
                endpoint,
                method,
                statusCode,
                message: `${apiName} API error: ${statusCode}`,
                response
            })
        }
    }
}

// ============================================================================
// Error Helpers
// ============================================================================

/**
 * Type guard for checking if an error has a specific tag
 */
export const isTaggedError = <T extends { _tag: string }>(
    error: unknown,
    tag: T['_tag']
): error is T => {
    return (
        typeof error === 'object' &&
        error !== null &&
        '_tag' in error &&
        error._tag === tag
    )
}

/**
 * Extract a user-friendly message from any error
 */
export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return String(error.message)
    }
    return String(error)
}

/**
 * Extract metadata from a tagged error
 */
export const getErrorMetadata = (error: unknown): Record<string, unknown> | undefined => {
    if (
        typeof error === 'object' &&
        error !== null &&
        'metadata' in error &&
        typeof error.metadata === 'object'
    ) {
        return error.metadata as Record<string, unknown>
    }
    return undefined
}

// ============================================================================
// Re-export for convenience
// ============================================================================

export { Data } from 'effect'