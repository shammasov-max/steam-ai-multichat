import { PayloadAction, Draft } from '@reduxjs/toolkit'

/**
 * Entity with ID property following the pattern {TName}Id
 */
export type EntityWithId<TName extends string, TEntity> = TEntity & {
    readonly [K in `${TName}Id`]: string
}

/**
 * Normalized entity state structure
 */
export interface EntityState<TEntity> {
    entities: Record<string, TEntity>
    ids: string[]
}

/**
 * Action payload that includes the entity ID
 */
export type EntityActionPayload<TName extends string, TPayload = void> = TPayload extends void
    ? { [K in `${TName}Id`]: string }
    : TPayload & { [K in `${TName}Id`]: string }

/**
 * Entity reducer function type
 */
export type EntityReducer<TName extends string, TEntity, TPayload = void> = (
    entity: Draft<TEntity>,
    payload: EntityActionPayload<TName, TPayload>
) => void | Draft<TEntity>

/**
 * Map of entity reducers
 *
 * @intentional-any The 'any' type for TPayload is required for TypeScript's type system to allow
 * proper variance when mapping over different reducer types with different payloads.
 * The actual payload types are properly constrained when the reducers are used.
 */
export type EntityReducersMap<TName extends string, TEntity> = Record<
    string,
    EntityReducer<TName, TEntity, any>
>

/**
 * Extract payload type from entity reducer
 *
 * @intentional-any The 'any' for TEntity is safe because we're only extracting the payload type P.
 * The entity type is irrelevant for this type extraction operation.
 */
export type ExtractPayload<T> = T extends EntityReducer<string, any, infer P> ? P : never

/**
 * Generate action creators with entity ID requirement
 *
 * @intentional-any The 'any' in EntityReducersMap is required for the type constraint.
 * TReducers is properly typed through the constraint, ensuring type safety.
 */
export type EntityActionCreators<
    TName extends string,
    TReducers extends EntityReducersMap<TName, any>,
> = {
    [K in keyof TReducers]: ExtractPayload<TReducers[K]> extends void
        ? (
              payload: EntityActionPayload<TName, void>
          ) => PayloadAction<EntityActionPayload<TName, void>>
        : (
              payload: EntityActionPayload<TName, ExtractPayload<TReducers[K]>>
          ) => PayloadAction<EntityActionPayload<TName, ExtractPayload<TReducers[K]>>>
}

/**
 * Transform entity reducers to slice reducers
 */
export type SliceReducersFromEntityReducers<
    TName extends string,
    TEntity,
    TReducers extends EntityReducersMap<TName, TEntity>,
> = {
    [K in keyof TReducers]: (
        state: Draft<EntityState<TEntity>>,
        action: PayloadAction<EntityActionPayload<TName, ExtractPayload<TReducers[K]>>>
    ) => void
}
