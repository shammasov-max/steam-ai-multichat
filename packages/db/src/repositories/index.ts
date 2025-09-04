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
    
    // Abstract implementation
    AbstractRepository,
    
    // Helper functions
    validateEntity,
    validateMany,
    getEventsForAggregate,
    saveEvent,
    getLatestSnapshot,
    saveSnapshot
} from './base/index.js'

// ============= Legacy Repository Exports (uses snapshots) =============
export {
    type AccountRepository as LegacyAccountRepository,
    AccountRepository as LegacyAccountRepositoryTag,
    AccountRepositoryLive as LegacyAccountRepositoryLive
} from './AccountRepository.js'

export {
    type DialogRepository as LegacyDialogRepository,
    DialogRepository as LegacyDialogRepositoryTag,
    DialogRepositoryLive as LegacyDialogRepositoryLive
} from './DialogRepository.js'

export {
    type SystemRepository as LegacySystemRepository,
    SystemRepository as LegacySystemRepositoryTag,
    SystemRepositoryLive as LegacySystemRepositoryLive
} from './SystemRepository.js'

// ============= MongoDB Repository Exports (uses collections) =============
export {
    type AccountRepository,
    AccountRepository as AccountRepositoryTag,
    MongoAccountRepositoryLive as AccountRepositoryLive
} from './MongoAccountRepository.js'

export {
    type DialogRepository,
    DialogRepository as DialogRepositoryTag,
    MongoDialogRepositoryLive as DialogRepositoryLive
} from './MongoDialogRepository.js'

export {
    type SystemRepository,
    SystemRepository as SystemRepositoryTag,
    MongoSystemRepositoryLive as SystemRepositoryLive
} from './MongoSystemRepository.js'

// ============= Composite Layers =============
import { Layer } from 'effect'
import { MongoAccountRepositoryLive } from './MongoAccountRepository.js'
import { MongoDialogRepositoryLive } from './MongoDialogRepository.js'
import { MongoSystemRepositoryLive } from './MongoSystemRepository.js'

/**
 * Composite layer that provides all MongoDB repositories
 * Requires Database layer to be provided
 */
export const RepositoriesLive = Layer.mergeAll(
    MongoAccountRepositoryLive,
    MongoDialogRepositoryLive,
    MongoSystemRepositoryLive
)