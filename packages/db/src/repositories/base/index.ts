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
    saveEvent,
    saveEvents,
    getEventsForAggregate,
    createEvent
} from './BaseRepository.js'