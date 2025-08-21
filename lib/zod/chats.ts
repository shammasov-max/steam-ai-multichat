import { z } from 'zod'

export const ChatSchema = z.object({
    id: z.string(),
    botId: z.string(),
    playerSteamId64: z.string(),
    agentEnabled: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
})

export type Chat = z.infer<typeof ChatSchema>

export const MessageSchema = z.object({
    id: z.string(),
    chatId: z.string(),
    from: z.enum(['bot', 'player']),
    text: z.string(),
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
    text: z.string().min(1).max(1000),
})

export type SendMessageInput = z.infer<typeof SendMessageInput>

export const GetMessagesInput = z.object({
    since: z.string().datetime().optional(),
})

export type GetMessagesInput = z.infer<typeof GetMessagesInput>