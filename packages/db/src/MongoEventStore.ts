import { Db, Collection, Filter, Sort } from 'mongodb'
import { EventRecord, EventFilter } from './types'
import { SimpleLogger } from '@packages/isomorphic'

export class MongoEventStore {
    private collection: Collection<EventRecord> | null = null
    private logger = new SimpleLogger('MongoEventStore')
    
    constructor() {}

    async init(db: Db): Promise<void> {
        try {
            // Use hardcoded 'events' collection name
            this.collection = db.collection<EventRecord>('events')
            
            // Create indexes for efficient querying
            await this.createIndexes()
            
            this.logger.info('EventStore initialized successfully', { collection: 'events' })
        } catch (error) {
            this.logger.error('EventStore initialization failed', error as Error)
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
            
            await this.collection.insertOne(eventToSave)
        } catch (error) {
            this.logger.error('Failed to save event', error as Error, { eventType: event.type })
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
            
            await this.collection.insertMany(eventsToSave)
        } catch (error) {
            this.logger.error('Failed to save events batch', error as Error, { eventsCount: events.length })
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
                const tsQuery: { $gte?: number; $lte?: number } = {}
                if (filter.fromTimestamp) {
                    tsQuery.$gte = filter.fromTimestamp
                }
                if (filter.toTimestamp) {
                    tsQuery.$lte = filter.toTimestamp
                }
                query['meta.ts'] = tsQuery
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
            this.logger.error('Failed to get events', error as Error, { filter })
            throw error
        }
    }
    
    async getEventsByAggregate(aggregate: string, limit?: number): Promise<EventRecord[]> {
        return this.getEvents({ aggregate, ...(limit !== undefined && { limit }) })
    }
    
    async getEventsSince(timestamp: number, limit?: number): Promise<EventRecord[]> {
        return this.getEvents({ fromTimestamp: timestamp, ...(limit !== undefined && { limit }) })
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
            this.logger.error('Failed to get events by aggregate ID', error as Error, { aggregateType, aggregateId })
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
            this.logger.error('Failed to get latest event', error as Error, { aggregateType, aggregateId })
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
                const tsQuery: { $gte?: number; $lte?: number } = {}
                if (filter.fromTimestamp) {
                    tsQuery.$gte = filter.fromTimestamp
                }
                if (filter.toTimestamp) {
                    tsQuery.$lte = filter.toTimestamp
                }
                query['meta.ts'] = tsQuery
            }
            
            return await this.collection.countDocuments(query)
        } catch (error) {
            this.logger.error('Failed to count events', error as Error, { filter })
            throw error
        }
    }

    async clearEvents(): Promise<void> {
        if (!this.collection) {
            throw new Error('EventStore not initialized')
        }
        
        try {
            await this.collection.deleteMany({})
            this.logger.info('All events cleared successfully')
        } catch (error) {
            this.logger.error('Failed to clear events', error as Error)
            throw error
        }
    }

    async close(): Promise<void> {
        // Connection is managed by MongoDatabase
        this.collection = null
        this.logger.info('EventStore closed')
    }
}