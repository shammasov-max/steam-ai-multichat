import { Effect, Context, Option } from 'effect'
import { Collection } from 'mongodb'
import {
    SystemSchema,
    type System,
    type RoundRobinAssignmentStatus
} from '@packages/isomorphic/src/slices/system'
import { Database, RepositoryError, validateEntity } from './base/BaseRepository'
import { systemEventFactory, saveEventToDb } from './base/EventFactory'
import type { MongoDatabase } from '../MongoDatabase'

// ============= SystemRepository Interface =============

export interface SystemRepository {
    // System state operations
    readonly getSystem: () => Effect.Effect<System>
    readonly updateSystem: (updates: Partial<System>) => Effect.Effect<System>
    readonly resetSystem: () => Effect.Effect<System>
    
    // Round-robin assignment
    readonly getNextAccountForAssignment: () => Effect.Effect<Option.Option<string>>
    readonly updateRoundRobinIndex: (newIndex: number) => Effect.Effect<System>
    readonly updateAssignmentStatus: (status: RoundRobinAssignmentStatus) => Effect.Effect<System>
    readonly resetRoundRobin: () => Effect.Effect<System>
    
    // Rate limiting
    readonly updateRateLimits: (accountId: string, timestamp: number) => Effect.Effect<System>
    readonly getRateLimitStatus: (accountId: string) => Effect.Effect<{
        canInvite: boolean
        nextAvailableTime: number
    }>
    readonly clearRateLimits: () => Effect.Effect<System>
    readonly clearAccountRateLimit: (accountId: string) => Effect.Effect<System>
    
    // Statistics
    readonly getSystemStats: () => Effect.Effect<{
        totalAccountsInRotation: number
        currentRoundRobinIndex: number
        assignmentStatus: RoundRobinAssignmentStatus
        rateLimitedAccounts: number
    }>
    readonly getUptime: () => Effect.Effect<number>
    readonly updateLastActivity: () => Effect.Effect<System>
}

// ============= Context Tag =============

export class SystemRepository extends Context.Tag("SystemRepository")<
    SystemRepository,
    SystemRepository
>() {}

// ============= MongoDB Implementation =============

class MongoSystemRepositoryImpl implements SystemRepository {
    private static readonly SYSTEM_ID = 'system_singleton'
    private static readonly RATE_LIMIT_WINDOW_MS = 60000 // 1 minute
    
    private collection: Collection<System>
    
    constructor(private readonly db: MongoDatabase) {
        if (!db.system) {
            throw new Error('System collection not initialized')
        }
        this.collection = db.system
    }
    
    private createDefaultSystem(): System {
        return {
            systemId: MongoSystemRepositoryImpl.SYSTEM_ID,
            roundRobinAccountIds: [],
            roundRobinIndex: 0,
            rateLimitedInvites: {},
            assignmentStatus: 'idle',
            startedAt: Date.now(),
            lastActivityAt: Date.now()
        }
    }
    
    private tryPromise = <T>(
        operation: () => Promise<T>,
        errorMessage: string
    ): Effect.Effect<T, RepositoryError> =>
        Effect.tryPromise({
            try: operation,
            catch: error => new RepositoryError({ message: errorMessage, cause: error })
        })
    
    getSystem = (): Effect.Effect<System> =>
        Effect.gen(function* () {
            const system = yield* this.tryPromise(
                () => this.collection.findOne({ systemId: MongoSystemRepositoryImpl.SYSTEM_ID }),
                'Failed to fetch system state'
            )
            
            if (!system) {
                const defaultSystem = this.createDefaultSystem()
                yield* this.tryPromise(
                    () => this.collection.insertOne(defaultSystem as any),
                    'Failed to create default system state'
                )
                return defaultSystem
            }
            
            return yield* validateEntity(SystemSchema)(system)
        })
    
    updateSystem = (updates: Partial<System>): Effect.Effect<System> =>
        Effect.gen(function* () {
            const result = yield* this.tryPromise(
                () => this.collection.findOneAndUpdate(
                    { systemId: MongoSystemRepositoryImpl.SYSTEM_ID },
                    { $set: updates },
                    { returnDocument: 'after', upsert: true }
                ),
                'Failed to update system state'
            )
            
            return result || { ...this.createDefaultSystem(), ...updates }
        })
    
    resetSystem = (): Effect.Effect<System> =>
        Effect.gen(function* () {
            const newSystem = this.createDefaultSystem()
            
            yield* this.tryPromise(
                () => this.collection.replaceOne(
                    { systemId: MongoSystemRepositoryImpl.SYSTEM_ID },
                    newSystem,
                    { upsert: true }
                ),
                'Failed to reset system state'
            )
            
            yield* systemEventFactory.createAndSave(
                this.db,
                'system/reset',
                MongoSystemRepositoryImpl.SYSTEM_ID,
                {},
                'event'
            )
            
            return newSystem
        })
    
    getNextAccountForAssignment = (): Effect.Effect<Option.Option<string>> =>
        Effect.gen(function* () {
            const system = yield* this.getSystem()
            
            if (system.roundRobinAccountIds.length === 0) {
                return Option.none()
            }
            
            const totalAccounts = system.roundRobinAccountIds.length
            let attempts = 0
            
            while (attempts < totalAccounts) {
                const currentIndex = (system.roundRobinIndex + attempts) % totalAccounts
                const accountId = system.roundRobinAccountIds[currentIndex]
                
                const rateLimitStatus = yield* this.getRateLimitStatus(accountId)
                
                if (rateLimitStatus.canInvite) {
                    yield* this.updateRoundRobinIndex((currentIndex + 1) % totalAccounts)
                    return Option.some(accountId)
                }
                
                attempts++
            }
            
            return Option.none()
        })
    
    updateRoundRobinIndex = (newIndex: number): Effect.Effect<System> =>
        Effect.gen(function* () {
            const system = yield* this.updateSystem({ roundRobinIndex: newIndex })
            
            yield* systemEventFactory.createAndSave(
                this.db,
                'system/roundRobinIndexUpdated',
                MongoSystemRepositoryImpl.SYSTEM_ID,
                { newIndex },
                'event'
            )
            
            return system
        })
    
    updateAssignmentStatus = (status: RoundRobinAssignmentStatus): Effect.Effect<System> =>
        Effect.gen(function* () {
            const system = yield* this.updateSystem({ assignmentStatus: status })
            
            yield* systemEventFactory.createAndSave(
                this.db,
                'system/assignmentStatusUpdated',
                MongoSystemRepositoryImpl.SYSTEM_ID,
                { status },
                'event'
            )
            
            return system
        })
    
    resetRoundRobin = (): Effect.Effect<System> =>
        this.updateSystem({
            roundRobinIndex: 0,
            assignmentStatus: 'idle'
        })
    
    updateRateLimits = (accountId: string, timestamp: number): Effect.Effect<System> =>
        Effect.gen(function* () {
            const system = yield* this.getSystem()
            const rateLimits = { ...system.rateLimitedInvites }
            
            if (!rateLimits[accountId]) {
                rateLimits[accountId] = []
            }
            
            const now = Date.now()
            rateLimits[accountId] = [
                ...rateLimits[accountId].filter(ts => 
                    now - ts < MongoSystemRepositoryImpl.RATE_LIMIT_WINDOW_MS
                ),
                timestamp
            ]
            
            const updatedSystem = yield* this.updateSystem({ rateLimitedInvites: rateLimits })
            
            yield* systemEventFactory.createAndSave(
                this.db,
                'system/rateLimitUpdated',
                MongoSystemRepositoryImpl.SYSTEM_ID,
                { accountId, timestamp },
                'event'
            )
            
            return updatedSystem
        })
    
    getRateLimitStatus = (accountId: string): Effect.Effect<{
        canInvite: boolean
        nextAvailableTime: number
    }> =>
        Effect.gen(function* () {
            const system = yield* this.getSystem()
            const timestamps = system.rateLimitedInvites[accountId] || []
            const now = Date.now()
            
            const recentTimestamps = timestamps.filter(ts => 
                now - ts < MongoSystemRepositoryImpl.RATE_LIMIT_WINDOW_MS
            )
            
            const canInvite = recentTimestamps.length === 0
            const nextAvailableTime = recentTimestamps.length > 0
                ? recentTimestamps[0] + MongoSystemRepositoryImpl.RATE_LIMIT_WINDOW_MS
                : now
            
            return { canInvite, nextAvailableTime }
        })
    
    clearRateLimits = (): Effect.Effect<System> =>
        this.updateSystem({ rateLimitedInvites: {} })
    
    clearAccountRateLimit = (accountId: string): Effect.Effect<System> =>
        Effect.gen(function* () {
            const system = yield* this.getSystem()
            const rateLimits = { ...system.rateLimitedInvites }
            delete rateLimits[accountId]
            
            return yield* this.updateSystem({ rateLimitedInvites: rateLimits })
        })
    
    getSystemStats = (): Effect.Effect<{
        totalAccountsInRotation: number
        currentRoundRobinIndex: number
        assignmentStatus: RoundRobinAssignmentStatus
        rateLimitedAccounts: number
    }> =>
        Effect.gen(function* () {
            const system = yield* this.getSystem()
            const now = Date.now()
            
            const rateLimitedAccounts = Object.entries(system.rateLimitedInvites)
                .filter(([_, timestamps]) => 
                    timestamps.some(ts => now - ts < MongoSystemRepositoryImpl.RATE_LIMIT_WINDOW_MS)
                ).length
            
            return {
                totalAccountsInRotation: system.roundRobinAccountIds.length,
                currentRoundRobinIndex: system.roundRobinIndex,
                assignmentStatus: system.assignmentStatus,
                rateLimitedAccounts
            }
        })
    
    getUptime = (): Effect.Effect<number> =>
        Effect.gen(function* () {
            const system = yield* this.getSystem()
            return Date.now() - (system.startedAt || Date.now())
        })
    
    updateLastActivity = (): Effect.Effect<System> =>
        this.updateSystem({ lastActivityAt: Date.now() })
}

import { createRepositoryLayer } from './base/LayerUtils'

// ============= Layer =============

export const MongoSystemRepositoryLive = createRepositoryLayer(
    SystemRepository,
    db => new MongoSystemRepositoryImpl(db)
)