import { Effect, Runtime, Layer, Context, Scope, Exit } from 'effect'
import { configureStore, EnhancedStore, StoreEnhancer, Middleware } from '@reduxjs/toolkit'
import type { UnknownAction, Reducer, AnyAction } from '@reduxjs/toolkit'
import { createEffectMiddleware, EffectMiddlewareConfig } from './middleware'
import { SagaManager, EffectSaga } from './saga-bridge'

/**
 * Effect-powered Redux store configuration
 */
export interface EffectStoreConfig<S = any, R = any> {
    /** Root reducer */
    reducer: Reducer<S>
    /** Initial state */
    preloadedState?: S
    /** Effect runtime */
    runtime: Runtime.Runtime<R>
    /** Additional middleware */
    middleware?: Middleware[]
    /** Store enhancers */
    enhancers?: StoreEnhancer[]
    /** Effect middleware configuration */
    effectConfig?: Partial<EffectMiddlewareConfig<R>>
    /** Initial sagas to run */
    sagas?: EffectSaga<R>[]
    /** Enable Redux DevTools */
    devTools?: boolean
    /** Debug mode */
    debug?: boolean
}

/**
 * Effect-enhanced Redux store
 */
export interface EffectStore<S = any, A extends UnknownAction = UnknownAction, R = any>
    extends EnhancedStore<S, A> {
    /** Saga manager for this store */
    sagaManager: SagaManager<R>
    /** Runtime used by the store */
    runtime: Runtime.Runtime<R>
    /** Run an Effect with store context */
    runEffect: <E, A>(effect: Effect.Effect<A, E, R>) => Promise<A>
    /** Run a saga */
    runSaga: (saga: EffectSaga<R>) => void
    /** Stop a saga */
    stopSaga: (sagaId: string) => void
    /** Cleanup and dispose the store */
    dispose: () => Promise<void>
}

/**
 * Store context for dependency injection
 */
export interface StoreContext<S = unknown> {
    readonly getState: () => S
    readonly dispatch: (action: UnknownAction) => void
    readonly subscribe: (listener: () => void) => () => void
}

export const StoreContextTag = <S = unknown>() =>
    Context.GenericTag<StoreContext<S>>('StoreContext')

/**
 * Create an Effect-powered Redux store
 */
export const createEffectStore = function createEffectStore<S = any, R = any>(
    config: EffectStoreConfig<S, R>
): EffectStore<S, UnknownAction, R> {
    const {
        reducer,
        preloadedState,
        runtime,
        middleware = [],
        enhancers = [],
        effectConfig = {},
        sagas = [],
        devTools = true,
        debug = false,
    } = config

    // Create Effect middleware
    const effectMiddleware = createEffectMiddleware<R>({
        runtime,
        debug,
        ...effectConfig,
    })

    // Configure the Redux store
    const store = configureStore({
        reducer,
        ...(preloadedState !== undefined && { preloadedState }),
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({ serializableCheck: false, immutableCheck: true })
                .concat(effectMiddleware)
                .concat(...middleware),
        enhancers: getDefaultEnhancers =>
            enhancers.length > 0
                ? getDefaultEnhancers().concat(...enhancers)
                : getDefaultEnhancers(),
        devTools,
    })

    // Create saga manager
    const sagaManager = new SagaManager<R>(runtime, store)

    // Create the enhanced store
    const effectStore: EffectStore<S, UnknownAction, R> = {
        ...store,
        sagaManager,
        runtime,

        runEffect: async <E, A>(effect: Effect.Effect<A, E, R>) => {
            const storeContext = StoreContextTag<S>()
            const effectWithStore = Effect.provide(
                effect,
                Layer.succeed(storeContext, {
                    getState: store.getState,
                    dispatch: store.dispatch,
                    subscribe: store.subscribe,
                })
            )

            return Runtime.runPromise(runtime)(effectWithStore)
        },

        runSaga: (saga: EffectSaga<R>) => {
            sagaManager.run(saga)
        },

        stopSaga: (sagaId: string) => {
            sagaManager.stop(sagaId)
        },

        dispose: async () => {
            await sagaManager.stopAll()
            // Additional cleanup if needed
        },
    }

    // Run initial sagas
    sagas.forEach(saga => sagaManager.run(saga))

    // Set up action forwarding to saga manager
    store.subscribe(() => {
        // This would need proper integration with action stream
        // For now, it's a placeholder
    })

    return effectStore
}

/**
 * Create a Layer that provides a Redux store
 */
export const createStoreLayer = function createStoreLayer<S, R>(
    config: EffectStoreConfig<S, R>
): Layer.Layer<StoreContext<S>, never, R> {
    const storeContext = StoreContextTag<S>()
    return Layer.scoped(
        storeContext,
        Effect.gen(function* () {
            const store = createEffectStore(config)

            // Add finalizer to dispose store on scope close
            yield* Effect.addFinalizer(() => Effect.promise(() => store.dispose()))

            return {
                getState: store.getState,
                dispatch: store.dispatch,
                subscribe: store.subscribe,
            }
        })
    )
}

/**
 * Helper to create a store with dependencies
 */
export const createStoreWithDeps = function createStoreWithDeps<S, R, E, ROut extends R>(
    config: Omit<EffectStoreConfig<S, ROut>, 'runtime'>,
    dependencies: Layer.Layer<ROut, E, R>
): Effect.Effect<EffectStore<S, UnknownAction, ROut>, E, R> {
    return Effect.gen(function* () {
        const runtime = yield* Effect.runtime<ROut>()
        return createEffectStore({
            ...config,
            runtime: runtime as Runtime.Runtime<ROut>,
        })
    }).pipe(Effect.provide(dependencies))
}

/**
 * Batch actions helper
 */
export const batchActions = function batchActions(actions: UnknownAction[]): UnknownAction {
    return {
        type: '@@BATCH',
        payload: actions,
    }
}

// Batch middleware to handle batched actions
export const batchMiddleware: Middleware = store => next => (action: any) => {
    if (action?.type === '@@BATCH' && Array.isArray(action?.payload)) {
        return action.payload.map((a: UnknownAction) => store.dispatch(a))
    }
    return next(action)
}

// Create a test store for unit testing
export const createTestStore = <S, R>(
    config: Partial<EffectStoreConfig<S, R>> & { reducer: Reducer<S> }
): EffectStore<S, UnknownAction, R> =>
    createEffectStore({
        ...config,
        runtime: config.runtime || (Runtime.defaultRuntime as Runtime.Runtime<R>),
        debug: true,
        devTools: false,
    })

// Store hooks for Effect usage
export const StoreHooks = {
    useStore: <S>() => StoreContextTag<S>(),

    useSelect: <S, T>(selector: (state: S) => T) =>
        StoreContextTag<S>().pipe(Effect.map(store => selector(store.getState()))),

    useDispatch: <S>() => StoreContextTag<S>().pipe(Effect.map(store => store.dispatch)),
}
