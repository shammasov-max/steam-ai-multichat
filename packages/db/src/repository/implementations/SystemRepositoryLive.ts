import { Effect, Layer, Option, pipe } from 'effect'
import { Collection, Document, Filter } from 'mongodb'
import { System, getSystemId } from '@packages/isomorphic'
import { SystemRepository, SystemRepositoryService } from '../SystemRepository'
import { MongoConnection } from '../../connection/MongoConnection'
import { MongoError } from '../../errors/MongoError'

const tryMongo = <A>(operation: string, fn: () => Promise<A>) =>
    Effect.tryPromise({
        try: fn,
        catch: (e) => MongoError.queryFailed(operation, String(e), e)
    })

/**
 * Live implementation of SystemRepository using MongoDB
 */
export const SystemRepositoryLive = Layer.effect(
    SystemRepository,
    Effect.gen(function* () {
        const { db } = yield* MongoConnection
        const collection = db.collection<System & Document>('systems')
        const systemId = getSystemId()
        
        // Create indexes
        yield* tryMongo('createIndexes', async () => {
            await collection.createIndex({ systemId: 1 }, { unique: true })
        })
        
        // Initialize system document if it doesn't exist
        yield* tryMongo('initializeSystem', async () => {
            const existing = await collection.findOne({ systemId } as Filter<System & Document>)
            if (!existing) {
                const initialSystem: System = {
                    systemId,
                    roundRobin: {
                        pointer: 0,
                        eligibleAccountIds: []
                    },
                    rateLimits: {}
                }
                await collection.insertOne(initialSystem as System & Document)
            }
        })
        
        return {
            findById: (id) =>
                tryMongo('findById', () =>
                    collection.findOne(
                        { systemId: id } as Filter<System & Document>,
                        { projection: { _id: 0 } }
                    )
                ).pipe(Effect.map(result => Option.fromNullable(result as System | null))),
            
            findAll: () =>
                tryMongo('findAll', () =>
                    collection.find({}, { projection: { _id: 0 } }).toArray()
                ).pipe(Effect.map(results => results as unknown as readonly System[])),
            
            findBatch: (ids) =>
                tryMongo('findBatch', () =>
                    collection
                        .find(
                            { systemId: { $in: ids as any } } as Filter<System & Document>,
                            { projection: { _id: 0 } }
                        )
                        .toArray()
                ).pipe(Effect.map(results => results as unknown as readonly System[])),
            
            save: (system) =>
                tryMongo('save', () =>
                    collection.replaceOne(
                        { systemId: system.systemId } as Filter<System & Document>,
                        system as System & Document,
                        { upsert: true }
                    )
                ).pipe(Effect.asVoid),
            
            delete: (id) =>
                tryMongo('delete', () =>
                    collection.deleteOne({ systemId: id } as Filter<System & Document>)
                ).pipe(Effect.asVoid),
            
            upsert: (system) =>
                tryMongo('upsert', () =>
                    collection.replaceOne(
                        { systemId: system.systemId } as Filter<System & Document>,
                        system as System & Document,
                        { upsert: true }
                    )
                ).pipe(Effect.asVoid),
            
            exists: (id) =>
                tryMongo('exists', () =>
                    collection.countDocuments({ systemId: id } as Filter<System & Document>)
                ).pipe(Effect.map(count => count > 0)),
            
            count: () =>
                tryMongo('count', () => collection.countDocuments()),
            
            // System-specific methods
            getSystem: () =>
                tryMongo('getSystem', () =>
                    collection.findOne(
                        { systemId } as Filter<System & Document>,
                        { projection: { _id: 0 } }
                    )
                ).pipe(
                    Effect.map(result => result as System | null),
                    Effect.flatMap(system =>
                        system
                            ? Effect.succeed(system)
                            : Effect.fail(MongoError.notFound('getSystem', systemId))
                    )
                ),
            
            updateRoundRobin: (pointer, eligibleAccountIds) =>
                tryMongo('updateRoundRobin', () =>
                    collection.updateOne(
                        { systemId } as Filter<System & Document>,
                        {
                            $set: {
                                'roundRobin.pointer': pointer,
                                'roundRobin.eligibleAccountIds': eligibleAccountIds
                            }
                        }
                    )
                ).pipe(Effect.asVoid),
            
            updateRateLimit: (key, limit) =>
                tryMongo('updateRateLimit', () =>
                    collection.updateOne(
                        { systemId } as Filter<System & Document>,
                        { $set: { [`rateLimits.${key}`]: limit } }
                    )
                ).pipe(Effect.asVoid)
        } satisfies SystemRepositoryService
    })
)