import { MongoDatabase } from './MongoDatabase'
import { accountSlice, dialogSlice, systemSlice } from '@packages/isomorphic'

// ============= Types =============
export type {
    EventRecord,
    StateSnapshot,
    EventStoreConfig,
    EventFilter,
    SnapshotFilter,
} from './types'

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
export function createDb(connectionString: string) {
    // Cast slices to match expected type structure
    const slices = [
        { name: 'account', schema: (accountSlice as any).schema, pluralizeFn: (accountSlice as any).pluralizeFn },
        { name: 'dialog', schema: (dialogSlice as any).schema, pluralizeFn: (dialogSlice as any).pluralizeFn },
        { name: 'system', schema: (systemSlice as any).schema, pluralizeFn: (systemSlice as any).pluralizeFn }
    ] as const
    
    return new MongoDatabase(connectionString, slices)
}

// Re-export MongoDatabase type for advanced usage
export type { MongoDatabase }