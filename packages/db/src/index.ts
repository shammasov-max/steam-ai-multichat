// ============= Core Database Exports (ClickHouse - Legacy) =============
export { EventStore } from './EventStore.js'
export { SnapshotStore } from './SnapshotStore.js'
export { Database } from './Database.js'

// ============= MongoDB Database Exports =============
export { MongoEventStore } from './MongoEventStore.js'
export { MongoSnapshotStore } from './MongoSnapshotStore.js'
export { MongoDatabase } from './MongoDatabase.js'
export { MongoConfig, defaultMongoConfig, loadMongoConfig } from './config.js'

// ============= Types =============
export type {
    EventRecord,
    StateSnapshot,
    EventStoreConfig,
    EventFilter,
    SnapshotFilter,
} from './types.js'

// ============= Repository Exports =============
export {
    // Base repository
    type BaseRepository,
    type QueryOptions,
    type FilterCriteria,
    Database as DatabaseTag,
    RepositoryError,
    EntityNotFoundError,
    ValidationError,
    ConcurrencyError,
    AbstractRepository,
    
    // Account repository
    type AccountRepository,
    AccountRepositoryTag,
    AccountRepositoryLive,
    
    // Dialog repository
    type DialogRepository,
    DialogRepositoryTag,
    DialogRepositoryLive,
    
    // System repository
    type SystemRepository,
    SystemRepositoryTag,
    SystemRepositoryLive,
    
    // Composite layer
    RepositoriesLive
} from './repositories/index.js'