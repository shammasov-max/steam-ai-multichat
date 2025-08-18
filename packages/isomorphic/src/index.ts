// ============= Base utilities =============
export { 
  createEntitySlice,
  addEntity,
  removeEntity,
  updateEntity,
  isEntityWithId,
  type EntityWithId,
  type EntityState,
  type EntityActionPayload,
  type EntityReducer,
  type EntityReducersMap,
  type CreateEntitySliceConfig
} from './base/createEntitySlice.js';

// ============= Entity Slices =============
export * from './slices/index.js';

// ============= Store setup helpers =============
export { sliceReducers, sliceActions, sliceSelectors, type RootState } from './slices/index.js';

// ============= Events =============
export * from './events/actions.js';
export * from './events/event-builder.js';
export * from './events/meta.js';
export * from './events/payloads.js';

