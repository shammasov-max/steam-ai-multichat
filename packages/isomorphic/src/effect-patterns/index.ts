import { Effect, Context, Layer, Runtime, Ref, Schedule, Duration, Queue, Stream, Fiber } from 'effect'
import { ServiceError, RateLimitError } from '../errors'

// ============================================================================
// Service Factory
// ============================================================================

/**
 * Configuration for creating a standard service
 */
export interface ServiceConfig<Ops> {
    readonly name: string
    readonly operations: (deps: {
        logger: {
            info: (message: string, metadata?: Record<string, unknown>) => Effect.Effect<void>
            error: (message: string, error?: unknown, metadata?: Record<string, unknown>) => Effect.Effect<void>
        }
        state: <T>(initial: T) => Effect.Effect<Ref.Ref<T>>
    }) => Effect.Effect<Ops>
    readonly cleanup?: () => Effect.Effect<void>
}

/**
 * Creates a standard Effect service with logging and state management
 */
export const createService = <Tag extends Context.Tag<any, any>>(
    tag: Tag,
    config: ServiceConfig<Context.Tag.Service<Tag>>
) => {
    type Service = Context.Tag.Service<Tag>
    
    return Layer.scoped(
        tag,
        Effect.gen(function* () {
            // Simple logger for the service
            const logger = {
                info: (message: string, metadata?: Record<string, unknown>) =>
                    Effect.log(`[${config.name}] ${message}`, metadata),
                error: (message: string, error?: unknown, metadata?: Record<string, unknown>) =>
                    Effect.logError(`[${config.name}] ${message}`, { error, ...metadata })
            }
            
            // State factory
            const state = <T>(initial: T) => Ref.make(initial)
            
            // Create service operations
            const service = yield* config.operations({ logger, state })
            
            // Add cleanup if provided
            if (config.cleanup) {
                yield* Effect.addFinalizer(() =>
                    Effect.gen(function* () {
                        yield* config.cleanup!()
                        yield* Effect.log(`[${config.name}] Service cleaned up`)
                    })
                )
            }
            
            yield* Effect.log(`[${config.name}] Service initialized`)
            
            return service
        })
    )
}

// ============================================================================
// Rate Limiter Service
// ============================================================================

export interface RateLimiterConfig {
    readonly maxRequests: number
    readonly window: Duration.DurationInput
    readonly keyExtractor?: (context: unknown) => string
}

export interface RateLimiterOps {
    readonly acquire: (key?: string, tokens?: number) => Effect.Effect<void, InstanceType<typeof RateLimitError>>
    readonly check: (key?: string) => Effect.Effect<number>
    readonly reset: (key?: string) => Effect.Effect<void>
}

export class RateLimiter extends Context.Tag('RateLimiter')<RateLimiter, RateLimiterOps>() {}

export const RateLimiterLive = (config: RateLimiterConfig) =>
    createService(RateLimiter, {
        name: 'RateLimiter',
        operations: ({ state }) =>
            Effect.gen(function* () {
                interface TokenBucket {
                    tokens: number
                    lastRefill: number
                }
                
                const buckets = yield* state<Map<string, TokenBucket>>(new Map())
                const windowMs = Duration.toMillis(config.window)
                
                const refillTokens = (bucket: TokenBucket): TokenBucket => {
                    const now = Date.now()
                    const elapsed = now - bucket.lastRefill
                    
                    if (elapsed >= windowMs) {
                        return {
                            tokens: config.maxRequests,
                            lastRefill: now
                        }
                    }
                    
                    const tokensToAdd = Math.floor((elapsed / windowMs) * config.maxRequests)
                    return {
                        tokens: Math.min(config.maxRequests, bucket.tokens + tokensToAdd),
                        lastRefill: now
                    }
                }
                
                return {
                    acquire: (key = 'default', tokens = 1) =>
                        Effect.gen(function* () {
                            const bucketsMap = yield* Ref.get(buckets)
                            const bucket = bucketsMap.get(key) ?? {
                                tokens: config.maxRequests,
                                lastRefill: Date.now()
                            }
                            
                            const refilled = refillTokens(bucket)
                            
                            if (refilled.tokens < tokens) {
                                return yield* Effect.fail(
                                    RateLimitError.create('Rate limit exceeded', undefined, {
                                        key,
                                        available: refilled.tokens,
                                        requested: tokens,
                                        maxRequests: config.maxRequests
                                    })
                                )
                            }
                            
                            yield* Ref.update(buckets, map => {
                                const newMap = new Map(map)
                                newMap.set(key, {
                                    ...refilled,
                                    tokens: refilled.tokens - tokens
                                })
                                return newMap
                            })
                        }),
                    
                    check: (key = 'default') =>
                        Effect.gen(function* () {
                            const bucketsMap = yield* Ref.get(buckets)
                            const bucket = bucketsMap.get(key) ?? {
                                tokens: config.maxRequests,
                                lastRefill: Date.now()
                            }
                            
                            const refilled = refillTokens(bucket)
                            return refilled.tokens
                        }),
                    
                    reset: (key = 'default') =>
                        Effect.gen(function* () {
                            if (key === '*') {
                                yield* Ref.set(buckets, new Map())
                            } else {
                                yield* Ref.update(buckets, map => {
                                    const newMap = new Map(map)
                                    newMap.delete(key)
                                    return newMap
                                })
                            }
                        })
                }
            })
    })

// ============================================================================
// Layer Composition Utilities
// ============================================================================

/**
 * Creates a test layer with mock implementations
 */
export const createTestLayer = <T extends Context.Tag<any, any>>(
    tag: T,
    mockOps: Partial<Context.Tag.Service<T>>
) => {
    const defaultOps = new Proxy({} as Context.Tag.Service<T>, {
        get: (_, prop) => {
            if (prop in mockOps) {
                return mockOps[prop as keyof Context.Tag.Service<T>]
            }
            return () => Effect.void
        }
    })
    
    return Layer.succeed(tag, { ...defaultOps, ...mockOps })
}

/**
 * Combines multiple layers with automatic dependency resolution
 */
export const composeLayers = <R, E>(...layers: Layer.Layer<any, E, R>[]) =>
    layers.reduce(
        (acc, layer) => Layer.provideMerge(acc, layer),
        Layer.empty as any
    )

/**
 * Creates a layer with automatic retry and fallback
 */
export const resilientLayer = <R, E, A>(
    layer: Layer.Layer<A, E, R>,
    options?: {
        retry?: Schedule.Schedule<any, E, any>
        fallback?: Layer.Layer<A, never, R>
        timeout?: Duration.DurationInput
    }
) => {
    let baseLayer = layer
    
    if (options?.retry) {
        baseLayer = Layer.retry(baseLayer, options.retry)
    }
    
    // Note: Layer.timeout not available in current Effect version
    // Timeout should be applied at the effect level instead
    
    if (options?.fallback) {
        baseLayer = Layer.orElse(baseLayer, () => options.fallback!)
    }
    
    return baseLayer
}

// ============================================================================
// Common Middleware Patterns
// ============================================================================

/**
 * Creates a logging middleware effect
 */
export const withLogging = <R, E, A>(
    effect: Effect.Effect<A, E, R>,
    context: string
) =>
    effect.pipe(
        Effect.tap(() => Effect.log(`[${context}] Started`)),
        Effect.tapBoth({
            onFailure: (error) => Effect.logError(`[${context}] Failed`, error),
            onSuccess: () => Effect.log(`[${context}] Completed`)
        })
    )

/**
 * Creates a rate-limited effect
 */
export const withRateLimit = <R, E, A>(
    effect: Effect.Effect<A, E, R>,
    key?: string
) =>
    Effect.gen(function* () {
        const limiter = yield* RateLimiter
        yield* limiter.acquire(key)
        return yield* effect
    })

/**
 * Creates a retrying effect with exponential backoff
 */
export const withRetry = <R, E, A>(
    effect: Effect.Effect<A, E, R>,
    maxAttempts = 3,
    baseDelay = Duration.seconds(1)
) =>
    Effect.retry(
        effect,
        Schedule.exponential(baseDelay).pipe(
            Schedule.jittered,
            Schedule.compose(Schedule.recurs(maxAttempts - 1))
        )
    )

// ============================================================================
// Stream Utilities
// ============================================================================

/**
 * Creates a batched stream processor
 */
export const batchedStream = <R, E, A, B>(
    stream: Stream.Stream<A, E, R>,
    batchSize: number,
    processBatch: (batch: readonly A[]) => Effect.Effect<B, E, R>
) =>
    stream.pipe(
        Stream.groupedWithin(batchSize, Duration.seconds(1)),
        Stream.mapEffect((chunk) => processBatch(Array.from(chunk)))
    )

/**
 * Creates a rate-limited stream
 */
export const rateLimitedStream = <R, E, A>(
    stream: Stream.Stream<A, E, R>,
    itemsPerSecond: number
) => {
    const delay = Duration.millis(1000 / itemsPerSecond)
    return stream.pipe(
        Stream.mapEffect((item) =>
            Effect.gen(function* () {
                yield* Effect.sleep(delay)
                return item
            })
        )
    )
}

// ============================================================================
// Queue Patterns
// ============================================================================

/**
 * Creates a worker pool for processing queue items
 */
export const createWorkerPool = <R, E, A, B>(
    queue: Queue.Queue<A>,
    workerCount: number,
    processItem: (item: A) => Effect.Effect<B, E, R>
) =>
    Effect.gen(function* () {
        const workers = yield* Effect.all(
            Array.from({ length: workerCount }, (_, i) =>
                Effect.gen(function* () {
                    while (true) {
                        const item = yield* Queue.take(queue)
                        yield* processItem(item).pipe(
                            Effect.catchAll((error) =>
                                Effect.logError(`Worker ${i} failed`, error)
                            )
                        )
                    }
                }).pipe(Effect.fork)
            )
        )
        
        return {
            shutdown: () => Effect.all(workers.map(Fiber.interrupt))
        }
    })

// ============================================================================
// Export Convenience
// ============================================================================

export * from '../errors'