import { Effect, Option } from 'effect'
import { MongoError } from '../errors/MongoError'
import type { EntityWithId } from '@packages/isomorphic'

/**
 * Extract ID type from an entity with branded ID
 */
type ExtractEntityId<T> = T extends EntityWithId<infer TName, any>
    ? T[`${TName}Id`]
    : string

/**
 * Unified repository interface for entity CRUD operations
 * Works with both branded entity IDs and plain strings
 */
export interface Repository<T> {
    readonly findById: (id: ExtractEntityId<T>) => Effect.Effect<Option.Option<T>, MongoError>
    readonly findAll: () => Effect.Effect<readonly T[], MongoError>
    readonly findBatch: (ids: readonly ExtractEntityId<T>[]) => Effect.Effect<readonly T[], MongoError>
    readonly save: (entity: T) => Effect.Effect<void, MongoError>
    readonly delete: (id: ExtractEntityId<T>) => Effect.Effect<void, MongoError>
    readonly upsert: (entity: T) => Effect.Effect<void, MongoError>
    readonly exists: (id: ExtractEntityId<T>) => Effect.Effect<boolean, MongoError>
    readonly count: () => Effect.Effect<number, MongoError>
}

export interface RepositoryConfig {
    sliceName: string
    idField?: string
    enableCache?: boolean
}

export interface CachedRepositoryConfig extends RepositoryConfig {
    cacheCapacity: number
    cacheTTLMinutes: number
}
