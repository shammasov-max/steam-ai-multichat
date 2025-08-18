export interface EventRecord {
    id: string
    type: string
    payload: Record<string, any>
    meta: {
        schemaVersion: string
        id: string
        ts: number
        aggregate: string
        kind: string
    }
    timestamp: number
}

export interface StateSnapshot {
    id: string
    state: Record<string, any>
    timestamp: number
    version: number
}

export interface EventStoreConfig {
    host: string
    port?: number
    username?: string
    password?: string
    database?: string
    secure?: boolean
}

export interface EventFilter {
    aggregate?: string
    type?: string
    fromTimestamp?: number
    toTimestamp?: number
    limit?: number
    offset?: number
}

export interface SnapshotFilter {
    fromTimestamp?: number
    toTimestamp?: number
    limit?: number
    offset?: number
}