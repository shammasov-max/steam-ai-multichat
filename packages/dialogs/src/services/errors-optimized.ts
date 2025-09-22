/**
 * Consolidated error definitions using error factories
 * Replaces individual error class definitions across dialog services
 * Saves ~25 lines per service file
 */

import {
    createServiceError,
    createValidationError,
    AIServiceError,
    toStructuredError
} from '@packages/isomorphic'

// ============= AI Service Errors (replaces 5 classes) =============

// Already defined in error-factories.ts: AIServiceError

export const OpenAIAPIError = createServiceError('OpenAIAPI')
export const InvalidResponseError = createValidationError('Response')
export const RateLimitError = createServiceError('RateLimit')
export const ConnectionError = createServiceError('Connection')

// ============= Scoring Engine Errors (replaces 3 classes) =============

export const ScoringError = createServiceError('Scoring')
export const InvalidMetricsError = createValidationError('Metrics')
export const ThresholdExceededError = createServiceError('Threshold')

// ============= Language Detector Errors (replaces 1 class) =============

export const LanguageDetectionError = createServiceError('LanguageDetection')

// ============= Context Compressor Errors (replaces 1 class) =============

export const CompressionError = createServiceError('Compression')

// ============= Error Helpers =============

/**
 * Convert OpenAI API errors to structured errors
 */
export const fromOpenAIError = (error: any) => {
    if (error?.response?.status === 429) {
        return new RateLimitError({
            operation: 'api_call',
            message: 'Rate limit exceeded',
            code: '429',
            details: error.response.data,
            retryable: 'true'
        })
    }

    if (error?.code === 'ECONNREFUSED') {
        return new ConnectionError({
            operation: 'connect',
            message: 'Connection refused',
            code: 'ECONNREFUSED',
            details: error,
            retryable: 'true'
        })
    }

    return new OpenAIAPIError({
        operation: 'api_call',
        message: error?.message || 'Unknown OpenAI error',
        code: String(error?.response?.status || 'unknown'),
        details: error,
        retryable: 'false'
    })
}

/**
 * Type guards for error checking
 */
export const isRateLimitError = (error: unknown): error is InstanceType<typeof RateLimitError> =>
    error instanceof RateLimitError || (error as any)?._tag === 'RateLimitServiceError'

export const isConnectionError = (error: unknown): error is InstanceType<typeof ConnectionError> =>
    error instanceof ConnectionError || (error as any)?._tag === 'ConnectionServiceError'