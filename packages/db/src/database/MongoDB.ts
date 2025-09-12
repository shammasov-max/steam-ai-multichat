import { Context, Effect } from 'effect'
import { Repository } from '../repository/Repository'
import { EventStoreService } from '../event-store/EventStore'
import { SliceConfig } from '../types'
import { MongoError } from '../errors/MongoError'

export interface MongoDBService<TSlices extends readonly SliceConfig[]> {
    repos: {
        [K in TSlices[number] as K['name']]: Repository<
            K extends SliceConfig<string, infer E> ? E : never
        >
    }
    eventStore: EventStoreService
    clearAll: () => Effect.Effect<void, MongoError>
}

export class MongoDB extends Context.Tag('MongoDB')<
    MongoDB,
    MongoDBService<any>
>() {}