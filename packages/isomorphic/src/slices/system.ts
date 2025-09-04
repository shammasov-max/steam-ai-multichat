import * as S from 'effect/Schema'
import { PayloadAction } from '@reduxjs/toolkit'
import { 
    createEntitySlice, 
    type EntityActionPayload,
    addEntity,
    type EntityState
} from '../base/createEntitySlice'
import { Draft } from '@reduxjs/toolkit'

// ============= Event Payload Schemas =============

export const SnapshotPayloadSchema = S.Struct({
    state: S.Unknown
})
export type SnapshotPayload = S.Schema.Type<typeof SnapshotPayloadSchema>

export const FriendInviteSentPayloadSchema = S.Struct({
    accountId: S.String,
    playerSteamId64: S.String,
    ts: S.optional(S.Number)
})
export type FriendInviteSentPayload = S.Schema.Type<typeof FriendInviteSentPayloadSchema>

export const FriendInviteAcceptedPayloadSchema = S.Struct({
    accountId: S.String,
    playerSteamId64: S.String
})
export type FriendInviteAcceptedPayload = S.Schema.Type<typeof FriendInviteAcceptedPayloadSchema>

export const FriendInviteFailedPayloadSchema = S.Struct({
    accountId: S.String,
    playerSteamId64: S.String,
    reason: S.String
})
export type FriendInviteFailedPayload = S.Schema.Type<typeof FriendInviteFailedPayloadSchema>

export const MaFileAssignedPayloadSchema = S.Struct({
    maFileId: S.String,
    accountId: S.String
})
export type MaFileAssignedPayload = S.Schema.Type<typeof MaFileAssignedPayloadSchema>

export const MaFileReleasedPayloadSchema = S.Struct({
    maFileId: S.String
})
export type MaFileReleasedPayload = S.Schema.Type<typeof MaFileReleasedPayloadSchema>

export const ErrorLoggedPayloadSchema = S.Struct({
    message: S.String,
    context: S.optional(S.Unknown)
})
export type ErrorLoggedPayload = S.Schema.Type<typeof ErrorLoggedPayloadSchema>

// ============= Entity Schemas =============

export const RoundRobinSchema = S.Struct({
    pointer: S.Number.annotations({ title: "Pointer", description: "Current position in round-robin" }),
    eligibleAccountIds: S.Array(S.String).annotations({ title: "Eligible Accounts", description: "Account IDs available for assignment" })
}).annotations({ title: "Round Robin State", description: "Account assignment round-robin state" })

export const RateLimitEntrySchema = S.Struct({
    lastInviteAt: S.optional(S.Number.annotations({ title: "Last Invite", description: "Timestamp of last friend invite" }))
}).annotations({ title: "Rate Limit Entry", description: "Friend invite rate limit tracking" })

export const SystemSchema = S.Struct({
    systemId: S.String.annotations({ title: "System ID", description: "Singleton identifier (always 'system')" }),
    roundRobin: RoundRobinSchema,
    rateLimits: S.Record({ key: S.String, value: RateLimitEntrySchema }).annotations({ title: "Rate Limits", description: "Account ID to rate limit mapping" })
}).annotations({ title: "System", description: "Global system state entity" })

// Derive types from schemas
export type RoundRobinState = S.Schema.Type<typeof RoundRobinSchema>
export type RateLimitEntry = S.Schema.Type<typeof RateLimitEntrySchema>
export type System = S.Schema.Type<typeof SystemSchema>

// ============= Create Slice =============

export const systemSlice = createEntitySlice({
    name: 'system',
    
    // Initialize with singleton entity
    initialEntities: [
        {
            systemId: 'system',
            roundRobin: {
                pointer: 0,
                eligibleAccountIds: []
            },
            rateLimits: {}
        }
    ],
    
    entityReducers: {
        // Event: friendInvite.sent - update rate limit
        'friendInvite.sent': (
            system,
            payload: EntityActionPayload<'system', { accountId: string; ts?: number }>
        ) => {
            if (!system.rateLimits[payload.accountId]) {
                system.rateLimits[payload.accountId] = {}
            }
            const rateLimitEntry = system.rateLimits[payload.accountId]
            if (rateLimitEntry && payload.ts) {
                rateLimitEntry.lastInviteAt = payload.ts
            }
        },
        
        // Event: friendInvite.accepted - no-op (chat is started elsewhere)
        'friendInvite.accepted': (
            _system,
            _payload: EntityActionPayload<'system', { accountId: string; playerSteamId64: string }>
        ) => {
            // No-op - chat creation is handled by chat slice
        },
        
        // Event: friendInvite.failed - no-op
        'friendInvite.failed': (
            _system,
            _payload: EntityActionPayload<'system', { accountId: string; playerSteamId64: string; reason?: string }>
        ) => {
            // No-op - failure tracking can be added post-MVP if needed
        },
        
        // Event: error.logged - no-op
        'error.logged': (
            _system,
            _payload: EntityActionPayload<'system', { message: string; context?: any }>
        ) => {
            // No-op - errors can be tracked in a separate slice or log stream
        }
    },
  
    extraReducers: {
        // Event: system/snapshot - initialize or update singleton from snapshot
        snapshot: (
            state: Draft<EntityState<System>>,
            action: PayloadAction<{
                state: {
                    system?: {
                        roundRobin?: RoundRobinState
                        rateLimits?: Record<string, RateLimitEntry>
                    }
                }
            }>
        ) => {
            const snapshotSystem = action.payload.state.system
            
            if (!snapshotSystem) {
                return // No system data in snapshot
            }
            
            // Check if singleton exists
            const existingSystem = state.entities['system']
            
            if (existingSystem) {
                // Update existing singleton
                if (snapshotSystem.roundRobin) {
                    existingSystem.roundRobin.pointer = snapshotSystem.roundRobin.pointer
                    existingSystem.roundRobin.eligibleAccountIds = [...snapshotSystem.roundRobin.eligibleAccountIds]
                }
                if (snapshotSystem.rateLimits) {
                    existingSystem.rateLimits = snapshotSystem.rateLimits
                }
            } else {
                // Create singleton if it doesn't exist
                const newSystem: System = {
                    systemId: 'system',
                    roundRobin: snapshotSystem.roundRobin || { pointer: 0, eligibleAccountIds: [] },
                    rateLimits: snapshotSystem.rateLimits || {}
                }
                
                addEntity(state, newSystem, 'system')
            }
        },
        
        // Helper event for updating round-robin eligible accounts (can be triggered by account events)
        updateEligibleAccounts: (
            state: Draft<EntityState<System>>,
            action: PayloadAction<{ eligibleAccountIds: string[] }>
        ) => {
            const system = state.entities['system']
            if (system) {
                system.roundRobin.eligibleAccountIds = action.payload.eligibleAccountIds
                // Reset pointer if it's out of bounds
                if (system.roundRobin.pointer >= action.payload.eligibleAccountIds.length) {
                    system.roundRobin.pointer = 0
                }
            }
        },
        
        // Helper event for advancing round-robin pointer
        advanceRoundRobin: (
            state: Draft<EntityState<System>>,
            _action: PayloadAction<{}>
        ) => {
            const system = state.entities['system']
            if (system && system.roundRobin.eligibleAccountIds.length > 0) {
                system.roundRobin.pointer = 
                    (system.roundRobin.pointer + 1) % system.roundRobin.eligibleAccountIds.length
            }
        }
    }
    
    // entitySchema: SystemSchema // Schema compatibility will be addressed in future refactor
})

// ============= Exports =============

export const { actions: systemActions, reducer: systemReducer } = systemSlice
export default systemSlice
