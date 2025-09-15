import { Effect, Context, Layer, Data, Runtime, Fiber, Queue, Stream, Scope, Exit, Cause, Ref } from 'effect'
import { 
    configureStore, 
    EnhancedStore, 
    Middleware, 
    UnknownAction, 
    Reducer,
    Dispatch,
    MiddlewareAPI,
    StoreEnhancer,
    PayloadAction
} from '@reduxjs/toolkit'
import { Logger } from '../utils/LoggerService'

// ============================================================================
// Error Types
// ============================================================================

export class ReduxServiceError extends Data.TaggedError('ReduxServiceError')<{
    readonly operation: string
    readonly message: string
    readonly cause?: unknown
}> {}

export class SagaError extends Data.TaggedError('SagaError')<{
    readonly sagaId: string
    readonly message: string
    readonly cause?: unknown
}> {}

export class StoreError extends Data.TaggedError('StoreError')<{
    readonly message: string
    readonly cause?: unknown
}> {}

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface EffectAction<R = any, E = any, A = any> extends UnknownAction {
    effect?: Effect.Effect<A, E, R>
    meta?: {
        effectId?: string
        cancelPrevious?: boolean
        debounce?: number
        throttle?: number
    }
}

export interface SagaDefinition<R = never> {
    id: string
    effect: Effect.Effect<void, never, R | ReduxStoreContext>
    cleanup?: Effect.Effect<void, never, never>
}

export interface ReduxStoreContext {
    readonly getState: () => unknown
    readonly dispatch: (action: UnknownAction) => void
    readonly subscribe: (listener: () => void) => () => void
}

export interface ReduxServiceConfig<S = any, R = any> {
    reducer: Reducer<S>
    preloadedState?: S
    middleware?: Middleware[]
    enhancers?: StoreEnhancer[]
    devTools?: boolean
    debug?: boolean
}

export interface ActionMatcher<A extends UnknownAction = UnknownAction> {
    (action: UnknownAction): action is A
}

// ============================================================================
// Service Interface
// ============================================================================

export interface ReduxServiceOps<S = any, R = any> {
    // Store operations
    readonly createStore: (config: ReduxServiceConfig<S, R>) => Effect.Effect<EnhancedStore<S>, StoreError>
    readonly getState: () => Effect.Effect<S, never>
    readonly dispatch: (action: UnknownAction) => Effect.Effect<void, never>
    readonly subscribe: (listener: () => void) => Effect.Effect<() => void, never>
    
    // Saga operations
    readonly runSaga: <R1>(saga: SagaDefinition<R1>) => Effect.Effect<Fiber.RuntimeFiber<void, never>, SagaError, never>
    readonly stopSaga: (sagaId: string) => Effect.Effect<void, SagaError, never>
    readonly stopAllSagas: () => Effect.Effect<void, never, never>
    
    // Effect action operations
    readonly runEffect: <E, A, R1>(effect: Effect.Effect<A, E, R1>) => Effect.Effect<A, E, never>
    readonly createEffectAction: <E, A>(
        type: string,
        effect: Effect.Effect<A, E, R>,
        meta?: EffectAction['meta']
    ) => EffectAction<R, E, A>
    
    // Stream operations
    readonly actionStream: () => Stream.Stream<UnknownAction, never, never>
    readonly filteredActionStream: <A extends UnknownAction>(
        matcher: ActionMatcher<A>
    ) => Stream.Stream<A, never, never>
    
    // Saga effects (inspired by redux-saga)
    readonly take: <A extends UnknownAction>(
        matcher: ActionMatcher<A>
    ) => Effect.Effect<A, never, never>
    readonly takeEvery: <A extends UnknownAction, E, R1>(
        matcher: ActionMatcher<A>,
        handler: (action: A) => Effect.Effect<unknown, E, R1>
    ) => Effect.Effect<never, never, never>
    readonly takeLatest: <A extends UnknownAction, E, R1>(
        matcher: ActionMatcher<A>,
        handler: (action: A) => Effect.Effect<unknown, E, R1>
    ) => Effect.Effect<never, never, never>
    readonly put: (action: UnknownAction) => Effect.Effect<void, never>
    readonly select: <T>(selector: (state: S) => T) => Effect.Effect<T, never>
}

// ============================================================================
// Context Tags
// ============================================================================

export interface ReduxService<S = any, R = any> {
    readonly _: unique symbol
}

export const ReduxService = <S = any, R = any>() =>
    Context.GenericTag<ReduxService<S, R>, ReduxServiceOps<S, R>>('ReduxService')

export interface ReduxStoreContextTag {
    readonly _: unique symbol
}

export const ReduxStoreContextTag = Context.GenericTag<ReduxStoreContextTag, ReduxStoreContext>('ReduxStoreContext')

// ============================================================================
// Implementation
// ============================================================================

const makeReduxService = <S, R>(runtime: Runtime.Runtime<R>) =>
    Effect.gen(function* () {
        const logger = yield* Logger
        
        // Internal state
        const storeRef = yield* Ref.make<EnhancedStore<S> | null>(null)
        const sagaFibers = yield* Ref.make<Map<string, Fiber.RuntimeFiber<void, never>>>(new Map())
        const actionQueue = yield* Queue.unbounded<UnknownAction>()
        const effectExecutions = yield* Ref.make<Map<string, Fiber.RuntimeFiber<any, any>>>(new Map())
        
        // Create Effect middleware
        const createEffectMiddleware = (): Middleware => {
            return ((api: MiddlewareAPI) => (next: (action: unknown) => unknown) => (action: unknown): unknown => {
                const effectAction = action as EffectAction
                
                if (effectAction.effect) {
                    const { meta } = effectAction
                    const effectId = meta?.effectId ?? `effect_${Date.now()}`
                    
                    Effect.gen(function* () {
                        // Cancel previous if needed
                        if (meta?.cancelPrevious) {
                            const executions = yield* Ref.get(effectExecutions)
                            const prev = executions.get(effectId)
                            if (prev) {
                                yield* Fiber.interrupt(prev)
                                yield* Ref.update(effectExecutions, map => {
                                    const newMap = new Map(map)
                                    newMap.delete(effectId)
                                    return newMap
                                })
                            }
                        }
                        
                        // Apply delay modifiers
                        let finalEffect = effectAction.effect!
                        if (meta?.debounce) {
                            finalEffect = Effect.delay(finalEffect, meta.debounce)
                        } else if (meta?.throttle) {
                            finalEffect = Effect.zipRight(
                                finalEffect,
                                Effect.sleep(meta.throttle)
                            )
                        }
                        
                        // Run the effect
                        const fiber = yield* Effect.fork(
                            Effect.provide(
                                finalEffect,
                                Layer.succeed(ReduxStoreContextTag, {
                                    getState: api.getState,
                                    dispatch: api.dispatch,
                                    subscribe: () => () => {}
                                })
                            )
                        )
                        
                        // Track execution
                        yield* Ref.update(effectExecutions, map => {
                            const newMap = new Map(map)
                            newMap.set(effectId, fiber)
                            return newMap
                        })
                        
                        // Clean up on completion
                        yield* Fiber.join(fiber).pipe(
                            Effect.ensuring(
                                Ref.update(effectExecutions, map => {
                                    const newMap = new Map(map)
                                    newMap.delete(effectId)
                                    return newMap
                                })
                            ),
                            Effect.fork
                        )
                    }).pipe(
                        Runtime.runFork(runtime)
                    )
                }
                
                // Add to action queue for sagas
                Queue.unsafeOffer(actionQueue, action as UnknownAction)

                return next(action)
            }) as Middleware
        }
        
        // Service implementation
        const service: ReduxServiceOps<S, R> = {
            createStore: (config) =>
                Effect.gen(function* () {
                    const store = configureStore({
                        reducer: config.reducer,
                        preloadedState: config.preloadedState,
                        middleware: (getDefaultMiddleware) =>
                            getDefaultMiddleware({ 
                                serializableCheck: false, 
                                immutableCheck: true 
                            })
                            .concat(createEffectMiddleware())
                            .concat(...(config.middleware ?? [])),
                        // @ts-ignore - Redux Toolkit enhancer typing issue with strict mode
                        enhancers: config.enhancers ? (getDefaultEnhancers: any) => [...getDefaultEnhancers(), ...config.enhancers!] : undefined,
                        devTools: config.devTools ?? true
                    })
                    
                    yield* Ref.set(storeRef, store)
                    yield* logger.info('Redux store created')
                    
                    return store
                }).pipe(
                    Effect.catchAll(cause =>
                        Effect.fail(new StoreError({
                            message: 'Failed to create store',
                            cause
                        }))
                    )
                ),
            
            getState: () =>
                Effect.gen(function* () {
                    const store = yield* Ref.get(storeRef)
                    if (!store) {
                        return yield* Effect.die('Store not initialized')
                    }
                    return store.getState() as S
                }),
            
            dispatch: (action) =>
                Effect.gen(function* () {
                    const store = yield* Ref.get(storeRef)
                    if (!store) {
                        return yield* Effect.die('Store not initialized')
                    }
                    store.dispatch(action)
                }),
            
            subscribe: (listener) =>
                Effect.gen(function* () {
                    const store = yield* Ref.get(storeRef)
                    if (!store) {
                        return yield* Effect.die('Store not initialized')
                    }
                    return store.subscribe(listener)
                }),
            
            runSaga: <R1>(saga: SagaDefinition<R1>) =>
                Effect.gen(function* () {
                    const store = yield* Ref.get(storeRef)
                    if (!store) {
                        return yield* Effect.fail(new SagaError({
                            sagaId: saga.id,
                            message: 'Store not initialized'
                        }))
                    }
                    
                    // Check if saga already running
                    const fibers = yield* Ref.get(sagaFibers)
                    if (fibers.has(saga.id)) {
                        return yield* Effect.fail(new SagaError({
                            sagaId: saga.id,
                            message: 'Saga already running'
                        }))
                    }
                    
                    // Run saga with store context
                    const fiber = yield* Effect.fork(
                        Effect.provide(
                            saga.effect,
                            Layer.succeed(ReduxStoreContextTag, {
                                getState: store.getState,
                                dispatch: store.dispatch,
                                subscribe: store.subscribe
                            })
                        )
                    )
                    
                    // Track saga
                    yield* Ref.update(sagaFibers, map => {
                        const newMap = new Map(map)
                        newMap.set(saga.id, fiber)
                        return newMap
                    })
                    
                    yield* logger.info(`Saga started: ${saga.id}`)
                    
                    return fiber
                }).pipe(
                    Effect.catchAll(cause =>
                        Effect.fail(new SagaError({
                            sagaId: saga.id,
                            message: 'Failed to run saga',
                            cause
                        }))
                    )
                ) as Effect.Effect<Fiber.RuntimeFiber<void, never>, SagaError, never>,
            
            stopSaga: (sagaId) =>
                Effect.gen(function* () {
                    const fibers = yield* Ref.get(sagaFibers)
                    const fiber = fibers.get(sagaId)
                    
                    if (!fiber) {
                        return yield* Effect.fail(new SagaError({
                            sagaId,
                            message: 'Saga not found'
                        }))
                    }
                    
                    yield* Fiber.interrupt(fiber)
                    yield* Ref.update(sagaFibers, map => {
                        const newMap = new Map(map)
                        newMap.delete(sagaId)
                        return newMap
                    })
                    
                    yield* logger.info(`Saga stopped: ${sagaId}`)
                }) as Effect.Effect<void, SagaError, never>,
            
            stopAllSagas: () =>
                Effect.gen(function* () {
                    const fibers = yield* Ref.get(sagaFibers)
                    yield* Effect.all(
                        Array.from(fibers.values()).map(fiber => Fiber.interrupt(fiber)),
                        { concurrency: 'unbounded' }
                    )
                    yield* Ref.set(sagaFibers, new Map())
                    yield* logger.info('All sagas stopped')
                }) as Effect.Effect<void, never, never>,
            
            runEffect: <E, A, R1>(effect: Effect.Effect<A, E, R1>) =>
                Effect.gen(function* () {
                    const store = yield* Ref.get(storeRef)
                    if (!store) {
                        return yield* Effect.die('Store not initialized')
                    }
                    
                    return yield* Effect.provide(
                        effect,
                        Layer.succeed(ReduxStoreContextTag, {
                            getState: store.getState,
                            dispatch: store.dispatch,
                            subscribe: store.subscribe
                        })
                    )
                }) as Effect.Effect<A, E, never>,
            
            createEffectAction: (type, effect, meta) => ({
                type,
                effect,
                ...(meta && { meta })
            }),
            
            actionStream: () => Stream.fromQueue(actionQueue),
            
            filteredActionStream: (matcher) =>
                Stream.fromQueue(actionQueue).pipe(
                    Stream.filter(matcher)
                ),
            
            take: (matcher) =>
                Effect.gen(function* () {
                    const stream = yield* Stream.fromQueue(actionQueue).pipe(
                        Stream.filter(matcher),
                        Stream.take(1),
                        Stream.runCollect
                    )
                    return Array.from(stream)[0]
                }),
            
            takeEvery: <A extends UnknownAction, E, R1>(
                matcher: ActionMatcher<A>,
                handler: (action: A) => Effect.Effect<unknown, E, R1>
            ) =>
                Effect.forever(
                    Effect.gen(function* () {
                        const action = yield* service.take(matcher)
                        yield* Effect.fork(handler(action))
                    })
                ) as Effect.Effect<never, never, never>,
            
            takeLatest: <A extends UnknownAction, E, R1>(
                matcher: ActionMatcher<A>,
                handler: (action: A) => Effect.Effect<unknown, E, R1>
            ) =>
                Effect.gen(function* () {
                    let lastFiber: Fiber.RuntimeFiber<unknown, any> | null = null
                    return yield* Effect.forever(
                        Effect.gen(function* () {
                            const action = yield* service.take(matcher)
                            if (lastFiber) {
                                yield* Fiber.interrupt(lastFiber)
                            }
                            lastFiber = yield* Effect.fork(handler(action))
                        })
                    )
                }) as Effect.Effect<never, never, never>,
            
            put: (action) => service.dispatch(action),
            
            select: (selector) =>
                Effect.map(service.getState(), selector)
        }
        
        return service
    })

// ============================================================================
// Layer Creation
// ============================================================================

export const ReduxServiceLive = <S, R>(runtime: Runtime.Runtime<R>) =>
    Layer.scoped(
        ReduxService<S, R>(),
        Effect.gen(function* (_) {
            const service = yield* makeReduxService<S, R>(runtime)
            
            // Add finalizer for cleanup
            yield* Effect.addFinalizer(() =>
                Effect.gen(function* () {
                    yield* service.stopAllSagas()
                    yield* Effect.logInfo('Redux service cleaned up')
                })
            )
            
            return service
        })
    )

// ============================================================================
// Helper Functions
// ============================================================================

export const createEffectAction = <R, E, A>(
    type: string,
    effect: Effect.Effect<A, E, R>,
    meta?: EffectAction['meta']
): EffectAction<R, E, A> => ({
    type,
    effect,
    ...(meta && { meta })
})

export const debouncedAction = <R, E, A>(
    type: string,
    effect: Effect.Effect<A, E, R>,
    debounce: number
): EffectAction<R, E, A> =>
    createEffectAction(type, effect, { debounce, cancelPrevious: true })

export const throttledAction = <R, E, A>(
    type: string,
    effect: Effect.Effect<A, E, R>,
    throttle: number
): EffectAction<R, E, A> =>
    createEffectAction(type, effect, { throttle })

export const createSaga = <R>(
    id: string,
    effect: Effect.Effect<void, never, R | ReduxStoreContext>
): SagaDefinition<R> => ({
    id,
    effect
})

// ============================================================================
// Convenience Functions
// ============================================================================

export const withReduxService = <S, R, E, A>(
    effect: Effect.Effect<A, E, ReduxService<S, R>>,
    runtime: Runtime.Runtime<R>
) =>
    Effect.provide(effect, ReduxServiceLive<S, R>(runtime))