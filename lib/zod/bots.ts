import { z } from 'zod'
import { BaseEntitySchema, SteamId64Schema, ProxyUrlSchema, LabelSchema } from './base'
import { BotStatus } from '../types/status'

export const BotSchema = BaseEntitySchema.extend({
    steamId64: SteamId64Schema,
    label: LabelSchema.nullable(),
    proxyUrl: ProxyUrlSchema,
    status: BotStatus,
    lastSeen: z.date().nullable(),
    mafileJson: z.string(),
    password: z.string(),
})

export type Bot = z.infer<typeof BotSchema>

export const AddBotInput = z.object({
    maFileJSON: z.string(),
    proxyUrl: ProxyUrlSchema,
    label: LabelSchema,
    password: z.string(),
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