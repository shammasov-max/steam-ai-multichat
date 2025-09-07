import { MongoClient, Db, Collection } from 'mongodb'
import { MongoEventStore } from './MongoEventStore'
import * as S from 'effect/Schema'

// Repository interface matching slice structure
interface Repository<T> {
    collection: Collection<any>
    findById: (id: string) => Promise<T | null>
    findAll: () => Promise<T[]>
    save: (entity: T) => Promise<void>
    delete: (id: string) => Promise<void>
}

// Extract entity type from slice
type EntityFromSlice<S> = S extends { schema: S.Schema<infer T> } ? T : never

// Generate repository map type from slices tuple
type RepositoriesFromSlices<S extends ReadonlyArray<any>> = {
    [K in keyof S as S[K] extends { name: infer N } ? N extends string ? N : never : never]: Repository<EntityFromSlice<S[K]>>
}

export class MongoDatabase<TSlices extends ReadonlyArray<{ name: string; schema: S.Schema<any>; pluralizeFn?: (name: string) => string }>> {
    public readonly eventStore: MongoEventStore
    public readonly repos: RepositoriesFromSlices<TSlices> = {} as RepositoriesFromSlices<TSlices>
    
    private client: MongoClient | null = null
    private db: Db | null = null
    private connectionString: string
    private slices: TSlices

    constructor(connectionString: string, slices: TSlices) {
        this.connectionString = connectionString
        this.slices = slices
        this.eventStore = new MongoEventStore()
        
        // Initialize repository stubs (will be connected in init())
        for (const slice of slices) {
            const repository: Repository<any> = {
                collection: null as any,
                findById: async () => { throw new Error('Database not initialized. Call init() first.') },
                findAll: async () => { throw new Error('Database not initialized. Call init() first.') },
                save: async () => { throw new Error('Database not initialized. Call init() first.') },
                delete: async () => { throw new Error('Database not initialized. Call init() first.') }
            }
            ;(this.repos as any)[slice.name] = repository
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
            
            console.log(`MongoDatabase connected to: ${dbName}`)
        } catch (error) {
            console.error('Failed to initialize MongoDatabase:', error)
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
            const repository: Repository<any> = {
                collection,
                findById: async (id: string) => {
                    const idField = `${slice.name}Id`
                    return await collection.findOne({ [idField]: id } as any)
                },
                findAll: async () => {
                    return await collection.find({}).toArray()
                },
                save: async (entity: any) => {
                    const idField = `${slice.name}Id`
                    const id = entity[idField]
                    await collection.replaceOne(
                        { [idField]: id } as any,
                        entity,
                        { upsert: true }
                    )
                },
                delete: async (id: string) => {
                    const idField = `${slice.name}Id`
                    await collection.deleteOne({ [idField]: id } as any)
                }
            }
            
            // Add repository to repos object
            ;(this.repos as any)[slice.name] = repository
        }
    }
    
    private async createIndexesFromSchema(collection: Collection, schema: S.Schema<any>): Promise<void> {
        // Extract index metadata from schema annotations
        const annotations = (schema as any).annotations || {}
        const indexes = annotations.indexes || []
        
        for (const index of indexes) {
            await collection.createIndex(index.fields, index.options || {})
        }
    }

    async close(): Promise<void> {
        await this.eventStore.close()
        
        if (this.client) {
            await this.client.close()
            this.client = null
            this.db = null
            console.log('MongoDatabase connection closed')
        }
    }

    async clearAll(): Promise<void> {
        await this.eventStore.clearEvents()
        
        // Clear all entity collections
        for (const key in this.repos) {
            const repo = (this.repos as any)[key]
            if (repo && repo.collection) {
                await repo.collection.deleteMany({})
            }
        }
    }
    
}
