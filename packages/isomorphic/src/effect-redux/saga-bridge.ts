import { Effect, Stream, Queue, Fiber, Runtime, Scope, Exit, Cause, Layer } from 'effect'
import type { UnknownAction, PayloadAction } from '@reduxjs/toolkit'
import { ReduxStore } from './middleware'

/**
 * Saga-like pattern for Effect-based Redux side effects
 */
export interface EffectSaga<R = never> {
    /** Unique identifier for the saga */
    id: string
    /** Effect that implements the saga logic */
    effect: Effect.Effect<void, never, R | ReduxStore>
    /** Optional cleanup effect */
    cleanup?: Effect.Effect<void, never, never>
}

/**
 * Action matcher for saga triggers
 */
export type ActionMatcher<A extends UnknownAction = UnknownAction> = 
    | string 
    | string[] 
    | ((action: UnknownAction) => action is A)
    | ((action: UnknownAction) => boolean)

/**
 * Saga manager for running Effect-based sagas
 */
export class SagaManager<R> {
    private sagas = new Map<string, Fiber.RuntimeFiber<void, never>>()
    private actionQueue: Queue.Queue<UnknownAction>
    private scope: Scope.CloseableScope
    
    constructor(
        private runtime: Runtime.Runtime<R>,
        private store: { getState: () => any; dispatch: <T>(action: T) => T }
    ) {
        this.actionQueue = Effect.runSync(Queue.unbounded<UnknownAction>())
        this.scope = Effect.runSync(Scope.make())
    }

    /**
     * Register and run a saga
     */
    run(saga: EffectSaga<R>) {
        if (this.sagas.has(saga.id)) {
            console.warn(`[SagaManager] Saga ${saga.id} is already running`)
            return
        }

        const store = this.store
        const sagaEffect = Effect.gen(function* () {
            // Provide Redux store context
            const effectWithStore = Effect.provide(
                saga.effect,
                Layer.succeed(ReduxStore, {
                    getState: store.getState,
                    dispatch: store.dispatch
                })
            )

            // Run the saga
            yield* effectWithStore
        })

        // Run the saga within the scope to ensure finalizers are tracked
        const fiber = Runtime.runFork(this.runtime)(
            Effect.provideService(sagaEffect, Scope.Scope, this.scope)
        )

        this.sagas.set(saga.id, fiber)
    }

    /**
     * Stop a running saga
     */
    stop(sagaId: string) {
        const fiber = this.sagas.get(sagaId)
        if (fiber) {
            Runtime.runPromise(this.runtime)(Fiber.interrupt(fiber))
            this.sagas.delete(sagaId)
        }
    }

    /**
     * Stop all running sagas
     */
    stopAll() {
        const fibers = Array.from(this.sagas.values())
        const scope = this.scope
        this.sagas.clear()
        
        // Close scope and interrupt all fibers
        return Runtime.runPromise(this.runtime)(
            Effect.gen(function* () {
                // First interrupt all fibers
                yield* Effect.all(fibers.map(f => Fiber.interrupt(f)), { concurrency: 'unbounded' })
                // Then close the scope to trigger finalizers
                yield* Scope.close(scope, Exit.void)
            })
        )
    }

    /**
     * Dispatch an action to the saga system
     */
    dispatch(action: UnknownAction) {
        Effect.runSync(Queue.offer(this.actionQueue, action))
    }

    /**
     * Get the action stream for sagas to consume
     */
    get actionStream() {
        return Stream.fromQueue(this.actionQueue)
    }
}

/**
 * Effect-based saga helpers
 */
export const SagaEffects = {
    /**
     * Take the next action matching the pattern
     */
    take: <A extends UnknownAction = UnknownAction>(
        matcher: ActionMatcher<A>
    ): Effect.Effect<A, never, ReduxStore> =>
        Effect.gen(function* () {
            const store = yield* ReduxStore
            
            return yield* Effect.async<A>((resume) => {
                const checkAction = (action: UnknownAction): boolean => {
                    if (typeof matcher === 'string') {
                        return action.type === matcher
                    } else if (Array.isArray(matcher)) {
                        return matcher.includes(action.type)
                    } else if (typeof matcher === 'function') {
                        return matcher(action)
                    }
                    return false
                }

                // This would need integration with the middleware
                // For now, returning a placeholder
                const unsubscribe = () => {}
                
                return Effect.sync(() => {
                    unsubscribe()
                })
            })
        }),

    // Take every action matching the pattern
    takeEvery: <A extends UnknownAction = UnknownAction, R = never, E = never>(
        matcher: ActionMatcher<A>,
        handler: (action: A) => Effect.Effect<unknown, E, R>
    ): Effect.Effect<never, never, ReduxStore | R> =>
        Effect.forever(Effect.gen(function* () {
            const action = yield* SagaEffects.take(matcher)
            yield* Effect.fork(handler(action))
        })),

    // Take latest action (cancels previous)
    takeLatest: <A extends UnknownAction = UnknownAction, R = never, E = never>(
        matcher: ActionMatcher<A>,
        handler: (action: A) => Effect.Effect<unknown, E, R>
    ): Effect.Effect<never, never, ReduxStore | R> =>
        Effect.gen(function* () {
            let lastFiber: Fiber.RuntimeFiber<unknown, E> | null = null
            return yield* Effect.forever(Effect.gen(function* () {
                const action = yield* SagaEffects.take(matcher)
                if (lastFiber) yield* Fiber.interrupt(lastFiber)
                lastFiber = yield* Effect.fork(handler(action))
            }))
        }),

    // Take leading action (ignores subsequent until complete)
    takeLeading: <A extends UnknownAction = UnknownAction, R = never>(
        matcher: ActionMatcher<A>,
        handler: (action: A) => Effect.Effect<unknown, never, R>
    ): Effect.Effect<never, never, ReduxStore | R> =>
        Effect.forever(Effect.gen(function* () {
            const action = yield* SagaEffects.take(matcher)
            yield* Effect.asVoid(handler(action))
        })),

    // Debounce actions
    debounce: <A extends UnknownAction = UnknownAction, R = never>(
        matcher: ActionMatcher<A>,
        delay: number,
        handler: (action: A) => Effect.Effect<unknown, never, R>
    ): Effect.Effect<never, never, ReduxStore | R> =>
        Effect.forever(Effect.gen(function* () {
            let action = yield* SagaEffects.take(matcher)
            const result = yield* Effect.race(
                Effect.delay(Effect.succeed(action), delay),
                SagaEffects.take(matcher)
            )
            if (result === action) yield* handler(action)
        })),

    // Throttle actions
    throttle: <A extends UnknownAction = UnknownAction, R = never, E = never>(
        matcher: ActionMatcher<A>,
        delay: number,
        handler: (action: A) => Effect.Effect<unknown, E, R>
    ): Effect.Effect<never, never, ReduxStore | R> =>
        Effect.forever(Effect.gen(function* () {
            const action = yield* SagaEffects.take(matcher)
            yield* Effect.fork(handler(action))
            yield* Effect.sleep(delay)
        })),

    /**
     * Put (dispatch) an action
     */
    put: (action: UnknownAction): Effect.Effect<void, never, ReduxStore> =>
        Effect.gen(function* () {
            const store = yield* ReduxStore
            store.dispatch(action)
        }),

    // Select from state
    select: <T>(selector: (state: unknown) => T): Effect.Effect<T, never, ReduxStore> =>
        ReduxStore.pipe(Effect.map(store => selector(store.getState()))),

    // Effect shortcuts
    call: <R, E, A>(effect: Effect.Effect<A, E, R>) => effect,
    fork: Effect.fork,
    join: Fiber.join,
    cancel: (fiber: Fiber.RuntimeFiber<unknown, unknown>) => Effect.asVoid(Fiber.interrupt(fiber)),
    delay: Effect.sleep,

    /**
     * Race multiple effects
     */
    race: <const T extends readonly [Effect.Effect<any, any, any>, Effect.Effect<any, any, any>]>(
        effects: T
    ): Effect.Effect<
        Effect.Effect.Success<T[number]>,
        Effect.Effect.Error<T[number]>,
        Effect.Effect.Context<T[number]>
    > => Effect.race(effects[0], effects[1]),

    /**
     * Run effects in parallel
     */
    all: <const T extends readonly Effect.Effect<any, any, any>[]>(
        effects: T
    ) => Effect.all(effects) as any
}

/**
 * Create a saga from an Effect
 */
export function createSaga<R>(
    id: string,
    effect: Effect.Effect<void, never, R | ReduxStore>
): EffectSaga<R> {
    return { id, effect }
}

/**
 * Root saga combiner
 */
export function rootSaga<R>(
    sagas: EffectSaga<R>[]
): Effect.Effect<void, never, R | ReduxStore> {
    return Effect.gen(function* () {
        yield* Effect.all(sagas.map(s => Effect.fork(s.effect)))
        yield* Effect.never
    })
}
