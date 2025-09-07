import { MongoClient, Db, Collection } from 'mongodb'
import { MongoEventStore } from './MongoEventStore'
import { MongoConfig, getDefaultMongoConfig } from './config'
import type { Account } from '@packages/isomorphic/src/slices/accounts'
import type { Dialog } from '@packages/isomorphic/src/slices/dialogs'
import type { System } from '@packages/isomorphic/src/slices/system'

export class MongoDatabase {
    public readonly events: MongoEventStore
    // public readonly snapshots: MongoSnapshotStore // TODO: Implement MongoSnapshotStore
    
    private client: MongoClient | null = null
    private db: Db | null = null
    
    // Entity collections
    public accounts: Collection<Account> | null = null
    public dialogs: Collection<Dialog> | null = null
    public system: Collection<System> | null = null
    
    private config: MongoConfig

    constructor(config?: Partial<MongoConfig>) {
        this.config = {
            ...getDefaultMongoConfig(),
            ...config
        }
        
        this.events = new MongoEventStore(this.config)
        // this.snapshots = new MongoSnapshotStore(this.config) // TODO: Implement
    }

    async init(): Promise<void> {
        try {
            // Create MongoDB client
            this.client = new MongoClient(this.config.connectionString, {
                maxPoolSize: this.config.maxPoolSize,
                minPoolSize: this.config.minPoolSize,
                retryWrites: this.config.retryWrites,
                writeConcern: this.config.writeConcern
            })
            
            // Connect to MongoDB
            await this.client.connect()
            
            // Get database reference
            this.db = this.client.db(this.config.database)
            
            // Initialize entity collections
            this.accounts = this.db.collection<Account>(this.config.accountsCollection)
            this.dialogs = this.db.collection<Dialog>(this.config.dialogsCollection)
            this.system = this.db.collection<System>(this.config.systemCollection)
            
            // Create indexes for entity collections
            await this.createEntityIndexes()
            
            // Initialize event store
            await this.events.init()
            // TODO: Initialize snapshots when MongoSnapshotStore is implemented
            // await this.snapshots.init()
            
            console.log(`MongoDatabase connected to: ${this.config.database}`)
        } catch (error) {
            console.error('Failed to initialize MongoDatabase:', error)
            throw error
        }
    }
    
    private async createEntityIndexes(): Promise<void> {
        if (!this.accounts || !this.dialogs || !this.system) return
        
        // Account indexes
        await this.accounts.createIndex({ accountId: 1 }, { unique: true })
        await this.accounts.createIndex({ steamId64: 1 })
        await this.accounts.createIndex({ status: 1 })
        await this.accounts.createIndex({ proxyUrl: 1 })
        await this.accounts.createIndex({ lastSeen: -1 })
        
        // Dialog indexes
        await this.dialogs.createIndex({ dialogId: 1 }, { unique: true })
        await this.dialogs.createIndex({ accountId: 1 })
        await this.dialogs.createIndex({ playerSteamId64: 1 })
        await this.dialogs.createIndex({ status: 1 })
        await this.dialogs.createIndex({ language: 1 })
        await this.dialogs.createIndex({ continuationScore: -1 })
        await this.dialogs.createIndex({ 'operatorAlert.required': 1 })
        await this.dialogs.createIndex({ lastMessageAt: -1 })
        
        // System indexes (singleton)
        await this.system.createIndex({ systemId: 1 }, { unique: true })
    }

    async close(): Promise<void> {
        await this.events.close()
        // TODO: Close snapshots when implemented
        // await this.snapshots.close()
        
        if (this.client) {
            await this.client.close()
            this.client = null
            this.db = null
            this.accounts = null
            this.dialogs = null
            this.system = null
            console.log('MongoDatabase connection closed')
        }
    }

    async clearAll(): Promise<void> {
        await this.events.clearEvents()
        // TODO: Clear snapshots when implemented
        // await this.snapshots.clearSnapshots()
    }
    
    // Helper method to save a snapshot of current state
    async saveStateSnapshot(state: Record<string, any>, id: string = 'system'): Promise<void> {
        // TODO: Implement when MongoSnapshotStore is available
        // await this.snapshots.saveSnapshot(state, id)
        throw new Error('MongoSnapshotStore not implemented')
    }
    
    // Helper method to get the latest state snapshot
    async getLatestState(id: string = 'system'): Promise<Record<string, any> | null> {
        // TODO: Implement when MongoSnapshotStore is available
        // const snapshot = await this.snapshots.getLatestSnapshot(id)
        // return snapshot?.state || null
        return null
    }
    
    // Helper method to rebuild state from events after a snapshot
    async rebuildStateFromEvents(snapshotTimestamp?: number): Promise<Record<string, any>> {
        const events = await this.events.getEvents({
            fromTimestamp: snapshotTimestamp || 0
        })
        
        // This is a simplified rebuild - in production you'd apply events to state
        // based on your event sourcing patterns
        const state: Record<string, any> = {}
        
        for (const event of events) {
            // Apply event to state based on event type and aggregate
            // This would be customized based on your domain logic
            const aggregate = event.meta.aggregate
            if (!state[`${aggregate}s`]) {
                state[`${aggregate}s`] = { entities: {}, ids: [] }
            }
            
            // Example: handle entity creation/update events
            if (event.type.includes('/created') || event.type.includes('/saved')) {
                const entityId = event.meta.id
                state[`${aggregate}s`].entities[entityId] = event.payload
                if (!state[`${aggregate}s`].ids.includes(entityId)) {
                    state[`${aggregate}s`].ids.push(entityId)
                }
            }
            
            // Example: handle entity deletion events
            if (event.type.includes('/deleted')) {
                const entityId = event.meta.id
                delete state[`${aggregate}s`].entities[entityId]
                state[`${aggregate}s`].ids = state[`${aggregate}s`].ids.filter((id: string) => id !== entityId)
            }
        }
        
        return state
    }
    
    // Helper method to get state at a specific point in time
    async getStateAt(timestamp: number, id: string = 'system'): Promise<Record<string, any> | null> {
        // First, try to get a snapshot before the timestamp
        // TODO: Implement when MongoSnapshotStore is available
        // const snapshot = await this.snapshots.getSnapshotAt(id, timestamp)
        const snapshot = null
        
        if (!snapshot) {
            // If no snapshot, rebuild from events up to timestamp
            const events = await this.events.getEvents({
                toTimestamp: timestamp
            })
            
            if (events.length === 0) {
                return null
            }
            
            // Rebuild state from events
            return this.rebuildStateFromEvents(0)
        }
        
        // If we have a snapshot, rebuild from that point
        const additionalEvents = await this.events.getEvents({
            fromTimestamp: snapshot.timestamp,
            toTimestamp: timestamp
        })
        
        if (additionalEvents.length === 0) {
            return snapshot.state
        }
        
        // Apply additional events to snapshot state
        const state = { ...snapshot.state }
        
        for (const event of additionalEvents) {
            // Apply event logic (simplified example)
            const aggregate = event.meta.aggregate
            if (!state[`${aggregate}s`]) {
                state[`${aggregate}s`] = { entities: {}, ids: [] }
            }
            
            // Apply event based on type
            // This would be customized based on your domain logic
        }
        
        return state
    }
}