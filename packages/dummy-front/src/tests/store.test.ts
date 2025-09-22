import { assert, describe, it } from '@effect/vitest'
import { Effect, Stream, pipe } from 'effect'
import type { UnknownAction } from '@reduxjs/toolkit'

// Import store utilities
import {
    StoreService,
    ActionStream,
    createTestStore,
    withStore,
    selectState,
    dispatch,
    waitForAction,
    runTestSaga,
    type RootState,
} from '../store/store-factory'
import { ConfigService } from '../store/config'
import { TestConfigService, runStoreTestEffect } from '../test-setup'

// Import slice actions for testing
import { accountsSlice } from '@packages/isomorphic/src/slices/accounts'
import { dialogsSlice } from '@packages/isomorphic/src/slices/dialogs'
import { systemSlice } from '@packages/isomorphic/src/slices/system'

// Import test data
import { ScenarioBuilder, createScenario } from '../test-utils/scenario-builder'

describe('Store Factory', () => {
    describe('Store Creation', () => {
        it.effect('should create store with default configuration', () =>
            Effect.gen(function* () {
                const result = yield* createTestStore

                assert.isDefined(result.store)
                assert.isDefined(result.actionQueue)
                assert.isDefined(result.actionStream)

                // Verify store has correct initial state
                const state = result.store.getState()
                assert.isDefined(state.accounts)
                assert.isDefined(state.dialogs)
                assert.isDefined(state.system)
                assert.deepStrictEqual(state.accounts, { ids: [], entities: {} })
                assert.deepStrictEqual(state.dialogs, { ids: [], entities: {} })
            }).pipe(
                Effect.provide(ConfigService.layer({
                    enableDevTools: false,
                    debug: false,
                    sagaTimeout: 1000,
                }))
            )
        )

        it.effect('should configure store with custom options', () =>
            Effect.gen(function* () {
                const customConfig = {
                    enableDevTools: true,
                    debug: true,
                    sagaTimeout: 2000,
                }

                const result = yield* createTestStore

                // Verify store was created successfully
                assert.isDefined(result.store)

                // Test that debug mode affects logging
                const config = yield* ConfigService
                assert.strictEqual(config.debug, true)
                assert.strictEqual(config.sagaTimeout, 2000)
            }).pipe(
                Effect.provide(ConfigService.layer(customConfig))
            )
        )
    })

    describe('Action Streaming', () => {
        it.effect('should capture dispatched actions in stream', () =>
            Effect.gen(function* () {
                const store = yield* StoreService
                const { stream } = yield* ActionStream

                // Create test action
                const testAction = accountsSlice.actions.connected({
                    accountId: 'account_test123',
                    ts: Date.now(),
                })

                // Start listening for actions
                const actionPromise = pipe(
                    stream,
                    Stream.take(1),
                    Stream.runHead,
                    Effect.fork
                )

                // Dispatch action
                store.dispatch(testAction)

                // Wait for action to be captured
                const capturedAction = yield* Effect.flatten(actionPromise)
                assert.isDefined(capturedAction)
                assert.strictEqual(capturedAction.type, testAction.type)
                assert.deepStrictEqual(capturedAction.payload, testAction.payload)
            }).pipe(Effect.provide(withStore))
        )

        it.effect('should handle multiple actions in stream', () =>
            Effect.gen(function* () {
                const store = yield* StoreService
                const { stream } = yield* ActionStream

                const actions = [
                    systemSlice.actions.configUpdated({ config: { rateLimitPerMinute: 60 } }),
                    accountsSlice.actions.connected({ accountId: 'account_1', ts: Date.now() }),
                    accountsSlice.actions.connected({ accountId: 'account_2', ts: Date.now() }),
                ]

                // Start collecting actions
                const actionsPromise = pipe(
                    stream,
                    Stream.take(actions.length),
                    Stream.runCollect,
                    Effect.fork
                )

                // Dispatch all actions
                actions.forEach((action) => store.dispatch(action))

                // Collect all captured actions
                const capturedActions = yield* Effect.flatten(actionsPromise)
                assert.strictEqual(capturedActions.length, actions.length)

                capturedActions.forEach((captured, index) => {
                    assert.strictEqual(captured.type, actions[index].type)
                })
            }).pipe(Effect.provide(withStore))
        )
    })

    describe('State Management', () => {
        it.effect('should handle entity creation and updates', () =>
            Effect.gen(function* () {
                const store = yield* StoreService

                // Create account using scenario builder
                const scenario = ScenarioBuilder.simpleAccount()

                // Dispatch all setup actions
                scenario.actions.forEach((action) => store.dispatch(action))

                // Verify account was created
                const state = store.getState()
                assert.strictEqual(state.accounts.ids.length, 1)
                assert.strictEqual(state.accounts.ids[0], scenario.accountId)

                const account = state.accounts.entities[scenario.accountId]
                assert.isDefined(account)
                assert.strictEqual(account.status, 'connected')
            }).pipe(Effect.provide(withStore))
        )

        it.effect('should handle dialog creation with messages', () =>
            Effect.gen(function* () {
                const store = yield* StoreService

                // Create account with dialog
                const scenario = ScenarioBuilder.accountWithDialog()

                // Dispatch all actions
                scenario.actions.forEach((action) => store.dispatch(action))

                // Verify both account and dialog were created
                const state = store.getState()

                // Check account
                assert.strictEqual(state.accounts.ids.length, 1)
                assert.strictEqual(state.accounts.ids[0], scenario.accountId)

                // Check dialog
                assert.strictEqual(state.dialogs.ids.length, 1)
                assert.strictEqual(state.dialogs.ids[0], scenario.dialogId)

                const dialog = state.dialogs.entities[scenario.dialogId]
                assert.isDefined(dialog)
                assert.strictEqual(dialog.accountId, scenario.accountId)
                assert.isTrue(dialog.messages.length > 0)
            }).pipe(Effect.provide(withStore))
        )
    })

    describe('Store Helpers', () => {
        it.effect('should select state correctly', () =>
            Effect.gen(function* () {
                const store = yield* StoreService

                // Add some test data
                const scenario = ScenarioBuilder.simpleAccount()
                scenario.actions.forEach((action) => store.dispatch(action))

                // Test state selector
                const accountIds = yield* selectState((state) => state.accounts.ids)
                assert.strictEqual(accountIds.length, 1)
                assert.strictEqual(accountIds[0], scenario.accountId)

                // Test nested selector
                const accountCount = yield* selectState((state) => state.accounts.ids.length)
                assert.strictEqual(accountCount, 1)
            }).pipe(Effect.provide(withStore))
        )

        it.effect('should dispatch actions through helper', () =>
            Effect.gen(function* () {
                const testAction = systemSlice.actions.configUpdated({
                    config: { rateLimitPerMinute: 120 },
                })

                // Dispatch using helper
                yield* dispatch(testAction)

                // Verify action was dispatched
                const state = yield* selectState((state) => state.system)
                assert.strictEqual(state.config?.rateLimitPerMinute, 120)
            }).pipe(Effect.provide(withStore))
        )

        it.effect('should wait for specific actions', () =>
            Effect.gen(function* () {
                const { emit } = yield* ActionStream

                const testAction = accountsSlice.actions.connected({
                    accountId: 'account_wait_test',
                    ts: Date.now(),
                })

                // Start waiting for action
                const waitPromise = waitForAction(
                    (action) => action.type === testAction.type,
                    1000
                ).pipe(Effect.fork)

                // Wait a bit then emit action
                yield* Effect.sleep(100)
                yield* emit(testAction)

                // Verify we received the action
                const receivedAction = yield* Effect.flatten(waitPromise)
                assert.strictEqual(receivedAction.type, testAction.type)
            }).pipe(Effect.provide(withStore))
        )

        it.effect('should timeout when waiting for actions that never arrive', () =>
            Effect.gen(function* () {
                const waitEffect = waitForAction(
                    (action) => action.type === 'non-existent-action',
                    500
                )

                // This should timeout and throw an error
                const result = yield* Effect.flip(waitEffect)
                assert.isTrue(result instanceof Error)
                assert.isTrue(result.message.includes('Action not received within'))
            }).pipe(Effect.provide(withStore))
        )
    })

    describe('Complex Scenarios', () => {
        it.effect('should handle full system scenario', () =>
            Effect.gen(function* () {
                const store = yield* StoreService

                // Create complex scenario
                const scenario = ScenarioBuilder.fullSystem()

                // Dispatch all actions
                scenario.actions.forEach((action) => store.dispatch(action))

                // Verify final state
                const state = store.getState()

                // Should have multiple accounts
                assert.isTrue(state.accounts.ids.length >= 2)

                // Should have dialogs
                assert.isTrue(state.dialogs.ids.length >= 2)

                // Should have system config
                assert.isDefined(state.system.config)
                assert.strictEqual(state.system.config.rateLimitPerMinute, 60)

                // Verify account statuses
                const connectedAccounts = state.accounts.ids.filter(
                    (id) => state.accounts.entities[id]?.status === 'connected'
                )
                assert.isTrue(connectedAccounts.length >= 2)

                const errorAccounts = state.accounts.ids.filter(
                    (id) => state.accounts.entities[id]?.status === 'error'
                )
                assert.isTrue(errorAccounts.length >= 1)
            }).pipe(Effect.provide(withStore))
        )

        it.effect('should handle dialog assessment workflow', () =>
            Effect.gen(function* () {
                const store = yield* StoreService

                // Create dialog nearing limit
                const builder = new ScenarioBuilder()
                const accountId = builder.connectedAccount()
                const dialogId = builder.dialogNearingLimit(accountId)

                // Dispatch actions
                builder.getActions().forEach((action) => store.dispatch(action))

                // Verify dialog has assessment
                const state = store.getState()
                const dialog = state.dialogs.entities[dialogId]

                assert.isDefined(dialog)
                assert.isDefined(dialog.assessment)
                assert.strictEqual(dialog.assessment.continuationScore, 0.35)
                assert.strictEqual(dialog.assessment.trend, 'stable')
                assert.isTrue(dialog.assessment.scoringFactors.engagement > 0)
            }).pipe(Effect.provide(withStore))
        )
    })

    describe('Error Handling', () => {
        it.effect('should handle invalid actions gracefully', () =>
            Effect.gen(function* () {
                const store = yield* StoreService

                // Dispatch malformed action (should not crash)
                const invalidAction = { type: 'invalid/action', payload: null }
                store.dispatch(invalidAction)

                // Store should still be functional
                const testAction = systemSlice.actions.configUpdated({
                    config: { rateLimitPerMinute: 30 },
                })
                store.dispatch(testAction)

                const state = store.getState()
                assert.strictEqual(state.system.config?.rateLimitPerMinute, 30)
            }).pipe(Effect.provide(withStore))
        )

        it.effect('should handle concurrent action dispatches', () =>
            Effect.gen(function* () {
                const store = yield* StoreService

                // Create multiple actions to dispatch concurrently
                const actions = Array.from({ length: 10 }, (_, i) =>
                    accountsSlice.actions.connected({
                        accountId: `account_concurrent_${i}`,
                        ts: Date.now(),
                    })
                )

                // Dispatch all actions concurrently
                yield* Effect.all(
                    actions.map((action) => dispatch(action)),
                    { concurrency: 'unbounded' }
                )

                // Verify all accounts were created
                const state = store.getState()
                assert.strictEqual(state.accounts.ids.length, 10)

                // Verify all accounts have correct status
                state.accounts.ids.forEach((accountId) => {
                    const account = state.accounts.entities[accountId]
                    assert.isDefined(account)
                    assert.strictEqual(account.status, 'connected')
                })
            }).pipe(Effect.provide(withStore))
        )
    })
})

describe('Store Integration with Effect-Redux', () => {
    describe('Middleware Integration', () => {
        it.effect('should integrate with Effect middleware pipeline', () =>
            Effect.gen(function* () {
                const store = yield* StoreService
                const { stream } = yield* ActionStream

                // Test action with metadata
                const testAction = {
                    type: 'test/action',
                    payload: { value: 42 },
                    meta: { effectId: 'test-effect-123' },
                }

                // Listen for action
                const actionPromise = pipe(
                    stream,
                    Stream.take(1),
                    Stream.runHead,
                    Effect.fork
                )

                // Dispatch action
                store.dispatch(testAction)

                // Verify action passed through middleware
                const capturedAction = yield* Effect.flatten(actionPromise)
                assert.isDefined(capturedAction)
                assert.strictEqual(capturedAction.type, testAction.type)
                assert.deepStrictEqual(capturedAction.payload, testAction.payload)
                assert.deepStrictEqual(capturedAction.meta, testAction.meta)
            }).pipe(Effect.provide(withStore))
        )

        it.effect('should handle Effect-based action processing', () =>
            Effect.gen(function* () {
                const store = yield* StoreService

                // Create scenario that includes Effect processing
                const scenario = createScenario.accountWithDialog()

                // Process actions through store
                scenario.actions.forEach((action) => store.dispatch(action))

                // Verify state was updated correctly
                const finalState = store.getState()

                // Account should exist and be connected
                const account = finalState.accounts.entities[scenario.accountId]
                assert.isDefined(account)
                assert.strictEqual(account.status, 'connected')

                // Dialog should exist with messages
                const dialog = finalState.dialogs.entities[scenario.dialogId]
                assert.isDefined(dialog)
                assert.isTrue(dialog.messages.length > 0)
                assert.strictEqual(dialog.accountId, scenario.accountId)
            }).pipe(Effect.provide(withStore))
        )
    })

    describe('Resource Management', () => {
        it.effect('should properly dispose of store resources', () =>
            Effect.gen(function* () {
                // Test that store can be disposed properly
                const result = yield* createTestStore

                // Use store briefly
                result.store.dispatch({ type: 'test/action' })

                // Dispose of store
                yield* Effect.promise(() => result.store.dispose())

                // Verify disposal completed without errors
                assert.isTrue(true) // If we reach here, disposal was successful
            }).pipe(
                Effect.provide(ConfigService.layer({
                    enableDevTools: false,
                    debug: false,
                    sagaTimeout: 1000,
                }))
            )
        )

        it.effect('should handle store lifecycle in scoped context', () =>
            Effect.gen(function* () {
                // Test scoped store creation and disposal
                yield* Effect.scoped(
                    Effect.gen(function* () {
                        const store = yield* StoreService
                        const { emit } = yield* ActionStream

                        // Use store within scope
                        yield* emit({ type: 'test/scoped-action' })

                        const state = store.getState()
                        assert.isDefined(state)
                    })
                )

                // Store should be automatically disposed here
                assert.isTrue(true) // If we reach here, scoped disposal worked
            }).pipe(Effect.provide(withStore))
        )
    })
})