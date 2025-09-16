import { Effect, Context, Layer } from 'effect'
import type { Collection, Db } from 'mongodb'
import type { SystemState } from '@packages/isomorphic/slices/systemSlice'
import {
    DEFAULT_SYSTEM_CONFIG,
    SYSTEM_CONFIG_ID,
    initializeSystemConfig
} from '@packages/isomorphic/slices/systemSlice'
import { MongoConnection } from '../connection/MongoConnection'
import { MongoError } from '../errors/MongoError'

/**
 * System repository service for database operations
 */
export class SystemRepository extends Context.Tag('SystemRepository')<
    SystemRepository,
    {
        /**
         * Load system state from database
         * Returns default state if none exists
         */
        load: () => Effect.Effect<SystemState, MongoError>

        /**
         * Save system state to database
         */
        save: (state: SystemState) => Effect.Effect<void, MongoError>

        /**
         * Initialize system state
         * Loads from DB or creates with defaults
         */
        initialize: () => Effect.Effect<SystemState, MongoError>
    }
>() {}

/**
 * Live implementation of SystemRepository
 */
export const SystemRepositoryLive = Layer.effect(
    SystemRepository,
    Effect.gen(function* () {
        const connection = yield* MongoConnection
        const db: Db = yield* connection.database()
        const collection: Collection<SystemState & { _id: string }> = db.collection('system')

        return {
            load: () =>
                Effect.tryPromise({
                    try: async () => {
                        const doc = await collection.findOne({ _id: SYSTEM_CONFIG_ID })
                        if (!doc) {
                            // Return defaults if no state exists
                            return DEFAULT_SYSTEM_CONFIG
                        }
                        // Remove MongoDB _id field
                        const { _id, ...state } = doc
                        return initializeSystemConfig(DEFAULT_SYSTEM_CONFIG, state)
                    },
                    catch: (error) =>
                        new MongoError({
                            message: `Failed to load system state: ${error}`,
                            operation: 'find',
                            collection: 'system',
                        }),
                }),

            save: (state: SystemState) =>
                Effect.tryPromise({
                    try: async () => {
                        await collection.replaceOne(
                            { _id: SYSTEM_CONFIG_ID },
                            { _id: SYSTEM_CONFIG_ID, ...state },
                            { upsert: true }
                        )
                    },
                    catch: (error) =>
                        new MongoError({
                            message: `Failed to save system state: ${error}`,
                            operation: 'replaceOne',
                            collection: 'system',
                        }),
                }),

            initialize: () =>
                Effect.gen(function* () {
                    // Try to load existing state
                    const state = yield* Effect.tryPromise({
                        try: async () => {
                            const doc = await collection.findOne({ _id: SYSTEM_CONFIG_ID })
                            if (!doc) {
                                // No state exists, create one with defaults
                                const newState = DEFAULT_SYSTEM_CONFIG
                                await collection.insertOne({
                                    _id: SYSTEM_CONFIG_ID,
                                    ...newState,
                                })
                                return newState
                            }
                            // State exists, merge with defaults
                            const { _id, ...dbState } = doc
                            return initializeSystemConfig(DEFAULT_SYSTEM_CONFIG, dbState)
                        },
                        catch: (error) =>
                            new MongoError({
                                message: `Failed to initialize system state: ${error}`,
                                operation: 'initialize',
                                collection: 'system',
                            }),
                    })

                    return state
                }),
        }
    })
)