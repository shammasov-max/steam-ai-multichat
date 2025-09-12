import { Effect, Layer, Option, pipe, Cache, Duration } from 'effect'
import { Collection, Document, Filter } from 'mongodb'
import { Account, getSystemId } from '@packages/isomorphic'
import { AccountRepository, AccountRepositoryService } from '../AccountRepository'
import { MongoConnection } from '../../connection/MongoConnection'
import { MongoError } from '../../errors/MongoError'
import { getDatabaseConfig } from '@packages/isomorphic'

const tryMongo = <A>(operation: string, fn: () => Promise<A>) =>
    Effect.tryPromise({
        try: fn,
        catch: (e) => MongoError.queryFailed(operation, String(e), e)
    })

/**
 * Live implementation of AccountRepository using MongoDB
 */
export const AccountRepositoryLive = Layer.effect(
    AccountRepository,
    Effect.gen(function* () {
        const { db } = yield* MongoConnection
        const config = yield* getDatabaseConfig
        const collection = db.collection<Account & Document>('accounts')
        
        // Create indexes
        yield* tryMongo('createIndexes', async () => {
            await collection.createIndex({ accountId: 1 }, { unique: true })
            await collection.createIndex({ status: 1 })
            await collection.createIndex({ steamId64: 1 }, { unique: true })
        })
        
        // Create cache for frequently accessed accounts
        const cache = yield* Cache.make<string, Option.Option<Account>, MongoError>({
            capacity: config.cache.capacity,
            timeToLive: Duration.minutes(config.cache.ttlMinutes),
            lookup: () => Effect.succeed(Option.none())
        })
        
        const withCache = (id: string, fetch: () => Effect.Effect<Option.Option<Account>, MongoError>) =>
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
                            { accountId: id } as Filter<Account & Document>,
                            { projection: { _id: 0 } }
                        )
                    ).pipe(Effect.map(result => Option.fromNullable(result as Account | null)))
                ),
            
            findAll: () =>
                tryMongo('findAll', () =>
                    collection.find({}, { projection: { _id: 0 } }).toArray()
                ).pipe(Effect.map(results => results as unknown as readonly Account[])),
            
            findBatch: (ids) =>
                tryMongo('findBatch', () =>
                    collection
                        .find(
                            { accountId: { $in: ids as any } } as Filter<Account & Document>,
                            { projection: { _id: 0 } }
                        )
                        .toArray()
                ).pipe(Effect.map(results => results as unknown as readonly Account[])),
            
            save: (account) =>
                pipe(
                    tryMongo('save', () =>
                        collection.replaceOne(
                            { accountId: account.accountId } as Filter<Account & Document>,
                            account as Account & Document,
                            { upsert: true }
                        )
                    ),
                    Effect.tap(() => cache.set(account.accountId, Option.some(account))),
                    Effect.asVoid
                ),
            
            delete: (id) =>
                pipe(
                    tryMongo('delete', () =>
                        collection.deleteOne({ accountId: id } as Filter<Account & Document>)
                    ),
                    Effect.tap(() => cache.invalidate(id)),
                    Effect.asVoid
                ),
            
            upsert: (account) =>
                pipe(
                    tryMongo('upsert', () =>
                        collection.replaceOne(
                            { accountId: account.accountId } as Filter<Account & Document>,
                            account as Account & Document,
                            { upsert: true }
                        )
                    ),
                    Effect.tap(() => cache.set(account.accountId, Option.some(account))),
                    Effect.asVoid
                ),
            
            exists: (id) =>
                tryMongo('exists', () =>
                    collection.countDocuments({ accountId: id } as Filter<Account & Document>)
                ).pipe(Effect.map(count => count > 0)),
            
            count: () =>
                tryMongo('count', () => collection.countDocuments()),
            
            // Account-specific methods
            findByStatus: (status) =>
                tryMongo('findByStatus', () =>
                    collection
                        .find(
                            { status } as Filter<Account & Document>,
                            { projection: { _id: 0 } }
                        )
                        .toArray()
                ).pipe(Effect.map(results => results as unknown as readonly Account[])),
            
            findBySteamId: (steamId64) =>
                tryMongo('findBySteamId', () =>
                    collection.findOne(
                        { steamId64 } as Filter<Account & Document>,
                        { projection: { _id: 0 } }
                    )
                ).pipe(Effect.map(result => Option.fromNullable(result as Account | null))),
            
            updateStatus: (accountId, status) =>
                pipe(
                    tryMongo('updateStatus', () =>
                        collection.updateOne(
                            { accountId } as Filter<Account & Document>,
                            { $set: { status: status as any } }
                        )
                    ),
                    Effect.tap(() => cache.invalidate(accountId)),
                    Effect.asVoid
                )
        } satisfies AccountRepositoryService
    })
)