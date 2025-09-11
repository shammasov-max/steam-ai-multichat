import { MongoDatabase } from './MongoDatabase'
import { accountSlice, dialogSlice, systemSlice, type Account, type Dialog, type System, getSystemId } from '@packages/isomorphic'
import * as S from 'effect/Schema'
import { Duration } from 'effect'
import { createCompleteMongoDB } from './MongoDatabaseEffect'
import { SliceConfig } from './types'

// ============= Types =============
export type {
    EventRecord,
    StateSnapshot,
    EventStoreConfig,
    EventFilter,
    SnapshotFilter,
    SliceConfig
} from './types'
export type { Repository } from './MongoDatabase'

// ============= Effect Exports =============
export {
    MongoError,
    MongoConnection,
    EventStore,
    EventStoreLive,
    MongoDB,
    MongoConnectionLive,
    createMongoDBLayer,
    createCompleteMongoDB,
    runWithMongoDB,
    type Repo
} from './MongoDatabaseEffect'

// ============= Main Export =============

/**
 * Creates a MongoDB database instance with typed repositories for all isomorphic slices
 * 
 * @param connectionString MongoDB connection string with database name embedded
 * @returns MongoDatabase instance with typed repositories for account, dialog, and system
 * 
 * @example
 * ```typescript
 * import { createDb } from '@packages/db'
 * 
 * const db = createDb('mongodb://localhost:27017/myapp')
 * 
 * await db.init()
 * 
 * // Access typed repositories
 * await db.repos.account.findById('account_123')
 * await db.repos.dialog.findAll()
 * await db.repos.system.findById('system')
 * 
 * // Access event store
 * await db.eventStore.append(event)
 * ```
 */
// Helper function to safely extract schema
function extractSchema<T>(schema: S.Schema<T, unknown, never> | undefined): S.Schema<T, unknown, never> {
    if (!schema) {
        throw new Error('Schema is required for database operations')
    }
    return schema
}

// Helper to create slice config with proper typing
function createSliceConfig<TName extends string, TEntity>(
    name: TName,
    slice: { schema: S.Schema<TEntity, unknown, never> | undefined; pluralizeFn?: (name: string) => string },
    initialEntities: TEntity[] = []
): SliceConfig<TName, TEntity> {
    return {
        name,
        schema: extractSchema(slice.schema),
        ...(slice.pluralizeFn && { pluralizeFn: slice.pluralizeFn }),
        initialEntities
    }
}

// Define slice configurations using helper function
const accountSliceConfig = createSliceConfig('account' as const, accountSlice as any)
const dialogSliceConfig = createSliceConfig('dialog' as const, dialogSlice as any)  
const systemSliceConfig = createSliceConfig('system' as const, systemSlice as any, [{
    systemId: getSystemId(),
    roundRobin: {
        pointer: 0,
        eligibleAccountIds: []
    },
    rateLimits: {}
}])

export function createDb(connectionString: string) {
    const slices = [
        accountSliceConfig,
        dialogSliceConfig,
        systemSliceConfig
    ] as const
    
    return new MongoDatabase(connectionString, slices)
}

// Effect-based database creator
export function createDbEffect(connectionString: string) {
    const slices = [
        accountSliceConfig,
        dialogSliceConfig,
        systemSliceConfig
    ] as const
    
    return {
        slices,
        layer: createCompleteMongoDB(slices)
    }
}

// Re-export MongoDatabase type for advanced usage
export type { MongoDatabase }

// Re-export Effect Duration for convenience
export { Duration } from 'effect'