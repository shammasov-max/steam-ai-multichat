import { Effect, Runtime, Fiber, Queue, Stream, Chunk, Exit, Cause, Context, Layer } from 'effect'
import type { Middleware, MiddlewareAPI, Dispatch, UnknownAction } from '@reduxjs/toolkit'

/**
 * Effect middleware configuration
 */
export interface EffectMiddlewareConfig<R> {
    /** Runtime to execute effects */
    runtime: Runtime.Runtime<R>
    /** Optional error handler for failed effects */
    onError?: (cause: Cause.Cause<unknown>) => void
    /** Optional success handler */
    onSuccess?: (value: unknown) => void
    /** Enable debug logging */
    debug?: boolean
}

/**
 * Action type for Effect-based actions
 */
export interface EffectAction<R = any, E = any, A = any> extends UnknownAction {
    effect?: Effect.Effect<A, E, R>
    meta?: {
        effectId?: string
        cancelPrevious?: boolean
        debounce?: number
    }
}

/**
 * Effect execution context
 */
interface EffectExecution {
    fiber: Fiber.RuntimeFiber<any, any>
    effectId: string
    startTime: number
    token?: symbol
}

/**
 * Creates Redux middleware that can handle Effect-based actions
 */
export function createEffectMiddleware<R>(
    config: EffectMiddlewareConfig<R>
): Middleware {
    const executions = new Map<string, EffectExecution>()
    const { runtime, onError, onSuccess, debug } = config

    return ((api: MiddlewareAPI) => (next: Dispatch) => <T extends UnknownAction>(action: T): T => {
        const effectAction = action as EffectAction
        if (!effectAction.effect) return next(action) as T

        const { meta } = effectAction
        const effectId = meta?.effectId ?? `effect_${Date.now()}_${Math.random()}`
        const finalEffectId = meta?.debounce ? action.type : effectId

        // Cancel previous if needed
        const prev = executions.get(finalEffectId)
        if (prev && (meta?.cancelPrevious || meta?.debounce)) {
            debug && console.log(`[EffectMiddleware] Cancelling: ${finalEffectId}`)
            // Use runPromise to ensure interruption completes
            Runtime.runPromise(runtime)(Fiber.interrupt(prev.fiber)).catch(() => {})
            executions.delete(finalEffectId)
        }

        // Build effect with store context
        const effectPipeline = Effect.gen(function* () {
            debug && console.log(`[EffectMiddleware] Starting: ${finalEffectId}`)
            const result = yield* Effect.provide(
                effectAction.effect!,
                Layer.succeed(ReduxStore, { getState: api.getState, dispatch: api.dispatch })
            )
            debug && console.log(`[EffectMiddleware] Completed: ${finalEffectId}`, result)
            return result
        })

        // Add debounce if needed
        const finalEffect = meta?.debounce
            ? Effect.gen(function* () {
                yield* Effect.sleep(meta.debounce!)
                return yield* effectPipeline
              })
            : effectPipeline

        // Create execution token to track this specific execution
        const executionToken = Symbol('execution')
        
        // Execute with handlers
        const fiber = Runtime.runFork(runtime)(
            finalEffect.pipe(
                Effect.tapBoth({
                    onFailure: error => Effect.sync(() => {
                        debug && console.error(`[EffectMiddleware] Failed: ${effectId}`, error)
                        onError?.(Cause.fail(error))
                    }),
                    onSuccess: value => Effect.sync(() => {
                        // Only call onSuccess if this execution is still current
                        const current = executions.get(finalEffectId)
                        if (current?.token === executionToken && value !== undefined) {
                            onSuccess?.(value)
                        }
                    })
                }),
                Effect.ensuring(Effect.sync(() => {
                    const current = executions.get(finalEffectId)
                    if (current?.token === executionToken) {
                        executions.delete(finalEffectId)
                    }
                }))
            )
        )

        executions.set(finalEffectId, {
            fiber,
            effectId: finalEffectId,
            startTime: Date.now(),
            token: executionToken
        })

        return next(action) as T
    }) as Middleware
}

/**
 * Redux store context for effects
 */
export class ReduxStore extends Context.Tag('ReduxStore')<
    ReduxStore,
    {
        getState: () => any
        dispatch: Dispatch<UnknownAction>
    }
>() {}

// Helper functions - simplified and type-safe
export const effectAction = <R, E, A>(
    type: string,
    effect: Effect.Effect<A, E, R>,
    meta?: EffectAction['meta']
): EffectAction<R, E, A> => ({ type, effect, ...(meta && { meta }) })

export const cancellableEffectAction = <R, E, A>(
    type: string,
    effectId: string,
    effect: Effect.Effect<A, E, R>
): EffectAction<R, E, A> => effectAction(type, effect, { effectId, cancelPrevious: true })

export const debouncedEffectAction = <R, E, A>(
    type: string,
    effect: Effect.Effect<A, E, R>,
    debounce: number
): EffectAction<R, E, A> => effectAction(type, effect, { debounce, cancelPrevious: true, effectId: type })

// Stream-based action dispatcher
export const createStreamDispatcher = <R>(runtime: Runtime.Runtime<R>) => 
    <A>(stream: Stream.Stream<A, never, R>, actionCreator: (value: A) => UnknownAction, dispatch: Dispatch<UnknownAction>) => {
        const fiber = Runtime.runFork(runtime)(
            Stream.runForEach(stream, value => Effect.sync(() => dispatch(actionCreator(value))))
        )
        return () => { Runtime.runFork(runtime)(Fiber.interrupt(fiber)) }
    }
