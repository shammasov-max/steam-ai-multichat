import * as S from 'effect/Schema'
import { typeid } from 'typeid-js'

// Simplified wire format for Redux actions that are also events
export type SimpleWireAction<T = any> = {
    type: string
    payload: T
    meta?: {
        id?: string
        ts?: number
        source?: 'server' | 'client'
        [key: string]: any
    }
}

// Internal type alias for cleaner code
type WireAction<T = any> = SimpleWireAction<T>

// Tagged template literal for type-safe event creation
export function event<T = any>(strings: TemplateStringsArray, ...values: any[]) {
    const eventType = strings.join('')
    
    return (payload: T, meta?: Record<string, any>): WireAction<T> => ({
        type: eventType,
        payload,
        meta: {
            id: typeid('evt').toString(),
            ts: Date.now(),
            source: 'server',
            ...meta
        }
    })
}

// Schema-based validation helper
export function withSchema<T>(schema: S.Schema<T>) {
    return {
        create: (eventType: string) => {
            const creator = event<T>([eventType] as any)
            return (payload: T, meta?: Record<string, any>) => {
                // Validate payload
                const validated = S.decodeUnknownSync(schema)(payload)
                return creator(validated, meta)
            }
        },
        decode: (action: unknown): WireAction<T> => {
            const decoded = S.decodeUnknownSync(
                S.Struct({
                    type: S.String,
                    payload: schema,
                    meta: S.optional(S.Unknown)
                })
            )(action)
            return decoded as WireAction<T>
        }
    }
}

// Batch helper for creating multiple events with the same slice prefix
export function createSliceEvents<T extends Record<string, S.Schema<any>>>(
    sliceName: string,
    schemas: T
) {
    type Events = {
        [K in keyof T]: (payload: S.Schema.Type<T[K]>, meta?: Record<string, any>) => SimpleWireAction
    }
    
    const events = {} as Events
    
    for (const [eventName, schema] of Object.entries(schemas)) {
        const eventType = `${sliceName}/${eventName}`
        events[eventName as keyof T] = withSchema(schema).create(eventType)
    }
    
    return events
}