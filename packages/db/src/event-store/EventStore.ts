import { Context, Effect } from 'effect'
import { MongoError } from '../errors/MongoError'
import { EventRecord, EventFilter } from '../types'

export interface EventStoreService {
    append: (event: EventRecord) => Effect.Effect<void, MongoError>
    appendBatch: (events: readonly EventRecord[]) => Effect.Effect<void, MongoError>
    getEvents: (filter?: EventFilter) => Effect.Effect<readonly EventRecord[], MongoError>
    getEventsByAggregate: (
        aggregate: string,
        limit?: number
    ) => Effect.Effect<readonly EventRecord[], MongoError>
    clearEvents: () => Effect.Effect<void, MongoError>
}

export class EventStore extends Context.Tag('EventStore')<EventStore, EventStoreService>() {}
