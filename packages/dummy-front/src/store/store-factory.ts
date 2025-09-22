import { Effect, Runtime, Layer, Context, Fiber, Queue, Stream, pipe } from 'effect'
import { combineReducers, configureStore, EnhancedStore } from '@reduxjs/toolkit'
import type { UnknownAction, Middleware } from '@reduxjs/toolkit'

// Import slices from isomorphic package
import { accountSlice as accountsSlice } from '@packages/isomorphic/src/slices/accounts'
import { dialogSlice as dialogsSlice } from '@packages/isomorphic/src/slices/dialogs'
import { systemSlice } from '@packages/isomorphic/src/slices/systemSlice'

// Import Effect-Redux integration
import {
    createEffectStore,
    createEffectMiddleware,
    type EffectStore,
    type EffectStoreConfig,
} from '@packages/isomorphic/src/effect-redux/store-factory'
import { SagaEffects, createSaga, type EffectSaga } from '@packages/isomorphic/src/effect-redux/saga-bridge'
import { batchMiddleware } from '@packages/isomorphic/src/effect-redux/store-factory'

import { ConfigService, createDevToolsEnhancer, type DummyFrontConfig } from './config'

/**
 * Root state type combining all slices
 */
export interface RootState {
    accounts: ReturnType<typeof accountsSlice.reducer>
    dialogs: ReturnType<typeof dialogsSlice.reducer>
    system: ReturnType<typeof systemSlice.reducer>
}

/**
 * Root reducer combining all slices
 */
const rootReducer = combineReducers({
    accounts: accountsSlice.reducer,
    dialogs: dialogsSlice.reducer,
    system: systemSlice.reducer,
})

/**
 * Store service for dependency injection
 */
export class StoreService extends Context.Tag('StoreService')<
    StoreService,
    EffectStore<RootState, UnknownAction, ConfigService>
>() {}

/**
 * Action stream for testing saga flows
 */
export class ActionStream extends Context.Tag('ActionStream')<
    ActionStream,
    {
        readonly queue: Queue.Queue<UnknownAction>
        readonly stream: Stream.Stream<UnknownAction>
        readonly emit: (action: UnknownAction) => Effect.Effect<void>
    }
>() {}

/**
 * Create the test store with Effect-saga middleware
 */
export const createTestStore = Effect.gen(function* () {
    const config = yield* ConfigService

    // Create action queue for streaming
    const actionQueue = yield* Queue.unbounded<UnknownAction>()
    const actionStream = Stream.fromQueue(actionQueue)

    // Create custom middleware to capture actions
    const captureMiddleware: Middleware = () => (next) => (action: UnknownAction) => {
        // Offer action to queue for streaming
        Queue.unsafeOffer(actionQueue, action)

        // Log action if debug is enabled
        if (config.debug) {
            console.log('[Action]', action.type, action)
        }

        return next(action)
    }

    // Create runtime with config
    const runtime = yield* Effect.runtime<ConfigService>()

    // Configure store with Effect middleware
    const storeConfig: EffectStoreConfig<RootState, ConfigService> = {
        reducer: rootReducer,
        runtime: runtime as Runtime.Runtime<ConfigService>,
        middleware: [captureMiddleware, batchMiddleware],
        effectConfig: {
            debug: config.debug,
            onError: (cause) => {
                console.error('[Effect Error]', cause)
            },
            onSuccess: (value) => {
                if (config.debug && value !== undefined) {
                    console.log('[Effect Success]', value)
                }
            },
        },
        devTools: config.enableDevTools,
        sagas: [], // Will be added dynamically
    }

    // Add DevTools enhancer if configured
    const devToolsEnhancer = createDevToolsEnhancer(config)
    if (devToolsEnhancer) {
        storeConfig.enhancers = [devToolsEnhancer]
    }

    // Create the Effect store
    const store = createEffectStore(storeConfig)

    // Log store creation
    yield* Effect.log('Test store created successfully')

    return {
        store,
        actionQueue,
        actionStream,
    }
})

/**
 * Store layer that provides both StoreService and ActionStream
 */
export const StoreLayer = Layer.scoped(
    Layer.mergeAll(StoreService, ActionStream),
    Effect.gen(function* () {
        const { store, actionQueue, actionStream } = yield* createTestStore

        // Add finalizer to dispose store
        yield* Effect.addFinalizer(() =>
            Effect.promise(async () => {
                await store.dispose()
                console.log('Store disposed')
            })
        )

        // Provide both services
        return {
            [StoreService.key]: store,
            [ActionStream.key]: {
                queue: actionQueue,
                stream: actionStream,
                emit: (action: UnknownAction) =>
                    Effect.sync(() => {
                        store.dispatch(action)
                    }),
            },
        } as const
    })
)

/**
 * Helper to run effects with store context
 */
export const withStore = <A, E>(
    effect: Effect.Effect<A, E, StoreService | ActionStream | ConfigService>
) =>
    effect.pipe(
        Effect.provide(StoreLayer),
        Effect.provide(Layer.succeed(ConfigService, {
            enableDevTools: true,
            debug: true,
            sagaTimeout: 5000,
        }))
    )

/**
 * Helper to get typed state selector
 */
export const selectState = <T>(selector: (state: RootState) => T) =>
    Effect.gen(function* () {
        const store = yield* StoreService
        return selector(store.getState())
    })

/**
 * Helper to dispatch action
 */
export const dispatch = (action: UnknownAction) =>
    Effect.gen(function* () {
        const store = yield* StoreService
        store.dispatch(action)
    })

/**
 * Helper to wait for specific action
 */
export const waitForAction = (
    predicate: (action: UnknownAction) => boolean,
    timeout?: number
) =>
    Effect.gen(function* () {
        const config = yield* ConfigService
        const { stream } = yield* ActionStream

        const timeoutMs = timeout ?? config.sagaTimeout ?? 5000

        return yield* pipe(
            stream,
            Stream.filter(predicate),
            Stream.take(1),
            Stream.runHead,
            Effect.timeout(timeoutMs),
            Effect.flatMap(Effect.fromNullable),
            Effect.orElseFail(new Error(`Action not received within ${timeoutMs}ms`))
        )
    })

/**
 * Helper to create and run a test saga
 */
export const runTestSaga = <R>(saga: EffectSaga<R>) =>
    Effect.gen(function* () {
        const store = yield* StoreService
        store.runSaga(saga)
        yield* Effect.log(`Started saga: ${saga.id}`)
    })

/**
 * Export store types for external use
 */
export type TestStore = EffectStore<RootState, UnknownAction, ConfigService>
export type { RootState }