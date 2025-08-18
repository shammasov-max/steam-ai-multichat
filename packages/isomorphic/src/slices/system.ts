import * as S from 'effect/Schema'
import { PayloadAction } from '@reduxjs/toolkit'
import { 
    createEntitySlice, 
    type EntityActionPayload,
    addEntity,
    type EntityState
} from '../base/createEntitySlice'
import { Draft } from '@reduxjs/toolkit'
import { createSliceEvents } from '../events/event-builder'
import { ProxyId, MaFileId, BotId } from '../events/core'

// ============= Event Schemas (Schema-First) =============

export const systemEventSchemas = {
    // Snapshot — only for the first SSE message
    'snapshot': S.Struct({ 
        state: S.Unknown 
    }),
    
    // Friend invites (aggregated at Bot level but conceptually system events)
    'friendInvite.sent': S.Struct({ 
        botId: BotId, 
        playerSteamId64: S.String 
    }),
    'friendInvite.accepted': S.Struct({ 
        botId: BotId, 
        playerSteamId64: S.String 
    }),
    'friendInvite.failed': S.Struct({ 
        botId: BotId, 
        playerSteamId64: S.String, 
        reason: S.String 
    }),
    
    // Proxies
    'proxy.assigned': S.Struct({ 
        proxyId: ProxyId, 
        botId: BotId 
    }),
    'proxy.released': S.Struct({ 
        proxyId: ProxyId 
    }),
    'proxy.failed': S.Struct({ 
        proxyId: ProxyId, 
        reason: S.optional(S.String) 
    }),
    'proxy.banned': S.Struct({ 
        proxyId: ProxyId, 
        reason: S.optional(S.String) 
    }),
    'proxy.restored': S.Struct({ 
        proxyId: ProxyId 
    }),
    
    // MaFiles
    'maFile.assigned': S.Struct({ 
        maFileId: MaFileId, 
        botId: BotId 
    }),
    'maFile.released': S.Struct({ 
        maFileId: MaFileId 
    }),
    
    // Logs
    'error.logged': S.Struct({ 
        message: S.String, 
        context: S.optional(S.Unknown) 
    }),
} as const

// ============= Auto-Generated Event Actions & Types =============

export const systemEvents = createSliceEvents('system', systemEventSchemas)

// Export inferred payload types for use elsewhere
export type SystemEventPayloads = {
    [K in keyof typeof systemEventSchemas]: S.Schema.Type<typeof systemEventSchemas[K]>
}

// ============= Entity Types =============

export interface RoundRobinState {
    readonly pointer: number
    readonly eligibleBotIds: readonly string[]
}

export interface RateLimitEntry {
    readonly lastInviteAt?: number
}

export interface System {
    readonly systemId: string // singleton, always 'system'
    readonly roundRobin: RoundRobinState
    readonly rateLimits: Record<string, RateLimitEntry>
}

// ============= Entity Schemas =============

export const RoundRobinSchema = S.Struct({
    pointer: S.Number,
    eligibleBotIds: S.Array(S.String)
})

export const RateLimitEntrySchema = S.Struct({
    lastInviteAt: S.optional(S.Number)
})

export const SystemSchema = S.Struct({
    systemId: S.String,
    roundRobin: RoundRobinSchema,
    rateLimits: S.Record({ key: S.String, value: RateLimitEntrySchema })
})

// ============= Create Slice =============

export const systemSlice = createEntitySlice({
    name: 'system',
    
    // Initialize with singleton entity
    initialEntities: [
        {
            systemId: 'system',
            roundRobin: {
                pointer: 0,
                eligibleBotIds: []
            },
            rateLimits: {}
        }
    ],
    
    entityReducers: {
        // Event: friendInvite.sent - update rate limit
        'friendInvite.sent': (
            system,
            payload: EntityActionPayload<'system', { botId: string; ts: number }>
        ) => {
            if (!system.rateLimits[payload.botId]) {
                system.rateLimits[payload.botId] = {}
            }
            system.rateLimits[payload.botId].lastInviteAt = payload.ts
        },
        
        // Event: friendInvite.accepted - no-op (chat is started elsewhere)
        'friendInvite.accepted': (
            system,
            payload: EntityActionPayload<'system', { botId: string; playerSteamId64: string }>
        ) => {
            // No-op - chat creation is handled by chat slice
        },
        
        // Event: friendInvite.failed - no-op
        'friendInvite.failed': (
            system,
            payload: EntityActionPayload<'system', { botId: string; playerSteamId64: string; reason?: string }>
        ) => {
            // No-op - failure tracking can be added post-MVP if needed
        },
        
        // Event: error.logged - no-op
        'error.logged': (
            system,
            payload: EntityActionPayload<'system', { message: string; context?: any }>
        ) => {
            // No-op - errors can be tracked in a separate slice or log stream
        }
    },
  
    extraReducers: {
        // Event: snapshot - initialize or update singleton from snapshot
        'snapshot': (
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
                    existingSystem.roundRobin.eligibleBotIds = [...snapshotSystem.roundRobin.eligibleBotIds]
                }
                if (snapshotSystem.rateLimits) {
                    existingSystem.rateLimits = snapshotSystem.rateLimits
                }
            } else {
                // Create singleton if it doesn't exist
                const newSystem: System = {
                    systemId: 'system',
                    roundRobin: snapshotSystem.roundRobin || { pointer: 0, eligibleBotIds: [] },
                    rateLimits: snapshotSystem.rateLimits || {}
                }
                
                addEntity(state, newSystem, 'system')
            }
        },
        
        // Helper event for updating round-robin eligible bots (can be triggered by bot events)
        updateEligibleBots: (
            state: Draft<EntityState<System>>,
            action: PayloadAction<{ eligibleBotIds: string[] }>
        ) => {
            const system = state.entities['system']
            if (system) {
                system.roundRobin.eligibleBotIds = action.payload.eligibleBotIds
                // Reset pointer if it's out of bounds
                if (system.roundRobin.pointer >= action.payload.eligibleBotIds.length) {
                    system.roundRobin.pointer = 0
                }
            }
        },
        
        // Helper event for advancing round-robin pointer
        advanceRoundRobin: (
            state: Draft<EntityState<System>>,
            action: PayloadAction<{}>
        ) => {
            const system = state.entities['system']
            if (system && system.roundRobin.eligibleBotIds.length > 0) {
                system.roundRobin.pointer = 
                    (system.roundRobin.pointer + 1) % system.roundRobin.eligibleBotIds.length
            }
        }
    }
    
    // entitySchema: SystemSchema // TODO: Fix schema type compatibility
})

// ============= Exports =============

export default systemSlice
