import { Effect, Queue, Ref, Stream, pipe } from 'effect'
import { configureStore, EnhancedStore, UnknownAction, Reducer } from '@reduxjs/toolkit'
import { tag, serviceLayer, error, type Op } from '../effect-patterns'

// ============================================================================
// Error Types (simplified)
// ============================================================================

export const ReduxError = error('ReduxError', 'Redux operation failed')
export const StoreNotInitializedError = error('StoreNotInitialized', 'Store not initialized')

// ============================================================================
// Types
// ============================================================================

export interface ReduxConfig<S = any> {
    reducer: Reducer<S>
    preloadedState?: S
    devTools?: boolean
}

// ============================================================================
// Service Interface (Before: 60+ lines, After: 12 lines)
// ============================================================================

export interface ReduxOps<S = any> {
    readonly getState: () => Op<S>
    readonly dispatch: (action: UnknownAction) => Op<void>
    readonly select: <T>(selector: (state: S) => T) => Op<T>
    readonly subscribe: (listener: () => void) => Op<() => void>
    readonly actions$: Stream.Stream<UnknownAction>
}

export const ReduxService = <S = any>() => tag<'ReduxService', ReduxOps<S>>('ReduxService')

// ============================================================================
// Service Implementation (Before: 150+ lines, After: 50 lines)
// ============================================================================

const createReduxService = <S>(config: ReduxConfig<S>): Op<ReduxOps<S>> =>
    Effect.gen(function* () {
        // Create store with minimal config
        const store = configureStore({
            reducer: config.reducer,
            preloadedState: config.preloadedState as any,
            middleware: (getDefault: any) => getDefault({ serializableCheck: false }),
            devTools: config.devTools ?? true,
        } as any)

        // Action stream
        const actionQueue = yield* Queue.unbounded<UnknownAction>()

        // Middleware to capture actions
        const middleware = () => (next: any) => (action: UnknownAction) => {
            Queue.unsafeOffer(actionQueue, action)
            return next(action)
        }

        // Since store is already created, we'll just capture state changes
        store.subscribe(() => {
            Queue.unsafeOffer(actionQueue, { type: 'STATE_CHANGE' } as UnknownAction)
        })

        return {
            getState: () => Effect.succeed(store.getState()),

            dispatch: (action: UnknownAction) =>
                Effect.sync(() => {
                    store.dispatch(action)
                    Queue.unsafeOffer(actionQueue, action)
                }),

            select: <T>(selector: (state: S) => T) =>
                Effect.map(Effect.succeed(store.getState()), selector),

            subscribe: (listener: () => void) => Effect.sync(() => store.subscribe(listener)),

            actions$: Stream.fromQueue(actionQueue),
        }
    })

// ============================================================================
// Layer Creation (Before: 40+ lines, After: 6 lines)
// ============================================================================

export const createReduxLayer = <S>(config: ReduxConfig<S>) =>
    serviceLayer(ReduxService<S>(), () => createReduxService(config))

// ============================================================================
// Saga-like Effects (simplified)
// ============================================================================

export const createReduxEffect = <S>(
    pattern: string | ((action: UnknownAction) => boolean),
    handler: (action: UnknownAction) => Op<void>
) => {
    const matchPattern =
        typeof pattern === 'string' ? (action: UnknownAction) => action.type === pattern : pattern

    return (redux: ReduxOps<S>) =>
        Stream.filter(redux.actions$, matchPattern).pipe(Stream.mapEffect(handler), Stream.runDrain)
}
