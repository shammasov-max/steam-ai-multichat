import { MongoClient, Db, Collection, Filter, Sort } from 'mongodb'
import { EventRecord, EventFilter } from './types'
import { MongoConfig } from './config'

export class MongoEventStore {
    private client: MongoClient | null = null
    private db: Db | null = null
    private collection: Collection<EventRecord> | null = null
    
    constructor(private config: MongoConfig) {}

    async init(): Promise<void> {
        try {
            // Create MongoDB client with configuration
            this.client = new MongoClient(this.config.connectionString, {
                maxPoolSize: this.config.maxPoolSize,
                minPoolSize: this.config.minPoolSize,
                retryWrites: this.config.retryWrites,
                writeConcern: this.config.writeConcern
            })
            
            // Connect to MongoDB
            await this.client.connect()
            
            // Get database and collection references
            this.db = this.client.db(this.config.database)
            this.collection = this.db.collection<EventRecord>(this.config.eventsCollection)
            
            // Create indexes for efficient querying
            await this.createIndexes()
            
            console.log(`EventStore connected to MongoDB: ${this.config.database}/${this.config.eventsCollection}`)
        } catch (error) {
            console.error('Failed to initialize EventStore:', error)
            throw error
        }
    }
    
    private async createIndexes(): Promise<void> {
        if (!this.collection) return
        
        // Create compound index for efficient event queries
        await this.collection.createIndex({ 'meta.aggregate': 1, 'meta.ts': -1 })
        await this.collection.createIndex({ type: 1, 'meta.ts': -1 })
        await this.collection.createIndex({ 'meta.ts': -1 })
        await this.collection.createIndex({ timestamp: -1 })
        await this.collection.createIndex({ 'meta.id': 1 })
    }

    async append(event: EventRecord): Promise<void> {
        if (!this.collection) {
            throw new Error('EventStore not initialized')
        }
        
        try {
            // Ensure event has required fields
            const eventToSave: EventRecord = {
                ...event,
                timestamp: event.timestamp || Date.now(),
                meta: {
                    ...event.meta,
                    ts: event.meta.ts || Date.now()
                }
            }
            
            await this.collection.insertOne(eventToSave as any)
        } catch (error) {
            console.error('Failed to save event:', error)
            throw error
        }
    }
    
    async appendBatch(events: EventRecord[]): Promise<void> {
        if (!this.collection) {
            throw new Error('EventStore not initialized')
        }
        
        if (events.length === 0) return
        
        try {
            const eventsToSave = events.map(event => ({
                ...event,
                timestamp: event.timestamp || Date.now(),
                meta: {
                    ...event.meta,
                    ts: event.meta.ts || Date.now()
                }
            }))
            
            await this.collection.insertMany(eventsToSave as any)
        } catch (error) {
            console.error('Failed to save events:', error)
            throw error
        }
    }

    async getEvents(filter?: EventFilter): Promise<EventRecord[]> {
        if (!this.collection) {
            throw new Error('EventStore not initialized')
        }
        
        try {
            // Build MongoDB query from filter
            const query: Filter<EventRecord> = {}
            
            if (filter?.aggregate) {
                query['meta.aggregate'] = filter.aggregate
            }
            
            if (filter?.type) {
                query.type = filter.type
            }
            
            if (filter?.fromTimestamp || filter?.toTimestamp) {
                query['meta.ts'] = {}
                if (filter.fromTimestamp) {
                    (query['meta.ts'] as any).$gte = filter.fromTimestamp
                }
                if (filter.toTimestamp) {
                    (query['meta.ts'] as any).$lte = filter.toTimestamp
                }
            }
            
            // Build sort and pagination options
            const sort: Sort = { 'meta.ts': -1 }
            const limit = filter?.limit || 1000
            const skip = filter?.offset || 0
            
            // Execute query
            const events = await this.collection
                .find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .toArray()
            
            return events as EventRecord[]
        } catch (error) {
            console.error('Failed to get events:', error)
            throw error
        }
    }
    
    async getEventsByAggregate(aggregate: string, limit?: number): Promise<EventRecord[]> {
        return this.getEvents({ aggregate, limit })
    }
    
    async getEventsSince(timestamp: number, limit?: number): Promise<EventRecord[]> {
        return this.getEvents({ fromTimestamp: timestamp, limit })
    }
    
    async getEventsByAggregateId(aggregateType: string, aggregateId: string, fromTimestamp?: number): Promise<EventRecord[]> {
        if (!this.collection) {
            throw new Error('EventStore not initialized')
        }
        
        try {
            const query: Filter<EventRecord> = {
                'meta.aggregate': aggregateType,
                'meta.id': aggregateId
            }
            
            if (fromTimestamp) {
                query['meta.ts'] = { $gte: fromTimestamp }
            }
            
            const events = await this.collection
                .find(query)
                .sort({ 'meta.ts': 1 }) // Chronological order for replay
                .toArray()
            
            return events as EventRecord[]
        } catch (error) {
            console.error('Failed to get events by aggregate ID:', error)
            throw error
        }
    }
    
    async getLatestEventForAggregate(aggregateType: string, aggregateId: string): Promise<EventRecord | null> {
        if (!this.collection) {
            throw new Error('EventStore not initialized')
        }
        
        try {
            const event = await this.collection.findOne(
                {
                    'meta.aggregate': aggregateType,
                    'meta.id': aggregateId
                },
                {
                    sort: { 'meta.ts': -1 }
                }
            )
            
            return event as EventRecord | null
        } catch (error) {
            console.error('Failed to get latest event:', error)
            throw error
        }
    }
    
    async getEventCount(filter?: EventFilter): Promise<number> {
        if (!this.collection) {
            throw new Error('EventStore not initialized')
        }
        
        try {
            const query: Filter<EventRecord> = {}
            
            if (filter?.aggregate) {
                query['meta.aggregate'] = filter.aggregate
            }
            
            if (filter?.type) {
                query.type = filter.type
            }
            
            if (filter?.fromTimestamp || filter?.toTimestamp) {
                query['meta.ts'] = {}
                if (filter.fromTimestamp) {
                    (query['meta.ts'] as any).$gte = filter.fromTimestamp
                }
                if (filter.toTimestamp) {
                    (query['meta.ts'] as any).$lte = filter.toTimestamp
                }
            }
            
            return await this.collection.countDocuments(query)
        } catch (error) {
            console.error('Failed to count events:', error)
            throw error
        }
    }

    async clearEvents(): Promise<void> {
        if (!this.collection) {
            throw new Error('EventStore not initialized')
        }
        
        try {
            await this.collection.deleteMany({})
            console.log('All events cleared')
        } catch (error) {
            console.error('Failed to clear events:', error)
            throw error
        }
    }

    async close(): Promise<void> {
        if (this.client) {
            await this.client.close()
            this.client = null
            this.db = null
            this.collection = null
            console.log('EventStore connection closed')
        }
    }
}