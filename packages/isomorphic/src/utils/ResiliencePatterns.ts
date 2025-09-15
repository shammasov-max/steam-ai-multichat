import { Effect, Schedule, Duration, Ref, pipe, Option, Data } from 'effect'
import { createError } from '../errors'

// ============================================================================
// Error Types
// ============================================================================

// Explicitly type the error classes to avoid TS4023 and TS4029
export const CircuitBreakerError: ReturnType<typeof createError<'CircuitBreakerError'>> = createError('CircuitBreakerError')
export const RetryExhaustedError: ReturnType<typeof createError<'RetryExhaustedError'>> = createError('RetryExhaustedError')
export const QueueFullError: ReturnType<typeof createError<'QueueFullError'>> = createError('QueueFullError')
export const RateLimitError: ReturnType<typeof createError<'RateLimitError'>> = createError('RateLimitError')
export const TimeoutError: ReturnType<typeof createError<'TimeoutError'>> = createError('TimeoutError')

// ============================================================================
// Retry Policies
// ============================================================================

/**
 * Exponential backoff with jitter
 */
export const exponentialBackoff = (
    baseDelay: Duration.DurationInput,
    maxDelay: Duration.DurationInput = Duration.seconds(30),
    factor: number = 2
) =>
    Schedule.exponential(baseDelay, factor).pipe(
        Schedule.either(Schedule.spaced(maxDelay)),
        Schedule.jittered
    )

/**
 * Linear backoff with maximum attempts
 */
export const linearBackoff = (
    delay: Duration.DurationInput,
    maxAttempts: number = 3
) =>
    Schedule.spaced(delay).pipe(
        Schedule.compose(Schedule.recurs(maxAttempts - 1))
    )

/**
 * Fibonacci backoff (1, 1, 2, 3, 5, 8, 13...)
 */
export const fibonacciBackoff = (
    baseDelay: Duration.DurationInput = Duration.seconds(1),
    maxAttempts: number = 7
) => {
    const fibSequence = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
    let index = 0
    
    // Create a base schedule and apply the delayed transformer to it
    const delaySchedule = pipe(
        Schedule.forever,
        Schedule.delayed(() => {
            const multiplier = fibSequence[Math.min(index++, fibSequence.length - 1)]
            return Duration.millis(Duration.toMillis(baseDelay) * multiplier)
        })
    )
    
    return Schedule.intersect(delaySchedule, Schedule.recurs(maxAttempts - 1))
}

/**
 * Retry with specific error filtering
 */
export const retryWithFilter = <E, A, R>(
    effect: Effect.Effect<A, E, R>,
    shouldRetry: (error: E) => boolean,
    schedule: Schedule.Schedule<any, any, any>
) =>
    Effect.retry(
        effect,
        pipe(
            schedule,
            Schedule.whileInput<E>((error) => shouldRetry(error))
        )
    )

// ============================================================================
// Circuit Breaker Implementation
// ============================================================================

export interface CircuitBreakerConfig {
    readonly failureThreshold: number
    readonly resetTimeout: Duration.DurationInput
    readonly halfOpenMaxAttempts: number
}

export interface CircuitBreakerState {
    readonly status: 'closed' | 'open' | 'half-open'
    readonly failureCount: number
    readonly lastFailureTime: Option.Option<number>
    readonly successCount: number
}

export class CircuitBreaker {
    private constructor(
        private readonly config: CircuitBreakerConfig,
        private readonly state: Ref.Ref<CircuitBreakerState>
    ) {}

    static make = (config: CircuitBreakerConfig) =>
        Effect.gen(function* () {
            const state = yield* Ref.make<CircuitBreakerState>({
                status: 'closed',
                failureCount: 0,
                lastFailureTime: Option.none(),
                successCount: 0
            })
            
            return new CircuitBreaker(config, state)
        })

    private updateState = (
        updater: (state: CircuitBreakerState) => CircuitBreakerState
    ) => Ref.update(this.state, updater)

    private checkAndTransition = () => {
        const self = this
        return Effect.gen(function* () {
            const currentState = yield* Ref.get(self.state)
            const now = Date.now()
            
            if (currentState.status === 'open') {
                const lastFailure = Option.getOrElse(currentState.lastFailureTime, () => 0)
                const resetTimeMs = Duration.toMillis(self.config.resetTimeout)
                
                if (now - lastFailure >= resetTimeMs) {
                    yield* self.updateState(s => ({
                        ...s,
                        status: 'half-open',
                        successCount: 0
                    }))
                    return 'half-open' as const
                }
                return 'open' as const
            }
            
            return currentState.status
        })
    }

    private recordSuccess = () => {
        const self = this
        return Effect.gen(function* () {
            yield* self.updateState(s => {
                if (s.status === 'half-open') {
                    const newSuccessCount = s.successCount + 1
                    if (newSuccessCount >= self.config.halfOpenMaxAttempts) {
                        return {
                            status: 'closed' as const,
                            failureCount: 0,
                            lastFailureTime: Option.none(),
                            successCount: 0
                        }
                    }
                    return { ...s, successCount: newSuccessCount }
                }
                
                if (s.status === 'closed') {
                    return {
                        ...s,
                        failureCount: 0,
                        lastFailureTime: Option.none()
                    }
                }
                
                return s
            })
        })
    }

    private recordFailure = () => {
        const self = this
        return Effect.gen(function* () {
            const now = Date.now()
            
            yield* self.updateState(s => {
                const newFailureCount = s.failureCount + 1
                
                if (s.status === 'half-open') {
                    return {
                        status: 'open' as const,
                        failureCount: newFailureCount,
                        lastFailureTime: Option.some(now),
                        successCount: 0
                    }
                }
                
                if (s.status === 'closed' && newFailureCount >= self.config.failureThreshold) {
                    return {
                        status: 'open' as const,
                        failureCount: newFailureCount,
                        lastFailureTime: Option.some(now),
                        successCount: 0
                    }
                }
                
                return {
                    ...s,
                    failureCount: newFailureCount,
                    lastFailureTime: Option.some(now)
                }
            })
        })
    }

    protect = <E, A, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E | InstanceType<typeof CircuitBreakerError>, R> => {
        const self = this
        return Effect.gen(function* () {
            const status = yield* self.checkAndTransition()
            
            if (status === 'open') {
                const state = yield* Ref.get(self.state)
                const lastFailure = Option.isSome(state.lastFailureTime) 
                    ? state.lastFailureTime.value 
                    : undefined
                
                return yield* Effect.fail(
                    CircuitBreakerError.create(
                        'Circuit breaker is open',
                        undefined,
                        { 
                            state: 'open', 
                            lastFailureTime: lastFailure 
                        }
                    )
                )
            }
            
            return yield* effect.pipe(
                Effect.tap(() => self.recordSuccess()),
                Effect.tapError(() => self.recordFailure())
            )
        })
    }

    getState = () => Ref.get(this.state)

    reset = () =>
        Ref.set(this.state, {
            status: 'closed' as const,
            failureCount: 0,
            lastFailureTime: Option.none(),
            successCount: 0
        })
}

// ============================================================================
// Bulkhead Pattern
// ============================================================================

export interface BulkheadConfig {
    readonly maxConcurrent: number
    readonly maxQueueSize: number
}

export class Bulkhead {
    private constructor(
        private readonly config: BulkheadConfig,
        private readonly semaphore: Effect.Semaphore,
        private readonly queueSize: Ref.Ref<number>
    ) {}

    static make = (config: BulkheadConfig) =>
        Effect.gen(function* () {
            const semaphore = yield* Effect.makeSemaphore(config.maxConcurrent)
            const queueSize = yield* Ref.make(0)
            return new Bulkhead(config, semaphore, queueSize)
        })

    execute = <E, A, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E | InstanceType<typeof QueueFullError>, R> => {
        const self = this
        return Effect.gen(function* () {
            const currentQueueSize = yield* Ref.get(self.queueSize)
            
            if (currentQueueSize >= self.config.maxQueueSize) {
                return yield* Effect.fail(
                    QueueFullError.create('Bulkhead queue is full', undefined, {
                        currentSize: currentQueueSize,
                        maxSize: self.config.maxQueueSize
                    })
                )
            }
            
            yield* Ref.update(self.queueSize, n => n + 1)
            
            return yield* self.semaphore.withPermits(1)(
                effect.pipe(
                    Effect.ensuring(
                        Ref.update(self.queueSize, n => Math.max(0, n - 1))
                    )
                )
            )
        })
    }

    getQueueSize = () => Ref.get(this.queueSize)
}

// ============================================================================
// Rate Limiter
// ============================================================================

export interface RateLimiterConfig {
    readonly maxRequests: number
    readonly window: Duration.DurationInput
}

export class RateLimiter {
    private constructor(
        private readonly config: RateLimiterConfig,
        private readonly tokens: Ref.Ref<number>,
        private readonly lastRefill: Ref.Ref<number>
    ) {}

    static make = (config: RateLimiterConfig) =>
        Effect.gen(function* () {
            const tokens = yield* Ref.make(config.maxRequests)
            const lastRefill = yield* Ref.make(Date.now())
            return new RateLimiter(config, tokens, lastRefill)
        })

    private refillTokens = () => {
        const self = this
        return Effect.gen(function* () {
            const now = Date.now()
            const lastRefillTime = yield* Ref.get(self.lastRefill)
            const windowMs = Duration.toMillis(self.config.window)
            const elapsed = now - lastRefillTime
            
            if (elapsed >= windowMs) {
                yield* Ref.set(self.tokens, self.config.maxRequests)
                yield* Ref.set(self.lastRefill, now)
            }
        })
    }

    acquire = (tokens: number = 1): Effect.Effect<void, InstanceType<typeof RateLimitError>, never> => {
        const self = this
        return Effect.gen(function* () {
            yield* self.refillTokens()
            
            const available = yield* Ref.get(self.tokens)
            
            if (available < tokens) {
                return yield* Effect.fail(
                    RateLimitError.create('Rate limit exceeded', undefined, {
                        available,
                        requested: tokens,
                        maxRequests: self.config.maxRequests
                    })
                )
            }
            
            yield* Ref.update(self.tokens, n => n - tokens)
        })
    }

    getAvailableTokens = () => {
        const self = this
        return Effect.gen(function* () {
            yield* self.refillTokens()
            return yield* Ref.get(self.tokens)
        })
    }
}

// ============================================================================
// Composed Resilience Pattern
// ============================================================================

export interface ResilienceConfig {
    readonly retry?: {
        readonly schedule: Schedule.Schedule<any, any, any>
        readonly filter?: (error: unknown) => boolean
    }
    readonly circuitBreaker?: CircuitBreakerConfig
    readonly timeout?: Duration.DurationInput
    readonly fallback?: Effect.Effect<any, any, any>
    readonly rateLimiter?: RateLimiterConfig
}

export const withResilience = <E, A, R>(
    effect: Effect.Effect<A, E, R>,
    config: ResilienceConfig
): Effect.Effect<A, E | Error | InstanceType<typeof CircuitBreakerError>, R> =>
    Effect.gen(function* () {
        let wrappedEffect: Effect.Effect<A, E | Error | InstanceType<typeof CircuitBreakerError>, R> = effect
        
        // Apply timeout
        if (config.timeout) {
            wrappedEffect = wrappedEffect.pipe(
                Effect.timeoutFail({
                    duration: config.timeout,
                    onTimeout: () => TimeoutError.create('Operation timed out')
                })
            )
        }
        
        // Apply retry
        if (config.retry) {
            wrappedEffect = config.retry.filter
                ? retryWithFilter(wrappedEffect, config.retry.filter as any, config.retry.schedule)
                : Effect.retry(wrappedEffect, config.retry.schedule)
        }
        
        // Apply circuit breaker
        if (config.circuitBreaker) {
            const breaker = yield* CircuitBreaker.make(config.circuitBreaker)
            wrappedEffect = breaker.protect(wrappedEffect) as Effect.Effect<A, E | Error | InstanceType<typeof CircuitBreakerError>, R>
        }
        
        // Apply rate limiter
        if (config.rateLimiter) {
            const limiter = yield* RateLimiter.make(config.rateLimiter)
            wrappedEffect = Effect.zipRight(
                limiter.acquire(),
                wrappedEffect
            )
        }
        
        // Apply fallback
        if (config.fallback) {
            wrappedEffect = Effect.orElse(wrappedEffect, () => config.fallback!)
        }
        
        return yield* wrappedEffect
    })

// ============================================================================
// Export Convenience Functions
// ============================================================================

export const retryWithExponentialBackoff = <E, A, R>(
    effect: Effect.Effect<A, E, R>,
    maxAttempts: number = 3,
    baseDelay: Duration.DurationInput = Duration.seconds(1)
) =>
    Effect.retry(
        effect,
        pipe(
            exponentialBackoff(baseDelay),
            Schedule.compose(Schedule.recurs(maxAttempts - 1))
        )
    )

export const withCircuitBreaker = <E, A, R>(
    effect: Effect.Effect<A, E, R>,
    failureThreshold: number = 5,
    resetTimeout: Duration.DurationInput = Duration.seconds(60)
): Effect.Effect<A, E | InstanceType<typeof CircuitBreakerError>, R> =>
    Effect.gen(function* () {
        const breaker = yield* CircuitBreaker.make({
            failureThreshold,
            resetTimeout,
            halfOpenMaxAttempts: 3
        })
        return yield* breaker.protect(effect)
    })

export const withRateLimit = <E, A, R>(
    effect: Effect.Effect<A, E, R>,
    maxRequests: number = 100,
    window: Duration.DurationInput = Duration.minutes(1)
): Effect.Effect<A, E | InstanceType<typeof RateLimitError>, R> =>
    Effect.gen(function* () {
        const limiter = yield* RateLimiter.make({
            maxRequests,
            window
        })
        yield* limiter.acquire()
        return yield* effect
    })