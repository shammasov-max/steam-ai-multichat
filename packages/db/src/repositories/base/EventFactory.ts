import { Effect } from 'effect'
import type { EventRecord } from '../../types'
import type { MongoDatabase } from '../../MongoDatabase'
import { RepositoryError } from './BaseRepository'

// Event type mapping for type safety
export type EntityEventTypes = {
    account: 
        | 'accounts/saved'
        | 'accounts/deleted'
        | 'accounts/connected'
        | 'accounts/disconnected'
        | 'accounts/authenticationFailed'
        | 'accounts/statusUpdated'
        | 'accounts/maFileStored'
    dialog:
        | 'dialogs/saved'
        | 'dialogs/deleted'
        | 'dialogs/messageSent'
        | 'dialogs/messageReceived'
        | 'dialogs/statusUpdated'
        | 'dialogs/assessed'
        | 'dialogs/progressUpdated'
        | 'dialogs/operatorAlerted'
    system:
        | 'system/reset'
        | 'system/roundRobinIndexUpdated'
        | 'system/assignmentStatusUpdated'
        | 'system/rateLimitUpdated'
}

export type AllEventTypes = EntityEventTypes[keyof EntityEventTypes]

export interface EventFactoryConfig<TEntity extends keyof EntityEventTypes> {
    readonly entityType: TEntity
    readonly idField: string
}

export class TypedEventFactory<TEntity extends keyof EntityEventTypes> {
    constructor(private readonly config: EventFactoryConfig<TEntity>) {}

    create(
        type: EntityEventTypes[TEntity],
        entityId: string,
        payload: Record<string, any>,
        kind: 'entity' | 'event' = 'entity'
    ): EventRecord {
        return {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            payload,
            meta: {
                schemaVersion: '1.0.0',
                id: entityId,
                ts: Date.now(),
                aggregate: this.config.entityType,
                kind
            },
            timestamp: Date.now()
        }
    }

    createAndSave(
        db: MongoDatabase,
        type: EntityEventTypes[TEntity],
        entityId: string,
        payload: Record<string, any>,
        kind: 'entity' | 'event' = 'entity'
    ): Effect.Effect<EventRecord, RepositoryError> {
        const event = this.create(type, entityId, payload, kind)
        return Effect.gen(function* () {
            yield* saveEventToDb(db, event)
            return event
        })
    }
}

export const saveEventToDb = (
    db: MongoDatabase,
    event: EventRecord
): Effect.Effect<void, RepositoryError> =>
    Effect.tryPromise({
        try: () => db.events.append(event),
        catch: error => new RepositoryError({
            message: `Failed to save event: ${event.type}`,
            cause: error
        })
    })

// Pre-configured factories for each entity type
export const accountEventFactory = new TypedEventFactory<'account'>({
    entityType: 'account',
    idField: 'accountId'
})

export const dialogEventFactory = new TypedEventFactory<'dialog'>({
    entityType: 'dialog',
    idField: 'dialogId'
})

export const systemEventFactory = new TypedEventFactory<'system'>({
    entityType: 'system',
    idField: 'systemId'
})