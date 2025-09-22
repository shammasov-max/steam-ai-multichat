import { Effect, Layer, Duration } from 'effect'
import { Logger, getDatabaseConfig } from '@packages/isomorphic'
import { MongoDB, MongoDBService } from './MongoDB'
import { MongoConnection } from '../connection/MongoConnection'
import { MongoConnectionLive } from '../connection/MongoConnectionLive'
import { EventStore } from '../event-store/EventStore'
import { EventStoreLive } from '../event-store/EventStoreLive'
import { createCachedRepository, createRepository } from '../repository/RepositoryImpl'
import { Repository } from '../repository/Repository'
import { MongoError } from '../errors/MongoError'
import { SliceConfig } from '../types'

const tryMongo = <A>(operation: string, fn: () => Promise<A>) =>
    Effect.tryPromise({
        try: fn,
        catch: e => MongoError.queryFailed(operation, String(e), e),
    })

export const createMongoDBLayer = <TSlices extends readonly SliceConfig[]>(slices: TSlices) =>
    Layer.effect(
        MongoDB,
        Effect.gen(function* () {
            const { db } = yield* MongoConnection
            const eventStore = yield* EventStore
            const dbConfig = yield* getDatabaseConfig
            const logger = yield* Logger

            const repos: Record<string, Repository<unknown>> = {}

            for (const slice of slices) {
                const collectionName = slice.pluralizeFn?.(slice.name) || `${slice.name}s`
                const collection = db.collection(collectionName)

                // Create indexes from schema annotations
                const schemaWithAst = slice.schema as unknown as {
                    ast?: {
                        annotations?: {
                            indexes?: Array<{
                                fields: Record<string, unknown>
                                options?: Record<string, unknown>
                            }>
                        }
                    }
                }

                const indexes = schemaWithAst.ast?.annotations?.indexes || []
                for (const idx of indexes) {
                    yield* tryMongo('createIndex', () =>
                        collection.createIndex(
                            idx.fields as Record<string, 1 | -1>,
                            idx.options || {}
                        )
                    )
                }

                // Create repository with optional caching
                const repo = yield* createCachedRepository(collection, {
                    sliceName: slice.name,
                    cacheCapacity: dbConfig.cache.capacity,
                    cacheTTLMinutes: dbConfig.cache.ttlMinutes,
                })

                repos[slice.name] = repo

                // Save initial entities if provided
                if (slice.initialEntities) {
                    yield* Effect.forEach(slice.initialEntities, entity => repo.save(entity), {
                        concurrency: 'unbounded',
                    })
                }

                yield* logger.info('Repository initialized', {
                    name: slice.name,
                    collection: collectionName,
                    indexCount: indexes.length,
                })
            }

            return {
                repos,
                eventStore,
                clearAll: () =>
                    Effect.gen(function* () {
                        yield* eventStore.clearEvents()
                        yield* Effect.forEach(Object.keys(repos), name =>
                            tryMongo('clearAll', () =>
                                db
                                    .collection(
                                        slices.find(s => s.name === name)?.pluralizeFn?.(name) ||
                                            `${name}s`
                                    )
                                    .deleteMany({})
                            )
                        )
                        // Re-init initial entities
                        yield* Effect.forEach(
                            slices.filter(s => s.initialEntities),
                            slice =>
                                Effect.forEach(slice.initialEntities!, e =>
                                    repos[slice.name].save(e)
                                )
                        )
                    }),
            } as MongoDBService<any>
        })
    )

// Complete MongoDB layer with all dependencies
export const createCompleteMongoDB = <TSlices extends readonly SliceConfig[]>(slices: TSlices) => {
    const connectionLayer = MongoConnectionLive
    const eventStoreLayer = EventStoreLive.pipe(Layer.provide(connectionLayer))
    const dbLayer = createMongoDBLayer(slices).pipe(
        Layer.provide(Layer.merge(connectionLayer, eventStoreLayer))
    )

    return dbLayer
}
