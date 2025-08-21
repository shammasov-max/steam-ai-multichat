import { z } from 'zod'

export const BotStatus = z.enum(['connecting', 'connected', 'disconnected', 'authFailed'])
export type BotStatus = z.infer<typeof BotStatus>

export const BotSchema = z.object({
    id: z.string(),
    steamId64: z.string(),
    label: z.string().nullable(),
    proxyUrl: z.string(),
    status: BotStatus,
    lastSeen: z.date().nullable(),
    mafileJson: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
})

export type Bot = z.infer<typeof BotSchema>

export const AddBotInput = z.object({
    maFileJSON: z.string(),
    proxyUrl: z.string().url(),
    label: z.string().optional(),
})

export type AddBotInput = z.infer<typeof AddBotInput>

export const RemoveBotInput = z.object({
    botId: z.string(),
})

export type RemoveBotInput = z.infer<typeof RemoveBotInput>

export const ConnectBotInput = z.object({
    botId: z.string(),
})

export type ConnectBotInput = z.infer<typeof ConnectBotInput>