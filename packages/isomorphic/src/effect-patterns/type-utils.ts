import { Effect, Context, Layer, Ref, Data } from 'effect'
import * as S from 'effect/Schema'

// ============================================================================
// Context.Tag Factory
// ============================================================================

/**
 * Simplified Context.Tag creation
 * @example
 * const MyService = tag<'MyService', MyServiceOps>('MyService')
 */
export const tag = <Name extends string, Service>(name: Name) => {
    // Using the pattern from existing codebase
    return class extends Context.Tag(name)<any, Service>() {} as Context.Tag<Service, Service>
}

/**
 * Generic tag creation with automatic naming
 * @example
 * const MyService = serviceTag<MyServiceOps>()
 */
export const serviceTag = <Service>() => {
    const name = `Service_${Math.random().toString(36).slice(2, 9)}`
    return class extends Context.Tag(name)<any, Service>() {} as Context.Tag<Service, Service>
}

// ============================================================================
// Schema Utilities
// ============================================================================

/**
 * Schema builder with automatic type extraction and codecs
 * @example
 * const User = schema(S.Struct({ id: S.String, name: S.String }))
 * type User = typeof User.Type
 */
export const schema = <A, I = A, R = never>(s: S.Schema<A, I, R>) => {
    const Type = {} as A
    return {
        schema: s,
        Type,
        decode: S.decodeUnknown(s) as any,
        encode: S.encode(s) as any,
        validate: S.validate(s) as any,
        is: S.is(s) as any,
        // Helper to create instances
        make: (input: I) => S.decodeUnknownSync(s)(input) as A
    }
}

/**
 * Create timestamped schema by adding optional timestamp
 */
export const timestamped = <T extends Record<string, S.Schema.Any>>(fields: T) => 
    S.Struct({
        ...fields,
        ts: S.optional(S.Number)
    })

/**
 * Create entity action schema with branded ID
 */
export const entityAction = <Name extends string>(
    entityName: Name,
    additionalFields?: Record<string, S.Schema.Any>
) => {
    const idField = `${entityName}Id` as const
    return S.Struct({
        [idField]: S.String,
        ...(additionalFields ?? {})
    })
}

// ============================================================================
// Service Operation Types
// ============================================================================

/**
 * Simplified Effect type for service operations
 */
export type Op<A, E = never, R = never> = Effect.Effect<A, E, R>

/**
 * Service operations map with consistent error type
 */
export type ServiceOps<E = never> = Record<string, (...args: any[]) => Op<any, E, any>>

/**
 * Extract operation signatures from service
 */
export type OpsOf<T> = T extends Context.Tag<any, infer S> ? S : never

// ============================================================================
// Layer Utilities
// ============================================================================

/**
 * Create a service layer with automatic cleanup
 */
export const serviceLayer = <Service, R = never, E = never>(
    tag: Context.Tag<Service, Service>,
    make: () => Effect.Effect<Service, E, R>,
    options?: {
        cleanup?: (service: Service) => Effect.Effect<void>
        dependencies?: Layer.Layer<R, any, any>
    }
) => {
    const layer = Layer.scoped(
        tag,
        Effect.gen(function* () {
            const service = yield* make()
            
            if (options?.cleanup) {
                yield* Effect.addFinalizer(() => options.cleanup!(service))
            }
            
            return service
        })
    )
    
    return options?.dependencies 
        ? layer.pipe(Layer.provide(options.dependencies))
        : layer
}

/**
 * Create a simple synchronous service layer
 */
export const syncLayer = <Service>(
    tag: Context.Tag<Service, Service>,
    service: Service
) => Layer.succeed(tag, service)

/**
 * Create a service layer from a factory function
 */
export const factoryLayer = <Service, Deps>(
    tag: Context.Tag<Service, Service>,
    factory: (deps: Deps) => Service,
    depsTag: Context.Tag<Deps, Deps>
) => Layer.effect(
    tag,
    Effect.gen(function* () {
        const deps = yield* depsTag
        return factory(deps)
    })
)

// ============================================================================
// Repository Pattern Factory
// ============================================================================

export interface Repository<Entity> {
    readonly findById: (id: string) => Op<Entity | null>
    readonly findAll: () => Op<readonly Entity[]>
    readonly save: (entity: Entity) => Op<void>
    readonly delete: (id: string) => Op<void>
    readonly exists: (id: string) => Op<boolean>
}

/**
 * Create a repository service tag
 */
export const repositoryTag = <Entity>(entityName: string) => {
    type Repo = Repository<Entity>
    return tag<`${typeof entityName}Repository`, Repo>(`${entityName}Repository`)
}

/**
 * Create an in-memory repository implementation
 */
export const inMemoryRepository = <Entity extends { id: string }>(): Repository<Entity> => {
    const store = new Map<string, Entity>()
    
    return {
        findById: (id) => Effect.sync(() => store.get(id) ?? null),
        findAll: () => Effect.sync(() => Array.from(store.values())),
        save: (entity) => Effect.sync(() => { store.set(entity.id, entity) }),
        delete: (id) => Effect.sync(() => { store.delete(id) }),
        exists: (id) => Effect.sync(() => store.has(id))
    }
}

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Create a service error class
 */
export const error = <Tag extends string>(tag: Tag, defaultMessage?: string) => {
    return class extends Data.TaggedError(tag)<{
        readonly message: string
        readonly cause?: unknown
    }> {
        static make(message: string = defaultMessage ?? `${tag} error`, cause?: unknown) {
            return new this({ message, cause })
        }
    }
}

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Create a mock service with default implementations
 */
export const mockService = <Service extends Record<string, any>>(
    partial: Partial<Service>,
    defaultImpl: (...args: any[]) => any = () => Effect.void
): Service => {
    return new Proxy(partial as Service, {
        get: (target, prop) => {
            const value = (target as any)[prop]
            if (value !== undefined) return value
            if (typeof prop === 'string') return defaultImpl
            return undefined
        }
    })
}

/**
 * Create a test layer with mock implementation
 */
export const mockLayer = <Service extends Record<string, any>>(
    tag: Context.Tag<Service, Service>,
    partial: Partial<Service>
) => Layer.succeed(tag, mockService(partial) as Service)

// ============================================================================
// State Management Utilities
// ============================================================================

/**
 * Create a state service with getters and setters
 */
export const stateService = <State>(initialState: State) => {
    type StateOps = {
        readonly get: () => Op<State>
        readonly set: (state: State) => Op<void>
        readonly update: (f: (state: State) => State) => Op<void>
        readonly subscribe: (listener: (state: State) => void) => Op<() => void>
    }
    
    return Effect.gen(function* () {
        const ref = yield* Ref.make(initialState)
        const listeners = yield* Ref.make<Set<(state: State) => void>>(new Set())
        
        const notify = (state: State) =>
            Effect.gen(function* () {
                const subs = yield* Ref.get(listeners)
                for (const listener of subs) {
                    listener(state)
                }
            })
        
        return {
            get: () => Ref.get(ref),
            set: (state) => 
                Effect.gen(function* () {
                    yield* Ref.set(ref, state)
                    yield* notify(state)
                }),
            update: (f) =>
                Effect.gen(function* () {
                    const newState = yield* Ref.updateAndGet(ref, f)
                    yield* notify(newState)
                }),
            subscribe: (listener) =>
                Effect.gen(function* () {
                    yield* Ref.update(listeners, set => new Set(set).add(listener))
                    return () => Ref.update(listeners, set => {
                        const newSet = new Set(set)
                        newSet.delete(listener)
                        return newSet
                    })
                })
        } as StateOps
    })
}

// ============================================================================
// Utility Type Helpers
// ============================================================================

/**
 * Make all properties of T optional recursively
 */
export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>
} : T

/**
 * Extract the success type from an Effect
 */
export type SuccessOf<T> = T extends Effect.Effect<infer A, any, any> ? A : never

/**
 * Extract the error type from an Effect
 */
export type ErrorOf<T> = T extends Effect.Effect<any, infer E, any> ? E : never

/**
 * Extract the context type from an Effect
 */
export type ContextOf<T> = T extends Effect.Effect<any, any, infer R> ? R : never

/**
 * Make specific keys required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

// ============================================================================
// Re-exports for convenience
// ============================================================================

export { Effect, Context, Layer, Data, Ref } from 'effect'
export * as S from 'effect/Schema'