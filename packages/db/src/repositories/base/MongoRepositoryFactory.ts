import { Effect, Option, pipe } from 'effect'
import * as S from 'effect/Schema'
import { Collection, Document } from 'mongodb'
import type { MongoDatabase } from '../../MongoDatabase'
import {
    BaseRepository,
    EntityNotFoundError,
    RepositoryError,
    validateEntity
} from './BaseRepository'
import { TypedEventFactory, type EntityEventTypes } from './EventFactory'

export interface MongoRepositoryConfig<T extends Document, TEntity extends keyof EntityEventTypes> {
    readonly collectionName: keyof MongoDatabase
    readonly entityType: TEntity
    readonly idField: keyof T
    readonly schema: S.Schema<T, any, never>
    readonly eventFactory: TypedEventFactory<TEntity>
}

export interface FindOperations<T> {
    readonly findByField: <K extends keyof T>(
        field: K,
        value: T[K]
    ) => Effect.Effect<readonly T[], RepositoryError>
    
    readonly findOneByField: <K extends keyof T>(
        field: K,
        value: T[K]
    ) => Effect.Effect<Option.Option<T>, RepositoryError>
    
    readonly findByFieldIn: <K extends keyof T>(
        field: K,
        values: readonly T[K][]
    ) => Effect.Effect<readonly T[], RepositoryError>
    
    readonly findByQuery: (
        query: Partial<T>
    ) => Effect.Effect<readonly T[], RepositoryError>
    
    readonly aggregate: <R>(
        pipeline: any[]
    ) => Effect.Effect<readonly R[], RepositoryError>
}

export class MongoRepositoryBase<T extends Document, TEntity extends keyof EntityEventTypes> 
    implements BaseRepository<T, string>, FindOperations<T> {
    
    protected readonly collection: Collection<T>
    
    constructor(
        protected readonly db: MongoDatabase,
        protected readonly config: MongoRepositoryConfig<T, TEntity>
    ) {
        const collection = db[config.collectionName] as Collection<T> | undefined
        if (!collection) {
            throw new Error(`${String(config.collectionName)} collection not initialized`)
        }
        this.collection = collection
    }
    
    protected getId(entity: T): string {
        return entity[this.config.idField] as unknown as string
    }
    
    findById = (id: string): Effect.Effect<Option.Option<T>, RepositoryError> =>
        pipe(
            Effect.tryPromise({
                try: () => this.collection.findOne({ [this.config.idField]: id } as any),
                catch: error => new RepositoryError({
                    message: `Failed to find ${this.config.entityType} by ID: ${id}`,
                    cause: error
                })
            }),
            Effect.flatMap(result =>
                result
                    ? pipe(
                        validateEntity(this.config.schema)(result),
                        Effect.map(Option.some),
                        Effect.catchAll(() => Effect.succeed(Option.none()))
                    )
                    : Effect.succeed(Option.none())
            )
        )
    
    findAll = (options?: { limit?: number; offset?: number }): Effect.Effect<readonly T[], RepositoryError> =>
        Effect.tryPromise({
            try: () => this.collection
                .find({})
                .skip(options?.offset || 0)
                .limit(options?.limit || 1000)
                .toArray(),
            catch: error => new RepositoryError({
                message: `Failed to find all ${this.config.entityType} entities`,
                cause: error
            })
        })
    
    findMany = (ids: readonly string[]): Effect.Effect<readonly T[], RepositoryError> =>
        Effect.tryPromise({
            try: () => this.collection
                .find({ [this.config.idField]: { $in: ids as string[] } } as any)
                .toArray(),
            catch: error => new RepositoryError({
                message: `Failed to find multiple ${this.config.entityType} entities`,
                cause: error
            })
        })
    
    save = (entity: T): Effect.Effect<T, RepositoryError> =>
        Effect.gen(function* () {
            const validated = yield* validateEntity(this.config.schema)(entity)
            const id = this.getId(validated)
            
            yield* Effect.tryPromise({
                try: () => this.collection.replaceOne(
                    { [this.config.idField]: id } as any,
                    validated,
                    { upsert: true }
                ),
                catch: error => new RepositoryError({
                    message: `Failed to save ${this.config.entityType}: ${id}`,
                    cause: error
                })
            })
            
            yield* this.config.eventFactory.createAndSave(
                this.db,
                `${this.config.entityType}s/saved` as EntityEventTypes[TEntity],
                id,
                validated as any
            )
            
            return validated
        })
    
    saveMany = (entities: readonly T[]): Effect.Effect<readonly T[], RepositoryError> =>
        Effect.all(entities.map(entity => this.save(entity)))
    
    update = (id: string, updates: Partial<T>): Effect.Effect<T, RepositoryError | EntityNotFoundError> =>
        Effect.gen(function* () {
            const result = yield* Effect.tryPromise({
                try: () => this.collection.findOneAndUpdate(
                    { [this.config.idField]: id } as any,
                    { $set: updates },
                    { returnDocument: 'after' }
                ),
                catch: error => new RepositoryError({
                    message: `Failed to update ${this.config.entityType}: ${id}`,
                    cause: error
                })
            })
            
            if (!result) {
                return yield* Effect.fail(new EntityNotFoundError({
                    entityType: this.config.entityType,
                    id
                }))
            }
            
            return result as T
        })
    
    delete = (id: string): Effect.Effect<void, RepositoryError> =>
        Effect.gen(function* () {
            yield* Effect.tryPromise({
                try: () => this.collection.deleteOne({ [this.config.idField]: id } as any),
                catch: error => new RepositoryError({
                    message: `Failed to delete ${this.config.entityType}: ${id}`,
                    cause: error
                })
            })
            
            yield* this.config.eventFactory.createAndSave(
                this.db,
                `${this.config.entityType}s/deleted` as EntityEventTypes[TEntity],
                id,
                { [this.config.idField]: id },
                'event'
            )
        })
    
    deleteMany = (ids: readonly string[]): Effect.Effect<void, RepositoryError> =>
        Effect.all(ids.map(id => this.delete(id)), { discard: true })
    
    exists = (id: string): Effect.Effect<boolean, RepositoryError> =>
        Effect.tryPromise({
            try: async () => {
                const count = await this.collection.countDocuments({ 
                    [this.config.idField]: id 
                } as any)
                return count > 0
            },
            catch: error => new RepositoryError({
                message: `Failed to check ${this.config.entityType} existence: ${id}`,
                cause: error
            })
        })
    
    count = (): Effect.Effect<number, RepositoryError> =>
        Effect.tryPromise({
            try: () => this.collection.countDocuments({}),
            catch: error => new RepositoryError({
                message: `Failed to count ${this.config.entityType} entities`,
                cause: error
            })
        })
    
    // Additional find operations
    findByField = <K extends keyof T>(
        field: K,
        value: T[K]
    ): Effect.Effect<readonly T[], RepositoryError> =>
        Effect.tryPromise({
            try: () => this.collection.find({ [field]: value } as any).toArray(),
            catch: error => new RepositoryError({
                message: `Failed to find ${this.config.entityType} by ${String(field)}: ${value}`,
                cause: error
            })
        })
    
    findOneByField = <K extends keyof T>(
        field: K,
        value: T[K]
    ): Effect.Effect<Option.Option<T>, RepositoryError> =>
        pipe(
            Effect.tryPromise({
                try: () => this.collection.findOne({ [field]: value } as any),
                catch: error => new RepositoryError({
                    message: `Failed to find ${this.config.entityType} by ${String(field)}: ${value}`,
                    cause: error
                })
            }),
            Effect.map(result => result ? Option.some(result) : Option.none())
        )
    
    findByFieldIn = <K extends keyof T>(
        field: K,
        values: readonly T[K][]
    ): Effect.Effect<readonly T[], RepositoryError> =>
        Effect.tryPromise({
            try: () => this.collection.find({ [field]: { $in: values } } as any).toArray(),
            catch: error => new RepositoryError({
                message: `Failed to find ${this.config.entityType} by ${String(field)} in list`,
                cause: error
            })
        })
    
    findByQuery = (query: Partial<T>): Effect.Effect<readonly T[], RepositoryError> =>
        Effect.tryPromise({
            try: () => this.collection.find(query as any).toArray(),
            catch: error => new RepositoryError({
                message: `Failed to find ${this.config.entityType} by query`,
                cause: error
            })
        })
    
    aggregate = <R>(pipeline: any[]): Effect.Effect<readonly R[], RepositoryError> =>
        Effect.tryPromise({
            try: () => this.collection.aggregate<R>(pipeline).toArray(),
            catch: error => new RepositoryError({
                message: `Failed to aggregate ${this.config.entityType} entities`,
                cause: error
            })
        })
}

// Factory function to create repositories
export const createMongoRepository = <T extends Document, TEntity extends keyof EntityEventTypes>(
    config: MongoRepositoryConfig<T, TEntity>
) => (db: MongoDatabase) => new MongoRepositoryBase(db, config)