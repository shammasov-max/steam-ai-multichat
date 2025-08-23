import { z } from 'zod'
import { BaseEntitySchema, SteamId64Schema, ItemNameSchema, PriceSchema } from './base'
import { TaskStatus } from '../types/status'

export const TaskSchema = BaseEntitySchema.extend({
    playerSteamId64: SteamId64Schema,
    item: ItemNameSchema,
    priceMin: PriceSchema,
    priceMax: PriceSchema,
    status: TaskStatus,
    assignedBotId: z.string().nullable(),
})

export type Task = z.infer<typeof TaskSchema>

export const TaskTargetSchema = z.object({
    taskId: z.string(),
    targetType: z.enum(['buy_item']),
    targetPayload: z.object({
        item: z.string(),
        priceMin: z.number(),
        priceMax: z.number(),
    }),
    successCriteria: z.string(),
})

export type TaskTarget = z.infer<typeof TaskTargetSchema>

export const TaskPreconditionSchema = z.object({
    taskId: z.string(),
    requireFriendship: z.boolean().default(true),
    scriptId: z.string().nullable(),
})

export type TaskPrecondition = z.infer<typeof TaskPreconditionSchema>

export const CreateTaskInput = z.object({
    playerSteamId64: SteamId64Schema,
    item: ItemNameSchema,
    priceMin: PriceSchema,
    priceMax: PriceSchema,
    target: z.object({
        type: z.enum(['buy_item']),
        payload: z.object({
            item: ItemNameSchema,
            priceMin: PriceSchema,
            priceMax: PriceSchema,
        }),
        successCriteria: z.string(),
    }).optional(),
    preconditions: z.object({
        requireFriendship: z.boolean().default(true),
        scriptId: z.string().optional(),
    }).optional(),
})

export type CreateTaskInput = z.infer<typeof CreateTaskInput>

export const DisposeTaskInput = z.object({
    taskId: z.string(),
})

export type DisposeTaskInput = z.infer<typeof DisposeTaskInput>