import {
    createSlice,
    PayloadAction,
    Draft,
    Slice,
    ValidateSliceCaseReducers,
} from '@reduxjs/toolkit'
import * as S from 'effect/Schema'
import { Effect } from 'effect'
import { createSelector } from 'reselect'
import { createLoggerService, LoggerService } from '../utils/LoggerService'
import {
    EntityWithId,
    EntityState,
    EntityActionPayload,
    EntityReducer,
    EntityReducersMap,
    ExtractPayload,
    EntityActionCreators,
    SliceReducersFromEntityReducers,
} from './entityTypes'

// Re-export types for backwards compatibility
export {
    EntityWithId,
    EntityState,
    EntityActionPayload,
    EntityReducer,
    EntityReducersMap,
} from './entityTypes'

// ============= Helper Functions =============

/**
 * Get entity ID from payload based on entity name
 */
const getEntityId = <TName extends string>(
    entityName: TName,
    payload: EntityActionPayload<TName, unknown>
): string => {
    const idKey = `${entityName}Id` as const
    return payload[idKey]
}

/**
 * Simple pluralization function
 * Can be enhanced with more complex rules if needed
 */
const pluralize = (singular: string): string => {
    if (
        singular.endsWith('y') &&
        !['ay', 'ey', 'iy', 'oy', 'uy'].some(ending => singular.endsWith(ending))
    ) {
        return singular.slice(0, -1) + 'ies'
    }
    if (
        singular.endsWith('s') ||
        singular.endsWith('x') ||
        singular.endsWith('z') ||
        singular.endsWith('ch') ||
        singular.endsWith('sh')
    ) {
        return singular + 'es'
    }
    return singular + 's'
}

/**
 * Create memoized selectors for entity operations
 */
const createEntitySelectors = <TEntity>(): EntitySelectors<TEntity> => {
    // Basic selectors (not memoized as they're simple property access)
    const selectEntities = (state: EntityState<TEntity>) => state.entities
    const selectIds = (state: EntityState<TEntity>) => state.ids

    // Memoized selector for single entity lookup
    const selectEntity = createSelector(
        [selectEntities, (_: EntityState<TEntity>, id: string) => id],
        (entities, id) => entities[id]
    )

    // Memoized selector for all entities as array
    const selectAllEntities = createSelector([selectEntities, selectIds], (entities, ids) =>
        ids.map(id => entities[id]).filter(Boolean)
    )

    // Simple selector for IDs (already optimal)
    const selectEntityIds = (state: EntityState<TEntity>) => state.ids

    // Memoized selector for multiple entities by IDs
    const selectEntitiesByIds = createSelector(
        [selectEntities, (_: EntityState<TEntity>, ids: string[]) => ids],
        (entities, ids) => ids.map(id => entities[id]).filter(Boolean)
    )

    // Memoized selector for entity count
    const selectEntityCount = createSelector([selectIds], ids => ids.length)

    // Memoized selector for checking entity existence
    const selectHasEntity = createSelector(
        [selectEntities, (_: EntityState<TEntity>, id: string) => id],
        (entities, id) => id in entities
    )

    return {
        selectEntity,
        selectAllEntities,
        selectEntityIds,
        selectEntitiesByIds,
        selectEntityCount,
        selectHasEntity,
    }
}

// ============= Main Function =============

/**
 * Configuration for createEntitySlice
 */
export interface CreateEntitySliceConfig<
    TName extends string,
    TEntity,
    TReducers extends EntityReducersMap<TName, TEntity>,
> {
    /**
     * Singular entity name (e.g., 'user')
     */
    name: TName

    /**
     * Initial entities (optional)
     */
    initialEntities?: EntityWithId<TName, TEntity>[]

    /**
     * Entity-level reducers
     */
    entityReducers: TReducers

    /**
     * Optional Schema for entity validation
     */
    entitySchema?: S.Schema<any, unknown, never>

    /**
     * Custom pluralization function (optional)
     */
    pluralizeFn?: (singular: string) => string

    /**
     * Extra reducers for actions that create/delete entities or handle slice-level operations
     * These are passed directly to Redux Toolkit's createSlice
     *
     * @intentional-any The 'any' payload type is required because extra reducers can handle
     * arbitrary action types from other slices. Using 'unknown' would require type assertions
     * in every extra reducer, making the API less ergonomic.
     */
    extraReducers?: Record<
        string,
        (state: Draft<EntityState<TEntity>>, action: PayloadAction<any>) => void
    >
}

/**
 * Memoized selectors for entity operations
 */
export interface EntitySelectors<TEntity> {
    selectEntity: (state: EntityState<TEntity>, id: string) => TEntity | undefined
    selectAllEntities: (state: EntityState<TEntity>) => TEntity[]
    selectEntityIds: (state: EntityState<TEntity>) => string[]
    selectEntitiesByIds: (state: EntityState<TEntity>, ids: string[]) => TEntity[]
    selectEntityCount: (state: EntityState<TEntity>) => number
    selectHasEntity: (state: EntityState<TEntity>, id: string) => boolean
}

/**
 * Creates a Redux Toolkit slice for managing normalized entity state
 *
 * @example
 * ```typescript
 * type User = {
 *   userId: string;
 *   name: string;
 *   email: string;
 * };
 *
 * const userSlice = createEntitySlice({
 *   name: 'user',
 *   entityReducers: {
 *     updateName: (user, { name }) => {
 *       user.name = name;
 *     },
 *     updateEmail: (user, { email }) => {
 *       user.email = email;
 *     }
 *   }
 * });
 *
 * // Usage:
 * dispatch(userSlice.actions.updateName({ userId: '123', name: 'John' }));
 * ```
 */
export function createEntitySlice<
    TName extends string,
    TEntity,
    TReducers extends EntityReducersMap<TName, TEntity>,
>(
    config: CreateEntitySliceConfig<TName, TEntity, TReducers>
): Slice<EntityState<TEntity>, SliceReducersFromEntityReducers<TName, TEntity, TReducers>, string> &
    EntitySelectors<TEntity> & {
        actions: EntityActionCreators<TName, TReducers>
        schema: S.Schema<TEntity, unknown, never> | undefined
        name: string
        pluralizeFn?: (singular: string) => string
    } {
    const {
        name: entityName,
        initialEntities = [],
        entityReducers,
        entitySchema,
        pluralizeFn = pluralize,
        extraReducers = {},
    } = config

    const sliceName = pluralizeFn(entityName)
    const idKey = `${entityName}Id` as keyof EntityWithId<TName, TEntity>

    // Create single logger instance for this slice
    const logger = createLoggerService(`EntitySlice:${entityName}`)

    // Build initial state
    const initialState: EntityState<TEntity> = {
        entities: {},
        ids: [],
    }

    // Add initial entities if provided
    initialEntities.forEach(entity => {
        const id = String(entity[idKey])
        initialState.entities[id] = entity
        initialState.ids.push(id)
    })

    // Transform entity reducers to slice reducers
    const sliceReducers: SliceReducersFromEntityReducers<TName, TEntity, TReducers> =
        {} as SliceReducersFromEntityReducers<TName, TEntity, TReducers>

    Object.entries(entityReducers).forEach(([actionName, entityReducer]) => {
        sliceReducers[actionName as keyof TReducers] = (
            state: Draft<EntityState<TEntity>>,
            action: PayloadAction<
                EntityActionPayload<TName, ExtractPayload<TReducers[typeof actionName]>>
            >
        ) => {
            const entityId = getEntityId(
                entityName,
                action.payload as EntityActionPayload<TName, unknown>
            )
            const entity = state.entities[entityId]

            if (!entity) {
                Effect.runSync(logger.warn(`Entity not found`, undefined, { entityName, entityId }))
                return
            }

            // Validate with schema if provided
            if (entitySchema) {
                const parseResult = S.decodeUnknownOption(
                    entitySchema as S.Schema<TEntity, unknown, never>
                )(entity)
                if (parseResult._tag === 'None') {
                    Effect.runSync(
                        logger.error(`Entity validation failed`, undefined, {
                            entityName,
                            entityId,
                        })
                    )
                    return
                }
            }

            // Apply the entity reducer
            const result = entityReducer(entity as Draft<TEntity>, action.payload)

            // If reducer returns a new entity, replace it
            if (result !== undefined) {
                state.entities[entityId] = result as Draft<TEntity>
            }
        }
    })

    // Merge extraReducers with sliceReducers
    const allReducers = { ...sliceReducers, ...extraReducers }

    // Create the slice
    const slice = createSlice({
        name: sliceName,
        initialState,
        reducers: allReducers as ValidateSliceCaseReducers<
            EntityState<TEntity>,
            SliceReducersFromEntityReducers<TName, TEntity, TReducers>
        >,
    })

    // Create memoized selectors
    const selectors = createEntitySelectors<TEntity>()

    // Add selector functions and expose schema
    const enhancedSlice = Object.assign(slice, {
        ...selectors,
        schema: entitySchema,
        name: sliceName,
        pluralizeFn,
    })

    return enhancedSlice as Slice<
        EntityState<TEntity>,
        SliceReducersFromEntityReducers<TName, TEntity, TReducers>,
        string
    > &
        EntitySelectors<TEntity> & {
            actions: EntityActionCreators<TName, TReducers>
            schema: S.Schema<TEntity, unknown, never> | undefined
            name: string
            pluralizeFn?: (singular: string) => string
        }
}

// ============= Additional Utilities =============

/**
 * Add entity to state
 */
export const addEntity = <TName extends string, TEntity>(
    state: Draft<EntityState<EntityWithId<TName, TEntity>>>,
    entity: EntityWithId<TName, TEntity>,
    entityName: TName
): void => {
    const idKey = `${entityName}Id` as keyof EntityWithId<TName, TEntity>
    const id = String(entity[idKey])

    if (!state.entities[id]) {
        state.entities[id] = entity as Draft<EntityWithId<TName, TEntity>>
        state.ids.push(id)
    }
}

/**
 * Remove entity from state
 */
export const removeEntity = <TEntity>(state: Draft<EntityState<TEntity>>, id: string): void => {
    if (state.entities[id]) {
        delete state.entities[id]
        state.ids = state.ids.filter(existingId => existingId !== id)
    }
}

/**
 * Update entity in state
 */
export const updateEntity = <TEntity>(
    state: Draft<EntityState<TEntity>>,
    id: string,
    updates: Partial<TEntity>
): void => {
    if (state.entities[id]) {
        Object.assign(state.entities[id], updates)
    }
}

// ============= Type Guards =============

/**
 * Check if value is a valid entity with required ID
 */
export const isEntityWithId = <TName extends string, TEntity>(
    value: unknown,
    entityName: TName
): value is EntityWithId<TName, TEntity> => {
    if (!value || typeof value !== 'object') return false

    const idKey = `${entityName}Id`
    return idKey in value && typeof (value as Record<string, unknown>)[idKey] === 'string'
}
