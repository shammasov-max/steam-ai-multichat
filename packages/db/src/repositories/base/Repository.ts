import { Effect, Context, pipe, Option } from 'effect'
import * as S from 'effect/Schema'
import { MongoDatabase } from '../../MongoDatabase.js'
import type { EventRecord, StateSnapshot, EventFilter } from '../../types.js'

// ============= Base Repository Interface =============

export interface BaseRepository<T, ID = string> {
    readonly findById: (id: ID) => Effect.Effect<Option.Option<T>>
    readonly findAll: (options?: { limit?: number; offset?: number }) => Effect.Effect<readonly T[]>
    readonly findMany: (ids: readonly ID[]) => Effect.Effect<readonly T[]>
    readonly save: (entity: T) => Effect.Effect<T>
    readonly saveMany: (entities: readonly T[]) => Effect.Effect<readonly T[]>
    readonly update: (id: ID, updates: Partial<T>) => Effect.Effect<T>
    readonly delete: (id: ID) => Effect.Effect<void>
    readonly deleteMany: (ids: readonly ID[]) => Effect.Effect<void>
    readonly exists: (id: ID) => Effect.Effect<boolean>
    readonly count: () => Effect.Effect<number>
}

// ============= Context Tags =============

export class Database extends Context.Tag("Database")<Database, MongoDatabase>() {}

// ============= Repository Errors =============

export class RepositoryError extends S.TaggedError<RepositoryError>()("RepositoryError", {
    message: S.String,
    cause: S.optional(S.Unknown)
}) {}

export class EntityNotFoundError extends S.TaggedError<EntityNotFoundError>()("EntityNotFoundError", {
    entityType: S.String,
    id: S.String
}) {}

export class ValidationError extends S.TaggedError<ValidationError>()("ValidationError", {
    message: S.String,
    errors: S.Array(S.Struct({
        path: S.Array(S.Union(S.String, S.Number)),
        message: S.String
    }))
}) {}

export class ConcurrencyError extends S.TaggedError<ConcurrencyError>()("ConcurrencyError", {
    entityType: S.String,
    id: S.String,
    message: S.String
}) {}

// ============= Helper Functions =============

export const validateEntity = <T>(
    schema: S.Schema<T, any, never>
) => (
    entity: unknown
): Effect.Effect<T, ValidationError> =>
    pipe(
        entity,
        S.decodeUnknown(schema),
        Effect.mapError(error => 
            new ValidationError({
                message: "Entity validation failed",
                errors: S.ParseResult.ArrayFormatter.formatErrorSync(error).map(issue => ({
                    path: issue.path,
                    message: issue.message
                }))
            })
        )
    )

export const validateMany = <T>(
    schema: S.Schema<T, any, never>
) => (
    entities: readonly unknown[]
): Effect.Effect<readonly T[], ValidationError> =>
    Effect.all(entities.map(validateEntity(schema)))

// ============= Query Builder Helpers =============

export interface QueryOptions {
    readonly limit?: number
    readonly offset?: number
    readonly orderBy?: string
    readonly orderDirection?: 'asc' | 'desc'
}

export interface FilterCriteria<T> {
    readonly where?: Partial<T>
    readonly whereIn?: { [K in keyof T]?: readonly T[K][] }
    readonly whereBetween?: { [K in keyof T]?: readonly [T[K], T[K]] }
    readonly whereNotNull?: readonly (keyof T)[]
    readonly whereNull?: readonly (keyof T)[]
}

// ============= Event Sourcing Helpers =============

export const getEventsForAggregate = (
    db: MongoDatabase,
    aggregate: string,
    aggregateId: string,
    fromTimestamp?: number
): Effect.Effect<readonly EventRecord[]> =>
    Effect.tryPromise({
        try: () => db.events.getEventsByAggregateId(aggregate, aggregateId, fromTimestamp),
        catch: error => new RepositoryError({
            message: `Failed to fetch events for ${aggregate}/${aggregateId}`,
            cause: error
        })
    })

export const saveEvent = (
    db: MongoDatabase,
    event: EventRecord
): Effect.Effect<void> =>
    Effect.tryPromise({
        try: () => db.events.append(event),
        catch: error => new RepositoryError({
            message: `Failed to save event: ${event.type}`,
            cause: error
        })
    })

export const getLatestSnapshot = (
    db: MongoDatabase
): Effect.Effect<Option.Option<StateSnapshot>> =>
    Effect.tryPromise({
        try: async () => {
            const snapshot = await db.snapshots.getLatestSnapshot()
            return snapshot ? Option.some(snapshot) : Option.none()
        },
        catch: error => new RepositoryError({
            message: "Failed to fetch latest snapshot",
            cause: error
        })
    })

export const saveSnapshot = (
    db: MongoDatabase,
    state: Record<string, any>
): Effect.Effect<void> =>
    Effect.tryPromise({
        try: () => db.saveStateSnapshot(state),
        catch: error => new RepositoryError({
            message: "Failed to save snapshot",
            cause: error
        })
    })

// ============= Abstract Repository Implementation =============

export abstract class AbstractRepository<T extends { [key: string]: any }, ID = string> 
    implements BaseRepository<T, ID> {
    
    protected abstract readonly entityName: string
    protected abstract readonly idField: keyof T
    protected abstract readonly schema: S.Schema<T, any, never>
    
    constructor(protected readonly db: MongoDatabase) {}
    
    protected getEntityId(entity: T): ID {
        return entity[this.idField] as unknown as ID
    }
    
    protected async getStateSlice(): Promise<Record<string, T>> {
        const state = await this.db.getLatestState()
        if (!state) return {}
        
        const sliceName = `${this.entityName}s` // pluralized
        const slice = state[sliceName]
        
        if (!slice || !slice.entities) return {}
        return slice.entities as Record<string, T>
    }
    
    findById = (id: ID): Effect.Effect<Option.Option<T>> =>
        Effect.gen(function* () {
            const entities = yield* Effect.tryPromise({
                try: () => this.getStateSlice(),
                catch: error => new RepositoryError({
                    message: `Failed to fetch ${this.entityName} with id: ${String(id)}`,
                    cause: error
                })
            })
            
            const entity = entities[String(id)]
            if (!entity) return Option.none()
            
            const validated = yield* validateEntity(this.schema)(entity)
            return Option.some(validated)
        })
    
    findAll = (options?: QueryOptions): Effect.Effect<readonly T[]> =>
        Effect.gen(function* () {
            const entities = yield* Effect.tryPromise({
                try: () => this.getStateSlice(),
                catch: error => new RepositoryError({
                    message: `Failed to fetch all ${this.entityName} entities`,
                    cause: error
                })
            })
            
            let results = Object.values(entities)
            
            // Apply pagination
            if (options?.offset) {
                results = results.slice(options.offset)
            }
            if (options?.limit) {
                results = results.slice(0, options.limit)
            }
            
            return yield* validateMany(this.schema)(results)
        })
    
    findMany = (ids: readonly ID[]): Effect.Effect<readonly T[]> =>
        Effect.gen(function* () {
            const entities = yield* Effect.tryPromise({
                try: () => this.getStateSlice(),
                catch: error => new RepositoryError({
                    message: `Failed to fetch multiple ${this.entityName} entities`,
                    cause: error
                })
            })
            
            const results = ids
                .map(id => entities[String(id)])
                .filter(Boolean)
            
            return yield* validateMany(this.schema)(results)
        })
    
    save = (entity: T): Effect.Effect<T> =>
        Effect.gen(function* () {
            // Validate entity
            const validated = yield* validateEntity(this.schema)(entity)
            
            // Create event for entity creation/update
            const event: EventRecord = {
                id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: `${this.entityName}s/saved`,
                payload: validated,
                meta: {
                    schemaVersion: '1.0.0',
                    id: String(this.getEntityId(validated)),
                    ts: Date.now(),
                    aggregate: this.entityName,
                    kind: 'entity'
                },
                timestamp: Date.now()
            }
            
            yield* saveEvent(this.db, event)
            return validated
        })
    
    saveMany = (entities: readonly T[]): Effect.Effect<readonly T[]> =>
        Effect.all(entities.map(entity => this.save(entity)))
    
    update = (id: ID, updates: Partial<T>): Effect.Effect<T> =>
        Effect.gen(function* () {
            const existingOpt = yield* this.findById(id)
            const existing = yield* pipe(
                existingOpt,
                Option.match({
                    onNone: () => Effect.fail(new EntityNotFoundError({
                        entityType: this.entityName,
                        id: String(id)
                    })),
                    onSome: Effect.succeed
                })
            )
            
            const updated = { ...existing, ...updates }
            return yield* this.save(updated)
        })
    
    delete = (id: ID): Effect.Effect<void> =>
        Effect.gen(function* () {
            const event: EventRecord = {
                id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: `${this.entityName}s/deleted`,
                payload: { [`${this.entityName}Id`]: String(id) },
                meta: {
                    schemaVersion: '1.0.0',
                    id: String(id),
                    ts: Date.now(),
                    aggregate: this.entityName,
                    kind: 'entity'
                },
                timestamp: Date.now()
            }
            
            yield* saveEvent(this.db, event)
        })
    
    deleteMany = (ids: readonly ID[]): Effect.Effect<void> =>
        Effect.all(ids.map(id => this.delete(id)), { discard: true })
    
    exists = (id: ID): Effect.Effect<boolean> =>
        pipe(
            this.findById(id),
            Effect.map(Option.isSome)
        )
    
    count = (): Effect.Effect<number> =>
        Effect.gen(function* () {
            const entities = yield* Effect.tryPromise({
                try: () => this.getStateSlice(),
                catch: error => new RepositoryError({
                    message: `Failed to count ${this.entityName} entities`,
                    cause: error
                })
            })
            
            return Object.keys(entities).length
        })
}