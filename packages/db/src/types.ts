export interface EventRecord<TPayload = unknown> {
    id: string
    type: string
    payload: TPayload extends Record<string, unknown> ? TPayload : Record<string, unknown>
    meta: {
        schemaVersion: string
        id: string
        ts: number
        aggregate: string
        kind: string
    }
    timestamp: number
}

export interface StateSnapshot<TState = unknown> {
    id: string
    state: TState extends Record<string, unknown> ? TState : Record<string, unknown>
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
