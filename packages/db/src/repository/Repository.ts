import { Effect, Option } from 'effect'
import { MongoError } from '../errors/MongoError'

export interface Repository<T> {
    findById: (id: string) => Effect.Effect<Option.Option<T>, MongoError>
    findAll: () => Effect.Effect<readonly T[], MongoError>
    findBatch: (ids: readonly string[]) => Effect.Effect<readonly T[], MongoError>
    save: (entity: T) => Effect.Effect<void, MongoError>
    delete: (id: string) => Effect.Effect<void, MongoError>
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