/**
 * Effect-Redux Integration
 * 
 * This module provides seamless integration between Effect-TS and Redux,
 * enabling Effect-based side effects, sagas, and middleware in Redux applications.
 */

// Middleware exports
export {
    createEffectMiddleware,
    effectAction,
    cancellableEffectAction,
    debouncedEffectAction,
    createStreamDispatcher,
    ReduxStore,
    type EffectMiddlewareConfig,
    type EffectAction
} from './middleware'

// Saga bridge exports
export {
    SagaManager,
    SagaEffects,
    createSaga,
    rootSaga,
    type EffectSaga,
    type ActionMatcher
} from './saga-bridge'

// Store factory exports
export {
    createEffectStore,
    createStoreLayer,
    createStoreWithDeps,
    createTestStore,
    batchActions,
    batchMiddleware,
    StoreContext,
    StoreHooks,
    type EffectStoreConfig,
    type EffectStore
} from './store-factory'

/**
 * Quick start example:
 * 
 * ```typescript
 * import { Runtime } from 'effect'
 * import { createEffectStore, createSaga, SagaEffects } from '@packages/isomorphic/effect-redux'
 * 
 * // Create a saga
 * const mySaga = createSaga('mySaga', Effect.gen(function* () {
 *   while (true) {
 *     const action = yield* SagaEffects.take('FETCH_DATA')
 *     // Handle the action with Effect
 *     yield* Effect.fork(fetchDataEffect(action.payload))
 *   }
 * }))
 * 
 * // Create the store
 * const store = createEffectStore({
 *   reducer: rootReducer,
 *   runtime: Runtime.defaultRuntime,
 *   sagas: [mySaga],
 *   debug: true
 * })
 * ```
 */
