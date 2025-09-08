import { createSelector } from 'reselect'
import { 
    createEntitySlice,
    type CreateEntitySliceConfig,
    type EntityState,
    type EntityWithId,
    type EntityReducersMap
} from './createEntitySlice'
import type { Slice } from '@reduxjs/toolkit'
import type * as S from 'effect/Schema'

/**
 * Creates an entity slice with memoized selectors for better performance.
 * This is a wrapper around createEntitySlice that adds reselect-based memoization.
 */
export function createEntitySliceWithMemoization<
    TName extends string,
    TEntity,
    TReducers extends EntityReducersMap<TName, TEntity>
>(
    config: CreateEntitySliceConfig<TName, TEntity, TReducers>
) {
    // Create the base slice
    const baseSlice = createEntitySlice(config)
    
    // Create memoized selectors
    const selectEntities = (state: EntityState<TEntity>) => state.entities
    const selectIds = (state: EntityState<TEntity>) => state.ids
    
    // Memoized selector for getting a specific entity
    const selectEntity = createSelector(
        [selectEntities, (_state: EntityState<TEntity>, id: string) => id],
        (entities, id) => entities[id]
    )
    
    // Memoized selector for getting all entities as an array
    const selectAllEntities = createSelector(
        [selectEntities, selectIds],
        (entities, ids) => ids.map(id => entities[id])
    )
    
    // Memoized selector for getting entity IDs
    const selectEntityIds = createSelector(
        [selectIds],
        ids => ids
    )
    
    // Memoized selector for getting entities by a filter predicate
    const selectEntitiesWhere = createSelector(
        [selectAllEntities, (_state: EntityState<TEntity>, predicate: (entity: TEntity) => boolean) => predicate],
        (entities, predicate) => entities.filter(predicate)
    )
    
    // Memoized selector for getting entity count
    const selectEntityCount = createSelector(
        [selectIds],
        ids => ids.length
    )
    
    // Memoized selector for checking if entity exists
    const selectEntityExists = createSelector(
        [selectEntities, (_state: EntityState<TEntity>, id: string) => id],
        (entities, id) => id in entities
    )
    
    // Memoized selector for getting entities as a map/record
    const selectEntitiesMap = createSelector(
        [selectEntities],
        entities => entities
    )
    
    // Return enhanced slice with memoized selectors
    return {
        ...baseSlice,
        // Override with memoized selectors
        selectEntity,
        selectAllEntities,
        selectEntityIds,
        // Add new memoized selectors
        selectEntitiesWhere,
        selectEntityCount,
        selectEntityExists,
        selectEntitiesMap,
        // Keep original non-memoized versions for backward compatibility
        selectEntityDirect: baseSlice.selectEntity,
        selectAllEntitiesDirect: baseSlice.selectAllEntities,
        selectEntityIdsDirect: baseSlice.selectEntityIds
    }
}

/**
 * Type for the enhanced slice with memoized selectors
 */
export type MemoizedEntitySlice<
    TName extends string,
    TEntity,
    TReducers extends EntityReducersMap<TName, TEntity>
> = ReturnType<typeof createEntitySliceWithMemoization<TName, TEntity, TReducers>>