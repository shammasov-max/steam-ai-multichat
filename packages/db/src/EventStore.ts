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
        await this.client.exec({
            query: `
                CREATE TABLE IF NOT EXISTS events (
                    id String,
                    type String,
                    payload String,
                    meta_schema_version String,
                    meta_id String,
                    meta_ts UInt64,
                    meta_aggregate String,
                    meta_kind String,
                    timestamp UInt64
                ) ENGINE = MergeTree()
                ORDER BY (meta_aggregate, timestamp)
                PARTITION BY toYYYYMM(toDateTime(timestamp / 1000))
            `,
        })
    }

    async append(event: EventRecord): Promise<void> {
        await this.client.insert({
            table: 'events',
            values: [{
                id: event.id,
                type: event.type,
                payload: JSON.stringify(event.payload),
                meta_schema_version: event.meta.schemaVersion,
                meta_id: event.meta.id,
                meta_ts: event.meta.ts,
                meta_aggregate: event.meta.aggregate,
                meta_kind: event.meta.kind,
                timestamp: event.timestamp,
            }],
            format: 'JSONEachRow',
        })
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

        const orderBy = 'ORDER BY timestamp'
        const limitClause = filter.limit ? `LIMIT ${filter.offset || 0}, ${filter.limit}` : ''

        const query = `
            SELECT 
                id, type, payload, 
                meta_schema_version, meta_id, meta_ts, meta_aggregate, meta_kind,
                timestamp
            FROM events 
            WHERE ${whereClause} 
            ${orderBy} 
            ${limitClause}
        `

        const result = await this.client.query({
            query,
            query_params: params,
            format: 'JSONEachRow',
        })

        const rows = await result.json<any[]>()
        
        return rows.map(row => ({
            id: row.id,
            type: row.type,
            payload: JSON.parse(row.payload),
            meta: {
                schemaVersion: row.meta_schema_version,
                id: row.meta_id,
                ts: row.meta_ts,
                aggregate: row.meta_aggregate,
                kind: row.meta_kind,
            },
            timestamp: row.timestamp,
        }))
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