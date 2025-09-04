import { Effect, Layer, Context, pipe, Option } from 'effect'
import * as S from 'effect/Schema'
import {
    SystemSchema,
    type System,
    type RoundRobinAssignmentStatus
} from '@packages/isomorphic/src/slices/system.js'
import {
    Database,
    EntityNotFoundError,
    RepositoryError,
    validateEntity,
    saveEvent,
    getLatestSnapshot,
    saveSnapshot
} from './base/Repository.js'
import type { EventRecord, StateSnapshot } from '../types.js'

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
    
    // Snapshot operations
    readonly saveSystemSnapshot: () => Effect.Effect<void>
    readonly loadSystemSnapshot: () => Effect.Effect<Option.Option<System>>
}

// ============= Context Tag =============

export class SystemRepository extends Context.Tag("SystemRepository")<
    SystemRepository,
    SystemRepository
>() {}

// ============= Implementation =============

class SystemRepositoryImpl implements SystemRepository {
    private static readonly SYSTEM_ID = 'system_singleton'
    private static readonly RATE_LIMIT_WINDOW_MS = 60000 // 1 minute
    
    constructor(private readonly db: Database) {}
    
    private async getSystemFromSnapshot(): Promise<System | null> {
        const snapshot = await this.db.snapshots.getSnapshots({ limit: 1 })
        if (snapshot.length === 0) return null
        
        const systemSlice = snapshot[0].state.system
        if (!systemSlice) return null
        
        return systemSlice as System
    }
    
    private createDefaultSystem(): System {
        return {
            systemId: SystemRepositoryImpl.SYSTEM_ID,
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
                try: () => this.getSystemFromSnapshot(),
                catch: error => new RepositoryError({
                    message: 'Failed to fetch system state',
                    cause: error
                })
            })
            
            if (!system) {
                const defaultSystem = this.createDefaultSystem()
                yield* this.saveSystemState(defaultSystem)
                return defaultSystem
            }
            
            return yield* validateEntity(SystemSchema)(system)
        })
    
    updateSystem = (updates: Partial<System>): Effect.Effect<System> =>
        Effect.gen(function* () {
            const current = yield* this.getSystem()
            const updated = { ...current, ...updates }
            
            yield* validateEntity(SystemSchema)(updated)
            yield* this.saveSystemState(updated)
            
            return updated
        })
    
    resetSystem = (): Effect.Effect<System> =>
        Effect.gen(function* () {
            const newSystem = this.createDefaultSystem()
            yield* this.saveSystemState(newSystem)
            
            const event: EventRecord = {
                id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'system/reset',
                payload: {},
                meta: {
                    schemaVersion: '1.0.0',
                    id: SystemRepositoryImpl.SYSTEM_ID,
                    ts: Date.now(),
                    aggregate: 'system',
                    kind: 'event'
                },
                timestamp: Date.now()
            }
            
            yield* saveEvent(this.db, event)
            return newSystem
        })
    
    getNextAccountForAssignment = (): Effect.Effect<Option.Option<string>> =>
        Effect.gen(function* () {
            const system = yield* this.getSystem()
            
            if (system.roundRobinAccountIds.length === 0) {
                return Option.none()
            }
            
            const nextAccountId = system.roundRobinAccountIds[system.roundRobinIndex]
            
            // Check if account is rate limited
            const rateLimitStatus = yield* this.getRateLimitStatus(nextAccountId)
            if (!rateLimitStatus.canInvite) {
                // Try next account
                const newIndex = (system.roundRobinIndex + 1) % system.roundRobinAccountIds.length
                yield* this.updateRoundRobinIndex(newIndex)
                
                // Recursive call to find next available account
                return yield* this.getNextAccountForAssignment()
            }
            
            return Option.some(nextAccountId)
        })
    
    updateRoundRobinIndex = (newIndex: number): Effect.Effect<System> =>
        Effect.gen(function* () {
            const event: EventRecord = {
                id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'system/roundRobinIndexUpdated',
                payload: { newIndex },
                meta: {
                    schemaVersion: '1.0.0',
                    id: SystemRepositoryImpl.SYSTEM_ID,
                    ts: Date.now(),
                    aggregate: 'system',
                    kind: 'event'
                },
                timestamp: Date.now()
            }
            
            yield* saveEvent(this.db, event)
            return yield* this.updateSystem({ roundRobinIndex: newIndex })
        })
    
    updateAssignmentStatus = (status: RoundRobinAssignmentStatus): Effect.Effect<System> =>
        Effect.gen(function* () {
            const event: EventRecord = {
                id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'system/assignmentStatusUpdated',
                payload: { status },
                meta: {
                    schemaVersion: '1.0.0',
                    id: SystemRepositoryImpl.SYSTEM_ID,
                    ts: Date.now(),
                    aggregate: 'system',
                    kind: 'event'
                },
                timestamp: Date.now()
            }
            
            yield* saveEvent(this.db, event)
            return yield* this.updateSystem({ assignmentStatus: status })
        })
    
    resetRoundRobin = (): Effect.Effect<System> =>
        Effect.gen(function* () {
            return yield* this.updateSystem({
                roundRobinIndex: 0,
                assignmentStatus: 'idle'
            })
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
                    now - ts < SystemRepositoryImpl.RATE_LIMIT_WINDOW_MS
                ),
                timestamp
            ]
            
            const event: EventRecord = {
                id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'system/rateLimitUpdated',
                payload: { accountId, timestamp },
                meta: {
                    schemaVersion: '1.0.0',
                    id: SystemRepositoryImpl.SYSTEM_ID,
                    ts: Date.now(),
                    aggregate: 'system',
                    kind: 'event'
                },
                timestamp: Date.now()
            }
            
            yield* saveEvent(this.db, event)
            return yield* this.updateSystem({ rateLimitedInvites: rateLimits })
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
                now - ts < SystemRepositoryImpl.RATE_LIMIT_WINDOW_MS
            )
            
            // Check if we've hit the rate limit (1 per minute)
            const canInvite = recentTimestamps.length === 0
            const nextAvailableTime = recentTimestamps.length > 0
                ? recentTimestamps[0] + SystemRepositoryImpl.RATE_LIMIT_WINDOW_MS
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
                    timestamps.some(ts => now - ts < SystemRepositoryImpl.RATE_LIMIT_WINDOW_MS)
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
    
    private saveSystemState = (system: System): Effect.Effect<void> =>
        Effect.gen(function* () {
            // Get current snapshot
            const snapshotOpt = yield* getLatestSnapshot(this.db)
            const currentSnapshot = Option.match(snapshotOpt, {
                onNone: () => ({ state: {} }),
                onSome: s => s
            })
            
            // Update system slice in snapshot
            const newState = {
                ...currentSnapshot.state,
                system
            }
            
            // Save updated snapshot
            yield* saveSnapshot(this.db, newState)
        })
    
    saveSystemSnapshot = (): Effect.Effect<void> =>
        Effect.gen(function* () {
            const system = yield* this.getSystem()
            yield* this.saveSystemState(system)
        })
    
    loadSystemSnapshot = (): Effect.Effect<Option.Option<System>> =>
        Effect.gen(function* () {
            const system = yield* Effect.tryPromise({
                try: () => this.getSystemFromSnapshot(),
                catch: error => new RepositoryError({
                    message: 'Failed to load system snapshot',
                    cause: error
                })
            })
            
            if (!system) return Option.none()
            
            const validated = yield* pipe(
                validateEntity(SystemSchema)(system),
                Effect.option
            )
            
            return validated
        })
}

// ============= Layer =============

export const SystemRepositoryLive = Layer.effect(
    SystemRepository,
    Effect.gen(function* () {
        const db = yield* Database
        return new SystemRepositoryImpl(db)
    })
)