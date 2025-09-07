// Base interfaces and types
export {
    type BaseRepository,
    type QueryOptions,
    type FilterCriteria,
    Database,
    RepositoryError,
    EntityNotFoundError,
    ValidationError,
    ConcurrencyError,
    validateEntity,
    validateMany,
    saveEvent,
    getEventsForAggregate,
    getLatestSnapshot,
    saveSnapshot
} from './BaseRepository'

// MongoDB Repository Factory
export {
    type MongoRepositoryConfig,
    type FindOperations,
    MongoRepositoryBase,
    createMongoRepository
} from './MongoRepositoryFactory'

// Event Factory
export {
    type EntityEventTypes,
    type AllEventTypes,
    type EventFactoryConfig,
    TypedEventFactory,
    saveEventToDb,
    accountEventFactory,
    dialogEventFactory,
    systemEventFactory
} from './EventFactory'

// Layer utilities
export {
    type RepositoryConstructor,
    type LayerFactory,
    createRepositoryLayer,
    combineRepositoryLayers,
    createCompleteRepositoryLayer,
    createScopedRepositoryLayer,
    createCachedRepositoryLayer,
    createRetryableRepositoryLayer
} from './LayerUtils'