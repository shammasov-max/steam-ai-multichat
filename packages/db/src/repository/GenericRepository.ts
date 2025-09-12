import { Effect, Option } from 'effect'
import { MongoError } from '../errors/MongoError'

/**
 * Generic repository interface for entity CRUD operations
 * @template T The entity type
 */
export interface GenericRepository<T> {
    readonly findById: (id: string) => Effect.Effect<Option.Option<T>, MongoError>
    readonly findAll: () => Effect.Effect<readonly T[], MongoError>
    readonly findBatch: (ids: readonly string[]) => Effect.Effect<readonly T[], MongoError>
    readonly save: (entity: T) => Effect.Effect<void, MongoError>
    readonly delete: (id: string) => Effect.Effect<void, MongoError>
    readonly upsert: (entity: T) => Effect.Effect<void, MongoError>
    readonly exists: (id: string) => Effect.Effect<boolean, MongoError>
    readonly count: () => Effect.Effect<number, MongoError>
}