import { Effect, Context, Layer } from 'effect'
import * as S from 'effect/Schema'
import {
    createEntitySlice,
    EntitySlice,
    EntityReducersMap,
    EntityWithId,
} from './base/createEntitySlice'
import type { PayloadAction, Draft } from '@reduxjs/toolkit'
import type { EntityState } from './base/entityTypes'

// ============================================================================
// Define Entity - Builds on enhanced EntitySlice with repository layer
// ============================================================================

/**
 * Repository interface for entity operations
 */
export interface Repository<Entity> {
    readonly findById: (id: string) => Effect.Effect<Entity | null, never, never>
    readonly findAll: () => Effect.Effect<readonly Entity[], never, never>
    readonly save: (entity: Entity) => Effect.Effect<void, never, never>
    readonly delete: (id: string) => Effect.Effect<void, never, never>
    readonly exists: (id: string) => Effect.Effect<boolean, never, never>
}

/**
 * Complete entity definition combining EntitySlice with Effect repository
 */
export interface EntityDefinition<
    Name extends string,
    Entity,
    Reducers extends EntityReducersMap<Name, Entity>,
> extends EntitySlice<Name, Entity, Reducers> {
    // Repository for Effect integration
    Repository: Context.Tag<any, Repository<Entity>>
    RepositoryLive: Layer.Layer<any>
}

/**
 * Creates a complete entity definition with Redux slice, repository, and mocks
 * Builds on the enhanced createEntitySlice to add Effect repository layer
 *
 * @example
 * ```typescript
 * const Account = defineEntity(
 *   'account',
 *   AccountSchema,
 *   {
 *     connected: (account, { sessionData }) => {
 *       account.status = 'online'
 *       account.session = sessionData
 *     },
 *     disconnected: (account) => {
 *       account.status = 'offline'
 *     }
 *   },
 *   {
 *     created: (state, action) => {
 *       addEntity(state, action.payload, 'account')
 *     }
 *   }
 * )
 *
 * // Use the entity
 * dispatch(Account.actions.connected({ accountId: '123', sessionData }))
 * const account = Account.selectors.selectEntity(state, '123')
 * const mockAccount = Account.mock({ name: 'Test' })
 * ```
 */
export const defineEntity = <
    Name extends string,
    Entity extends Record<string, any>,
    Reducers extends EntityReducersMap<Name, Entity> = {},
>(
    name: Name,
    schema: S.Schema<Entity, any, never>,
    entityReducers: Reducers = {} as Reducers,
    extraReducers?: Record<
        string,
        (state: Draft<EntityState<Entity>>, action: PayloadAction<any>) => void
    >,
    initialEntities: Entity[] = []
): EntityDefinition<Name, Entity, Reducers> => {
    const idField = `${name}Id` as const
    const collectionName = `${name}s`

    // 1. Create enhanced EntitySlice using createEntitySlice
    const entitySlice = createEntitySlice({
        name,
        entitySchema: schema,
        entityReducers,
        extraReducers: extraReducers || {},
        initialEntities: initialEntities as any,
    })

    // 2. Create Repository Tag for Effect integration
    class RepositoryTag extends Context.Tag(`${name}Repository`)<
        RepositoryTag,
        Repository<Entity>
    >() {}

    // 3. Create Repository Layer (deferred - will be connected when MongoConnection is available)
    const RepositoryLive = Layer.succeed(
        RepositoryTag,
        (() => {
            // For now, we'll create a simple in-memory implementation
            const store = new Map<string, Entity>()

            return {
                findById: (id: string) => Effect.sync(() => store.get(id) ?? null),

                findAll: () => Effect.sync(() => Array.from(store.values())),

                save: (entity: Entity) =>
                    Effect.sync(() => {
                        const id = (entity as any)[idField]
                        store.set(id, entity)
                    }),

                delete: (id: string) =>
                    Effect.sync(() => {
                        store.delete(id)
                    }),

                exists: (id: string) => Effect.sync(() => store.has(id)),
            }
        })()
    )

    // 4. Return combined EntityDefinition
    return {
        // Spread all properties from EntitySlice
        ...entitySlice,

        // Add repository for Effect integration
        Repository: RepositoryTag,
        RepositoryLive,
    }
}

// ============================================================================
// Helper function for creating simple entities without reducers
// ============================================================================

/**
 * Creates a simple entity with no custom reducers
 * Useful for data-only entities
 */
export const defineSimpleEntity = <Name extends string, Entity extends Record<string, any>>(
    name: Name,
    schema: S.Schema<Entity, any, never>,
    initialEntities: Entity[] = []
) => defineEntity(name, schema, {}, undefined, initialEntities)
