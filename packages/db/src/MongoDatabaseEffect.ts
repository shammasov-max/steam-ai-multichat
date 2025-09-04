import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import { pipe } from 'effect/Function'
import { Layer, Context } from 'effect'
import { MongoClient, Db, Collection } from 'mongodb'
import { MongoEventStore } from './MongoEventStore.js'
import { MongoSnapshotStore } from './MongoSnapshotStore.js'
import { MongoConfig, defaultMongoConfig } from './config.js'
import type { Account } from '@packages/isomorphic/src/slices/accounts.js'
import type { Dialog } from '@packages/isomorphic/src/slices/dialogs.js'
import type { System } from '@packages/isomorphic/src/slices/system.js'

// Error types
export class MongoConnectionError extends Schema.TaggedError<MongoConnectionError>()(
    'MongoConnectionError',
    {
        message: Schema.String,
        cause: Schema.optional(Schema.Unknown)
    }
) {}

export class MongoOperationError extends Schema.TaggedError<MongoOperationError>()(
    'MongoOperationError',
    {
        operation: Schema.String,
        message: Schema.String,
        cause: Schema.optional(Schema.Unknown)
    }
) {}

export type MongoErrors = MongoConnectionError | MongoOperationError

// Service interface
export interface MongoDatabase {
    readonly client: MongoClient
    readonly db: Db
    readonly accounts: Collection<Account>
    readonly dialogs: Collection<Dialog>
    readonly system: Collection<System>
    readonly events: MongoEventStore
    readonly snapshots: MongoSnapshotStore
}

export const MongoDatabase = Context.GenericTag<MongoDatabase>('MongoDatabase')

// Helper functions with Effect error handling
const createIndexesSafely = (collections: {
    accounts: Collection<Account>
    dialogs: Collection<Dialog>
    system: Collection<System>
}) => pipe(
    Effect.all([
        // Account indexes
        Effect.tryPromise({
            try: () => collections.accounts.createIndex({ accountId: 1 }, { unique: true }),
            catch: (e) => new MongoOperationError({ operation: 'createIndex:accounts:accountId', message: String(e), cause: e })
        }),
        Effect.tryPromise({
            try: () => collections.accounts.createIndex({ steamId64: 1 }),
            catch: (e) => new MongoOperationError({ operation: 'createIndex:accounts:steamId64', message: String(e), cause: e })
        }),
        Effect.tryPromise({
            try: () => collections.accounts.createIndex({ status: 1 }),
            catch: (e) => new MongoOperationError({ operation: 'createIndex:accounts:status', message: String(e), cause: e })
        }),
        
        // Dialog indexes
        Effect.tryPromise({
            try: () => collections.dialogs.createIndex({ dialogId: 1 }, { unique: true }),
            catch: (e) => new MongoOperationError({ operation: 'createIndex:dialogs:dialogId', message: String(e), cause: e })
        }),
        Effect.tryPromise({
            try: () => collections.dialogs.createIndex({ accountId: 1 }),
            catch: (e) => new MongoOperationError({ operation: 'createIndex:dialogs:accountId', message: String(e), cause: e })
        }),
        Effect.tryPromise({
            try: () => collections.dialogs.createIndex({ status: 1 }),
            catch: (e) => new MongoOperationError({ operation: 'createIndex:dialogs:status', message: String(e), cause: e })
        }),
        Effect.tryPromise({
            try: () => collections.dialogs.createIndex({ continuationScore: -1 }),
            catch: (e) => new MongoOperationError({ operation: 'createIndex:dialogs:continuationScore', message: String(e), cause: e })
        }),
        
        // System indexes
        Effect.tryPromise({
            try: () => collections.system.createIndex({ systemId: 1 }, { unique: true }),
            catch: (e) => new MongoOperationError({ operation: 'createIndex:system:systemId', message: String(e), cause: e })
        })
    ], { concurrency: 3 }), // Limit concurrent index creation
    Effect.retry({
        times: 3,
        delay: '1 second'
    }),
    Effect.tap(() => Effect.log('All MongoDB indexes created successfully'))
)

// MongoDB connection with proper resource management
const connectToMongo = (config: MongoConfig) => pipe(
    Effect.acquireRelease(
        Effect.tryPromise({
            try: async () => {
                const client = new MongoClient(config.connectionString, {
                    maxPoolSize: config.maxPoolSize,
                    minPoolSize: config.minPoolSize,
                    retryWrites: config.retryWrites,
                    writeConcern: config.writeConcern
                })
                await client.connect()
                return client
            },
            catch: (e) => new MongoConnectionError({ 
                message: `Failed to connect to MongoDB: ${String(e)}`, 
                cause: e 
            })
        }),
        (client) => Effect.tryPromise({
            try: () => client.close(),
            catch: () => new MongoOperationError({ 
                operation: 'close', 
                message: 'Failed to close MongoDB connection' 
            })
        })
    ),
    Effect.retry({
        times: 5,
        delay: '2 seconds',
        factor: 2 // Exponential backoff
    }),
    Effect.tap(() => Effect.log(`Connected to MongoDB: ${config.database}`))
)

// MongoDB Layer with Effect patterns
export const MongoDatabaseLive = (config?: Partial<MongoConfig>) => {
    const fullConfig = { ...defaultMongoConfig, ...config }
    
    return Layer.scoped(
        MongoDatabase,
        pipe(
            connectToMongo(fullConfig),
            Effect.flatMap((client) => {
                const db = client.db(fullConfig.database)
                const accounts = db.collection<Account>(fullConfig.accountsCollection)
                const dialogs = db.collection<Dialog>(fullConfig.dialogsCollection)
                const system = db.collection<System>(fullConfig.systemCollection)
                
                return pipe(
                    createIndexesSafely({ accounts, dialogs, system }),
                    Effect.map(() => ({
                        client,
                        db,
                        accounts,
                        dialogs,
                        system,
                        events: new MongoEventStore(fullConfig),
                        snapshots: new MongoSnapshotStore(fullConfig)
                    })),
                    Effect.tap((database) => 
                        Effect.all([
                            Effect.tryPromise({
                                try: () => database.events.init(),
                                catch: (e) => new MongoOperationError({
                                    operation: 'initEventStore',
                                    message: String(e),
                                    cause: e
                                })
                            }),
                            Effect.tryPromise({
                                try: () => database.snapshots.init(),
                                catch: (e) => new MongoOperationError({
                                    operation: 'initSnapshotStore',
                                    message: String(e),
                                    cause: e
                                })
                            })
                        ])
                    )
                )
            })
        )
    )
}

// Helper operations using Effect patterns
export const saveStateSnapshot = (state: Record<string, any>, id = 'system') =>
    Effect.gen(function* () {
        const db = yield* MongoDatabase
        return yield* Effect.tryPromise({
            try: () => db.snapshots.saveSnapshot(state, id),
            catch: (e) => new MongoOperationError({
                operation: 'saveSnapshot',
                message: String(e),
                cause: e
            })
        })
    })

export const getLatestState = (id = 'system') =>
    Effect.gen(function* () {
        const db = yield* MongoDatabase
        const snapshot = yield* Effect.tryPromise({
            try: () => db.snapshots.getLatestSnapshot(id),
            catch: (e) => new MongoOperationError({
                operation: 'getLatestSnapshot',
                message: String(e),
                cause: e
            })
        })
        return snapshot?.state || null
    })

export const clearAll = () =>
    Effect.gen(function* () {
        const db = yield* MongoDatabase
        yield* Effect.all([
            Effect.tryPromise({
                try: () => db.events.clearEvents(),
                catch: (e) => new MongoOperationError({
                    operation: 'clearEvents',
                    message: String(e),
                    cause: e
                })
            }),
            Effect.tryPromise({
                try: () => db.snapshots.clearSnapshots(),
                catch: (e) => new MongoOperationError({
                    operation: 'clearSnapshots',
                    message: String(e),
                    cause: e
                })
            })
        ], { concurrency: 2 })
    })

// Batched operations with controlled concurrency
export const batchInsertAccounts = (accounts: Account[]) =>
    Effect.gen(function* () {
        const db = yield* MongoDatabase
        const batchSize = 100
        const batches = []
        
        for (let i = 0; i < accounts.length; i += batchSize) {
            batches.push(accounts.slice(i, i + batchSize))
        }
        
        return yield* Effect.all(
            batches.map(batch =>
                Effect.tryPromise({
                    try: () => db.accounts.insertMany(batch),
                    catch: (e) => new MongoOperationError({
                        operation: 'batchInsertAccounts',
                        message: String(e),
                        cause: e
                    })
                })
            ),
            { concurrency: 3 } // Limit concurrent batch operations
        )
    })