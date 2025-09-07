// ============= Base Repository Exports =============
export {
    // Base interfaces
    type BaseRepository,
    type QueryOptions,
    type FilterCriteria,
    
    // Context tags
    Database,
    
    // Errors
    RepositoryError,
    EntityNotFoundError,
    ValidationError,
    ConcurrencyError,
    
    // Helper functions
    validateEntity,
    validateMany,
    getEventsForAggregate,
    saveEvent,
    getLatestSnapshot,
    saveSnapshot,
    
    // MongoDB Factory exports
    type MongoRepositoryConfig,
    type FindOperations,
    MongoRepositoryBase,
    createMongoRepository,
    
    // Event Factory exports
    type EntityEventTypes,
    type AllEventTypes,
    type EventFactoryConfig,
    TypedEventFactory,
    saveEventToDb,
    accountEventFactory,
    dialogEventFactory,
    systemEventFactory,
    
    // Layer utilities
    type RepositoryConstructor,
    type LayerFactory,
    createRepositoryLayer,
    combineRepositoryLayers,
    createCompleteRepositoryLayer,
    createScopedRepositoryLayer,
    createCachedRepositoryLayer,
    createRetryableRepositoryLayer
} from './base/index'

// ============= MongoDB Repository Exports (uses collections) =============
export {
    type AccountRepository,
    AccountRepository as AccountRepositoryTag,
    MongoAccountRepositoryLive as AccountRepositoryLive
} from './MongoAccountRepository'

export {
    type DialogRepository,
    DialogRepository as DialogRepositoryTag,
    MongoDialogRepositoryLive as DialogRepositoryLive
} from './MongoDialogRepository'

export {
    type SystemRepository,
    SystemRepository as SystemRepositoryTag,
    MongoSystemRepositoryLive as SystemRepositoryLive
} from './MongoSystemRepository'

// ============= Composite Layers =============
import { Layer } from 'effect'
import { MongoAccountRepositoryLive } from './MongoAccountRepository'
import { MongoDialogRepositoryLive } from './MongoDialogRepository'
import { MongoSystemRepositoryLive } from './MongoSystemRepository'

/**
 * Composite layer that provides all MongoDB repositories
 * Requires Database layer to be provided
 */
export const RepositoriesLive = Layer.mergeAll(
    MongoAccountRepositoryLive,
    MongoDialogRepositoryLive,
    MongoSystemRepositoryLive
)