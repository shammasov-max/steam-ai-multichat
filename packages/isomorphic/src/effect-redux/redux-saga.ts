import { Effect, Ref, Fiber, Stream, Queue } from 'effect'
import { UnknownAction } from '@reduxjs/toolkit'
import { createServiceError } from '../effect-patterns'
import type { ReduxCore } from './redux-core'

// ============================================================================
// Error Types
// ============================================================================

export const SagaError = createServiceError('Saga')

// ============================================================================
// Types
// ============================================================================

export interface SagaDefinition<R = never> {
    id: string
    effect: Effect.Effect<void, never, R>
    cleanup?: Effect.Effect<void>
}

export interface ActionMatcher<A extends UnknownAction = UnknownAction> {
    (action: UnknownAction): action is A
}

export interface SagaManager {
    readonly runSaga: <R>(saga: SagaDefinition<R>) => Effect.Effect<Fiber.RuntimeFiber<void, never>, any, any>
    readonly stopSaga: (sagaId: string) => Effect.Effect<void, any, any>
    readonly stopAllSagas: () => Effect.Effect<void, any, any>
}

// ============================================================================
// Saga Effects
// ============================================================================

export interface SagaEffects<S = any> {
    readonly take: <A extends UnknownAction>(
        matcher: ActionMatcher<A>
    ) => Effect.Effect<A>
    
    readonly takeEvery: <A extends UnknownAction, E, R>(
        matcher: ActionMatcher<A>,
        handler: (action: A) => Effect.Effect<unknown, E, R>
    ) => Effect.Effect<never>
    
    readonly takeLatest: <A extends UnknownAction, E, R>(
        matcher: ActionMatcher<A>,
        handler: (action: A) => Effect.Effect<unknown, E, R>
    ) => Effect.Effect<never>
    
    readonly put: (action: UnknownAction) => Effect.Effect<void>
    
    readonly select: <T>(selector: (state: S) => T) => Effect.Effect<T>
    
    readonly call: <E, A, R>(
        effect: Effect.Effect<A, E, R>
    ) => Effect.Effect<A, E, R>
    
    readonly fork: <E, A, R>(
        effect: Effect.Effect<A, E, R>
    ) => Effect.Effect<Fiber.RuntimeFiber<A, E>, never, R>
    
    readonly race: <E1, A1, R1, E2, A2, R2>(
        effect1: Effect.Effect<A1, E1, R1>,
        effect2: Effect.Effect<A2, E2, R2>
    ) => Effect.Effect<A1 | A2, E1 | E2, R1 | R2>
    
    readonly delay: (ms: number) => Effect.Effect<void>
}

// ============================================================================
// Implementation
// ============================================================================

export const createSagaManager = <S>(core: ReduxCore<S>) =>
    Effect.gen(function* () {
        const sagaFibers = yield* Ref.make<Map<string, Fiber.RuntimeFiber<void, never>>>(new Map())
        
        // Create saga effects
        const sagaEffects: SagaEffects<S> = {
            take: (matcher) =>
                Effect.gen(function* () {
                    const stream = yield* Stream.fromQueue(core.actionQueue).pipe(
                        Stream.filter(matcher),
                        Stream.take(1),
                        Stream.runCollect
                    )
                    return Array.from(stream)[0]
                }),
            
            takeEvery: (matcher, handler) =>
                Effect.forever(
                    Effect.gen(function* () {
                        const action = yield* sagaEffects.take(matcher)
                        yield* Effect.fork(handler(action))
                    })
                ) as Effect.Effect<never>,
            
            takeLatest: (matcher, handler) =>
                Effect.gen(function* () {
                    let lastFiber: Fiber.RuntimeFiber<unknown, any> | null = null
                    return yield* Effect.forever(
                        Effect.gen(function* () {
                            const action = yield* sagaEffects.take(matcher)
                            if (lastFiber) {
                                yield* Fiber.interrupt(lastFiber)
                            }
                            lastFiber = yield* Effect.fork(handler(action))
                        })
                    )
                }) as Effect.Effect<never>,
            
            put: core.dispatch,
            
            select: (selector) =>
                Effect.map(core.getState(), selector),
            
            call: (effect) => effect,
            
            fork: (effect) => Effect.fork(effect),
            
            race: Effect.race,
            
            delay: (ms) => Effect.sleep(ms)
        }
        
        // Create saga manager
        const manager: SagaManager = {
            runSaga: (saga) =>
                Effect.gen(function* () {
                    const fibers = yield* Ref.get(sagaFibers)
                    if (fibers.has(saga.id)) {
                        return yield* Effect.fail(
                            SagaError.create('runSaga', `Saga already running: ${saga.id}`)
                        )
                    }
                    
                    const fiber = yield* Effect.fork(
                        saga.effect.pipe(
                            Effect.catchAll(() => Effect.void)
                        )
                    ) as Effect.Effect<Fiber.RuntimeFiber<void, never>>
                    
                    yield* Ref.update(sagaFibers, map => {
                        const newMap = new Map(map)
                        newMap.set(saga.id, fiber as Fiber.RuntimeFiber<void, never>)
                        return newMap
                    })
                    
                    yield* Effect.log(`Saga started: ${saga.id}`)
                    
                    return fiber
                }),
            
            stopSaga: (sagaId) =>
                Effect.gen(function* () {
                    const fibers = yield* Ref.get(sagaFibers)
                    const fiber = fibers.get(sagaId)
                    
                    if (!fiber) {
                        return yield* Effect.fail(
                            SagaError.create('stopSaga', `Saga not found: ${sagaId}`)
                        )
                    }
                    
                    yield* Fiber.interrupt(fiber)
                    yield* Ref.update(sagaFibers, map => {
                        const newMap = new Map(map)
                        newMap.delete(sagaId)
                        return newMap
                    })
                    
                    yield* Effect.log(`Saga stopped: ${sagaId}`)
                }),
            
            stopAllSagas: () =>
                Effect.gen(function* () {
                    const fibers = yield* Ref.get(sagaFibers)
                    yield* Effect.all(
                        Array.from(fibers.values()).map(fiber => Fiber.interrupt(fiber)),
                        { concurrency: 'unbounded' }
                    ) as Effect.Effect<any[]>
                    yield* Ref.set(sagaFibers, new Map())
                    yield* Effect.log('All sagas stopped')
                })
        }
        
        return {
            ...manager,
            effects: sagaEffects
        }
    })

// ============================================================================
// Helper Functions
// ============================================================================

export const createSaga = <R>(
    id: string,
    effect: Effect.Effect<void, never, R>
): SagaDefinition<R> => ({
    id,
    effect
})

export const createActionMatcher = <T extends string>(type: T) =>
    (action: UnknownAction): action is UnknownAction & { type: T } =>
        action.type === type

export const createPayloadMatcher = <T extends string, P>(
    type: T,
    predicate?: (payload: unknown) => payload is P
) =>
    (action: UnknownAction): action is UnknownAction & { type: T; payload: P } =>
        action.type === type && (!predicate || ('payload' in action && predicate(action.payload)))