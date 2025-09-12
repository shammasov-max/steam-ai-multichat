import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Effect, Runtime, Layer, Exit, Scope } from 'effect'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
    createEffectStore,
    createEffectMiddleware,
    effectAction,
    cancellableEffectAction,
    debouncedEffectAction,
    SagaEffects,
    createSaga,
    EffectSaga,
    ReduxStore,
    StoreContext,
    StoreContextTag
} from '../src/effect-redux'

describe('Effect-Redux Integration', () => {
    // Test slice
    const counterSlice = createSlice({
        name: 'counter',
        initialState: { value: 0 },
        reducers: {
            increment: (state) => {
                state.value += 1
            },
            decrement: (state) => {
                state.value -= 1
            },
            incrementBy: (state, action: PayloadAction<number>) => {
                state.value += action.payload
            },
            setCounter: (state, action: PayloadAction<number>) => {
                state.value = action.payload
            }
        }
    })

    describe('Effect Middleware', () => {
        it('should handle Effect actions', async () => {
            const runtime = Runtime.defaultRuntime
            const onSuccess = vi.fn()
            const onError = vi.fn()

            const store = createEffectStore({
                reducer: counterSlice.reducer,
                runtime,
                effectConfig: {
                    onSuccess,
                    onError,
                    debug: false
                }
            })

            // Create an Effect action
            const testEffect = Effect.succeed(42)
            const action = effectAction('TEST_EFFECT', testEffect)

            // Dispatch the Effect action
            store.dispatch(action)

            // Wait for the effect to complete
            await new Promise(resolve => setTimeout(resolve, 100))

            expect(onSuccess).toHaveBeenCalledWith(42)
            expect(onError).not.toHaveBeenCalled()
        })

        it('should handle failed Effects', async () => {
            const runtime = Runtime.defaultRuntime
            const onSuccess = vi.fn()
            const onError = vi.fn()

            const store = createEffectStore({
                reducer: counterSlice.reducer,
                runtime,
                effectConfig: {
                    onSuccess,
                    onError,
                    debug: false
                }
            })

            // Create a failing Effect action
            const failingEffect = Effect.fail('Test error')
            const action = effectAction('FAILING_EFFECT', failingEffect)

            // Dispatch the Effect action
            store.dispatch(action)

            // Wait for the effect to complete
            await new Promise(resolve => setTimeout(resolve, 100))

            expect(onSuccess).not.toHaveBeenCalled()
            expect(onError).toHaveBeenCalled()
        })

        it('should cancel previous Effects with cancelPrevious', async () => {
            const runtime = Runtime.defaultRuntime
            const results: number[] = []

            const store = createEffectStore({
                reducer: counterSlice.reducer,
                runtime,
                effectConfig: {
                    onSuccess: (value) => results.push(value as number),
                    debug: false
                }
            })

            // Create cancellable effects
            const effect1 = Effect.delay(Effect.succeed(1), 200)
            const effect2 = Effect.succeed(2)

            const action1 = cancellableEffectAction('CANCELLABLE', 'test-id', effect1)
            const action2 = cancellableEffectAction('CANCELLABLE', 'test-id', effect2)

            // Dispatch both actions quickly
            store.dispatch(action1)
            await new Promise(resolve => setTimeout(resolve, 50))
            store.dispatch(action2)

            // Wait for effects to complete
            await new Promise(resolve => setTimeout(resolve, 300))

            // Only the second effect should complete
            expect(results).toEqual([2])
        })

        it('should debounce Effects', async () => {
            const runtime = Runtime.defaultRuntime
            const results: number[] = []

            const store = createEffectStore({
                reducer: counterSlice.reducer,
                runtime,
                effectConfig: {
                    onSuccess: (value) => {
                        console.log(`[TEST] onSuccess called with: ${value}`)
                        results.push(value as number)
                    },
                    debug: true
                }
            })

            // Create debounced effects
            const effect1 = Effect.succeed(1)
            const effect2 = Effect.succeed(2)
            const effect3 = Effect.succeed(3)

            const action1 = debouncedEffectAction('DEBOUNCED', effect1, 100)
            const action2 = debouncedEffectAction('DEBOUNCED', effect2, 100)
            const action3 = debouncedEffectAction('DEBOUNCED', effect3, 100)

            // Dispatch actions rapidly
            store.dispatch(action1)
            await new Promise(resolve => setTimeout(resolve, 30))
            store.dispatch(action2)
            await new Promise(resolve => setTimeout(resolve, 30))
            store.dispatch(action3)

            // Wait for debounce to complete
            await new Promise(resolve => setTimeout(resolve, 200))

            // Only the last effect should complete
            expect(results).toEqual([3])
        })
    })

    describe('Saga Bridge', () => {
        it('should run basic sagas', async () => {
            const runtime = Runtime.defaultRuntime
            const results: string[] = []

            const testSaga: EffectSaga<ReduxStore> = createSaga('testSaga', Effect.gen(function* () {
                const store = yield* ReduxStore
                results.push('saga-started')
                
                // Simulate some work
                yield* Effect.sleep(50)
                results.push('saga-completed')
            }))

            const store = createEffectStore<any, ReduxStore>({
                reducer: counterSlice.reducer,
                runtime: runtime as any,
                sagas: [testSaga]
            })

            // Wait for saga to complete
            await new Promise(resolve => setTimeout(resolve, 100))

            expect(results).toEqual(['saga-started', 'saga-completed'])
        })

        it('should handle saga effects helpers', async () => {
            const runtime = Runtime.defaultRuntime
            const dispatched: any[] = []

            const store = createEffectStore({
                reducer: counterSlice.reducer,
                runtime,
                effectConfig: {
                    debug: false
                }
            })

            // Override dispatch to track actions
            const originalDispatch = store.dispatch
            store.dispatch = (action: any) => {
                dispatched.push(action)
                return originalDispatch(action)
            }

            // Test put effect - needs ReduxStore context
            await store.runEffect(
                Effect.gen(function* () {
                    yield* SagaEffects.put(counterSlice.actions.increment())
                }).pipe(
                    Effect.provide(
                        Layer.succeed(ReduxStore, {
                            getState: store.getState,
                            dispatch: store.dispatch
                        })
                    )
                )
            )

            expect(dispatched).toContainEqual(counterSlice.actions.increment())

            // Test select effect - also needs ReduxStore context
            const state = await store.runEffect(
                SagaEffects.select((state: any) => state.value).pipe(
                    Effect.provide(
                        Layer.succeed(ReduxStore, {
                            getState: store.getState,
                            dispatch: store.dispatch
                        })
                    )
                )
            )

            expect(state).toBe(1) // Should be 1 after increment
        })

        it('should stop sagas on demand', async () => {
            const runtime = Runtime.defaultRuntime
            const results: string[] = []

            const infiniteSaga = createSaga('infiniteSaga', Effect.gen(function* () {
                while (true) {
                    results.push('tick')
                    yield* Effect.sleep(50)
                }
            }))

            const store = createEffectStore({
                reducer: counterSlice.reducer,
                runtime
            })

            // Run the saga
            store.runSaga(infiniteSaga)

            // Let it run for a bit
            await new Promise(resolve => setTimeout(resolve, 120))

            // Stop the saga
            store.stopSaga('infiniteSaga')

            const tickCount = results.length
            
            // Wait a bit more to ensure it's stopped
            await new Promise(resolve => setTimeout(resolve, 100))

            // Should not have added more ticks
            expect(results.length).toBe(tickCount)
            expect(tickCount).toBeGreaterThan(0)
            expect(tickCount).toBeLessThanOrEqual(3)
        })
    })

    describe('Store Factory', () => {
        it('should create an Effect-powered store', () => {
            const runtime = Runtime.defaultRuntime

            const store = createEffectStore({
                reducer: counterSlice.reducer,
                runtime
            })

            expect(store.getState()).toEqual({ value: 0 })
            
            store.dispatch(counterSlice.actions.increment())
            expect(store.getState()).toEqual({ value: 1 })
            
            store.dispatch(counterSlice.actions.incrementBy(5))
            expect(store.getState()).toEqual({ value: 6 })
        })

        it('should run Effects with store context', async () => {
            const runtime = Runtime.defaultRuntime

            const store = createEffectStore<{ value: number }, StoreContext<{ value: number }>>({
                reducer: counterSlice.reducer,
                runtime: runtime as any
            })

            const result = await store.runEffect(
                Effect.gen(function* () {
                    const storeContext = StoreContextTag<{ value: number }>()
                    const ctx = yield* storeContext
                    
                    // Get initial state
                    const initialState = ctx.getState()
                    
                    // Dispatch an action
                    ctx.dispatch(counterSlice.actions.incrementBy(10))
                    
                    // Get updated state
                    const updatedState = ctx.getState()
                    
                    return { initialState, updatedState }
                })
            )

            expect(result.initialState).toEqual({ value: 0 })
            expect(result.updatedState).toEqual({ value: 10 })
        })

        it('should dispose properly', async () => {
            const cleanupCalled = vi.fn()

            // Create a scoped runtime
            const runtime = Effect.runSync(Scope.make().pipe(
                Effect.map(scope => Runtime.defaultRuntime.pipe(
                    Runtime.provideService(Scope.Scope, scope)
                ))
            ))

            const cleanupSaga: EffectSaga<Scope.Scope> = createSaga('cleanup', Effect.gen(function* () {
                yield* Effect.addFinalizer(() => 
                    Effect.sync(() => cleanupCalled())
                )
                yield* Effect.never
            }))

            const store = createEffectStore<any, Scope.Scope>({
                reducer: counterSlice.reducer,
                runtime: runtime as Runtime.Runtime<Scope.Scope>,
                sagas: [cleanupSaga]
            })

            // Dispose the store
            await store.dispose()

            // Cleanup should have been called
            expect(cleanupCalled).toHaveBeenCalled()
        })
    })

    describe('Integration with Redux DevTools', () => {
        it('should work with Redux DevTools when enabled', () => {
            const runtime = Runtime.defaultRuntime

            const store = createEffectStore({
                reducer: counterSlice.reducer,
                runtime,
                devTools: true
            })

            // Store should be created successfully
            expect(store).toBeDefined()
            expect(store.getState()).toEqual({ value: 0 })
        })
    })
})
