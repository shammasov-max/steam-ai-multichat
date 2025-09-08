import { MongoDatabase, type SliceConfig } from './MongoDatabase'
import { accountSlice, dialogSlice, systemSlice, type Account, type Dialog, type System, getSystemId } from '@packages/isomorphic'
import * as S from 'effect/Schema'

// ============= Types =============
export type {
    EventRecord,
    StateSnapshot,
    EventStoreConfig,
    EventFilter,
    SnapshotFilter,
} from './types'
export type { Repository, SliceConfig } from './MongoDatabase'

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
// Type the slices properly with their extended properties
type ExtendedSlice<TName extends string, TEntity> = {
    schema: S.Schema<TEntity, unknown, never> | undefined
    pluralizeFn?: (singular: string) => string
    name: TName
}

const accountSliceTyped = accountSlice as unknown as ExtendedSlice<'account', Account>
const dialogSliceTyped = dialogSlice as unknown as ExtendedSlice<'dialog', Dialog>
const systemSliceTyped = systemSlice as unknown as ExtendedSlice<'system', System>

// Define slice configurations with proper types
const accountSliceConfig: SliceConfig<'account', Account> = {
    name: 'account' as const,
    schema: accountSliceTyped.schema as S.Schema<Account, unknown, never>,
    ...(accountSliceTyped.pluralizeFn && { pluralizeFn: accountSliceTyped.pluralizeFn }),
    initialEntities: []
}

const dialogSliceConfig: SliceConfig<'dialog', Dialog> = {
    name: 'dialog' as const,
    schema: dialogSliceTyped.schema as S.Schema<Dialog, unknown, never>,
    ...(dialogSliceTyped.pluralizeFn && { pluralizeFn: dialogSliceTyped.pluralizeFn }),
    initialEntities: []
}

const systemSliceConfig: SliceConfig<'system', System> = {
    name: 'system' as const,
    schema: systemSliceTyped.schema as S.Schema<System, unknown, never>,
    ...(systemSliceTyped.pluralizeFn && { pluralizeFn: systemSliceTyped.pluralizeFn }),
    initialEntities: [{
        systemId: getSystemId(),
        roundRobin: {
            pointer: 0,
            eligibleAccountIds: []
        },
        rateLimits: {}
    }]
}

export function createDb(connectionString: string) {
    const slices = [
        accountSliceConfig,
        dialogSliceConfig,
        systemSliceConfig
    ] as const
    
    return new MongoDatabase(connectionString, slices)
}

// Re-export MongoDatabase type for advanced usage
export type { MongoDatabase }