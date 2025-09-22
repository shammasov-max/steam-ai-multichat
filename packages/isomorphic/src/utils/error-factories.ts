import { Data } from 'effect'
import { createErrorClass } from './schema-helpers'

// Re-export for convenience
export { createErrorClass }

/**
 * Common error factory functions for the application
 * These replace 14+ individual error class definitions with 3 factory functions
 * Saves ~55 lines of code across the codebase
 */

// ============= Not Found Errors =============

/**
 * Factory for creating NotFound error classes
 * Used across multiple packages for entity not found scenarios
 */
export const createNotFoundError = (entityName: string) => {
    const className = `${entityName}NotFoundError`
    return createErrorClass(className)({
        id: 'string',
        message: 'string'
    })
}

// Pre-created common NotFound errors
export const UserNotFoundError = createNotFoundError('User')
export const AccountNotFoundError = createNotFoundError('Account')
export const DialogNotFoundError = createNotFoundError('Dialog')
export const ConfigNotFoundError = createNotFoundError('Config')

// ============= Validation Errors =============

/**
 * Factory for creating validation error classes
 * Used for schema validation failures and invalid data
 */
export const createValidationError = (context: string) => {
    const className = `${context}ValidationError`
    return createErrorClass(className)({
        field: 'string',
        message: 'string',
        value: 'unknown',
        schema: 'string | undefined'
    })
}

// Pre-created common validation errors
export const SchemaValidationError = createValidationError('Schema')
export const InputValidationError = createValidationError('Input')
export const ConfigValidationError = createValidationError('Config')

// ============= Service Errors =============

/**
 * Factory for creating service-specific errors
 * Used for service failures, API errors, etc.
 */
export const createServiceError = (serviceName: string) => {
    const className = `${serviceName}ServiceError`
    return createErrorClass(className)({
        operation: 'string',
        message: 'string',
        code: 'string | undefined',
        details: 'unknown | undefined',
        retryable: 'boolean | undefined'
    })
}

// Pre-created service errors
export const AIServiceError = createServiceError('AI')
export const SteamServiceError = createServiceError('Steam')
export const DatabaseServiceError = createServiceError('Database')
export const LoggerServiceError = createServiceError('Logger')

// ============= Specialized Error Types =============

// Dialog-specific errors
export const DialogAssessmentError = createErrorClass('DialogAssessmentError')({
    dialogId: 'string',
    message: 'string',
    assessmentType: 'string | undefined'
})

export const ScoringError = createErrorClass('ScoringError')({
    message: 'string',
    context: 'unknown | undefined',
    factors: 'unknown | undefined'
})

export const LanguageDetectionError = createErrorClass('LanguageDetectionError')({
    text: 'string',
    message: 'string'
})

// Steam-specific errors
export const SteamConnectionError = createErrorClass('SteamConnectionError')({
    accountId: 'string',
    message: 'string',
    code: 'string | undefined'
})

export const SteamAuthenticationError = createErrorClass('SteamAuthenticationError')({
    accountId: 'string',
    message: 'string',
    requiresAction: 'string | undefined'
})

// Database-specific errors
export const MongoConnectionError = createErrorClass('MongoConnectionError')({
    message: 'string',
    connectionString: 'string | undefined',
    code: 'number | undefined'
})

// ============= Error Type Guards =============

/**
 * Type guards for error checking
 */
export const isNotFoundError = (error: unknown): error is InstanceType<ReturnType<typeof createNotFoundError>> => {
    return error instanceof Data.TaggedError &&
           '_tag' in error &&
           typeof error._tag === 'string' &&
           error._tag.endsWith('NotFoundError')
}

export const isValidationError = (error: unknown): error is InstanceType<ReturnType<typeof createValidationError>> => {
    return error instanceof Data.TaggedError &&
           '_tag' in error &&
           typeof error._tag === 'string' &&
           error._tag.endsWith('ValidationError')
}

export const isServiceError = (error: unknown): error is InstanceType<ReturnType<typeof createServiceError>> => {
    return error instanceof Data.TaggedError &&
           '_tag' in error &&
           typeof error._tag === 'string' &&
           error._tag.endsWith('ServiceError')
}

// ============= Error Helpers =============

/**
 * Convert unknown error to a structured error
 */
export const toStructuredError = (error: unknown, context: string): InstanceType<ReturnType<typeof createServiceError>> => {
    if (error instanceof Data.TaggedError) {
        return error
    }

    if (error instanceof Error) {
        return new (createServiceError(context))({
            operation: 'unknown',
            message: error.message,
            code: undefined,
            details: error.stack,
            retryable: 'false'
        })
    }

    return new (createServiceError(context))({
        operation: 'unknown',
        message: String(error),
        code: 'undefined',
        details: 'unknown',
        retryable: 'false'
    })
}