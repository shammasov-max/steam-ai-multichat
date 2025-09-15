import { Effect, Ref, Fiber, Duration, Runtime, Schedule } from 'effect'
import { UnknownAction, Middleware, MiddlewareAPI } from '@reduxjs/toolkit'
import { Queue } from 'effect'

// ============================================================================
// Types
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

export interface EffectMiddlewareConfig<R> {
    runtime: Runtime.Runtime<R>
    onError?: (error: unknown) => void
}

// ============================================================================
// Effect Middleware
// ============================================================================

export const createEffectMiddleware = <R>(
    config: EffectMiddlewareConfig<R>
): Middleware => {
    const effectExecutions = new Map<string, Fiber.RuntimeFiber<any, any>>()
    
    return (api: MiddlewareAPI) => (next: any) => (action: any) => {
        const effectAction = action as EffectAction
        
        if (effectAction.effect) {
            const { meta } = effectAction
            const effectId = meta?.effectId ?? `effect_${Date.now()}`
            
            Effect.gen(function* () {
                // Cancel previous if needed
                if (meta?.cancelPrevious) {
                    const prev = effectExecutions.get(effectId)
                    if (prev) {
                        yield* Fiber.interrupt(prev)
                        effectExecutions.delete(effectId)
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
                const fiber = yield* Effect.fork(finalEffect)
                
                // Track execution
                effectExecutions.set(effectId, fiber)
                
                // Clean up on completion
                yield* Fiber.join(fiber).pipe(
                    Effect.ensuring(
                        Effect.sync(() => effectExecutions.delete(effectId))
                    ),
                    Effect.fork
                )
            }).pipe(
                Effect.catchAll((error) => {
                    if (config.onError) {
                        config.onError(error)
                    }
                    return Effect.void
                }),
                Runtime.runFork(config.runtime)
            )
        }
        
        return next(action)
    }
}

// ============================================================================
// Action Creators
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

export const cancelableAction = <R, E, A>(
    type: string,
    effect: Effect.Effect<A, E, R>,
    effectId: string
): EffectAction<R, E, A> =>
    createEffectAction(type, effect, { effectId, cancelPrevious: true })

// ============================================================================
// Effect Patterns
// ============================================================================

/**
 * Creates an async thunk-like effect action
 */
export const createAsyncAction = <Args, Result, Error = unknown>(
    type: string,
    handler: (args: Args) => Promise<Result>
) => {
    const pending = `${type}/pending`
    const fulfilled = `${type}/fulfilled`
    const rejected = `${type}/rejected`
    
    return {
        pending: () => ({ type: pending }),
        fulfilled: (result: Result) => ({ type: fulfilled, payload: result }),
        rejected: (error: Error) => ({ type: rejected, payload: error }),
        
        execute: (args: Args): EffectAction =>
            createEffectAction(
                type,
                Effect.gen(function* () {
                    yield* Effect.sync(() => ({ type: pending }))
                    
                    const result = yield* Effect.tryPromise({
                        try: () => handler(args),
                        catch: (error) => error as Error
                    })
                    
                    return result
                }).pipe(
                    Effect.tapBoth({
                        onFailure: (error) => Effect.sync(() => ({ type: rejected, payload: error })),
                        onSuccess: (result) => Effect.sync(() => ({ type: fulfilled, payload: result }))
                    })
                )
            )
    }
}

/**
 * Creates a polling effect action
 */
export const createPollingAction = (
    type: string,
    pollEffect: Effect.Effect<any>,
    interval: Duration.DurationInput
) =>
    createEffectAction(
        type,
        Effect.repeat(pollEffect, Schedule.spaced(interval))
    )