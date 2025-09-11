import { describe, it, expect, beforeEach } from 'vitest'
import { Runtime, Effect } from 'effect'
import { combineReducers } from '@reduxjs/toolkit'

// Test imports step by step to debug the EntityWithId issue
describe('Effect-Redux Playground Integration Tests', () => {
    describe('Basic Imports', () => {
        it('should import Effect types', async () => {
            expect(Runtime.defaultRuntime).toBeDefined()
            expect(Effect.succeed).toBeDefined()
        })

        it('should import Redux types', async () => {
            expect(combineReducers).toBeDefined()
        })

        it('should import isomorphic types from main index', async () => {
            // Types are exported as type-only, so we can't test them at runtime
            // But we can test that the module imports without error
            const isomorphic = await import('@packages/isomorphic')
            expect(isomorphic.createEntitySlice).toBeDefined()
        })

        it('should import createEntitySlice from main index', async () => {
            const { createEntitySlice } = await import('@packages/isomorphic')
            expect(createEntitySlice).toBeDefined()
            expect(typeof createEntitySlice).toBe('function')
        })

        it('should import effect-redux from main index', async () => {
            const { createEffectStore, createSaga, SagaEffects } = await import('@packages/isomorphic')
            expect(createEffectStore).toBeDefined()
            expect(createSaga).toBeDefined()
            expect(SagaEffects).toBeDefined()
        })

        it('should import from main isomorphic index', async () => {
            const isomorphic = await import('@packages/isomorphic')
            expect(isomorphic.createEffectStore).toBeDefined()
            expect(isomorphic.createEntitySlice).toBeDefined()
            
            console.log('Available isomorphic exports:', Object.keys(isomorphic).slice(0, 20))
        })
    })

    describe('Entity Slice Creation', () => {
        it('should create a simple entity slice', async () => {
            const { createEntitySlice } = await import('@packages/isomorphic')
            
            // Create a minimal test slice
            const testSlice = createEntitySlice({
                name: 'test',
                initialEntities: [
                    { testId: 'test_1', name: 'Test Entity 1' },
                    { testId: 'test_2', name: 'Test Entity 2' }
                ] as any[],
                entityReducers: {
                    updateName: (entity: any, payload: any) => {
                        entity.name = payload.name
                    }
                }
            })

            expect(testSlice.name).toBe('tests')
            expect(testSlice.actions.updateName).toBeDefined()
            expect(testSlice.reducer).toBeDefined()
            
            // Test initial state
            const initialState = testSlice.reducer(undefined, { type: '@@INIT' })
            expect(initialState.ids).toEqual(['test_1', 'test_2'])
            expect(initialState.entities['test_1']).toEqual({ testId: 'test_1', name: 'Test Entity 1' })
        })

        it('should create account-like slice', async () => {
            const { createEntitySlice } = await import('@packages/isomorphic')
            
            const accountSlice = createEntitySlice({
                name: 'account',
                initialEntities: [
                    {
                        accountId: 'account_123',
                        steamId64: '76561198123456789',
                        status: 'connected',
                        label: 'TestBot'
                    }
                ] as any[],
                entityReducers: {
                    connected: (account: any, payload: any) => {
                        account.status = 'connected'
                        if (payload.ts) account.lastSeen = payload.ts
                    },
                    disconnected: (account: any, payload: any) => {
                        account.status = 'disconnected'
                        if (payload.ts) account.lastSeen = payload.ts
                    }
                }
            })

            expect(accountSlice.name).toBe('accounts')
            expect(accountSlice.actions.connected).toBeDefined()
            expect(accountSlice.actions.disconnected).toBeDefined()
            
            // Test state updates
            const initialState = accountSlice.reducer(undefined, { type: '@@INIT' })
            expect(initialState.entities['account_123']).toEqual({
                accountId: 'account_123',
                steamId64: '76561198123456789',
                status: 'connected',
                label: 'TestBot'
            })
            
            // Test action dispatch
            const updatedState = accountSlice.reducer(
                initialState,
                accountSlice.actions.disconnected({ accountId: 'account_123', ts: Date.now() })
            )
            expect(updatedState.entities['account_123'].status).toBe('disconnected')
        })
    })

    describe('Effect Store Integration', () => {
        it('should create effect store with entity slices', async () => {
            const { createEffectStore } = await import('@packages/isomorphic')
            const { createEntitySlice } = await import('@packages/isomorphic')
            
            // Create test slices
            const accountSlice = createEntitySlice({
                name: 'account',
                initialEntities: [
                    { accountId: 'acc_1', name: 'Account 1', status: 'active' }
                ] as any[],
                entityReducers: {
                    activate: (account: any, _payload: any) => {
                        account.status = 'active'
                    }
                }
            })

            const testSlice = createEntitySlice({
                name: 'test',
                initialEntities: [] as any[],
                entityReducers: {
                    update: (entity: any, payload: any) => {
                        entity.value = payload.value
                    }
                }
            })

            // Create root reducer
            const rootReducer = combineReducers({
                accounts: accountSlice.reducer,
                tests: testSlice.reducer
            })

            // Create effect store
            const store = createEffectStore({
                reducer: rootReducer,
                runtime: Runtime.defaultRuntime,
                debug: true,
                devTools: false // Disable for testing
            })

            expect(store).toBeDefined()
            expect(store.getState).toBeDefined()
            expect(store.dispatch).toBeDefined()
            expect(store.runSaga).toBeDefined()
            
            // Test initial state
            const initialState = store.getState()
            expect(initialState.accounts.ids).toEqual(['acc_1'])
            expect(initialState.accounts.entities['acc_1']).toEqual({
                accountId: 'acc_1',
                name: 'Account 1',
                status: 'active'
            })
            expect(initialState.tests.ids).toEqual([])
            
            // Test action dispatch
            store.dispatch(accountSlice.actions.activate({ accountId: 'acc_1' }))
            const updatedState = store.getState()
            expect(updatedState.accounts.entities['acc_1'].status).toBe('active')
        })
    })

    describe('Saga Integration', () => {
        it('should run simple sagas', async () => {
            const { createEffectStore, createSaga, SagaEffects } = await import('@packages/isomorphic')
            const { createEntitySlice } = await import('@packages/isomorphic')
            
            const results: string[] = []
            
            // Create test slice
            const testSlice = createEntitySlice({
                name: 'test',
                initialEntities: [
                    { testId: 'test_1', value: 0 }
                ] as any[],
                entityReducers: {
                    increment: (entity: any, _payload: any) => {
                        entity.value += 1
                        results.push(`incremented-${entity.testId}-${entity.value}`)
                    }
                }
            })

            // Create saga
            const testSaga = createSaga('testSaga', Effect.gen(function* () {
                results.push('saga-started')
                
                // Wait a bit
                yield* Effect.sleep(10)
                
                // Dispatch action
                yield* SagaEffects.put(testSlice.actions.increment({ testId: 'test_1' }))
                
                results.push('saga-completed')
            }))

            // Create store with saga
            const rootReducer = combineReducers({
                tests: testSlice.reducer
            })

            const store = createEffectStore({
                reducer: rootReducer,
                runtime: Runtime.defaultRuntime,
                sagas: [testSaga],
                debug: false,
                devTools: false
            })

            // Wait for saga to complete
            await new Promise(resolve => setTimeout(resolve, 100))

            // Check results
            expect(results).toContain('saga-started')
            expect(results).toContain('saga-completed')
            expect(results).toContain('incremented-test_1-1')
            
            // Check state
            const finalState = store.getState()
            expect(finalState.tests.entities['test_1'].value).toBe(1)
        })

        it('should handle multiple sagas with timing', async () => {
            const { createEffectStore, createSaga, SagaEffects } = await import('@packages/isomorphic')
            const { createEntitySlice } = await import('@packages/isomorphic')
            
            const events: string[] = []
            
            // Create counter slice
            const counterSlice = createEntitySlice({
                name: 'counter',
                initialEntities: [
                    { counterId: 'main', value: 0 }
                ] as any[],
                entityReducers: {
                    increment: (counter: any, _payload: any) => {
                        counter.value += 1
                        events.push(`counter-${counter.value}`)
                    }
                }
            })

            // Fast saga
            const fastSaga = createSaga('fastSaga', Effect.gen(function* () {
                events.push('fast-start')
                yield* Effect.sleep(20)
                yield* SagaEffects.put(counterSlice.actions.increment({ counterId: 'main' }))
                events.push('fast-done')
            }))

            // Slow saga
            const slowSaga = createSaga('slowSaga', Effect.gen(function* () {
                events.push('slow-start')
                yield* Effect.sleep(50)
                yield* SagaEffects.put(counterSlice.actions.increment({ counterId: 'main' }))
                events.push('slow-done')
            }))

            const rootReducer = combineReducers({
                counters: counterSlice.reducer
            })

            const store = createEffectStore({
                reducer: rootReducer,
                runtime: Runtime.defaultRuntime,
                sagas: [fastSaga, slowSaga],
                debug: false,
                devTools: false
            })

            // Wait for both sagas to complete
            await new Promise(resolve => setTimeout(resolve, 100))

            // Check execution order
            expect(events).toContain('fast-start')
            expect(events).toContain('slow-start')
            expect(events).toContain('fast-done')
            expect(events).toContain('slow-done')
            expect(events).toContain('counter-1')
            expect(events).toContain('counter-2')
            
            // Fast saga should complete before slow saga
            const fastDoneIndex = events.indexOf('fast-done')
            const slowDoneIndex = events.indexOf('slow-done')
            expect(fastDoneIndex).toBeLessThan(slowDoneIndex)
            
            // Final counter value should be 2
            const finalState = store.getState()
            expect(finalState.counters.entities['main'].value).toBe(2)
        })
    })

    describe('Full Playground Simulation', () => {
        it('should simulate the complete playground workflow', async () => {
            const { createEffectStore, createSaga, SagaEffects } = await import('@packages/isomorphic')
            const { createEntitySlice } = await import('@packages/isomorphic')
            
            const timeline: string[] = []
            
            // Create account slice
            const accountSlice = createEntitySlice({
                name: 'account',
                initialEntities: [
                    {
                        accountId: 'acc_1',
                        steamId64: '76561198123456789',
                        status: 'connecting',
                        label: 'TestBot_1'
                    },
                    {
                        accountId: 'acc_2', 
                        steamId64: '76561198987654321',
                        status: 'disconnected',
                        label: 'TestBot_2'
                    }
                ] as any[],
                entityReducers: {
                    connected: (account: any, payload: any) => {
                        account.status = 'connected'
                        if (payload.ts) account.lastSeen = payload.ts
                        timeline.push(`${account.label}-connected`)
                    },
                    disconnected: (account: any, payload: any) => {
                        account.status = 'disconnected'
                        if (payload.ts) account.lastSeen = payload.ts
                        timeline.push(`${account.label}-disconnected`)
                    }
                }
            })

            // Create dialog slice  
            const dialogSlice = createEntitySlice({
                name: 'dialog',
                initialEntities: [
                    {
                        dialogId: 'dlg_1',
                        accountId: 'acc_1',
                        status: 'active',
                        messages: []
                    }
                ] as any[],
                entityReducers: {
                    messageAdded: (dialog: any, payload: any) => {
                        dialog.messages = [...dialog.messages, payload.message]
                        timeline.push(`${dialog.dialogId}-message-${dialog.messages.length}`)
                    }
                }
            })

            // Account connection saga
            const accountSaga = createSaga('accountSaga', Effect.gen(function* () {
                timeline.push('account-saga-start')
                
                // Connect first account
                yield* Effect.sleep(10)
                yield* SagaEffects.put(accountSlice.actions.connected({
                    accountId: 'acc_1',
                    ts: Date.now()
                }))
                
                // Connect second account
                yield* Effect.sleep(20)
                yield* SagaEffects.put(accountSlice.actions.connected({
                    accountId: 'acc_2', 
                    ts: Date.now()
                }))
                
                timeline.push('account-saga-done')
            }))

            // Dialog saga
            const dialogSaga = createSaga('dialogSaga', Effect.gen(function* () {
                timeline.push('dialog-saga-start')
                
                // Add some messages
                yield* Effect.sleep(15)
                yield* SagaEffects.put(dialogSlice.actions.messageAdded({
                    dialogId: 'dlg_1',
                    message: { id: 'msg_1', text: 'Hello!', from: 'account' }
                }))
                
                yield* Effect.sleep(25)
                yield* SagaEffects.put(dialogSlice.actions.messageAdded({
                    dialogId: 'dlg_1',
                    message: { id: 'msg_2', text: 'Hi there!', from: 'player' }
                }))
                
                timeline.push('dialog-saga-done')
            }))

            // Create store
            const rootReducer = combineReducers({
                accounts: accountSlice.reducer,
                dialogs: dialogSlice.reducer
            })

            const store = createEffectStore({
                reducer: rootReducer,
                runtime: Runtime.defaultRuntime,
                sagas: [accountSaga, dialogSaga],
                debug: false,
                devTools: false
            })

            // Verify initial state
            const initialState = store.getState()
            expect(initialState.accounts.ids).toEqual(['acc_1', 'acc_2'])
            expect(initialState.accounts.entities['acc_1'].status).toBe('connecting')
            expect(initialState.accounts.entities['acc_2'].status).toBe('disconnected')
            expect(initialState.dialogs.ids).toEqual(['dlg_1'])
            expect(initialState.dialogs.entities['dlg_1'].messages).toEqual([])

            // Wait for sagas to complete
            await new Promise(resolve => setTimeout(resolve, 100))

            // Verify final state
            const finalState = store.getState()
            expect(finalState.accounts.entities['acc_1'].status).toBe('connected')
            expect(finalState.accounts.entities['acc_2'].status).toBe('connected')
            expect(finalState.dialogs.entities['dlg_1'].messages).toHaveLength(2)
            
            // Verify timeline
            expect(timeline).toContain('account-saga-start')
            expect(timeline).toContain('dialog-saga-start')
            expect(timeline).toContain('TestBot_1-connected')
            expect(timeline).toContain('TestBot_2-connected')
            expect(timeline).toContain('dlg_1-message-1')
            expect(timeline).toContain('dlg_1-message-2')
            expect(timeline).toContain('account-saga-done')
            expect(timeline).toContain('dialog-saga-done')
            
            console.log('Timeline:', timeline)
        })
    })
})