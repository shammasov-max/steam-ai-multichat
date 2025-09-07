// ============= MongoDB Database Exports =============
export { MongoEventStore } from './MongoEventStore'
export { MongoDatabase } from './MongoDatabase'
export { MongoConfig, getDefaultMongoConfig, loadMongoConfig } from './config'

// ============= Types =============
export type {
    EventRecord,
    StateSnapshot,
    EventStoreConfig,
    EventFilter,
    SnapshotFilter,
} from './types'

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
} from './repositories/index'