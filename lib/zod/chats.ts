import { z } from 'zod'
import { BaseEntitySchema, SteamId64Schema, MessageTextSchema, DateTimeStringSchema } from './base'
import { MessageSource } from '../types/status'

export const ChatSchema = BaseEntitySchema.extend({
    botId: z.string(),
    playerSteamId64: SteamId64Schema,
    agentEnabled: z.boolean(),
})

export type Chat = z.infer<typeof ChatSchema>

export const MessageSchema = z.object({
    id: z.string(),
    chatId: z.string(),
    from: MessageSource,
    text: MessageTextSchema,
    ts: z.date(),
})

export type Message = z.infer<typeof MessageSchema>

export const ToggleAgentInput = z.object({
    chatId: z.string(),
    enabled: z.boolean(),
})

export type ToggleAgentInput = z.infer<typeof ToggleAgentInput>

export const SendMessageInput = z.object({
    chatId: z.string(),
    text: MessageTextSchema,
})

export type SendMessageInput = z.infer<typeof SendMessageInput>

export const GetMessagesInput = z.object({
    since: DateTimeStringSchema,
})

export type GetMessagesInput = z.infer<typeof GetMessagesInput>