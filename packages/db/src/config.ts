import * as dotenv from 'dotenv'
import { Effect, Config, ConfigError } from 'effect'
import * as S from 'effect/Schema'

// Load environment variables
dotenv.config()

// ============= Configuration Schema =============

export const MongoConfigSchema = S.Struct({
    connectionString: S.optional(S.String.pipe(
        S.nonEmptyString(),
        S.annotations({ 
            title: "MongoDB Connection String",
            description: "MongoDB connection URI including credentials"
        })
    )),
    database: S.optional(S.String.pipe(
        S.nonEmptyString(),
        S.annotations({ 
            title: "Database Name",
            description: "Name of the MongoDB database"
        })
    )),
    eventsCollection: S.optional(S.String.pipe(
        S.nonEmptyString(),
        S.annotations({ 
            title: "Events Collection",
            description: "Name of the collection for storing events"
        })
    )),
    snapshotsCollection: S.optional(S.String.pipe(
        S.nonEmptyString(),
        S.annotations({ 
            title: "Snapshots Collection",
            description: "Name of the collection for storing snapshots"
        })
    )),
    accountsCollection: S.optional(S.String.pipe(
        S.nonEmptyString(),
        S.annotations({ 
            title: "Accounts Collection",
            description: "Name of the collection for storing account entities"
        })
    )),
    dialogsCollection: S.optional(S.String.pipe(
        S.nonEmptyString(),
        S.annotations({ 
            title: "Dialogs Collection",
            description: "Name of the collection for storing dialog entities"
        })
    )),
    systemCollection: S.optional(S.String.pipe(
        S.nonEmptyString(),
        S.annotations({ 
            title: "System Collection",
            description: "Name of the collection for storing system state"
        })
    )),
    maxPoolSize: S.optional(S.Number.pipe(
        S.positive(),
        S.annotations({ 
            title: "Max Pool Size",
            description: "Maximum number of connections in the pool"
        })
    )),
    minPoolSize: S.optional(S.Number.pipe(
        S.positive(),
        S.annotations({ 
            title: "Min Pool Size",
            description: "Minimum number of connections in the pool"
        })
    )),
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
            Effect.orElse(() => Config.string('MONGODB_CONNECTION_STRING'))
        )
        
        const database = yield* Config.string('MONGODB_DATABASE')
        
        const eventsCollection = yield* Config.string('MONGODB_EVENTS_COLLECTION')
        
        const snapshotsCollection = yield* Config.string('MONGODB_SNAPSHOTS_COLLECTION')
        
        const accountsCollection = yield* Config.string('MONGODB_ACCOUNTS_COLLECTION')
        
        const dialogsCollection = yield* Config.string('MONGODB_DIALOGS_COLLECTION')
        
        const systemCollection = yield* Config.string('MONGODB_SYSTEM_COLLECTION')
        
        const maxPoolSize = yield* Config.number('MONGODB_MAX_POOL_SIZE')
        
        const minPoolSize = yield* Config.number('MONGODB_MIN_POOL_SIZE')
        
        const retryWrites = yield* Config.boolean('MONGODB_RETRY_WRITES')
        
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

export const getDefaultMongoConfig = () => ({
    connectionString: process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING,
    database: process.env.MONGODB_DATABASE,
    eventsCollection: process.env.MONGODB_EVENTS_COLLECTION,
    snapshotsCollection: process.env.MONGODB_SNAPSHOTS_COLLECTION,
    accountsCollection: process.env.MONGODB_ACCOUNTS_COLLECTION,
    dialogsCollection: process.env.MONGODB_DIALOGS_COLLECTION,
    systemCollection: process.env.MONGODB_SYSTEM_COLLECTION,
    maxPoolSize: process.env.MONGODB_MAX_POOL_SIZE ? parseInt(process.env.MONGODB_MAX_POOL_SIZE) : undefined,
    minPoolSize: process.env.MONGODB_MIN_POOL_SIZE ? parseInt(process.env.MONGODB_MIN_POOL_SIZE) : undefined,
    retryWrites: process.env.MONGODB_RETRY_WRITES !== 'false',
    writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 5000
    }
})