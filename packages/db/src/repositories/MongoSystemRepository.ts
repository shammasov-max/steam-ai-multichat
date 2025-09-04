import { Effect, Layer, Context, pipe, Option } from 'effect'
import * as S from 'effect/Schema'
import { Collection } from 'mongodb'
import {
    SystemSchema,
    type System,
    type RoundRobinAssignmentStatus
} from '@packages/isomorphic/src/slices/system.js'
import {
    Database,
    RepositoryError,
    validateEntity,
    saveEvent,
    createEvent
} from './base/BaseRepository.js'
import { MongoDatabase } from '../MongoDatabase.js'
import type { EventRecord } from '../types.js'

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
    
    getSystem = (): Effect.Effect<System> =>
        Effect.gen(function* () {
            const system = yield* Effect.tryPromise({
                try: () => this.collection.findOne({ systemId: MongoSystemRepositoryImpl.SYSTEM_ID }),
                catch: error => new RepositoryError({
                    message: 'Failed to fetch system state',
                    cause: error
                })
            })
            
            if (!system) {
                // Create default system if not exists
                const defaultSystem = this.createDefaultSystem()
                
                yield* Effect.tryPromise({
                    try: () => this.collection.insertOne(defaultSystem as any),
                    catch: error => new RepositoryError({
                        message: 'Failed to create default system state',
                        cause: error
                    })
                })
                
                return defaultSystem
            }
            
            return yield* validateEntity(SystemSchema)(system)
        })
    
    updateSystem = (updates: Partial<System>): Effect.Effect<System> =>
        Effect.gen(function* () {
            const result = yield* Effect.tryPromise({
                try: () => this.collection.findOneAndUpdate(
                    { systemId: MongoSystemRepositoryImpl.SYSTEM_ID },
                    { $set: updates },
                    { 
                        returnDocument: 'after',
                        upsert: true
                    }
                ),
                catch: error => new RepositoryError({
                    message: 'Failed to update system state',
                    cause: error
                })
            })
            
            if (!result) {
                // This shouldn't happen with upsert: true
                const defaultSystem = this.createDefaultSystem()
                return { ...defaultSystem, ...updates }
            }
            
            return result as System
        })
    
    resetSystem = (): Effect.Effect<System> =>
        Effect.gen(function* () {
            const newSystem = this.createDefaultSystem()
            
            yield* Effect.tryPromise({
                try: () => this.collection.replaceOne(
                    { systemId: MongoSystemRepositoryImpl.SYSTEM_ID },
                    newSystem,
                    { upsert: true }
                ),
                catch: error => new RepositoryError({
                    message: 'Failed to reset system state',
                    cause: error
                })
            })
            
            // Emit reset event
            const event = createEvent(
                'system/reset',
                'system',
                MongoSystemRepositoryImpl.SYSTEM_ID,
                {},
                'event'
            )
            
            yield* saveEvent(this.db, event)
            return newSystem
        })
    
    getNextAccountForAssignment = (): Effect.Effect<Option.Option<string>> =>
        Effect.gen(function* () {
            const system = yield* this.getSystem()
            
            if (system.roundRobinAccountIds.length === 0) {
                return Option.none()
            }
            
            // Start from current index and look for available account
            const totalAccounts = system.roundRobinAccountIds.length
            let attempts = 0
            
            while (attempts < totalAccounts) {
                const currentIndex = (system.roundRobinIndex + attempts) % totalAccounts
                const accountId = system.roundRobinAccountIds[currentIndex]
                
                // Check if account is rate limited
                const rateLimitStatus = yield* this.getRateLimitStatus(accountId)
                
                if (rateLimitStatus.canInvite) {
                    // Update the index for next assignment
                    yield* this.updateRoundRobinIndex((currentIndex + 1) % totalAccounts)
                    return Option.some(accountId)
                }
                
                attempts++
            }
            
            // All accounts are rate limited
            return Option.none()
        })
    
    updateRoundRobinIndex = (newIndex: number): Effect.Effect<System> =>
        Effect.gen(function* () {
            const system = yield* this.updateSystem({ roundRobinIndex: newIndex })
            
            // Emit event
            const event = createEvent(
                'system/roundRobinIndexUpdated',
                'system',
                MongoSystemRepositoryImpl.SYSTEM_ID,
                { newIndex },
                'event'
            )
            
            yield* saveEvent(this.db, event)
            return system
        })
    
    updateAssignmentStatus = (status: RoundRobinAssignmentStatus): Effect.Effect<System> =>
        Effect.gen(function* () {
            const system = yield* this.updateSystem({ assignmentStatus: status })
            
            // Emit event
            const event = createEvent(
                'system/assignmentStatusUpdated',
                'system',
                MongoSystemRepositoryImpl.SYSTEM_ID,
                { status },
                'event'
            )
            
            yield* saveEvent(this.db, event)
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
            
            // Add new timestamp and clean old ones
            const now = Date.now()
            rateLimits[accountId] = [
                ...rateLimits[accountId].filter(ts => 
                    now - ts < MongoSystemRepositoryImpl.RATE_LIMIT_WINDOW_MS
                ),
                timestamp
            ]
            
            const updatedSystem = yield* this.updateSystem({ rateLimitedInvites: rateLimits })
            
            // Emit event
            const event = createEvent(
                'system/rateLimitUpdated',
                'system',
                MongoSystemRepositoryImpl.SYSTEM_ID,
                { accountId, timestamp },
                'event'
            )
            
            yield* saveEvent(this.db, event)
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
            
            // Clean old timestamps
            const recentTimestamps = timestamps.filter(ts => 
                now - ts < MongoSystemRepositoryImpl.RATE_LIMIT_WINDOW_MS
            )
            
            // Check if we've hit the rate limit (1 per minute)
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
            
            // Count accounts with active rate limits
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

// ============= Layer =============

export const MongoSystemRepositoryLive = Layer.effect(
    SystemRepository,
    Effect.gen(function* () {
        const db = yield* Database
        return new MongoSystemRepositoryImpl(db)
    })
)