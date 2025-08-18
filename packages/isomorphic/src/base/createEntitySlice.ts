import { createSlice, PayloadAction, Draft, Slice, SliceCaseReducers, ValidateSliceCaseReducers } from '@reduxjs/toolkit';
import { Schema } from '@effect/schema';

// ============= Core Types =============

/**
 * Entity with ID property following the pattern {TName}Id
 */
export type EntityWithId<TName extends string, TEntity> = TEntity & {
  readonly [K in `${TName}Id`]: string;
};

/**
 * Normalized entity state structure
 */
export interface EntityState<TEntity> {
  entities: Record<string, TEntity>;
  ids: string[];
}

/**
 * Action payload that includes the entity ID
 */
export type EntityActionPayload<TName extends string, TPayload = void> = TPayload extends void
  ? { [K in `${TName}Id`]: string }
  : TPayload & { [K in `${TName}Id`]: string };

/**
 * Entity reducer function type
 */
export type EntityReducer<TName extends string, TEntity, TPayload = void> = (
  entity: Draft<TEntity>,
  payload: EntityActionPayload<TName, TPayload>
) => void | Draft<TEntity>;

/**
 * Map of entity reducers
 */
export type EntityReducersMap<TName extends string, TEntity> = {
  [K: string]: EntityReducer<TName, TEntity, any>;
};

// ============= Type Helpers =============

/**
 * Extract payload type from entity reducer
 */
type ExtractPayload<T> = T extends EntityReducer<any, any, infer P> ? P : never;

/**
 * Generate action creators with entity ID requirement
 */
type EntityActionCreators<TName extends string, TReducers extends EntityReducersMap<TName, any>> = {
  [K in keyof TReducers]: ExtractPayload<TReducers[K]> extends void
    ? (payload: EntityActionPayload<TName, void>) => PayloadAction<EntityActionPayload<TName, void>>
    : (payload: EntityActionPayload<TName, ExtractPayload<TReducers[K]>>) => PayloadAction<EntityActionPayload<TName, ExtractPayload<TReducers[K]>>>;
};

/**
 * Transform entity reducers to slice reducers
 */
type SliceReducersFromEntityReducers<TName extends string, TEntity, TReducers extends EntityReducersMap<TName, TEntity>> = {
  [K in keyof TReducers]: (
    state: Draft<EntityState<TEntity>>,
    action: PayloadAction<EntityActionPayload<TName, ExtractPayload<TReducers[K]>>>
  ) => void;
};

// ============= Helper Functions =============

/**
 * Get entity ID from payload based on entity name
 */
function getEntityId<TName extends string>(
  entityName: TName,
  payload: EntityActionPayload<TName, any>
): string {
  const idKey = `${entityName}Id` as const;
  return payload[idKey];
}

/**
 * Simple pluralization function
 * Can be enhanced with more complex rules if needed
 */
function pluralize(singular: string): string {
  if (singular.endsWith('y') && !['ay', 'ey', 'iy', 'oy', 'uy'].some(ending => singular.endsWith(ending))) {
    return singular.slice(0, -1) + 'ies';
  }
  if (singular.endsWith('s') || singular.endsWith('x') || singular.endsWith('z') || 
      singular.endsWith('ch') || singular.endsWith('sh')) {
    return singular + 'es';
  }
  return singular + 's';
}

// ============= Main Function =============

/**
 * Configuration for createEntitySlice
 */
export interface CreateEntitySliceConfig<TName extends string, TEntity, TReducers extends EntityReducersMap<TName, TEntity>> {
  /**
   * Singular entity name (e.g., 'user')
   */
  name: TName;
  
  /**
   * Initial entities (optional)
   */
  initialEntities?: EntityWithId<TName, TEntity>[];
  
  /**
   * Entity-level reducers
   */
  entityReducers: TReducers;
  
  /**
   * Optional Schema for entity validation
   */
  entitySchema?: Schema.Schema<TEntity>;
  
  /**
   * Custom pluralization function (optional)
   */
  pluralizeFn?: (singular: string) => string;
  
  /**
   * Extra reducers for actions that create/delete entities or handle slice-level operations
   * These are passed directly to Redux Toolkit's createSlice
   */
  extraReducers?: Record<string, (state: Draft<EntityState<TEntity>>, action: PayloadAction<any>) => void>;
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
  TReducers extends EntityReducersMap<TName, TEntity>
>(
  config: CreateEntitySliceConfig<TName, TEntity, TReducers>
): Slice<EntityState<TEntity>, SliceReducersFromEntityReducers<TName, TEntity, TReducers>, string> & {
  actions: EntityActionCreators<TName, TReducers>;
  selectEntity: (state: EntityState<TEntity>, id: string) => TEntity | undefined;
  selectAllEntities: (state: EntityState<TEntity>) => TEntity[];
  selectEntityIds: (state: EntityState<TEntity>) => string[];
} {
  const {
    name: entityName,
    initialEntities = [],
    entityReducers,
    entitySchema,
    pluralizeFn = pluralize,
    extraReducers = {}
  } = config;
  
  const sliceName = pluralizeFn(entityName);
  const idKey = `${entityName}Id` as keyof EntityWithId<TName, TEntity>;
  
  // Build initial state
  const initialState: EntityState<TEntity> = {
    entities: {},
    ids: []
  };
  
  // Add initial entities if provided
  initialEntities.forEach(entity => {
    const id = String(entity[idKey]);
    initialState.entities[id] = entity;
    initialState.ids.push(id);
  });
  
  // Transform entity reducers to slice reducers
  const sliceReducers: SliceReducersFromEntityReducers<TName, TEntity, TReducers> = {} as any;
  
  Object.entries(entityReducers).forEach(([actionName, entityReducer]) => {
    sliceReducers[actionName as keyof TReducers] = (
      state: Draft<EntityState<TEntity>>,
      action: PayloadAction<EntityActionPayload<TName, any>>
    ) => {
      const entityId = getEntityId(entityName, action.payload);
      const entity = state.entities[entityId];
      
      if (!entity) {
        console.warn(`Entity with ${entityName}Id "${entityId}" not found`);
        return;
      }
      
      // Validate with schema if provided
      if (entitySchema) {
        const parseResult = Schema.decodeUnknownOption(entitySchema)(entity);
        if (parseResult._tag === 'None') {
          console.error(`Entity validation failed for ${entityName}Id "${entityId}"`);
          return;
        }
      }
      
      // Apply the entity reducer
      const result = entityReducer(entity as Draft<TEntity>, action.payload);
      
      // If reducer returns a new entity, replace it
      if (result !== undefined) {
        state.entities[entityId] = result as Draft<TEntity>;
      }
    };
  });
  
  // Merge extraReducers with sliceReducers
  const allReducers = { ...sliceReducers, ...extraReducers } as any;
  
  // Create the slice
  const slice = createSlice({
    name: sliceName,
    initialState,
    reducers: allReducers as ValidateSliceCaseReducers<EntityState<TEntity>, SliceReducersFromEntityReducers<TName, TEntity, TReducers>>
  });
  
  // Add selector functions
  const enhancedSlice = Object.assign(slice, {
    selectEntity: (state: EntityState<TEntity>, id: string) => state.entities[id],
    selectAllEntities: (state: EntityState<TEntity>) => state.ids.map(id => state.entities[id]),
    selectEntityIds: (state: EntityState<TEntity>) => state.ids
  });
  
  return enhancedSlice as any;
}

// ============= Additional Utilities =============

/**
 * Add entity to state
 */
export function addEntity<TName extends string, TEntity>(
  state: Draft<EntityState<EntityWithId<TName, TEntity>>>,
  entity: EntityWithId<TName, TEntity>,
  entityName: TName
): void {
  const idKey = `${entityName}Id` as keyof EntityWithId<TName, TEntity>;
  const id = String(entity[idKey]);
  
  if (!state.entities[id]) {
    state.entities[id] = entity as Draft<EntityWithId<TName, TEntity>>;
    state.ids.push(id);
  }
}

/**
 * Remove entity from state
 */
export function removeEntity<TEntity>(
  state: Draft<EntityState<TEntity>>,
  id: string
): void {
  if (state.entities[id]) {
    delete state.entities[id];
    state.ids = state.ids.filter(existingId => existingId !== id);
  }
}

/**
 * Update entity in state
 */
export function updateEntity<TEntity>(
  state: Draft<EntityState<TEntity>>,
  id: string,
  updates: Partial<TEntity>
): void {
  if (state.entities[id]) {
    Object.assign(state.entities[id], updates);
  }
}

// ============= Type Guards =============

/**
 * Check if value is a valid entity with required ID
 */
export function isEntityWithId<TName extends string, TEntity>(
  value: unknown,
  entityName: TName
): value is EntityWithId<TName, TEntity> {
  if (!value || typeof value !== 'object') return false;
  
  const idKey = `${entityName}Id`;
  return idKey in value && typeof (value as any)[idKey] === 'string';
}