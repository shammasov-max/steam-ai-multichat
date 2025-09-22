import { Effect, Context, Layer, Ref, Data, Duration, Schedule, pipe, Option } from 'effect'
import * as S from 'effect/Schema'
import { Logger } from './utils/LoggerService'

// Export all Effect types to prevent TS4023 errors
export * from 'effect'

// ============================================================================
// Core Types
// ============================================================================

export type Op<A, E = never, R = never> = Effect.Effect<A, E, R>

// ============================================================================
// Error Factory
// ============================================================================

/**
 * Create a tagged error with factory methods
 */
export const error = <Tag extends string>(tag: Tag, defaultMessage: string) => {
    class ErrorClass extends Data.TaggedError(tag)<{
        readonly message: string
        readonly cause?: unknown
        readonly context?: Record<string, unknown>
    }> {
        static make(cause?: unknown, context?: Record<string, unknown>) {
            return new ErrorClass({
                message: defaultMessage,
                cause,
                ...(context ? { context } : {}),
            })
        }

        static create(operation: string, details?: string, cause?: unknown) {
            return new ErrorClass({
                message: `${defaultMessage}: ${operation}${details ? ` - ${details}` : ''}`,
                cause,
            })
        }
    }
    return ErrorClass
}

// ============================================================================
// Service Definition
// ============================================================================

/**
 * Create a Context.Tag with simplified syntax
 */
export const tag = <Name extends string, Service>(name: Name) => {
    return class extends Context.Tag(name)<any, Service>() {} as Context.Tag<Service, Service>
}

/**
 * Create a service layer with automatic error handling
 */
export const serviceLayer = <T extends Context.Tag<any, any>>(
    tag: T,
    implementation: () => Op<Context.Tag.Service<T>>
) => Layer.effect(tag, implementation)

/**
 * Define a complete service with tag, implementation, and layer
 */
export interface ServiceDefinition<Name extends string, Service> {
    tag: Context.Tag<Service, Service>
    layer: Layer.Layer<Service>
    mock: (impl: Partial<Service>) => Layer.Layer<Service>
}

export const defineService = <Name extends string, Service>(
    name: Name,
    implementation: () => Op<Service>,
    dependencies?: Layer.Layer<any>
): ServiceDefinition<Name, Service> => {
    const ServiceTag = tag<Name, Service>(name)

    const ServiceLayer = dependencies
        ? Layer.effect(ServiceTag, implementation).pipe(Layer.provide(dependencies))
        : Layer.effect(ServiceTag, implementation)

    const mock = (impl: Partial<Service>) =>
        Layer.succeed(ServiceTag, impl as Service)

    return {
        tag: ServiceTag,
        layer: ServiceLayer,
        mock,
    }
}

// ============================================================================
// Schema Utilities
// ============================================================================

/**
 * Create a branded ID schema
 */
export const brandedId = <Name extends string>(name: Name) =>
    S.String.pipe(S.brand(`${name}Id`))

/**
 * Add indexes annotation to schema
 */
export const indexed = <A, I, R>(
    schema: S.Schema<A, I, R>,
    indexes: Array<{ fields: Record<string, 1 | -1>; options?: Record<string, any> }>
) => schema.annotations({ indexes })

/**
 * Create entity action schema
 */
export const entityAction = <Name extends string>(
    entityName: Name,
    additionalFields?: Record<string, S.Schema.Any>
) => {
    const idField = `${entityName}Id` as const
    return S.Struct({
        [idField]: S.String,
        ...(additionalFields ?? {}),
    })
}

// ============================================================================
// Resilience Patterns
// ============================================================================

const ResilienceError = error('ResilienceError', 'Resilience operation failed')
const RetryError = error('RetryError', 'Max retries exceeded')
const TimeoutError = error('TimeoutError', 'Operation timed out')

/**
 * Simple retry with exponential backoff and structured logging
 * Perfect for prototypes and MVPs
 */
export const retry = <R, E, A>(
    operation: string,
    effect: Effect.Effect<A, E, R>,
    options?: {
        maxAttempts?: number
        initialDelay?: number // milliseconds
        maxDelay?: number // milliseconds
        onError?: (error: E, attempt: number) => Effect.Effect<void>
    }
): Effect.Effect<A, E | InstanceType<typeof RetryError>, R | Logger> => {
    const {
        maxAttempts = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        onError
    } = options || {}

    const schedule = pipe(
        Schedule.exponential(Duration.millis(initialDelay), 2),
        Schedule.either(Schedule.spaced(Duration.millis(maxDelay))),
        Schedule.compose(Schedule.recurs(maxAttempts - 1))
    )

    return Effect.gen(function* () {
        const logger = yield* Logger
        const startTime = Date.now()
        let currentAttempt = 1

        // Log operation start
        yield* logger.info(`Starting operation: ${operation}`, {
            maxAttempts,
            initialDelay,
            maxDelay
        })

        const attemptWithLogging = pipe(
            effect,
            Effect.tap(() => {
                const duration = Date.now() - startTime
                return logger.info(`Operation succeeded: ${operation}`, {
                    attempt: currentAttempt,
                    duration,
                    success: true
                })
            }),
            Effect.tapError((error) =>
                Effect.gen(function* () {
                    yield* logger.error(
                        `Operation failed: ${operation}`,
                        error instanceof Error ? error : undefined,
                        {
                            attempt: currentAttempt,
                            maxAttempts,
                            willRetry: currentAttempt < maxAttempts
                        }
                    )

                    if (onError && currentAttempt < maxAttempts) {
                        yield* onError(error, currentAttempt)
                    }

                    currentAttempt++
                })
            )
        )

        return yield* pipe(
            attemptWithLogging,
            Effect.retry(schedule),
            Effect.catchAll((error) =>
                Effect.gen(function* () {
                    yield* logger.error(
                        `All retry attempts exhausted: ${operation}`,
                        error instanceof Error ? error : undefined,
                        {
                            totalAttempts: maxAttempts,
                            totalDuration: Date.now() - startTime
                        }
                    )
                    return yield* Effect.fail(
                        RetryError.create(operation, `Failed after ${maxAttempts} attempts`, error)
                    )
                })
            )
        )
    })
}

/**
 * Circuit breaker pattern
 */
export interface CircuitBreakerConfig {
    maxFailures: number
    resetTimeout: Duration.DurationInput
    halfOpenMax: number
}

export const createCircuitBreaker = (config: CircuitBreakerConfig) => {
    type State = 'closed' | 'open' | 'half-open'

    return Effect.gen(function* () {
        const state = yield* Ref.make<State>('closed')
        const failures = yield* Ref.make(0)
        const halfOpenAttempts = yield* Ref.make(0)

        const execute = <R, E, A>(effect: Op<A, E, R>): Op<A, E | InstanceType<typeof ResilienceError>, R> =>
            Effect.gen(function* () {
                const currentState = yield* Ref.get(state)

                if (currentState === 'open') {
                    return yield* Effect.fail(ResilienceError.create('Circuit breaker is open'))
                }

                return yield* pipe(
                    effect,
                    Effect.tapBoth({
                        onFailure: () =>
                            Effect.gen(function* () {
                                const newFailures = yield* Ref.updateAndGet(failures, (n) => n + 1)

                                if (newFailures >= config.maxFailures) {
                                    yield* Ref.set(state, 'open')
                                    yield* Effect.sleep(config.resetTimeout).pipe(
                                        Effect.zipRight(Ref.set(state, 'half-open')),
                                        Effect.fork
                                    )
                                }
                            }),
                        onSuccess: () =>
                            Effect.gen(function* () {
                                const currentState = yield* Ref.get(state)
                                if (currentState === 'half-open') {
                                    yield* Ref.set(state, 'closed')
                                }
                                yield* Ref.set(failures, 0)
                            }),
                    })
                )
            })

        return { execute }
    })
}

/**
 * Add timeout to any operation with structured logging
 */
export const withTimeout = <R, E, A>(
    operation: string,
    effect: Effect.Effect<A, E, R>,
    milliseconds: number
): Effect.Effect<A, E | InstanceType<typeof TimeoutError>, R | Logger> =>
    Effect.gen(function* () {
        const logger = yield* Logger

        yield* logger.info(`Starting timed operation: ${operation}`, {
            timeout: milliseconds,
            unit: 'ms'
        })

        return yield* pipe(
            effect,
            Effect.timeout(Duration.millis(milliseconds)),
            Effect.flatMap((option) =>
                option._tag === 'Some'
                    ? Effect.succeed(option.value)
                    : Effect.gen(function* () {
                        yield* logger.error(`Operation timed out: ${operation}`, undefined, {
                            timeout: milliseconds,
                            exceeded: true
                        })
                        return yield* Effect.fail(
                            TimeoutError.create(operation, `Timed out after ${milliseconds}ms`)
                        )
                    })
            )
        )
    })

/**
 * Retry with timeout - the most common resilience pattern for prototypes
 * Includes comprehensive structured logging
 */
export const resilient = <R, E, A>(
    operation: string,
    effect: Effect.Effect<A, E, R>,
    options?: {
        timeout?: number
        maxAttempts?: number
        initialDelay?: number
    }
): Effect.Effect<A, E | InstanceType<typeof RetryError> | InstanceType<typeof TimeoutError>, R | Logger> => {
    const { timeout = 30000, maxAttempts = 3, initialDelay = 1000 } = options || {}

    const withTimeoutEffect = timeout
        ? withTimeout(operation, effect, timeout)
        : effect

    return retry(operation, withTimeoutEffect, {
        maxAttempts,
        initialDelay,
        onError: (error, attempt) =>
            Effect.flatMap(Logger, logger =>
                logger.warn(`Retrying operation: ${operation}`, undefined, {
                    attempt,
                    nextDelay: initialDelay * Math.pow(2, attempt - 1),
                    error: String(error)
                })
            )
    })
}

/**
 * Quick retry for prototypes - wrap promises with automatic retry and logging
 */
export const quick = <A>(
    operation: string,
    fn: () => Promise<A>,
    options?: {
        maxAttempts?: number
        timeout?: number
    }
): Effect.Effect<A, InstanceType<typeof RetryError> | InstanceType<typeof TimeoutError>, Logger> =>
    resilient(
        operation,
        Effect.tryPromise({
            try: fn,
            catch: (error) => new Error(String(error))
        }),
        {
            maxAttempts: options?.maxAttempts ?? 3,
            timeout: options?.timeout ?? 10000
        }
    )

/**
 * Wrap any effect with automatic logging
 */
export const logged = <R, E, A>(
    operation: string,
    effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R | Logger> =>
    Effect.gen(function* () {
        const logger = yield* Logger
        const timer = yield* logger.timer(operation)

        return yield* pipe(
            effect,
            Effect.tap(() => timer()),
            Effect.tapError((error) =>
                logger.error(
                    `Operation failed: ${operation}`,
                    error instanceof Error ? error : undefined,
                    {
                        operation,
                        failed: true
                    }
                )
            )
        )
    })

/**
 * Rate limiter
 */
export const createRateLimiter = (
    maxRequests: number,
    window: Duration.DurationInput
) =>
    Effect.gen(function* () {
        const requests = yield* Ref.make<number[]>([])

        const acquire = () =>
            Effect.gen(function* () {
                const now = Date.now()
                const windowMs = Duration.toMillis(Duration.decode(window))
                const cutoff = now - windowMs

                // Remove old requests
                const current = yield* Ref.updateAndGet(requests, (reqs) =>
                    reqs.filter((time) => time > cutoff)
                )

                if (current.length >= maxRequests) {
                    return yield* Effect.fail(
                        ResilienceError.create('Rate limit exceeded')
                    )
                }

                // Add new request
                yield* Ref.update(requests, (reqs) => [...reqs, now])
            })

        return { acquire }
    })

// ============================================================================
// State Management
// ============================================================================

/**
 * Create a stateful service
 */
export const stateService = <State>(
    initialState: State
): Op<{
    get: () => Op<State>
    set: (state: State) => Op<void>
    update: (f: (state: State) => State) => Op<void>
    modify: <A>(f: (state: State) => [State, A]) => Op<A>
}> =>
    Effect.gen(function* () {
        const ref = yield* Ref.make(initialState)

        return {
            get: () => Ref.get(ref),
            set: (state: State) => Ref.set(ref, state),
            update: (f: (state: State) => State) => Ref.update(ref, f),
            modify: <A>(f: (state: State) => [State, A]) => {
                return Ref.modify(ref, (state) => {
                    const [newState, result] = f(state)
                    return [result, newState]
                })
            },
        }
    })

// ============================================================================
// Testing Utilities
// ============================================================================

/**
 * Create a mock service layer
 */
export const mockService = <T extends Context.Tag<any, any>>(
    tag: T,
    implementation: Partial<Context.Tag.Service<T>>
) => Layer.succeed(tag, implementation as Context.Tag.Service<T>)

/**
 * Create a test layer with multiple mocks
 */
export const testLayer = (
    ...mocks: Array<Layer.Layer<any>>
) => Layer.mergeAll(...mocks)

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example: Define a service
 * ```typescript
 * interface UserService {
 *   getUser: (id: string) => Op<User>
 *   saveUser: (user: User) => Op<void>
 * }
 *
 * const { tag: UserService, layer: UserServiceLive } = defineService(
 *   'UserService',
 *   () => Effect.succeed({
 *     getUser: (id) => fetchUser(id),
 *     saveUser: (user) => saveUserToDb(user)
 *   })
 * )
 * ```
 *
 * Example: Use resilience patterns
 * ```typescript
 * // Simple API call with retry
 * const user = yield* quick(
 *   'fetchUser',
 *   () => fetch('/api/user').then(r => r.json()),
 *   { maxAttempts: 3, timeout: 5000 }
 * )
 *
 * // Database operation with retry
 * const saveData = retry(
 *   'saveToDatabase',
 *   databaseSave(data),
 *   {
 *     maxAttempts: 5,
 *     initialDelay: 500
 *   }
 * )
 *
 * // Logged operation
 * const operation = logged(
 *   'complexCalculation',
 *   Effect.sync(() => performCalculation())
 * )
 *
 * // Rate limiting
 * const limiter = yield* createRateLimiter(10, '1 minute')
 * yield* limiter.acquire()
 * yield* makeApiCall()
 * ```
 */