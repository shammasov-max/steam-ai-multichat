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
import { TaskId, BotId, SteamID64, TaskStatus } from '../events/core'

// ============= Event Schemas (Schema-First) =============

export const taskEventSchemas = {
    'task.created': S.Struct({
        taskId: TaskId,
        playerSteamId64: SteamID64,
        item: S.String,
        priceMin: S.Number,
        priceMax: S.Number
    }),
    'task.assigned': S.Struct({ 
        taskId: TaskId, 
        botId: BotId 
    }),
    'task.statusUpdated': S.Struct({ 
        taskId: TaskId, 
        status: TaskStatus 
    }),
} as const

// ============= Auto-Generated Event Actions & Types =============

export const taskEvents = createSliceEvents('tasks', taskEventSchemas)

// Export inferred payload types for use elsewhere
export type TaskEventPayloads = {
    [K in keyof typeof taskEventSchemas]: S.Schema.Type<typeof taskEventSchemas[K]>
}

// ============= Entity Types =============

export interface Task {
    readonly taskId: string
    readonly playerSteamId64: string
    readonly item: string
    readonly priceMin: number
    readonly priceMax: number
    readonly status: S.Schema.Type<typeof TaskStatus>
    readonly assignedBotId?: string
}

// ============= Entity Schema =============

export const TaskSchema = S.Struct({
    taskId: S.String,
    playerSteamId64: S.String,
    item: S.String,
    priceMin: S.Number,
    priceMax: S.Number,
    status: TaskStatus,
    assignedBotId: S.optional(S.String)
})

// ============= Create Slice =============

export const taskSlice = createEntitySlice({
    name: 'task',
    
    entityReducers: {
        // Event: task.assigned
        assigned: (task, payload: EntityActionPayload<'task', { botId: string }>) => {
            task.assignedBotId = payload.botId
            task.status = 'assigned'
        },
        
        // Event: task.statusUpdated
        statusUpdated: (task, payload: EntityActionPayload<'task', { status: S.Schema.Type<typeof TaskStatus> }>) => {
            task.status = payload.status
        }
    },
    
    extraReducers: {
        // Event: task.created - creates new entity
        created: (
            state: Draft<EntityState<Task>>, 
            action: PayloadAction<{
                taskId: string
                playerSteamId64: string
                item: string
                priceMin: number
                priceMax: number
            }>
        ) => {
            const newTask: Task = {
                taskId: action.payload.taskId,
                playerSteamId64: action.payload.playerSteamId64,
                item: action.payload.item,
                priceMin: action.payload.priceMin,
                priceMax: action.payload.priceMax,
                status: 'created'
            }
            
            addEntity(state, newTask, 'task')
        }
    }
    
    // entitySchema: TaskSchema // TODO: Fix schema type compatibility
})

// ============= Exports =============

export default taskSlice
