import { createClient, ClickHouseClient } from '@clickhouse/client'
import { StateSnapshot, EventStoreConfig, SnapshotFilter } from './types.js'

export class SnapshotStore {
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
                CREATE TABLE IF NOT EXISTS snapshots (
                    id String,
                    state String,
                    timestamp UInt64,
                    version UInt32
                ) ENGINE = ReplacingMergeTree(version)
                ORDER BY (id, timestamp)
                PARTITION BY toYYYYMM(toDateTime(timestamp / 1000))
            `,
        })
    }

    async saveSnapshot(snapshot: StateSnapshot): Promise<void> {
        await this.client.insert({
            table: 'snapshots',
            values: [{
                id: snapshot.id,
                state: JSON.stringify(snapshot.state),
                timestamp: snapshot.timestamp,
                version: snapshot.version,
            }],
            format: 'JSONEachRow',
        })
    }

    async getLatestSnapshot(id: string): Promise<StateSnapshot | null> {
        const query = `
            SELECT id, state, timestamp, version 
            FROM snapshots 
            WHERE id = {id:String}
            ORDER BY timestamp DESC, version DESC
            LIMIT 1
        `

        const result = await this.client.query({
            query,
            query_params: { id },
            format: 'JSONEachRow',
        })

        const rows = await result.json<any[]>()
        
        if (rows.length === 0) {
            return null
        }

        const row = rows[0]
        return {
            id: row.id,
            state: JSON.parse(row.state),
            timestamp: row.timestamp,
            version: row.version,
        }
    }

    async getSnapshotAt(id: string, timestamp: number): Promise<StateSnapshot | null> {
        const query = `
            SELECT id, state, timestamp, version 
            FROM snapshots 
            WHERE id = {id:String} AND timestamp <= {timestamp:UInt64}
            ORDER BY timestamp DESC, version DESC
            LIMIT 1
        `

        const result = await this.client.query({
            query,
            query_params: { id, timestamp },
            format: 'JSONEachRow',
        })

        const rows = await result.json<any[]>()
        
        if (rows.length === 0) {
            return null
        }

        const row = rows[0]
        return {
            id: row.id,
            state: JSON.parse(row.state),
            timestamp: row.timestamp,
            version: row.version,
        }
    }

    async getSnapshots(filter: SnapshotFilter = {}): Promise<StateSnapshot[]> {
        let whereClause = '1=1'
        const params: Record<string, any> = {}

        if (filter.fromTimestamp) {
            whereClause += ' AND timestamp >= {fromTimestamp:UInt64}'
            params.fromTimestamp = filter.fromTimestamp
        }

        if (filter.toTimestamp) {
            whereClause += ' AND timestamp <= {toTimestamp:UInt64}'
            params.toTimestamp = filter.toTimestamp
        }

        const orderBy = 'ORDER BY timestamp DESC'
        const limitClause = filter.limit ? `LIMIT ${filter.offset || 0}, ${filter.limit}` : ''

        const query = `
            SELECT id, state, timestamp, version
            FROM snapshots 
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
            state: JSON.parse(row.state),
            timestamp: row.timestamp,
            version: row.version,
        }))
    }

    async deleteSnapshot(id: string): Promise<void> {
        await this.client.exec({
            query: `ALTER TABLE snapshots DELETE WHERE id = '${id}'`,
        })
    }

    async deleteSnapshotsBefore(timestamp: number): Promise<void> {
        await this.client.exec({
            query: `ALTER TABLE snapshots DELETE WHERE timestamp < ${timestamp}`,
        })
    }

    async close(): Promise<void> {
        await this.client.close()
    }

    async clearSnapshots(): Promise<void> {
        await this.client.exec({
            query: 'TRUNCATE TABLE IF EXISTS snapshots',
        })
    }
}