import { assert, describe, it } from '@effect/vitest'
import { Effect, Stream, pipe, Duration } from 'effect'
import type { UnknownAction } from '@reduxjs/toolkit'

// Import store and saga utilities
import {
    StoreService,
    ActionStream,
    withStore,
    selectState,
    dispatch,
    waitForAction,
    runTestSaga,
    type RootState,
} from '../store/store-factory'

// Import scenario builder and test utilities
import { ScenarioBuilder, createScenario } from '../test-utils/scenario-builder'
import { TestConfigService, runStoreTestEffect } from '../test-setup'

// Import slice actions
import { accountsSlice } from '@packages/isomorphic/src/slices/accounts'
import { dialogsSlice } from '@packages/isomorphic/src/slices/dialogs'
import { systemSlice } from '@packages/isomorphic/src/slices/system'

// Import Effect-Redux saga utilities
import { SagaEffects, createSaga } from '@packages/isomorphic/src/effect-redux/saga-bridge'

describe('Integration Tests', () => {
    describe('Store and Scenario Integration', () => {
        it.effect('should execute complete account lifecycle', () =>
            Effect.gen(function* () {
                const store = yield* StoreService
                const { stream, emit } = yield* ActionStream

                // Start with empty state
                let state = store.getState()
                assert.strictEqual(state.accounts.ids.length, 0)

                // Execute account creation scenario
                const scenario = createScenario.simpleAccount()
                scenario.actions.forEach((action) => store.dispatch(action))

                // Verify account was created and connected
                state = store.getState()
                assert.strictEqual(state.accounts.ids.length, 1)

                const account = state.accounts.entities[scenario.accountId]
                assert.isDefined(account)
                assert.strictEqual(account.status, 'connected')
                assert.isDefined(account.connectedAt)
                assert.isNull(account.lastError)

                // Simulate disconnection
                yield* emit(accountsSlice.actions.disconnected({
                    accountId: scenario.accountId,
                    reason: 'Test disconnect',
                }))

                // Verify disconnection
                state = store.getState()
                const disconnectedAccount = state.accounts.entities[scenario.accountId]
                assert.strictEqual(disconnectedAccount.status, 'disconnected')
                assert.strictEqual(disconnectedAccount.lastDisconnectReason, 'Test disconnect')
            }).pipe(Effect.provide(withStore))
        )

        it.effect('should handle dialog creation and assessment workflow', () =>
            Effect.gen(function* () {
                const store = yield* StoreService

                // Create account with dialog scenario
                const scenario = createScenario.accountWithDialog()
                scenario.actions.forEach((action) => store.dispatch(action))

                // Verify initial state
                let state = store.getState()
                const dialog = state.dialogs.entities[scenario.dialogId]
                assert.isDefined(dialog)
                assert.strictEqual(dialog.accountId, scenario.accountId)
                assert.isTrue(dialog.messages.length === 5) // Default message count

                // Add new message to dialog
                const newMessage = {
                    role: 'user' as const,
                    content: 'This is a new test message',
                    timestamp: Date.now(),
                }

                store.dispatch(dialogsSlice.actions.messageReceived({
                    dialogId: scenario.dialogId,
                    message: newMessage,
                }))

                // Verify message was added
                state = store.getState()
                const updatedDialog = state.dialogs.entities[scenario.dialogId]
                assert.strictEqual(updatedDialog.messages.length, 6)
                assert.strictEqual(updatedDialog.messages[5].content, newMessage.content)

                // Add AI assessment
                const assessment = {
                    continuationScore: 0.75,
                    trend: 'stable' as const,
                    lastAssessedAt: Date.now(),
                    assessmentCount: 1,
                    scoringFactors: {
                        engagement: 0.8,
                        relevance: 0.7,
                        tone: 0.75,
                        quality: 0.8,
                        goalProximity: 0.7,
                    },
                    issues: [],
                }

                store.dispatch(dialogsSlice.actions.assessed({
                    dialogId: scenario.dialogId,
                    assessment,
                }))

                // Verify assessment was applied
                state = store.getState()
                const assessedDialog = state.dialogs.entities[scenario.dialogId]
                assert.isDefined(assessedDialog.assessment)
                assert.strictEqual(assessedDialog.assessment.continuationScore, 0.75)
                assert.strictEqual(assessedDialog.assessment.trend, 'stable')
            }).pipe(Effect.provide(withStore))
        )

        it.effect('should handle complex multi-account scenario', () =>
            Effect.gen(function* () {
                const store = yield* StoreService

                // Execute full system scenario
                const scenario = createScenario.fullSystem()
                scenario.actions.forEach((action) => store.dispatch(action))

                // Verify comprehensive state
                const state = store.getState()

                // System should be configured
                assert.isDefined(state.system.config)
                assert.strictEqual(state.system.config.rateLimitPerMinute, 60)

                // Multiple accounts should exist
                assert.isTrue(state.accounts.ids.length >= 3)

                // Should have connected and error accounts
                const accounts = state.accounts.ids.map((id) => state.accounts.entities[id])
                const connectedAccounts = accounts.filter((acc) => acc.status === 'connected')
                const errorAccounts = accounts.filter((acc) => acc.status === 'error')

                assert.isTrue(connectedAccounts.length >= 2)
                assert.isTrue(errorAccounts.length >= 1)

                // Should have dialogs for connected accounts
                assert.isTrue(state.dialogs.ids.length >= 2)

                // Should have at least one dialog with assessment
                const dialogs = state.dialogs.ids.map((id) => state.dialogs.entities[id])
                const assessedDialogs = dialogs.filter((dialog) => dialog.assessment)
                assert.isTrue(assessedDialogs.length >= 1)

                // Should have at least one operator alert
                const alertedDialogs = dialogs.filter((dialog) => dialog.metadata.operatorAlerted)
                assert.isTrue(alertedDialogs.length >= 1)
            }).pipe(Effect.provide(withStore))
        )
    })

    describe('Action Streaming and Event Handling', () => {
        it.effect('should stream actions in real-time', () =>
            Effect.gen(function* () {
                const { stream, emit } = yield* ActionStream

                // Set up action collection
                const actionPromise = pipe(
                    stream,
                    Stream.take(3),
                    Stream.runCollect,
                    Effect.fork
                )

                // Emit actions with delays
                yield* emit({ type: 'test/action1', payload: { value: 1 } })
                yield* Effect.sleep(10)
                yield* emit({ type: 'test/action2', payload: { value: 2 } })
                yield* Effect.sleep(10)
                yield* emit({ type: 'test/action3', payload: { value: 3 } })

                // Collect actions
                const collectedActions = yield* Effect.flatten(actionPromise)
                assert.strictEqual(collectedActions.length, 3)

                collectedActions.forEach((action, index) => {
                    assert.strictEqual(action.type, `test/action${index + 1}`)
                    assert.strictEqual(action.payload.value, index + 1)
                })
            }).pipe(Effect.provide(withStore))
        )

        it.effect('should wait for specific action patterns', () =>
            Effect.gen(function* () {
                const { emit } = yield* ActionStream

                // Start waiting for specific action
                const waitPromise = waitForAction(
                    (action) => action.type === 'accounts/connected' &&
                                action.payload.accountId === 'target_account',
                    2000
                ).pipe(Effect.fork)

                // Emit some other actions first
                yield* emit({ type: 'test/noise1' })
                yield* emit(accountsSlice.actions.connected({
                    accountId: 'wrong_account',
                    ts: Date.now(),
                }))
                yield* emit({ type: 'test/noise2' })

                // Emit the target action
                yield* emit(accountsSlice.actions.connected({
                    accountId: 'target_account',
                    ts: Date.now(),
                }))

                // Verify we caught the right action
                const receivedAction = yield* Effect.flatten(waitPromise)
                assert.strictEqual(receivedAction.type, 'accounts/connected')
                assert.strictEqual(receivedAction.payload.accountId, 'target_account')
            }).pipe(Effect.provide(withStore))
        )

        it.effect('should handle high-frequency action streams', () =>
            Effect.gen(function* () {
                const { stream, emit } = yield* ActionStream

                // Set up collection for many actions
                const actionCount = 50
                const actionPromise = pipe(
                    stream,
                    Stream.take(actionCount),
                    Stream.runCollect,
                    Effect.fork
                )

                // Emit many actions rapidly
                yield* Effect.all(
                    Array.from({ length: actionCount }, (_, i) =>
                        emit({ type: 'test/rapid', payload: { index: i } })
                    ),
                    { concurrency: 'unbounded' }
                )

                // Collect all actions
                const collectedActions = yield* Effect.flatten(actionPromise)
                assert.strictEqual(collectedActions.length, actionCount)

                // Verify all actions were captured
                const indices = collectedActions.map((action) => action.payload.index)
                const uniqueIndices = new Set(indices)
                assert.strictEqual(uniqueIndices.size, actionCount)
            }).pipe(Effect.provide(withStore))
        )
    })

    describe('Error Handling and Recovery', () => {
        it.effect('should handle invalid scenarios gracefully', () =>
            Effect.gen(function* () {
                const store = yield* StoreService

                // Try to create dialog for non-existent account
                const invalidDialogAction = dialogsSlice.actions.created({
                    dialogId: 'dialog_invalid_test',
                    accountId: 'account_nonexistent',
                    partnerId: 'partner_test',
                    startedAt: Date.now(),
                })

                // This should not crash the store
                store.dispatch(invalidDialogAction)

                // Verify dialog was created anyway (reducer doesn't validate relationships)
                const state = store.getState()
                const dialog = state.dialogs.entities['dialog_invalid_test']
                assert.isDefined(dialog)
                assert.strictEqual(dialog.accountId, 'account_nonexistent')

                // Store should still be functional
                const validScenario = createScenario.simpleAccount()
                validScenario.actions.forEach((action) => store.dispatch(action))

                // Verify valid scenario worked
                const account = state.accounts.entities[validScenario.accountId]
                assert.isDefined(account)
            }).pipe(Effect.provide(withStore))
        )

        it.effect('should recover from action stream errors', () =>
            Effect.gen(function* () {
                const { stream, emit } = yield* ActionStream

                // Start collecting actions
                const actionPromise = pipe(
                    stream,
                    Stream.take(3),
                    Stream.runCollect,
                    Effect.fork
                )

                // Emit valid actions around potentially problematic ones
                yield* emit({ type: 'test/valid1' })
                yield* emit({ type: undefined as any }) // Invalid action
                yield* emit({ type: 'test/valid2' })

                // Should still collect valid actions
                const collectedActions = yield* Effect.flatten(actionPromise)
                assert.isTrue(collectedActions.length >= 2)

                const validActions = collectedActions.filter((action) =>
                    action.type && typeof action.type === 'string'
                )
                assert.isTrue(validActions.length >= 2)
            }).pipe(Effect.provide(withStore))
        )
    })

    describe('State Consistency and Validation', () => {
        it.effect('should maintain state consistency across operations', () =>
            Effect.gen(function* () {
                const store = yield* StoreService

                // Create complex scenario and verify intermediate states
                const builder = new ScenarioBuilder()

                // Step 1: Configure system
                builder.configureSystem({ rateLimitPerMinute: 100 })
                builder.getActions().forEach((action) => store.dispatch(action))

                let state = store.getState()
                assert.strictEqual(state.system.config?.rateLimitPerMinute, 100)

                // Step 2: Add accounts
                const account1 = builder.connectedAccount()
                const account2 = builder.connectedAccount()
                builder.getActions().slice(-6).forEach((action) => store.dispatch(action))

                state = store.getState()
                assert.strictEqual(state.accounts.ids.length, 2)
                assert.isTrue(state.accounts.ids.includes(account1))
                assert.isTrue(state.accounts.ids.includes(account2))

                // Step 3: Add dialogs
                const dialog1 = builder.createDialog({ accountId: account1 })
                const dialog2 = builder.createDialog({ accountId: account2, messageCount: 8 })

                // Get only the new actions for dialogs
                const allActions = builder.getActions()
                const dialogActions = allActions.slice(-16) // Approximate number of new actions
                dialogActions.forEach((action) => store.dispatch(action))

                state = store.getState()
                assert.strictEqual(state.dialogs.ids.length, 2)

                // Verify relationships
                const dialog1Entity = state.dialogs.entities[dialog1]
                const dialog2Entity = state.dialogs.entities[dialog2]

                assert.strictEqual(dialog1Entity.accountId, account1)
                assert.strictEqual(dialog2Entity.accountId, account2)
                assert.strictEqual(dialog1Entity.messages.length, 5) // Default
                assert.strictEqual(dialog2Entity.messages.length, 8) // Custom

                // Verify accounts still exist and are connected
                assert.strictEqual(state.accounts.entities[account1].status, 'connected')
                assert.strictEqual(state.accounts.entities[account2].status, 'connected')
            }).pipe(Effect.provide(withStore))
        )

        it.effect('should handle message trimming in dialogs', () =>
            Effect.gen(function* () {
                const store = yield* StoreService

                // Create dialog with many messages
                const scenario = createScenario.accountWithDialog()
                scenario.actions.forEach((action) => store.dispatch(action))

                // Add many more messages to exceed typical limits
                const additionalMessages = Array.from({ length: 50 }, (_, i) => ({
                    role: (i % 2 === 0 ? 'user' : 'assistant') as const,
                    content: `Additional message ${i + 1}`,
                    timestamp: Date.now() + i,
                }))

                additionalMessages.forEach((message) => {
                    const action = message.role === 'user'
                        ? dialogsSlice.actions.messageReceived({
                            dialogId: scenario.dialogId,
                            message,
                        })
                        : dialogsSlice.actions.messageSent({
                            dialogId: scenario.dialogId,
                            message,
                        })
                    store.dispatch(action)
                })

                // Verify messages are properly managed
                const state = store.getState()
                const dialog = state.dialogs.entities[scenario.dialogId]

                // Should have trimmed to reasonable number (based on slice logic)
                assert.isTrue(dialog.messages.length <= 50) // Assumed trim limit

                // Latest messages should be preserved
                const lastMessage = dialog.messages[dialog.messages.length - 1]
                assert.isTrue(lastMessage.content.includes('Additional message'))
            }).pipe(Effect.provide(withStore))
        )
    })

    describe('Performance and Concurrency', () => {
        it.effect('should handle concurrent store operations', () =>
            Effect.gen(function* () {
                const store = yield* StoreService

                // Create multiple scenarios concurrently
                const scenarios = yield* Effect.all(
                    Array.from({ length: 5 }, () =>
                        Effect.sync(() => createScenario.simpleAccount())
                    ),
                    { concurrency: 'unbounded' }
                )

                // Dispatch all actions concurrently
                yield* Effect.all(
                    scenarios.flatMap((scenario) =>
                        scenario.actions.map((action) =>
                            Effect.sync(() => store.dispatch(action))
                        )
                    ),
                    { concurrency: 'unbounded' }
                )

                // Verify all accounts were created
                const state = store.getState()
                assert.strictEqual(state.accounts.ids.length, scenarios.length)

                // Verify each scenario's account exists
                scenarios.forEach((scenario) => {
                    const account = state.accounts.entities[scenario.accountId]
                    assert.isDefined(account)
                    assert.strictEqual(account.status, 'connected')
                })
            }).pipe(Effect.provide(withStore))
        )

        it.effect('should maintain performance under high action volume', () =>
            Effect.gen(function* () {
                const { emit } = yield* ActionStream

                // Measure time for high-volume operations
                const startTime = Date.now()
                const actionCount = 1000

                // Emit many actions rapidly
                yield* Effect.all(
                    Array.from({ length: actionCount }, (_, i) =>
                        emit({ type: 'test/performance', payload: { index: i } })
                    ),
                    { concurrency: 'unbounded' }
                )

                const endTime = Date.now()
                const duration = endTime - startTime

                // Should complete within reasonable time (adjust threshold as needed)
                assert.isTrue(duration < 5000) // 5 seconds max for 1000 actions

                // Verify store is still responsive
                const testAction = systemSlice.actions.configUpdated({
                    config: { rateLimitPerMinute: 999 }
                })
                yield* dispatch(testAction)

                const finalState = yield* selectState((state) => state.system.config?.rateLimitPerMinute)
                assert.strictEqual(finalState, 999)
            }).pipe(Effect.provide(withStore))
        )
    })

    describe('Real-world Workflow Simulation', () => {
        it.effect('should simulate complete chat automation workflow', () =>
            Effect.gen(function* () {
                const store = yield* StoreService
                const { emit } = yield* ActionStream

                // Phase 1: System initialization
                const systemConfig = {
                    rateLimitPerMinute: 60,
                    maxDialogsPerAccount: 5,
                    openAIApiKey: 'test-key'
                }
                yield* emit(systemSlice.actions.configUpdated({ config: systemConfig }))

                // Phase 2: Account onboarding
                const builder = new ScenarioBuilder()
                const accounts = [
                    builder.connectedAccount(),
                    builder.connectedAccount(),
                    builder.accountWithFailedAuth('Invalid credentials')
                ]

                // Apply account actions
                builder.getActions().forEach((action) => store.dispatch(action))

                // Phase 3: Dialog initiation and interaction
                const connectedAccounts = accounts.slice(0, 2)
                const dialogs = connectedAccounts.map((accountId) =>
                    builder.createDialog({ accountId, messageCount: 10 })
                )

                // Apply dialog actions
                builder.getActions().slice(-32).forEach((action) => store.dispatch(action))

                // Phase 4: AI assessment and alerts
                const assessmentResults = [
                    { dialogId: dialogs[0], score: 0.85, trend: 'stable' as const },
                    { dialogId: dialogs[1], score: 0.25, trend: 'declining' as const }
                ]

                for (const result of assessmentResults) {
                    yield* emit(dialogsSlice.actions.assessed({
                        dialogId: result.dialogId,
                        assessment: {
                            continuationScore: result.score,
                            trend: result.trend,
                            lastAssessedAt: Date.now(),
                            assessmentCount: 1,
                            scoringFactors: {
                                engagement: 0.8,
                                relevance: 0.7,
                                tone: 0.75,
                                quality: 0.8,
                                goalProximity: 0.7,
                            },
                            issues: result.score < 0.3 ? [
                                { type: 'low_engagement', severity: 'high', description: 'User not responding' }
                            ] : [],
                        }
                    }))

                    // Trigger alert for low scores
                    if (result.score < 0.3) {
                        yield* emit(dialogsSlice.actions.operatorAlerted({
                            dialogId: result.dialogId,
                            alert: {
                                reason: 'Low continuation score',
                                urgency: 'high',
                                timestamp: Date.now(),
                            }
                        }))
                    }
                }

                // Phase 5: Verification of final state
                const finalState = store.getState()

                // System should be properly configured
                assert.deepStrictEqual(finalState.system.config, systemConfig)

                // Should have all accounts
                assert.strictEqual(finalState.accounts.ids.length, 3)

                // Connected accounts
                const connectedAccountEntities = connectedAccounts.map(id =>
                    finalState.accounts.entities[id]
                )
                connectedAccountEntities.forEach(account => {
                    assert.strictEqual(account.status, 'connected')
                })

                // Failed account
                const failedAccount = finalState.accounts.entities[accounts[2]]
                assert.strictEqual(failedAccount.status, 'error')

                // Should have dialogs for connected accounts
                assert.strictEqual(finalState.dialogs.ids.length, 2)

                // Should have assessments
                const assessedDialogs = dialogs.map(id => finalState.dialogs.entities[id])
                assessedDialogs.forEach(dialog => {
                    assert.isDefined(dialog.assessment)
                })

                // Should have operator alert for low-scoring dialog
                const lowScoringDialog = finalState.dialogs.entities[dialogs[1]]
                assert.isTrue(lowScoringDialog.metadata.operatorAlerted)
                assert.strictEqual(lowScoringDialog.assessment?.continuationScore, 0.25)

                // High-scoring dialog should not be alerted
                const highScoringDialog = finalState.dialogs.entities[dialogs[0]]
                assert.isFalse(highScoringDialog.metadata.operatorAlerted)
                assert.strictEqual(highScoringDialog.assessment?.continuationScore, 0.85)
            }).pipe(Effect.provide(withStore))
        )
    })
})