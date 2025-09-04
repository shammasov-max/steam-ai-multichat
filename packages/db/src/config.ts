import * as dotenv from 'dotenv'
import { Effect, Config, ConfigError } from 'effect'
import * as S from 'effect/Schema'

// Load environment variables
dotenv.config()

// ============= Configuration Schema =============

export const MongoConfigSchema = S.Struct({
    connectionString: S.String.pipe(
        S.nonEmptyString(),
        S.annotations({ 
            title: "MongoDB Connection String",
            description: "MongoDB connection URI including credentials"
        })
    ),
    database: S.String.pipe(
        S.nonEmptyString(),
        S.annotations({ 
            title: "Database Name",
            description: "Name of the MongoDB database"
        })
    ),
    eventsCollection: S.String.pipe(
        S.nonEmptyString(),
        S.annotations({ 
            title: "Events Collection",
            description: "Name of the collection for storing events"
        })
    ),
    snapshotsCollection: S.String.pipe(
        S.nonEmptyString(),
        S.annotations({ 
            title: "Snapshots Collection",
            description: "Name of the collection for storing snapshots"
        })
    ),
    accountsCollection: S.String.pipe(
        S.nonEmptyString(),
        S.annotations({ 
            title: "Accounts Collection",
            description: "Name of the collection for storing account entities"
        })
    ),
    dialogsCollection: S.String.pipe(
        S.nonEmptyString(),
        S.annotations({ 
            title: "Dialogs Collection",
            description: "Name of the collection for storing dialog entities"
        })
    ),
    systemCollection: S.String.pipe(
        S.nonEmptyString(),
        S.annotations({ 
            title: "System Collection",
            description: "Name of the collection for storing system state"
        })
    ),
    maxPoolSize: S.Number.pipe(
        S.positive(),
        S.annotations({ 
            title: "Max Pool Size",
            description: "Maximum number of connections in the pool"
        })
    ),
    minPoolSize: S.Number.pipe(
        S.positive(),
        S.annotations({ 
            title: "Min Pool Size",
            description: "Minimum number of connections in the pool"
        })
    ),
    retryWrites: S.Boolean.annotations({ 
        title: "Retry Writes",
        description: "Enable automatic retry of write operations"
    }),
    writeConcern: S.Struct({
        w: S.Union(S.Number, S.Literal('majority')),
        j: S.Boolean,
        wtimeout: S.optional(S.Number)
    }).annotations({ 
        title: "Write Concern",
        description: "MongoDB write concern settings"
    })
})

export type MongoConfig = S.Schema.Type<typeof MongoConfigSchema>

// ============= Configuration Loading =============

export const loadMongoConfig = (): Effect.Effect<MongoConfig, ConfigError.ConfigError> =>
    Effect.gen(function* () {
        const connectionString = yield* Config.string('MONGODB_URI').pipe(
            Effect.orElse(() => Config.string('MONGODB_CONNECTION_STRING')),
            Effect.orElse(() => Effect.succeed('mongodb://localhost:27017'))
        )
        
        const database = yield* Config.string('MONGODB_DATABASE').pipe(
            Effect.orElse(() => Effect.succeed('effect-redux'))
        )
        
        const eventsCollection = yield* Config.string('MONGODB_EVENTS_COLLECTION').pipe(
            Effect.orElse(() => Effect.succeed('events'))
        )
        
        const snapshotsCollection = yield* Config.string('MONGODB_SNAPSHOTS_COLLECTION').pipe(
            Effect.orElse(() => Effect.succeed('snapshots'))
        )
        
        const accountsCollection = yield* Config.string('MONGODB_ACCOUNTS_COLLECTION').pipe(
            Effect.orElse(() => Effect.succeed('accounts'))
        )
        
        const dialogsCollection = yield* Config.string('MONGODB_DIALOGS_COLLECTION').pipe(
            Effect.orElse(() => Effect.succeed('dialogs'))
        )
        
        const systemCollection = yield* Config.string('MONGODB_SYSTEM_COLLECTION').pipe(
            Effect.orElse(() => Effect.succeed('system'))
        )
        
        const maxPoolSize = yield* Config.number('MONGODB_MAX_POOL_SIZE').pipe(
            Effect.orElse(() => Effect.succeed(10))
        )
        
        const minPoolSize = yield* Config.number('MONGODB_MIN_POOL_SIZE').pipe(
            Effect.orElse(() => Effect.succeed(2))
        )
        
        const retryWrites = yield* Config.boolean('MONGODB_RETRY_WRITES').pipe(
            Effect.orElse(() => Effect.succeed(true))
        )
        
        const config: MongoConfig = {
            connectionString,
            database,
            eventsCollection,
            snapshotsCollection,
            accountsCollection,
            dialogsCollection,
            systemCollection,
            maxPoolSize,
            minPoolSize,
            retryWrites,
            writeConcern: {
                w: 'majority',
                j: true,
                wtimeout: 5000
            }
        }
        
        return config
    })

// ============= Default Configuration =============

export const defaultMongoConfig: MongoConfig = {
    connectionString: process.env.MONGODB_URI || 
                     process.env.MONGODB_CONNECTION_STRING || 
                     'mongodb://localhost:27017',
    database: process.env.MONGODB_DATABASE || 'effect-redux',
    eventsCollection: process.env.MONGODB_EVENTS_COLLECTION || 'events',
    snapshotsCollection: process.env.MONGODB_SNAPSHOTS_COLLECTION || 'snapshots',
    accountsCollection: process.env.MONGODB_ACCOUNTS_COLLECTION || 'accounts',
    dialogsCollection: process.env.MONGODB_DIALOGS_COLLECTION || 'dialogs',
    systemCollection: process.env.MONGODB_SYSTEM_COLLECTION || 'system',
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),
    retryWrites: process.env.MONGODB_RETRY_WRITES !== 'false',
    writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 5000
    }
}