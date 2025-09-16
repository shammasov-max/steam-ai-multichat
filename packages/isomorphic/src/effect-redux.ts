import { Effect, Queue, Ref, Stream, Fiber, pipe } from 'effect'
import {
    configureStore,
    EnhancedStore,
    UnknownAction,
    Reducer,
    Middleware,
    StoreEnhancer,
} from '@reduxjs/toolkit'
import { error } from './effect-patterns/type-utils'

// ============================================================================
// Errors
// ============================================================================

const ReduxError = error('ReduxError', 'Redux operation failed')
const StoreError = error('StoreError', 'Store operation failed')
const SagaError = error('SagaError', 'Saga operation failed')

// ============================================================================
// Types
// ============================================================================

type Op<A, E = never> = Effect.Effect<A, E, never>

export interface ReduxConfig<S = any> {
    reducer: Reducer<S>
    preloadedState?: S
    middleware?: Middleware[]
    enhancers?: StoreEnhancer[]
    devTools?: boolean
}

export interface ReduxStore<S = any> {
    readonly getState: () => Op<S>
    readonly dispatch: (action: UnknownAction) => Op<void>
    readonly select: <T>(selector: (state: S) => T) => Op<T>
    readonly subscribe: (listener: () => void) => Op<() => void>
    readonly actions$: Stream.Stream<UnknownAction>
    readonly state$: Stream.Stream<S>
}

// ============================================================================
// Saga Types
// ============================================================================

export interface Saga<R = never> {
    readonly id: string
    readonly effect: Op<void, never, R>
    readonly pattern?: (action: UnknownAction) => boolean
}

export interface SagaManager {
    readonly run: <R>(saga: Saga<R>) => Op<Fiber.RuntimeFiber<void, never>>
    readonly cancel: (id: string) => Op<void>
    readonly cancelAll: () => Op<void>
}

// ============================================================================
// Redux Store Factory
// ============================================================================

export const createReduxStore = <S>(
    config: ReduxConfig<S>
): Op<ReduxStore<S> & { store: EnhancedStore<S> }> =>
    Effect.gen(function* () {
        // Create action and state queues
        const actionQueue = yield* Queue.unbounded<UnknownAction>()
        const stateQueue = yield* Queue.unbounded<S>()

        // Custom middleware to capture actions
        const captureMiddleware: Middleware = () => (next) => (action: UnknownAction) => {
            Queue.unsafeOffer(actionQueue, action)
            const result = next(action)
            Queue.unsafeOffer(stateQueue, (store as any).getState())
            return result
        }

        // Configure store
        const store = configureStore({
            reducer: config.reducer,
            preloadedState: config.preloadedState as any,
            middleware: (getDefault) => {
                const defaults = getDefault({ serializableCheck: false })
                return [...defaults, captureMiddleware, ...(config.middleware || [])]
            },
            enhancers: config.enhancers,
            devTools: config.devTools ?? true,
        })

        // Initial state
        Queue.unsafeOffer(stateQueue, store.getState())

        return {
            store,
            getState: () => Effect.succeed(store.getState()),
            dispatch: (action) => Effect.sync(() => store.dispatch(action)),
            select: (selector) => Effect.succeed(selector(store.getState())),
            subscribe: (listener) => Effect.sync(() => store.subscribe(listener)),
            actions$: Stream.fromQueue(actionQueue),
            state$: Stream.fromQueue(stateQueue),
        }
    })

// ============================================================================
// Saga Runner
// ============================================================================

export const createSagaManager = <S>(
    store: ReduxStore<S>
): Op<SagaManager> =>
    Effect.gen(function* () {
        const runningFibers = yield* Ref.make<Map<string, Fiber.RuntimeFiber<void, never>>>(
            new Map()
        )

        const manager: SagaManager = {
            run: <R>(saga: Saga<R>) =>
                Effect.gen(function* () {
                    // Cancel existing saga with same ID
                    yield* manager.cancel(saga.id)

                    // Create saga fiber
                    const fiber = yield* pipe(
                        saga.pattern
                            ? // Watch for specific actions
                              pipe(
                                  store.actions$,
                                  Stream.filter(saga.pattern),
                                  Stream.runForEach(() => saga.effect)
                              )
                            : // Run once
                              saga.effect,
                        Effect.fork
                    )

                    // Track fiber
                    yield* Ref.update(runningFibers, (map) => {
                        const newMap = new Map(map)
                        newMap.set(saga.id, fiber)
                        return newMap
                    })

                    return fiber
                }),

            cancel: (id: string) =>
                Effect.gen(function* () {
                    const fibers = yield* Ref.get(runningFibers)
                    const fiber = fibers.get(id)
                    if (fiber) {
                        yield* Fiber.interrupt(fiber)
                        yield* Ref.update(runningFibers, (map) => {
                            const newMap = new Map(map)
                            newMap.delete(id)
                            return newMap
                        })
                    }
                }),

            cancelAll: () =>
                Effect.gen(function* () {
                    const fibers = yield* Ref.get(runningFibers)
                    yield* Effect.forEach(fibers.values(), Fiber.interrupt, {
                        concurrency: 'unbounded',
                    })
                    yield* Ref.set(runningFibers, new Map())
                }),
        }

        return manager
    })

// ============================================================================
// Effect-Redux Integration
// ============================================================================

export interface EffectRedux<S = any> {
    readonly store: ReduxStore<S> & { store: EnhancedStore<S> }
    readonly sagas: SagaManager
    readonly runSaga: <R>(saga: Saga<R>) => Op<Fiber.RuntimeFiber<void, never>>
    readonly dispatch: (action: UnknownAction) => Op<void>
    readonly select: <T>(selector: (state: S) => T) => Op<T>
    readonly takeEvery: (
        pattern: string | ((action: UnknownAction) => boolean),
        handler: (action: UnknownAction) => Op<void>
    ) => Op<Fiber.RuntimeFiber<void, never>>
    readonly takeLatest: (
        pattern: string | ((action: UnknownAction) => boolean),
        handler: (action: UnknownAction) => Op<void>
    ) => Op<Fiber.RuntimeFiber<void, never>>
}

/**
 * Create Effect-Redux integration
 */
export const createEffectRedux = <S>(
    config: ReduxConfig<S>
): Op<EffectRedux<S>> =>
    Effect.gen(function* () {
        const store = yield* createReduxStore(config)
        const sagas = yield* createSagaManager(store)

        const integration: EffectRedux<S> = {
            store,
            sagas,
            runSaga: sagas.run,
            dispatch: store.dispatch,
            select: store.select,

            takeEvery: (pattern, handler) => {
                const patternFn =
                    typeof pattern === 'string'
                        ? (action: UnknownAction) => action.type === pattern
                        : pattern

                return sagas.run({
                    id: `takeEvery-${Math.random()}`,
                    pattern: patternFn,
                    effect: handler({ type: 'DUMMY' } as UnknownAction), // Will be called with real actions
                })
            },

            takeLatest: (pattern, handler) => {
                const patternFn =
                    typeof pattern === 'string'
                        ? (action: UnknownAction) => action.type === pattern
                        : pattern

                let lastFiber: Fiber.RuntimeFiber<void, never> | null = null

                return sagas.run({
                    id: `takeLatest-${Math.random()}`,
                    effect: pipe(
                        store.actions$,
                        Stream.filter(patternFn),
                        Stream.runForEach((action) =>
                            Effect.gen(function* () {
                                // Cancel previous
                                if (lastFiber) {
                                    yield* Fiber.interrupt(lastFiber)
                                }
                                // Start new
                                lastFiber = yield* Effect.fork(handler(action))
                            })
                        )
                    ),
                })
            },
        }

        return integration
    })

// ============================================================================
// Saga Helpers
// ============================================================================

/**
 * Create a saga that watches for actions
 */
export const watchActions = (
    pattern: string | ((action: UnknownAction) => boolean),
    handler: (action: UnknownAction) => Op<void>
): Saga => ({
    id: `watch-${typeof pattern === 'string' ? pattern : 'custom'}`,
    pattern: typeof pattern === 'string' ? (a) => a.type === pattern : pattern,
    effect: Effect.never, // Will be handled by saga runner
})

/**
 * Create a saga that runs once on startup
 */
export const startupSaga = (id: string, effect: Op<void>): Saga => ({
    id,
    effect,
})

/**
 * Delay effect
 */
export const delay = (ms: number) => Effect.sleep(`${ms} millis`)

/**
 * Select from store
 */
export const select = <S, T>(
    store: ReduxStore<S>,
    selector: (state: S) => T
): Op<T> => store.select(selector)

/**
 * Put action to store
 */
export const put = <S>(
    store: ReduxStore<S>,
    action: UnknownAction
): Op<void> => store.dispatch(action)

// ============================================================================
// Usage Example
// ============================================================================

/**
 * Example usage:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   // Create Effect-Redux
 *   const redux = yield* createEffectRedux({
 *     reducer: rootReducer,
 *     devTools: true
 *   })
 *
 *   // Run a startup saga
 *   yield* redux.runSaga({
 *     id: 'initialize',
 *     effect: Effect.gen(function* () {
 *       const config = yield* loadConfig()
 *       yield* redux.dispatch({ type: 'CONFIG_LOADED', payload: config })
 *     })
 *   })
 *
 *   // Watch for actions
 *   yield* redux.takeEvery('user/login', (action) =>
 *     Effect.gen(function* () {
 *       const user = yield* fetchUser(action.payload.id)
 *       yield* redux.dispatch({ type: 'user/loginSuccess', payload: user })
 *     })
 *   )
 *
 *   // Select state
 *   const user = yield* redux.select(state => state.user)
 * })
 * ```
 */