import { EventStore } from './EventStore.js'
import { SnapshotStore } from './SnapshotStore.js'
import { EventStoreConfig } from './types.js'

export class Database {
    public readonly events: EventStore
    public readonly snapshots: SnapshotStore

    constructor(config: EventStoreConfig) {
        this.events = new EventStore(config)
        this.snapshots = new SnapshotStore(config)
    }

    async init(): Promise<void> {
        await Promise.all([
            this.events.init(),
            this.snapshots.init(),
        ])
    }

    async close(): Promise<void> {
        await Promise.all([
            this.events.close(),
            this.snapshots.close(),
        ])
    }

    async clearAll(): Promise<void> {
        await Promise.all([
            this.events.clearEvents(),
            this.snapshots.clearSnapshots(),
        ])
    }
}