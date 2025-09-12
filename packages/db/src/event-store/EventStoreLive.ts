import { Effect, Layer } from 'effect'
import { Collection, Filter } from 'mongodb'
import { Logger } from '@packages/isomorphic'
import { EventStore } from './EventStore'
import { MongoConnection } from '../connection/MongoConnection'
import { MongoError } from '../errors/MongoError'
import { EventRecord, EventFilter } from '../types'

const tryMongo = <A>(operation: string, fn: () => Promise<A>) =>
    Effect.tryPromise({
        try: fn,
        catch: (e) => MongoError.queryFailed(operation, String(e), e)
    })

const ensureTimestamp = (event: EventRecord): EventRecord => ({
    ...event,
    timestamp: event.timestamp || Date.now(),
    meta: {
        ...event.meta,
        ts: event.meta.ts || Date.now()
    }
})

export const EventStoreLive = Layer.effect(
    EventStore,
    Effect.gen(function* () {
        const { db } = yield* MongoConnection
        const collection = db.collection<EventRecord>('events')
        const logger = yield* Logger
        
        // Create indexes for efficient querying
        yield* tryMongo('createIndexes', async () => {
            await collection.createIndex({ 'meta.aggregate': 1, 'meta.ts': -1 })
            await collection.createIndex({ 'meta.ts': -1 })
            await collection.createIndex({ type: 1, 'meta.ts': -1 })
        })
        
        yield* logger.info('EventStore initialized with indexes')
        
        return {
            append: (event) =>
                tryMongo('append', () => collection.insertOne(ensureTimestamp(event))).pipe(
                    Effect.asVoid
                ),
            
            appendBatch: (events) =>
                events.length === 0
                    ? Effect.void
                    : tryMongo('appendBatch', () =>
                          collection.insertMany([...events.map(ensureTimestamp)])
                      ).pipe(Effect.asVoid),
            
            getEvents: (filter) =>
                tryMongo('getEvents', async () => {
                    const query: Filter<EventRecord> = {}
                    
                    if (filter?.aggregate) {
                        query['meta.aggregate'] = filter.aggregate
                    }
                    if (filter?.type) {
                        query.type = filter.type
                    }
                    if (filter?.fromTimestamp || filter?.toTimestamp) {
                        query['meta.ts'] = {
                            ...(filter.fromTimestamp && { $gte: filter.fromTimestamp }),
                            ...(filter.toTimestamp && { $lte: filter.toTimestamp })
                        }
                    }
                    
                    return collection
                        .find(query)
                        .sort({ 'meta.ts': -1 })
                        .skip(filter?.offset || 0)
                        .limit(filter?.limit || 1000)
                        .toArray()
                }),
            
            getEventsByAggregate: (aggregate, limit = 100) =>
                tryMongo('getEventsByAggregate', () =>
                    collection
                        .find({ 'meta.aggregate': aggregate })
                        .sort({ 'meta.ts': -1 })
                        .limit(limit)
                        .toArray()
                ),
            
            clearEvents: () =>
                tryMongo('clearEvents', () => collection.deleteMany({})).pipe(
                    Effect.tap(() => logger.info('All events cleared').pipe(Effect.ignore)),
                    Effect.asVoid
                )
        }
    })
)