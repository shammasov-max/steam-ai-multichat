import { Layer, Effect, Context } from 'effect'
import type { MongoDatabase } from '../../MongoDatabase'
import { Database } from './BaseRepository'

export type RepositoryConstructor<T> = (db: MongoDatabase) => T

export type LayerFactory<TService extends Context.Tag<any, any>> = 
    Layer.Layer<Context.Tag.Identifier<TService>, Database, never>

/**
 * Creates a repository layer with database dependency
 * Simplifies the common pattern: Layer.effect(Tag, Effect.gen(function* () { ... }))
 */
export const createRepositoryLayer = <TService extends Context.Tag<any, any>>(
    tag: TService,
    constructor: RepositoryConstructor<Context.Tag.Service<TService>>
): LayerFactory<TService> =>
    Layer.effect(
        tag,
        Effect.gen(function* () {
            const db = yield* Database
            return constructor(db)
        })
    )

/**
 * Combines multiple repository layers into a single layer
 * Useful for application-level layer composition
 */
export const combineRepositoryLayers = <TLayers extends readonly Layer.Layer<any, any, any>[]>(
    ...layers: TLayers
): Layer.Layer<
    TLayers[number] extends Layer.Layer<infer A, any, any> ? A : never,
    TLayers[number] extends Layer.Layer<any, infer R, any> ? R : never,
    TLayers[number] extends Layer.Layer<any, any, infer E> ? E : never
> => Layer.mergeAll(...layers) as any

/**
 * Creates a complete repository layer with all dependencies
 */
export const createCompleteRepositoryLayer = <T>(
    repositories: Record<string, LayerFactory<any>>
): Layer.Layer<any, Database, never> => {
    const layers = Object.values(repositories)
    return combineRepositoryLayers(...layers)
}

/**
 * Helper to create a scoped repository layer with lifecycle management
 */
export const createScopedRepositoryLayer = <TService extends Context.Tag<any, any>>(
    tag: TService,
    constructor: RepositoryConstructor<Context.Tag.Service<TService>>,
    options?: {
        readonly onAcquire?: () => Effect.Effect<void>
        readonly onRelease?: () => Effect.Effect<void>
    }
): LayerFactory<TService> =>
    Layer.scoped(
        tag,
        Effect.gen(function* () {
            const db = yield* Database
            
            if (options?.onAcquire) {
                yield* options.onAcquire()
            }
            
            const repository = constructor(db)
            
            yield* Effect.addFinalizer(() => 
                options?.onRelease ? options.onRelease() : Effect.void
            )
            
            return repository
        })
    )

/**
 * Creates a cached repository layer that shares the same instance
 */
export const createCachedRepositoryLayer = <TService extends Context.Tag<any, any>>(
    tag: TService,
    constructor: RepositoryConstructor<Context.Tag.Service<TService>>
): LayerFactory<TService> =>
    Layer.effect(
        tag,
        Effect.gen(function* () {
            const db = yield* Database
            return constructor(db)
        })
    ).pipe(Layer.memoize)

/**
 * Creates a repository layer with retry logic for database operations
 */
export const createRetryableRepositoryLayer = <TService extends Context.Tag<any, any>>(
    tag: TService,
    constructor: RepositoryConstructor<Context.Tag.Service<TService>>,
    retryPolicy?: {
        readonly times?: number
        readonly delay?: number
    }
): LayerFactory<TService> =>
    Layer.effect(
        tag,
        Effect.gen(function* () {
            const db = yield* Database
            return constructor(db)
        }).pipe(
            Effect.retry({
                times: retryPolicy?.times ?? 3,
                delay: retryPolicy?.delay ?? 1000
            })
        )
    )