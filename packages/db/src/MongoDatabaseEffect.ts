import { Effect, Context, Layer, Schema, Option, Cache, Duration, pipe, Scope } from 'effect'
import { MongoClient, Db, Collection, Document, Filter } from 'mongodb'
import { SimpleLogger, getDatabaseConfig, DatabaseConfig, ConfigService, ConfigError } from '@packages/isomorphic'
import { EventRecord, EventFilter, SliceConfig } from './types'

// Error type
export class MongoError extends Schema.TaggedError<MongoError>()('MongoError', {
    operation: Schema.String,
    message: Schema.String
}) {}

// Types
export type Repo<T> = {
    findById: (id: string) => Effect.Effect<Option.Option<T>, MongoError>
    findAll: () => Effect.Effect<readonly T[], MongoError>
    save: (entity: T) => Effect.Effect<void, MongoError>
    delete: (id: string) => Effect.Effect<void, MongoError>
    findBatch: (ids: readonly string[]) => Effect.Effect<readonly T[], MongoError>
}

// Services
export class MongoConnection extends Context.Tag('MongoConnection')<MongoConnection, { client: MongoClient; db: Db }>() {}

// Helpers
const tryMongo = <A>(operation: string, fn: () => Promise<A>) =>
    Effect.tryPromise({
        try: fn,
        catch: (e) => new MongoError({ operation, message: String(e) })
    })

const extractDbName = (url: string) => {
    const match = url.match(/\/([^/?]+)(\?|$)/)
    if (!match?.[1]) throw new Error('Database name not found')
    return match[1]
}

// Connection Layer
export const MongoConnectionLive = Layer.scoped(
    MongoConnection,
    Effect.gen(function* () {
        const config = yield* getDatabaseConfig
        const logger = new SimpleLogger('MongoDB')
        
        const client = new MongoClient(config.connectionString, { maxPoolSize: config.poolSize })
        yield* tryMongo('connect', () => client.connect())
        const db = client.db(extractDbName(config.connectionString))
        
        logger.info('Connected', { db: db.databaseName, poolSize: config.poolSize })
        
        // Register cleanup using Effect.addFinalizer
        yield* Effect.addFinalizer(() => 
            tryMongo('close', () => client.close()).pipe(
                Effect.tap(() => Effect.sync(() => logger.info('Disconnected'))),
                Effect.catchAll(() => Effect.void)
            )
        )
        
        return { client, db }
    })
)

// Repository factory
const createRepo = <T>(
    collection: Collection<T & Document>,
    sliceName: string,
    cache?: Cache.Cache<string, Option.Option<T>, MongoError>
): Repo<T> => {
    const idField = `${sliceName}Id`
    const tryOp = (op: string) => <A>(fn: () => Promise<A>) => tryMongo(`${op}:${sliceName}`, fn)
    
    const withCache = <A>(id: string, fetch: () => Effect.Effect<Option.Option<T>, MongoError>) =>
        cache ? cache.get(id).pipe(
            Effect.flatMap(cached => Option.isSome(cached) ? Effect.succeed(cached) : fetch().pipe(
                Effect.tap(result => cache.set(id, result))
            ))
        ) : fetch()
    
    return {
        findById: (id) => withCache(id, () =>
            tryOp('find')(() => collection.findOne(
                { [idField]: id } as Filter<T & Document>,
                { projection: { _id: 0 } }
            )).pipe(Effect.map(result => Option.fromNullable(result as T | null)))
        ),
        
        findAll: () => tryOp('findAll')(() =>
            collection.find({}, { projection: { _id: 0 } }).toArray()
        ).pipe(Effect.map(results => results as unknown as readonly T[])),
        
        save: (entity) => {
            const entityRecord = entity as Record<string, unknown>
            const id = entityRecord[idField] as string
            return pipe(
                tryOp('save')(() => collection.replaceOne(
                    { [idField]: id } as Filter<T & Document>,
                    entity as T & Document,
                    { upsert: true }
                )),
                Effect.tap(() => cache ? cache.set(id, Option.some(entity)) : Effect.void),
                Effect.asVoid
            )
        },
        
        delete: (id) => pipe(
            tryOp('delete')(() => collection.deleteOne({ [idField]: id } as Filter<T & Document>)),
            Effect.tap(() => cache ? cache.invalidate(id) : Effect.void),
            Effect.asVoid
        ),
        
        findBatch: (ids) => tryOp('findBatch')(() =>
            collection.find(
                { [idField]: { $in: [...ids] } } as Filter<T & Document>,
                { projection: { _id: 0 } }
            ).toArray()
        ).pipe(Effect.map(results => results as unknown as readonly T[]))
    }
}

// EventStore service
export class EventStore extends Context.Tag('EventStore')<EventStore, {
    append: (event: EventRecord) => Effect.Effect<void, MongoError>
    appendBatch: (events: readonly EventRecord[]) => Effect.Effect<void, MongoError>
    getEvents: (filter?: EventFilter) => Effect.Effect<readonly EventRecord[], MongoError>
    clearEvents: () => Effect.Effect<void, MongoError>
}>() {}

export const EventStoreLive = Layer.effect(
    EventStore,
    Effect.gen(function* () {
        const { db } = yield* MongoConnection
        const col = db.collection<EventRecord>('events')
        
        // Create indexes
        yield* tryMongo('indexes', async () => {
            await col.createIndex({ 'meta.aggregate': 1, 'meta.ts': -1 })
            await col.createIndex({ 'meta.ts': -1 })
        })
        
        const ensureTimestamp = (e: EventRecord): EventRecord => ({
            ...e,
            timestamp: e.timestamp || Date.now(),
            meta: { ...e.meta, ts: e.meta.ts || Date.now() }
        })
        
        return {
            append: (event) => tryMongo('append', () => col.insertOne(ensureTimestamp(event))).pipe(Effect.asVoid),
            
            appendBatch: (events) => events.length === 0 
                ? Effect.void
                : tryMongo('appendBatch', () => col.insertMany([...events.map(ensureTimestamp)])).pipe(Effect.asVoid),
            
            getEvents: (filter) => tryMongo('getEvents', async () => {
                const query: Filter<EventRecord> = {}
                if (filter?.aggregate) query['meta.aggregate'] = filter.aggregate
                if (filter?.type) query.type = filter.type
                if (filter?.fromTimestamp || filter?.toTimestamp) {
                    query['meta.ts'] = {
                        ...(filter.fromTimestamp && { $gte: filter.fromTimestamp }),
                        ...(filter.toTimestamp && { $lte: filter.toTimestamp })
                    }
                }
                return col.find(query)
                    .sort({ 'meta.ts': -1 })
                    .skip(filter?.offset || 0)
                    .limit(filter?.limit || 1000)
                    .toArray()
            }),
            
            clearEvents: () => tryMongo('clear', () => col.deleteMany({})).pipe(Effect.asVoid)
        }
    })
)

// Database service (using interface approach instead of generic class)
export interface MongoDBService<TSlices extends readonly SliceConfig[]> {
    repos: { [K in TSlices[number] as K['name']]: Repo<K extends SliceConfig<string, infer E> ? E : never> }
    eventStore: Context.Tag.Service<EventStore>
    clearAll: () => Effect.Effect<void, MongoError>
}

export class MongoDB extends Context.Tag('MongoDB')<MongoDB, MongoDBService<any>>() {}

// Database Layer factory
export const createMongoDBLayer = <TSlices extends readonly SliceConfig[]>(
    slices: TSlices
) =>
    Layer.effect(
        MongoDB,
        Effect.gen(function* () {
            const { db } = yield* MongoConnection
            const eventStore = yield* EventStore
            const dbConfig = yield* getDatabaseConfig
            const logger = new SimpleLogger('MongoDB')
            
            const repos: Record<string, Repo<unknown>> = {}
            
            for (const slice of slices) {
                const colName = slice.pluralizeFn?.(slice.name) || `${slice.name}s`
                const col = db.collection(colName)
                
                // Create indexes from schema annotations  
                const schemaWithAst = slice.schema as unknown as { ast?: { annotations?: { indexes?: Array<{ fields: Record<string, unknown>, options?: Record<string, unknown> }> } } }
                const indexes = schemaWithAst.ast?.annotations?.indexes || []
                for (const idx of indexes) {
                    yield* tryMongo('createIndex', () => col.createIndex(idx.fields as Record<string, 1 | -1>, idx.options || {}))
                }
                
                // Create cache using config settings
                const cache = yield* Cache.make<string, Option.Option<unknown>, MongoError>({
                    capacity: dbConfig.cache.capacity,
                    timeToLive: Duration.minutes(dbConfig.cache.ttlMinutes),
                    lookup: () => Effect.succeed(Option.none())
                })
                
                repos[slice.name] = createRepo(col, slice.name, cache)
                
                // Save initial entities
                if (slice.initialEntities) {
                    yield* Effect.forEach(slice.initialEntities, (e) => repos[slice.name].save(e))
                }
                
                logger.info('Repository ready', { name: slice.name, collection: colName })
            }
            
            return {
                repos,
                eventStore,
                clearAll: () => Effect.gen(function* () {
                    yield* eventStore.clearEvents()
                    yield* Effect.forEach(Object.keys(repos), (name) =>
                        tryMongo('clearAll', () => db.collection(slices.find(s => s.name === name)?.pluralizeFn?.(name) || `${name}s`).deleteMany({}))
                    )
                    // Re-init initial entities
                    yield* Effect.forEach(slices.filter(s => s.initialEntities), (slice) =>
                        Effect.forEach(slice.initialEntities!, (e) => repos[slice.name].save(e))
                    )
                })
            } as MongoDBService<any>
        })
    )

// Complete Layer (requires ConfigService to be provided externally)
export const createCompleteMongoDB = <TSlices extends readonly SliceConfig[]>(
    slices: TSlices
) => {
    const eventStoreLayer = EventStoreLive.pipe(Layer.provide(MongoConnectionLive))
    const dbLayer = createMongoDBLayer(slices).pipe(
        Layer.provide(Layer.merge(MongoConnectionLive, eventStoreLayer))
    )
    
    return dbLayer
}

// Helper to run with MongoDB
export const runWithMongoDB = <TSlices extends readonly SliceConfig[], R, E, A>(
    config: DatabaseConfig,
    slices: TSlices,
    program: Effect.Effect<A, E, MongoDB | R>,
    cacheOptions?: { capacity: number; ttl: Duration.Duration }
) => {
    // Create a simple ConfigService layer that provides the database config
    const configServiceLayer = Layer.succeed(ConfigService, {
        getDatabase: () => Effect.succeed(config),
        getFullConfig: () => Effect.fail(new ConfigError({ section: 'full', message: 'Not implemented in test' })),
        getOpenAI: () => Effect.fail(new ConfigError({ section: 'openai', message: 'Not implemented in test' })),
        getScoring: () => Effect.fail(new ConfigError({ section: 'scoring', message: 'Not implemented in test' })),
        getContext: () => Effect.fail(new ConfigError({ section: 'context', message: 'Not implemented in test' })),
        getServer: () => Effect.fail(new ConfigError({ section: 'server', message: 'Not implemented in test' })),
        getRateLimit: () => Effect.fail(new ConfigError({ section: 'ratelimit', message: 'Not implemented in test' })),
        getEnvironment: () => Effect.fail(new ConfigError({ section: 'environment', message: 'Not implemented in test' }))
    })
    
    return program.pipe(
        Effect.provide(createCompleteMongoDB(slices)),
        Effect.provide(configServiceLayer)
    )
}