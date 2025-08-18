// Central registry of all event schemas from domain slices
import { botEventSchemas } from '../slices/bots'
import { taskEventSchemas } from '../slices/tasks'
import { chatEventSchemas } from '../slices/chats'
import { systemEventSchemas } from '../slices/system'
import * as S from 'effect/Schema'

// Combine all domain schemas into one registry
export const PayloadSchemas = {
    ...botEventSchemas,
    ...taskEventSchemas, 
    ...chatEventSchemas,
    ...systemEventSchemas,
} as const

// Type utilities for working with events
export type EventKind = keyof typeof PayloadSchemas
export type PayloadOf<K extends EventKind> = S.Schema.Type<(typeof PayloadSchemas)[K]>

// Global event payload types
export type EventPayloads = {
    [K in EventKind]: PayloadOf<K>
}

// Validate any event at runtime
export function validateEventPayload(
    type: EventKind,
    payload: unknown
): any {
    const schema = PayloadSchemas[type as keyof typeof PayloadSchemas]
    if (!schema) {
        throw new Error(`Unknown event type: ${type}`)
    }
    return S.decodeUnknownSync(schema as any)(payload)
}
