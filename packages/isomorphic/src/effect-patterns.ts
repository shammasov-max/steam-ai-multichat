/**
 * Effect Patterns Module
 *
 * Re-exports all effect pattern utilities and helpers
 */

// Export from type-utils first (excluding conflicting names)
export {
    tag,
    serviceTag,
    schema,
    timestamped,
    entityAction,
    brandedId,
    indexed,
    error,
    createServiceError,
    Op,
    ServiceOps,
    OpsOf,
    serviceLayer,
    defineService,
    mockService,
    mockLayer,
    stateService,
    syncLayer,
    factoryLayer,
    repositoryTag,
    inMemoryRepository,
    DeepPartial,
    SuccessOf,
    ErrorOf,
    ContextOf,
    RequireKeys,
    Repository,
    Effect,
    Context,
    Layer,
    Data,
    Ref,
} from './effect-patterns/type-utils'

// Export from index (service patterns and utilities)
export * from './effect-patterns/index'
