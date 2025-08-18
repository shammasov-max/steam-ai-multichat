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
import { ChatId, BotId, SteamID64 } from '../events/core'

// ============= Constants =============

const MAX_MESSAGES = 50 // Limit messages per chat to control snapshot size

// ============= Event Schemas (Schema-First) =============

export const chatEventSchemas = {
    'chat.started': S.Struct({
        chatId: ChatId,
        botId: BotId,
        playerSteamId64: SteamID64
    }),
    'chat.messageReceived': S.Struct({
        chatId: ChatId,
        from: S.Union(S.Literal('player'), S.Literal('bot')),
        text: S.String
    }),
    'chat.messageSent': S.Struct({
        chatId: ChatId,
        text: S.String
    }),
    'chat.agentToggled': S.Struct({
        chatId: ChatId,
        enabled: S.Boolean
    }),
    'dialogScript.advanced': S.Struct({
        chatId: ChatId,
        step: S.Number
    }),
    'dialogScript.completed': S.Struct({
        chatId: ChatId
    }),
} as const

// ============= Auto-Generated Event Actions & Types =============

export const chatEvents = createSliceEvents('chats', chatEventSchemas)

// Export inferred payload types for use elsewhere
export type ChatEventPayloads = {
    [K in keyof typeof chatEventSchemas]: S.Schema.Type<typeof chatEventSchemas[K]>
}

// ============= Entity Types =============

export type ChatMsgFrom = 'bot' | 'player'

export interface ChatMsg {
    readonly id: string
    readonly from: ChatMsgFrom
    readonly text: string
    readonly ts: number
}

export interface Chat {
    readonly chatId: string
    readonly botId: string
    readonly playerSteamId64: string
    readonly agentEnabled: boolean
    readonly messages: readonly ChatMsg[]
    readonly scriptStep?: number
}

// ============= Entity Schemas =============

export const ChatMsgSchema = S.Struct({
    id: S.String,
    from: S.Union(
        S.Literal('bot'),
        S.Literal('player')
    ),
    text: S.String,
    ts: S.Number
})

export const ChatSchema = S.Struct({
    chatId: S.String,
    botId: S.String,
    playerSteamId64: S.String,
    agentEnabled: S.Boolean,
    messages: S.Array(ChatMsgSchema),
    scriptStep: S.optional(S.Number)
})

// ============= Helper Functions =============

function trimMessages(messages: ChatMsg[]): ChatMsg[] {
    if (messages.length > MAX_MESSAGES) {
        // Keep only the last MAX_MESSAGES messages
        return messages.slice(messages.length - MAX_MESSAGES)
    }
    return messages
}

// ============= Create Slice =============

export const chatSlice = createEntitySlice({
    name: 'chat',
    
    entityReducers: {
        // Event: chat.messageReceived
        'messageReceived': (
            chat, 
            payload: EntityActionPayload<'chat', { 
                from: ChatMsgFrom
                text: string
                messageId: string
                ts: number
            }>
        ) => {
            const newMessage: ChatMsg = {
                id: payload.messageId,
                from: payload.from,
                text: payload.text,
                ts: payload.ts
            }
            
            chat.messages = trimMessages([...chat.messages, newMessage])
        },
        
        // Event: chat.messageSent
        'messageSent': (
            chat,
            payload: EntityActionPayload<'chat', {
                text: string
                messageId: string
                ts: number
            }>
        ) => {
            const newMessage: ChatMsg = {
                id: payload.messageId,
                from: 'bot',
                text: payload.text,
                ts: payload.ts
            }
            
            chat.messages = trimMessages([...chat.messages, newMessage])
        },
        
        // Event: chat.agentToggled
        'agentToggled': (
            chat,
            payload: EntityActionPayload<'chat', { enabled: boolean }>
        ) => {
            chat.agentEnabled = payload.enabled
        },
        
        // Event: dialogScript.advanced
        'dialogScript.advanced': (
            chat,
            payload: EntityActionPayload<'chat', { step: number }>
        ) => {
            chat.scriptStep = payload.step
        },
        
        // Event: dialogScript.completed
        'dialogScript.completed': (
            chat,
            payload: EntityActionPayload<'chat'>
        ) => {
            delete chat.scriptStep
        }
    },
    
    extraReducers: {
        // Event: chat.started - creates new entity
        'chat.started': (
            state: Draft<EntityState<Chat>>,
            action: PayloadAction<{
                chatId: string
                botId: string
                playerSteamId64: string
            }>
        ) => {
            const newChat: Chat = {
                chatId: action.payload.chatId,
                botId: action.payload.botId,
                playerSteamId64: action.payload.playerSteamId64,
                agentEnabled: true,
                messages: []
            }
            
            addEntity(state, newChat, 'chat')
        }
    }
    
    // entitySchema: ChatSchema // TODO: Fix schema type compatibility
})

// ============= Exports =============

export default chatSlice
