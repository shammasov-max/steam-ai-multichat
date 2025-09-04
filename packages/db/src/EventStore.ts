import { createClient, ClickHouseClient } from '@clickhouse/client'
import { EventRecord, EventStoreConfig, EventFilter } from './types.js'

export class EventStore {
    private client: ClickHouseClient

    constructor(config: EventStoreConfig) {
        this.client = createClient({
            host: `${config.secure ? 'https' : 'http'}://${config.host}:${config.port || 8123}`,
            username: config.username || 'default',
            password: config.password || '',
            database: config.database || 'default',
        })
    }

    async init(): Promise<void> {

    }

    async append(event: EventRecord): Promise<void> {

    }

    async appendBatch(events: EventRecord[]): Promise<void> {
        if (events.length === 0) return

        await this.client.insert({
            table: 'events',
            values: events.map(event => ({
                id: event.id,
                type: event.type,
                payload: JSON.stringify(event.payload),
                meta_schema_version: event.meta.schemaVersion,
                meta_id: event.meta.id,
                meta_ts: event.meta.ts,
                meta_aggregate: event.meta.aggregate,
                meta_kind: event.meta.kind,
                timestamp: event.timestamp,
            })),
            format: 'JSONEachRow',
        })
    }

    async getEvents(filter: EventFilter = {}): Promise<EventRecord[]> {

    }

    async getEventsByAggregate(aggregate: string, limit?: number): Promise<EventRecord[]> {
        return this.getEvents({ aggregate, limit })
    }

    async getEventsSince(timestamp: number, limit?: number): Promise<EventRecord[]> {
        return this.getEvents({ fromTimestamp: timestamp, limit })
    }

    async getEventCount(filter: EventFilter = {}): Promise<number> {
        let whereClause = '1=1'
        const params: Record<string, any> = {}

        if (filter.aggregate) {
            whereClause += ' AND meta_aggregate = {aggregate:String}'
            params.aggregate = filter.aggregate
        }

        if (filter.type) {
            whereClause += ' AND type = {type:String}'
            params.type = filter.type
        }

        if (filter.fromTimestamp) {
            whereClause += ' AND timestamp >= {fromTimestamp:UInt64}'
            params.fromTimestamp = filter.fromTimestamp
        }

        if (filter.toTimestamp) {
            whereClause += ' AND timestamp <= {toTimestamp:UInt64}'
            params.toTimestamp = filter.toTimestamp
        }

        const query = `SELECT count() as count FROM events WHERE ${whereClause}`

        const result = await this.client.query({
            query,
            query_params: params,
            format: 'JSONEachRow',
        })

        const rows = await result.json<{ count: string }[]>()
        return parseInt(rows[0].count, 10)
    }

    async close(): Promise<void> {
        await this.client.close()
    }

    async clearEvents(): Promise<void> {
        await this.client.exec({
            query: 'TRUNCATE TABLE IF EXISTS events',
        })
    }
}
