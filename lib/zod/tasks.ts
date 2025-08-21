import { z } from 'zod'

export const TaskStatus = z.enum([
    'created',
    'assigned',
    'invited',
    'accepted',
    'failed',
    'disposed',
    'resolved'
])
export type TaskStatus = z.infer<typeof TaskStatus>

export const TaskSchema = z.object({
    id: z.string(),
    playerSteamId64: z.string(),
    item: z.string(),
    priceMin: z.number(),
    priceMax: z.number(),
    status: TaskStatus,
    assignedBotId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
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
    playerSteamId64: z.string(),
    item: z.string(),
    priceMin: z.number().min(0),
    priceMax: z.number().min(0),
    target: z.object({
        type: z.enum(['buy_item']),
        payload: z.object({
            item: z.string(),
            priceMin: z.number(),
            priceMax: z.number(),
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