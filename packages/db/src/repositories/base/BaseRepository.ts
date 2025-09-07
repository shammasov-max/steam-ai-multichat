import { Effect, Context, pipe, Option } from 'effect'
import * as S from 'effect/Schema'
import { MongoDatabase } from '../../MongoDatabase'
import type { EventRecord } from '../../types'

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

// ============= Query Options =============

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

// ============= Event Helpers =============

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

// ============= Snapshot Helpers =============

export interface Snapshot<T> {
    readonly aggregateId: string
    readonly aggregate: string
    readonly data: T
    readonly version: number
    readonly timestamp: number
}

export const getLatestSnapshot = <T>(
    db: MongoDatabase,
    aggregate: string,
    aggregateId: string
): Effect.Effect<Option.Option<Snapshot<T>>> =>
    Effect.gen(function* () {
        // This would typically query a snapshots collection
        // For now, returning none as snapshots are not implemented
        return Option.none()
    })

export const saveSnapshot = <T>(
    db: MongoDatabase,
    snapshot: Snapshot<T>
): Effect.Effect<void> =>
    Effect.gen(function* () {
        // This would typically save to a snapshots collection
        // For now, this is a no-op as snapshots are not implemented
        return
    })