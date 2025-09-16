import { Effect, Option, Cache, Duration, pipe } from 'effect'
import { Collection, Document, Filter } from 'mongodb'
import { Repository, RepositoryConfig, CachedRepositoryConfig } from './Repository'
import { MongoError } from '../errors/MongoError'

const tryMongo = <A>(operation: string, fn: () => Promise<A>) =>
    Effect.tryPromise({
        try: fn,
        catch: e => MongoError.queryFailed(operation, String(e), e),
    })

export const createRepository = <T>(
    collection: Collection<T & Document>,
    config: RepositoryConfig,
    cache?: Cache.Cache<string, Option.Option<T>, MongoError>
): Repository<T> => {
    const idField = config.idField || `${config.sliceName}Id`

    const tryOp =
        (op: string) =>
        <A>(fn: () => Promise<A>) =>
            tryMongo(`${op}:${config.sliceName}`, fn)

    const withCache = (id: string, fetch: () => Effect.Effect<Option.Option<T>, MongoError>) =>
        cache
            ? cache
                  .get(id)
                  .pipe(
                      Effect.flatMap(cached =>
                          Option.isSome(cached)
                              ? Effect.succeed(cached)
                              : fetch().pipe(Effect.tap(result => cache.set(id, result)))
                      )
                  )
            : fetch()

    return {
        findById: id =>
            withCache(id, () =>
                tryOp('find')(() =>
                    collection.findOne({ [idField]: id } as Filter<T & Document>, {
                        projection: { _id: 0 },
                    })
                ).pipe(Effect.map(result => Option.fromNullable(result as T | null)))
            ),

        findAll: () =>
            tryOp('findAll')(() => collection.find({}, { projection: { _id: 0 } }).toArray()).pipe(
                Effect.map(results => results as unknown as readonly T[])
            ),

        findBatch: ids =>
            tryOp('findBatch')(() =>
                collection
                    .find({ [idField]: { $in: [...ids] } } as Filter<T & Document>, {
                        projection: { _id: 0 },
                    })
                    .toArray()
            ).pipe(Effect.map(results => results as unknown as readonly T[])),

        save: entity => {
            const entityRecord = entity as Record<string, unknown>
            const id = entityRecord[idField] as string
            return pipe(
                tryOp('save')(() =>
                    collection.replaceOne(
                        { [idField]: id } as Filter<T & Document>,
                        entity as T & Document,
                        { upsert: true }
                    )
                ),
                Effect.tap(() => (cache ? cache.set(id, Option.some(entity)) : Effect.void)),
                Effect.asVoid
            )
        },

        delete: id =>
            pipe(
                tryOp('delete')(() =>
                    collection.deleteOne({ [idField]: id } as Filter<T & Document>)
                ),
                Effect.tap(() => (cache ? cache.invalidate(id) : Effect.void)),
                Effect.asVoid
            ),
    }
}

export const createCachedRepository = <T>(
    collection: Collection<T & Document>,
    config: CachedRepositoryConfig
): Effect.Effect<Repository<T>, MongoError> =>
    Cache.make({
        capacity: config.cacheCapacity,
        timeToLive: Duration.minutes(config.cacheTTLMinutes),
        lookup: (id: string) =>
            Effect.tryPromise({
                try: () =>
                    collection.findOne(
                        { [config.idField || `${config.sliceName}Id`]: id } as Filter<T & Document>,
                        { projection: { _id: 0 } }
                    ),
                catch: e => MongoError.queryFailed(`find:${config.sliceName}`, String(e), e),
            }).pipe(Effect.map(result => Option.fromNullable(result as T | null))),
    }).pipe(Effect.map(cache => createRepository(collection, config, cache as any)))
