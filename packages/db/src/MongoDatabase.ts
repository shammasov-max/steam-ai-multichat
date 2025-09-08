import { MongoClient, Db, Collection, Document } from 'mongodb'
import { MongoEventStore } from './MongoEventStore'
import * as S from 'effect/Schema'
import { SimpleLogger } from '@packages/isomorphic'

// Repository interface matching slice structure
export interface Repository<T> {
    collection: Collection<T & Document>
    findById: (id: string) => Promise<T | null>
    findAll: () => Promise<T[]>
    save: (entity: T) => Promise<void>
    delete: (id: string) => Promise<void>
}

// Slice configuration type
export interface SliceConfig<TName extends string = string, TEntity = unknown> {
    name: TName
    schema: S.Schema<TEntity, unknown, never>
    pluralizeFn?: (name: string) => string
    initialEntities?: TEntity[]
}

// Extract entity type from slice config
type EntityFromSlice<S> = S extends SliceConfig<string, infer E> ? E : never

// Generate repository map type from slices tuple
type RepositoriesFromSlices<T extends readonly SliceConfig[]> = {
    [K in T[number] as K['name']]: Repository<EntityFromSlice<K>>
}

export class MongoDatabase<TSlices extends readonly SliceConfig[]> {
    public readonly eventStore: MongoEventStore
    public readonly repos: RepositoriesFromSlices<TSlices> = {} as RepositoriesFromSlices<TSlices>
    
    private client: MongoClient | null = null
    private db: Db | null = null
    private connectionString: string
    private slices: TSlices
    private logger = new SimpleLogger('MongoDatabase')

    constructor(connectionString: string, slices: TSlices) {
        this.connectionString = connectionString
        this.slices = slices
        this.eventStore = new MongoEventStore()
        
        // Initialize repository stubs (will be connected in init())
        for (const slice of slices) {
            type EntityType = EntityFromSlice<typeof slice>
            const repository: Repository<EntityType> = {
                collection: null as unknown as Collection<EntityType & Document>,
                findById: async () => { throw new Error('Database not initialized. Call init() first.') },
                findAll: async () => { throw new Error('Database not initialized. Call init() first.') },
                save: async () => { throw new Error('Database not initialized. Call init() first.') },
                delete: async () => { throw new Error('Database not initialized. Call init() first.') }
            }
            ;(this.repos as Record<string, Repository<unknown>>)[slice.name] = repository
        }
    }

    async init(): Promise<void> {
        try {
            // Extract database name from connection string
            const dbName = this.extractDatabaseName(this.connectionString)
            
            // Create MongoDB client with minimal config
            this.client = new MongoClient(this.connectionString)
            
            // Connect to MongoDB
            await this.client.connect()
            
            // Get database reference
            this.db = this.client.db(dbName)
            
            // Initialize repositories from slices
            await this.initializeRepositories()
            
            // Initialize event store with db reference
            await this.eventStore.init(this.db)
            
            this.logger.info('MongoDB connected successfully', { database: dbName })
        } catch (error) {
            this.logger.error('MongoDB initialization failed', error as Error, { database: this.extractDatabaseName(this.connectionString) })
            throw error
        }
    }
    
    private extractDatabaseName(connectionString: string): string {
        // Parse MongoDB connection string to extract database name
        // Format: mongodb://[user:pass@]host[:port]/database[?options]
        const match = connectionString.match(/\/([^/?]+)(\?|$)/)
        if (!match || !match[1]) {
            throw new Error('Database name not found in connection string')
        }
        return match[1]
    }
    
    private async initializeRepositories(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized')
        
        for (const slice of this.slices) {
            const collectionName = slice.pluralizeFn ? slice.pluralizeFn(slice.name) : slice.name + 's'
            const collection = this.db.collection(collectionName)
            
            // Create indexes from schema annotations
            await this.createIndexesFromSchema(collection, slice.schema)
            
            // Create repository
            type EntityType = EntityFromSlice<typeof slice>
            const repository: Repository<EntityType> = {
                collection: collection as Collection<EntityType & Document>,
                findById: async (id: string) => {
                    const idField = `${slice.name}Id`
                    const result = await collection.findOne({ [idField]: id }, { projection: { _id: 0 } })
                    return result as EntityType | null
                },
                findAll: async () => {
                    const results = await collection.find({}, { projection: { _id: 0 } }).toArray()
                    return results as EntityType[]
                },
                save: async (entity: EntityType) => {
                    const idField = `${slice.name}Id`
                    const id = (entity as Record<string, unknown>)[idField]
                    await collection.replaceOne(
                        { [idField]: id },
                        entity as Document,
                        { upsert: true }
                    )
                },
                delete: async (id: string) => {
                    const idField = `${slice.name}Id`
                    await collection.deleteOne({ [idField]: id })
                }
            }
            
            // Add repository to repos object
            ;(this.repos as Record<string, Repository<unknown>>)[slice.name] = repository
            
            // Save initial entities if slice has them
            const initialEntities = slice.initialEntities
            if (initialEntities && Array.isArray(initialEntities)) {
                for (const entity of initialEntities) {
                    await repository.save(entity)
                }
            }
        }
    }
    
    private async createIndexesFromSchema(collection: Collection, schema: S.Schema<unknown, unknown, never>): Promise<void> {
        // Extract index metadata from schema AST annotations
        if (!schema) {
            return
        }
        
        try {
            // Access annotations through the AST
            const ast = (schema as S.Schema<unknown, unknown, never> & { ast?: { annotations?: Record<string, unknown> } }).ast
            const annotations = ast?.annotations || {}
            const indexes = (annotations as { indexes?: Array<{ fields: Record<string, unknown>, options?: Record<string, unknown> }> }).indexes || []
            
            for (const index of indexes) {
                await collection.createIndex(index.fields, index.options || {})
            }
        } catch (error) {
            this.logger.warn('Failed to create indexes from schema', error as Error)
        }
    }

    async close(): Promise<void> {
        await this.eventStore.close()
        
        if (this.client) {
            await this.client.close()
            this.client = null
            this.db = null
            this.logger.info('MongoDB connection closed')
        }
    }

    async clearAll(): Promise<void> {
        await this.eventStore.clearEvents()
        
        // Clear all entity collections
        for (const key in this.repos) {
            const repo = (this.repos as Record<string, Repository<unknown>>)[key]
            if (repo && repo.collection) {
                await repo.collection.deleteMany({})
            }
        }
        
        // Re-initialize initial entities after clearing
        for (const slice of this.slices) {
            const initialEntities = slice.initialEntities
            if (initialEntities && Array.isArray(initialEntities)) {
                const repo = (this.repos as Record<string, Repository<unknown>>)[slice.name]
                for (const entity of initialEntities) {
                    await repo.save(entity)
                }
            }
        }
    }
    
}
