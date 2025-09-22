import { Effect, Context, Layer, pipe, Option } from 'effect'
import * as S from 'effect/Schema'
import { Collection, Filter, Document, OptionalId } from 'mongodb'
import { MongoConnection } from '../connection/MongoConnection'
import { error, tag, serviceLayer } from '@packages/isomorphic'

// ============================================================================
// Error Types
// ============================================================================

const RepoError = error('RepoError', 'Repository operation failed')

// ============================================================================
// Types
// ============================================================================

type Op<A, E = never> = Effect.Effect<A, E, never>

// Generic repository interface
export interface Repository<T> {
    readonly findById: (id: string) => Op<Option.Option<T>, InstanceType<typeof RepoError>>
    readonly findAll: () => Op<readonly T[], InstanceType<typeof RepoError>>
    readonly save: (entity: T) => Op<void, InstanceType<typeof RepoError>>
    readonly delete: (id: string) => Op<void, InstanceType<typeof RepoError>>
    readonly upsert: (entity: T) => Op<void, InstanceType<typeof RepoError>>
    readonly exists: (id: string) => Op<boolean, InstanceType<typeof RepoError>>
    readonly count: () => Op<number, InstanceType<typeof RepoError>>
    readonly find: (filter: Partial<T>) => Op<readonly T[], InstanceType<typeof RepoError>>
    readonly findOne: (filter: Partial<T>) => Op<Option.Option<T>, InstanceType<typeof RepoError>>
}

// ============================================================================
// Repository Configuration
// ============================================================================

export interface RepositoryConfig<T> {
    readonly entityName: string
    readonly collectionName?: string
    readonly idField: keyof T
    readonly schema?: S.Schema<T, any, never>
    readonly indexes?: Array<{
        fields: Record<string, 1 | -1>
        options?: Record<string, any>
    }>
    // Entity-specific methods can be added via extensions
    readonly extensions?: (base: Repository<T>) => any
}

// ============================================================================
// MongoDB Helper
// ============================================================================

const tryMongo = <A>(op: () => Promise<A>, operation: string) =>
    Effect.tryPromise({
        try: op,
        catch: (error) => RepoError.create(operation, String(error)),
    })

// ============================================================================
// Generic Repository Factory
// ============================================================================

export const createRepository = <T extends Record<string, any>>(
    config: RepositoryConfig<T>
): Op<Repository<T> & ReturnType<NonNullable<typeof config.extensions>>, never, MongoConnection> =>
    Effect.gen(function* () {
        const mongo = yield* MongoConnection
        const collectionName = config.collectionName || `${config.entityName}s`
        const collection = mongo.collection<T & Document>(collectionName)
        const idField = config.idField as string

        // Create indexes if specified
        if (config.indexes) {
            yield* Effect.forEach(config.indexes, (index) =>
                tryMongo(
                    () => collection.createIndex(index.fields as any, index.options),
                    `Creating index on ${collectionName}`
                )
            )
        }

        // Base repository implementation
        const baseRepo: Repository<T> = {
            findById: (id: string) =>
                pipe(
                    tryMongo(
                        () => collection.findOne({ [idField]: id } as Filter<T & Document>),
                        `Finding ${config.entityName} by ID`
                    ),
                    Effect.map((doc) => Option.fromNullable(doc as T | null))
                ),

            findAll: () =>
                tryMongo(
                    () => collection.find({}).toArray(),
                    `Finding all ${config.entityName}s`
                ).pipe(Effect.map((docs) => docs as readonly T[])),

            save: (entity: T) =>
                tryMongo(
                    () =>
                        collection.replaceOne(
                            { [idField]: entity[idField] } as Filter<T & Document>,
                            entity as OptionalId<T & Document>,
                            { upsert: true }
                        ),
                    `Saving ${config.entityName}`
                ).pipe(Effect.asVoid),

            delete: (id: string) =>
                tryMongo(
                    () => collection.deleteOne({ [idField]: id } as Filter<T & Document>),
                    `Deleting ${config.entityName}`
                ).pipe(Effect.asVoid),

            upsert: (entity: T) =>
                tryMongo(
                    () =>
                        collection.replaceOne(
                            { [idField]: entity[idField] } as Filter<T & Document>,
                            entity as OptionalId<T & Document>,
                            { upsert: true }
                        ),
                    `Upserting ${config.entityName}`
                ).pipe(Effect.asVoid),

            exists: (id: string) =>
                tryMongo(
                    () => collection.countDocuments({ [idField]: id } as Filter<T & Document>),
                    `Checking ${config.entityName} existence`
                ).pipe(Effect.map((count) => count > 0)),

            count: () =>
                tryMongo(
                    () => collection.countDocuments(),
                    `Counting ${config.entityName}s`
                ),

            find: (filter: Partial<T>) =>
                tryMongo(
                    () => collection.find(filter as Filter<T & Document>).toArray(),
                    `Finding ${config.entityName}s`
                ).pipe(Effect.map((docs) => docs as readonly T[])),

            findOne: (filter: Partial<T>) =>
                pipe(
                    tryMongo(
                        () => collection.findOne(filter as Filter<T & Document>),
                        `Finding one ${config.entityName}`
                    ),
                    Effect.map((doc) => Option.fromNullable(doc as T | null))
                ),
        }

        // Apply extensions if provided
        const extended = config.extensions ? { ...baseRepo, ...config.extensions(baseRepo) } : baseRepo

        return extended
    })

// ============================================================================
// Entity-Specific Extensions
// ============================================================================

// Account extensions
export const accountExtensions = <T extends { status?: string; steamId64?: string }>(
    base: Repository<T>
) => ({
    findByStatus: (status: string) => base.find({ status } as Partial<T>),
    findBySteamId: (steamId64: string) => base.findOne({ steamId64 } as Partial<T>),
    updateStatus: (id: string, status: string) =>
        Effect.gen(function* () {
            const account = yield* base.findById(id)
            if (Option.isSome(account)) {
                yield* base.save({ ...account.value, status } as T)
            }
        }),
})

// Dialog extensions
export const dialogExtensions = <T extends {
    accountId?: string
    status?: string
    score?: number
    messages?: any[]
}>(base: Repository<T>) => ({
    findByAccountId: (accountId: string) => base.find({ accountId } as Partial<T>),
    findByStatus: (status: string) => base.find({ status } as Partial<T>),
    findActive: () => base.find({ status: 'active' } as Partial<T>),
    updateScore: (id: string, score: number) =>
        Effect.gen(function* () {
            const dialog = yield* base.findById(id)
            if (Option.isSome(dialog)) {
                yield* base.save({ ...dialog.value, score } as T)
            }
        }),
    appendMessage: (id: string, message: any) =>
        Effect.gen(function* () {
            const dialog = yield* base.findById(id)
            if (Option.isSome(dialog)) {
                const messages = [...(dialog.value.messages || []), message]
                yield* base.save({ ...dialog.value, messages } as T)
            }
        }),
})

// ============================================================================
// Repository Definition Helper
// ============================================================================

export interface RepositoryDefinition<T> {
    tag: Context.Tag<any, any>
    layer: Layer.Layer<any>
    config: RepositoryConfig<T>
}

/**
 * Define a repository with automatic tag and layer creation
 */
export const defineRepository = <T, Extensions = {}>(
    config: RepositoryConfig<T>
): RepositoryDefinition<T> => {
    const tagName = `${config.entityName}Repository`
    const RepositoryTag = tag<typeof tagName, Repository<T> & Extensions>(tagName)

    const RepositoryLayer = serviceLayer(
        RepositoryTag,
        () => createRepository(config) as Op<Repository<T> & Extensions>
    )

    return {
        tag: RepositoryTag,
        layer: RepositoryLayer,
        config,
    }
}

// ============================================================================
// Batch Repository Creation
// ============================================================================

/**
 * Create all repository layers from entity schemas
 */
export const createRepositoriesFromSchemas = (
    schemas: Record<string, {
        schema: S.Schema<any, any, never>
        extensions?: (base: Repository<any>) => any
    }>
) => {
    const repositories: Record<string, RepositoryDefinition<any>> = {}

    for (const [name, { schema, extensions }] of Object.entries(schemas)) {
        const config: RepositoryConfig<any> = {
            entityName: name,
            collectionName: `${name}s`,
            idField: `${name}Id`,
            schema,
            indexes: (schema.annotations as any)?.indexes,
            extensions,
        }

        repositories[name] = defineRepository(config)
    }

    // Combine all layers
    const layers = Object.values(repositories).map(r => r.layer)
    const AllRepositoriesLayer = Layer.mergeAll(...layers)

    return {
        repositories,
        AllRepositoriesLayer,
    }
}

// ============================================================================
// Usage Example
// ============================================================================

/**
 * Example usage:
 *
 * ```typescript
 * import { AccountSchema, DialogSchema } from '@packages/isomorphic'
 *
 * const { repositories, AllRepositoriesLayer } = createRepositoriesFromSchemas({
 *   account: {
 *     schema: AccountSchema,
 *     extensions: accountExtensions
 *   },
 *   dialog: {
 *     schema: DialogSchema,
 *     extensions: dialogExtensions
 *   },
 * })
 *
 * // Use in Effect
 * const program = Effect.gen(function* () {
 *   const accountRepo = yield* repositories.account.tag
 *   const account = yield* accountRepo.findById('123')
 *
 *   // Entity-specific methods available
 *   const onlineAccounts = yield* accountRepo.findByStatus('online')
 * })
 * ```
 */