import { Effect, Ref, Queue } from 'effect'
import { 
    configureStore, 
    EnhancedStore, 
    Middleware, 
    UnknownAction, 
    Reducer,
    StoreEnhancer
} from '@reduxjs/toolkit'
import { createServiceError } from '../effect-patterns'

// ============================================================================
// Error Types
// ============================================================================

export const ReduxError = createServiceError('Redux')
export const StoreError = createServiceError('Store')

// ============================================================================
// Core Types
// ============================================================================

export interface ReduxStoreConfig<S = any> {
    reducer: Reducer<S>
    preloadedState?: S
    middleware?: Middleware[]
    enhancers?: StoreEnhancer[]
    devTools?: boolean
}

export interface ReduxCore<S = any> {
    readonly store: Ref.Ref<EnhancedStore<S> | null>
    readonly actionQueue: Queue.Queue<UnknownAction>
    readonly getState: () => Effect.Effect<S>
    readonly dispatch: (action: UnknownAction) => Effect.Effect<void>
    readonly subscribe: (listener: () => void) => Effect.Effect<() => void>
}

// ============================================================================
// Store Factory
// ============================================================================

export const createReduxCore = <S>() =>
    Effect.gen(function* () {
        const store = yield* Ref.make<EnhancedStore<S> | null>(null)
        const actionQueue = yield* Queue.unbounded<UnknownAction>()
        
        const createStore = (config: ReduxStoreConfig<S>) =>
            Effect.gen(function* () {
                const existingStore = yield* Ref.get(store)
                if (existingStore) {
                    return yield* Effect.fail(
                        StoreError.create('createStore', 'Store already initialized')
                    )
                }
                
                const newStore = configureStore({
                    reducer: config.reducer,
                    preloadedState: config.preloadedState,
                    middleware: (getDefaultMiddleware) =>
                        getDefaultMiddleware({ 
                            serializableCheck: false, 
                            immutableCheck: true 
                        })
                        .concat(createActionQueueMiddleware(actionQueue))
                        .concat(...(config.middleware ?? [])),
                    // @ts-ignore - Redux Toolkit enhancer typing issue
                    enhancers: config.enhancers ? 
                        (getDefaultEnhancers: any) => [...getDefaultEnhancers(), ...config.enhancers!] : 
                        undefined,
                    devTools: config.devTools ?? true
                })
                
                yield* Ref.set(store, newStore)
                yield* Effect.log('Redux store created')
                
                return newStore
            })
        
        const getStore = () =>
            Effect.gen(function* () {
                const s = yield* Ref.get(store)
                if (!s) {
                    return yield* Effect.die('Store not initialized')
                }
                return s
            })
        
        const core: ReduxCore<S> = {
            store,
            actionQueue,
            
            getState: () =>
                Effect.gen(function* () {
                    const s = yield* getStore()
                    return s.getState() as S
                }),
            
            dispatch: (action) =>
                Effect.gen(function* () {
                    const s = yield* getStore()
                    s.dispatch(action)
                }),
            
            subscribe: (listener) =>
                Effect.gen(function* () {
                    const s = yield* getStore()
                    return s.subscribe(listener)
                })
        }
        
        return {
            ...core,
            createStore,
            getStore
        }
    })

// ============================================================================
// Middleware Factory
// ============================================================================

const createActionQueueMiddleware = (queue: Queue.Queue<UnknownAction>): Middleware =>
    () => (next) => (action) => {
        Queue.unsafeOffer(queue, action as UnknownAction)
        return next(action)
    }