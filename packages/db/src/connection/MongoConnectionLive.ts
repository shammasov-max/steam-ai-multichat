import { Effect, Layer } from 'effect'
import { MongoClient } from 'mongodb'
import { Logger, getDatabaseConfig } from '@packages/isomorphic'
import { MongoConnection } from './MongoConnection'
import { MongoError } from '../errors/MongoError'

const tryMongo = <A>(operation: string, fn: () => Promise<A>) =>
    Effect.tryPromise({
        try: fn,
        catch: (e) => MongoError.connectionFailed(String(e), e)
    })

const extractDbName = (url: string) => {
    const match = url.match(/\/([^/?]+)(\?|$)/)
    if (!match?.[1]) throw new Error('Database name not found in connection string')
    return match[1]
}

export const MongoConnectionLive = Layer.scoped(
    MongoConnection,
    Effect.gen(function* () {
        const config = yield* getDatabaseConfig
        const logger = yield* Logger
        
        const client = new MongoClient(config.connectionString, {
            maxPoolSize: config.poolSize,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 10000
        })
        
        yield* tryMongo('connect', () => client.connect())
        const db = client.db(extractDbName(config.connectionString))
        
        yield* logger.info('Connected to MongoDB', {
            database: db.databaseName,
            poolSize: config.poolSize
        })
        
        yield* Effect.addFinalizer(() =>
            tryMongo('close', () => client.close()).pipe(
                Effect.tap(() => logger.info('Disconnected from MongoDB')),
                Effect.catchAll(() => Effect.void)
            )
        )
        
        return { client, db }
    })
)