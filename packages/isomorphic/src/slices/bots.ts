import * as S from 'effect/Schema'
import { Draft } from '@reduxjs/toolkit'
import { createEntitySlice, type EntityActionPayload } from '../base/createEntitySlice'
import { createSliceEvents } from '../events/event-builder'
import { BotId, SteamID64, BotStatus } from '../events/core'

// ============= Event Schemas (Schema-First) =============

export const botEventSchemas = {
    'bot.connected': S.Struct({ 
        botId: BotId 
    }),
    'bot.disconnected': S.Struct({ 
        botId: BotId 
    }),
    'bot.authenticationFailed': S.Struct({ 
        botId: BotId, 
        reason: S.String 
    }),
} as const

// ============= Auto-Generated Event Actions & Types =============

export const botEvents = createSliceEvents('bots', botEventSchemas)

// Export inferred payload types for use elsewhere
export type BotEventPayloads = {
    [K in keyof typeof botEventSchemas]: S.Schema.Type<typeof botEventSchemas[K]>
}

// ============= Entity Types =============

export interface Bot {
    readonly botId: string
    readonly steamId64: string
    readonly label?: string
    readonly proxyUrl: string
    readonly status: S.Schema.Type<typeof BotStatus>
    readonly lastSeen?: number
}

// ============= Entity Schema =============

export const BotSchema = S.Struct({
    botId: S.String,
    steamId64: S.String,
    label: S.optional(S.String),
    proxyUrl: S.String,
    status: BotStatus,
    lastSeen: S.optional(S.Number)
})

// ============= Create Slice =============

export const botSlice = createEntitySlice({
    name: 'bot',
    initialEntities: [] as Draft<Bot>[],
    entityReducers: {
        // Event: bot.connected
        connected: (bot: Draft<Bot>, payload: EntityActionPayload<'bot', { ts: number }>) => {
            bot.status = 'connected'
            bot.lastSeen = payload.ts
        },
        
        // Event: bot.disconnected
        disconnected: (bot: Draft<Bot>, payload: EntityActionPayload<'bot', { ts: number }>) => {
            bot.status = 'disconnected'
            bot.lastSeen = payload.ts
        },
        
        // Event: bot.authenticationFailed
        authenticationFailed: (bot: Draft<Bot>, payload: EntityActionPayload<'bot', { reason?: string }>) => {
            bot.status = 'authFailed'
            // Note: reason is available in payload but not stored in entity per spec
        }
    }
    
    // entitySchema: BotSchema, // TODO: Fix schema type compatibility
    
    // No extraReducers needed - bots are created via commands/snapshot, not events
})

// ============= Exports =============

export default botSlice
