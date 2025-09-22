import {
    accountSlice,
    dialogSlice,
    systemSlice,
    type Account,
    type Dialog,
    type System,
    getSystemId,
} from '@packages/isomorphic'
import * as S from 'effect/Schema'
import { Duration } from 'effect'
import { createCompleteMongoDB } from './database/MongoDBLayer'
import { SliceConfig } from './types'

// ============= Types =============
export type {
    EventRecord,
    StateSnapshot,
    EventStoreConfig,
    EventFilter,
    SnapshotFilter,
    SliceConfig,
} from './types'

// ============= Errors =============
export { MongoError } from './errors/MongoError'

// ============= Connection =============
export { MongoConnection, type MongoConnectionService } from './connection/MongoConnection'
export { MongoConnectionLive } from './connection/MongoConnectionLive'

// ============= Repository =============
export { type Repository, type RepositoryConfig } from './repository/Repository'
export { createRepository, createCachedRepository } from './repository/RepositoryImpl'

// ============= Repository Tags =============
// Note: Individual repository tags will be added when repository files are created
// export {
//     AccountRepository,
//     type AccountRepository as AccountRepositoryService,
// } from './repository/AccountRepository'
// export {
//     DialogRepository,
//     type DialogRepository as DialogRepositoryService,
// } from './repository/DialogRepository'
export {
    SystemRepository,
    SystemRepositoryLive,
    type SystemRepository as SystemRepositoryService,
} from './repository/SystemRepository'

// ============= Repository Implementations =============
// Note: Repository implementations are exported from their individual files above

// ============= Repository Facade =============
export {
    RepositoryFacade,
    RepositoryFacadeLive,
    type RepositoryFacade as RepositoryFacadeService,
} from './database/RepositoryFacade'
export {
    AppLayer,
    createAppLayer,
    AccountRepoLayer,
    DialogRepoLayer,
    SystemRepoLayer,
    EventStoreLayer,
} from './database/AppLayer'

// ============= EventStore =============
export { EventStore, type EventStoreService } from './event-store/EventStore'
export { EventStoreLive } from './event-store/EventStoreLive'

// ============= Database =============
export { MongoDB, type MongoDBService } from './database/MongoDB'
export { createMongoDBLayer, createCompleteMongoDB } from './database/MongoDBLayer'

// ============= Legacy Exports (for backwards compatibility) =============
export { runWithMongoDB, type Repo } from './MongoDatabaseEffect'

// ============= Main Export =============
// Helper function to safely extract schema
const extractSchema = <T>(
    schema: S.Schema<T, unknown, never> | undefined
): S.Schema<T, unknown, never> => {
    if (!schema) {
        throw new Error('Schema is required for database operations')
    }
    return schema
}

// Helper to create slice config with proper typing
const createSliceConfig = <TName extends string, TEntity>(
    name: TName,
    slice: {
        schema: S.Schema<TEntity, unknown, never> | undefined
        pluralizeFn?: (name: string) => string
    },
    initialEntities: TEntity[] = []
): SliceConfig<TName, TEntity> => {
    return {
        name,
        schema: extractSchema(slice.schema),
        ...(slice.pluralizeFn && { pluralizeFn: slice.pluralizeFn }),
        initialEntities,
    }
}

// Define slice configurations using helper function
const accountSliceConfig = createSliceConfig('account' as const, accountSlice as any)
const dialogSliceConfig = createSliceConfig('dialog' as const, dialogSlice as any)
const systemSliceConfig = createSliceConfig('system' as const, systemSlice as any, [
    {
        systemId: getSystemId(),
        roundRobin: {
            pointer: 0,
            eligibleAccountIds: [],
        },
        rateLimits: {},
    },
])

/**
 * Creates an Effect-based MongoDB database layer with typed repositories for all isomorphic slices
 *
 * @param connectionString MongoDB connection string with database name embedded
 * @returns Object with slices configuration and Effect Layer
 *
 * @example
 * ```typescript
 * import { createDb } from '@packages/db'
 * import { Effect, Layer } from 'effect'
 *
 * const { layer } = createDb('mongodb://localhost:27017/myapp')
 *
 * // Use with Effect runtime
 * const program = Effect.gen(function* () {
 *   const db = yield* MongoDB
 *   const account = yield* db.repos.account.findById('account_123')
 * })
 *
 * Effect.runPromise(program.pipe(
 *   Effect.provide(layer)
 * ))
 * ```
 */
export const createDb = (connectionString: string) => {
    const slices = [accountSliceConfig, dialogSliceConfig, systemSliceConfig] as const

    return {
        slices,
        layer: createCompleteMongoDB(slices),
    }
}

// Re-export Effect Duration for convenience
export { Duration } from 'effect'
