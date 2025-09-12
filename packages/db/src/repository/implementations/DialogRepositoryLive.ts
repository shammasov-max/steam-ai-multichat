import { Effect, Layer, Option, pipe, Cache, Duration } from 'effect'
import { Collection, Document, Filter } from 'mongodb'
import { Dialog } from '@packages/isomorphic'
import { DialogRepository, DialogRepositoryService } from '../DialogRepository'
import { MongoConnection } from '../../connection/MongoConnection'
import { MongoError } from '../../errors/MongoError'
import { getDatabaseConfig } from '@packages/isomorphic'

const tryMongo = <A>(operation: string, fn: () => Promise<A>) =>
    Effect.tryPromise({
        try: fn,
        catch: (e) => MongoError.queryFailed(operation, String(e), e)
    })

/**
 * Live implementation of DialogRepository using MongoDB
 */
export const DialogRepositoryLive = Layer.effect(
    DialogRepository,
    Effect.gen(function* () {
        const { db } = yield* MongoConnection
        const config = yield* getDatabaseConfig
        const collection = db.collection<Dialog & Document>('dialogs')
        
        // Create indexes
        yield* tryMongo('createIndexes', async () => {
            await collection.createIndex({ dialogId: 1 }, { unique: true })
            await collection.createIndex({ accountId: 1 })
            await collection.createIndex({ status: 1 })
            await collection.createIndex({ 'assessment.continuationScore': -1 })
            await collection.createIndex({ createdAt: -1 })
        })
        
        // Create cache for frequently accessed dialogs
        const cache = yield* Cache.make<string, Option.Option<Dialog>, MongoError>({
            capacity: config.cache.capacity,
            timeToLive: Duration.minutes(config.cache.ttlMinutes),
            lookup: () => Effect.succeed(Option.none())
        })
        
        const withCache = (id: string, fetch: () => Effect.Effect<Option.Option<Dialog>, MongoError>) =>
            cache.get(id).pipe(
                Effect.flatMap(cached =>
                    Option.isSome(cached)
                        ? Effect.succeed(cached)
                        : fetch().pipe(Effect.tap(result => cache.set(id, result)))
                )
            )
        
        return {
            findById: (id) =>
                withCache(id, () =>
                    tryMongo('findById', () =>
                        collection.findOne(
                            { dialogId: id } as Filter<Dialog & Document>,
                            { projection: { _id: 0 } }
                        )
                    ).pipe(Effect.map(result => Option.fromNullable(result as Dialog | null)))
                ),
            
            findAll: () =>
                tryMongo('findAll', () =>
                    collection.find({}, { projection: { _id: 0 } }).toArray()
                ).pipe(Effect.map(results => results as unknown as readonly Dialog[])),
            
            findBatch: (ids) =>
                tryMongo('findBatch', () =>
                    collection
                        .find(
                            { dialogId: { $in: ids as any } } as Filter<Dialog & Document>,
                            { projection: { _id: 0 } }
                        )
                        .toArray()
                ).pipe(Effect.map(results => results as unknown as readonly Dialog[])),
            
            save: (dialog) =>
                pipe(
                    tryMongo('save', () =>
                        collection.replaceOne(
                            { dialogId: dialog.dialogId } as Filter<Dialog & Document>,
                            dialog as Dialog & Document,
                            { upsert: true }
                        )
                    ),
                    Effect.tap(() => cache.set(dialog.dialogId, Option.some(dialog))),
                    Effect.asVoid
                ),
            
            delete: (id) =>
                pipe(
                    tryMongo('delete', () =>
                        collection.deleteOne({ dialogId: id } as Filter<Dialog & Document>)
                    ),
                    Effect.tap(() => cache.invalidate(id)),
                    Effect.asVoid
                ),
            
            upsert: (dialog) =>
                pipe(
                    tryMongo('upsert', () =>
                        collection.replaceOne(
                            { dialogId: dialog.dialogId } as Filter<Dialog & Document>,
                            dialog as Dialog & Document,
                            { upsert: true }
                        )
                    ),
                    Effect.tap(() => cache.set(dialog.dialogId, Option.some(dialog))),
                    Effect.asVoid
                ),
            
            exists: (id) =>
                tryMongo('exists', () =>
                    collection.countDocuments({ dialogId: id } as Filter<Dialog & Document>)
                ).pipe(Effect.map(count => count > 0)),
            
            count: () =>
                tryMongo('count', () => collection.countDocuments()),
            
            // Dialog-specific methods
            findByAccountId: (accountId) =>
                tryMongo('findByAccountId', () =>
                    collection
                        .find(
                            { accountId } as Filter<Dialog & Document>,
                            { projection: { _id: 0 } }
                        )
                        .toArray()
                ).pipe(Effect.map(results => results as unknown as readonly Dialog[])),
            
            findByStatus: (status) =>
                tryMongo('findByStatus', () =>
                    collection
                        .find(
                            { status } as Filter<Dialog & Document>,
                            { projection: { _id: 0 } }
                        )
                        .toArray()
                ).pipe(Effect.map(results => results as unknown as readonly Dialog[])),
            
            findActive: () =>
                tryMongo('findActive', () =>
                    collection
                        .find(
                            { status: { $in: ['active', 'ongoing'] } } as Filter<Dialog & Document>,
                            { projection: { _id: 0 } }
                        )
                        .toArray()
                ).pipe(Effect.map(results => results as unknown as readonly Dialog[])),
            
            updateScore: (dialogId, score) =>
                pipe(
                    tryMongo('updateScore', () =>
                        collection.updateOne(
                            { dialogId } as Filter<Dialog & Document>,
                            { $set: { 'assessment.continuationScore': score } }
                        )
                    ),
                    Effect.tap(() => cache.invalidate(dialogId)),
                    Effect.asVoid
                ),
            
            appendMessage: (dialogId, message) =>
                pipe(
                    tryMongo('appendMessage', () =>
                        collection.updateOne(
                            { dialogId } as Filter<Dialog & Document>,
                            { $push: { messages: message } as any }
                        )
                    ),
                    Effect.tap(() => cache.invalidate(dialogId)),
                    Effect.asVoid
                )
        } satisfies DialogRepositoryService
    })
)