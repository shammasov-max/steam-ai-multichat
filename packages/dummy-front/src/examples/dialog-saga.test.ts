import { assert, describe, it } from '@effect/vitest'
import { Effect, Duration, pipe, Stream } from 'effect'
import { createSaga } from '@packages/isomorphic/src/effect-redux/saga-bridge'

// Import slices and actions
import { dialogSlice } from '@packages/isomorphic/src/slices/dialogs'
import { accountSlice } from '@packages/isomorphic/src/slices/accounts'
import { systemSlice } from '@packages/isomorphic/src/slices/systemSlice'

// Import test utilities
import { withStore } from '../store/store-factory'
import {
    runSagaTest,
    createSagaTestRunner,
    matchers,
    effects,
    assertSaga
} from '../saga-tests/test-runner'

// Import scenario builders
import { createDialogScenario, createAccountScenario } from '../scenarios/account-scenarios'

describe('Dialog Saga Tests', () => {
    it.effect('should handle dialog creation and message flow', () =>
        withStore(
            runSagaTest('Dialog Creation and Message Flow', (ctx) =>
                Effect.gen(function* () {
                    yield* Effect.log('=== Starting Dialog Creation Test ===')

                    // Setup test account
                    const testAccount = createAccountScenario({
                        accountId: 'account_dialog123',
                        steamId64: '76561198000000001',
                        proxyUrl: 'http://proxy1.example.com:8080',
                        status: 'connected'
                    })

                    // Setup test dialog data
                    const dialogId = 'dialog_test123'
                    const playerSteamId64 = '76561198999999999'

                    // Create dialog management saga
                    const dialogManagementSaga = createSaga('dialog-manager',
                        Effect.gen(function* () {
                            yield* Effect.log('Dialog management saga started')

                            yield* pipe(
                                ctx.actions$,
                                Stream.filter(matchers.ofType('dialogs/initiate')),
                                Stream.runForEach((action: any) =>
                                    Effect.gen(function* () {
                                        const { accountId, playerSteamId64, contextMessage } = action.payload

                                        // Create dialog
                                        yield* Effect.sleep(Duration.millis(50))
                                        yield* ctx.dispatch(dialogSlice.actions.created({
                                            dialogId,
                                            accountId,
                                            playerSteamId64,
                                            contextMessage
                                        }))

                                        // Simulate initial message exchange
                                        yield* Effect.sleep(Duration.millis(100))
                                        yield* ctx.dispatch(dialogSlice.actions.messageReceived({
                                            dialogId,
                                            message: {
                                                id: 'msg_1',
                                                from: 'player',
                                                text: 'Hello there!',
                                                ts: Date.now(),
                                                sequenceNumber: 1
                                            }
                                        }))

                                        // Auto-respond
                                        yield* Effect.sleep(Duration.millis(200))
                                        yield* ctx.dispatch(dialogSlice.actions.messageSent({
                                            dialogId,
                                            message: {
                                                id: 'msg_2',
                                                from: 'account',
                                                text: 'Hi! How can I help you today?',
                                                ts: Date.now(),
                                                sequenceNumber: 2
                                            }
                                        }))
                                    })
                                )
                            )
                        })
                    )

                    // Start dialog management saga
                    yield* ctx.runSaga(dialogManagementSaga)

                    // Initiate dialog
                    yield* ctx.dispatch({
                        type: 'dialogs/initiate',
                        payload: {
                            accountId: testAccount.accountId,
                            playerSteamId64,
                            contextMessage: 'Friend request accepted'
                        }
                    })

                    // Wait for dialog creation
                    const createdAction = yield* ctx.waitFor(
                        matchers.ofType('dialogs/created')
                    )

                    assert.strictEqual(createdAction.payload.dialogId, dialogId)
                    assert.strictEqual(createdAction.payload.accountId, testAccount.accountId)
                    assert.strictEqual(createdAction.payload.playerSteamId64, playerSteamId64)

                    // Wait for message received
                    const receivedAction = yield* ctx.waitFor(
                        matchers.ofType('dialogs/messageReceived')
                    )

                    assert.strictEqual(receivedAction.payload.dialogId, dialogId)
                    assert.strictEqual(receivedAction.payload.message.from, 'player')
                    assert.strictEqual(receivedAction.payload.message.text, 'Hello there!')

                    // Wait for message sent
                    const sentAction = yield* ctx.waitFor(
                        matchers.ofType('dialogs/messageSent')
                    )

                    assert.strictEqual(sentAction.payload.dialogId, dialogId)
                    assert.strictEqual(sentAction.payload.message.from, 'account')
                    assert.strictEqual(sentAction.payload.message.text, 'Hi! How can I help you today?')

                    // Verify dialog state
                    yield* assertSaga.stateMatches(ctx,
                        (state) => state.dialogs.entities[dialogId]?.status,
                        'created'
                    )

                    yield* assertSaga.stateMatches(ctx,
                        (state) => state.dialogs.entities[dialogId]?.messages.length,
                        2
                    )

                    yield* Effect.log('=== Dialog Creation Test Complete ===')
                })
            )
        )
    )

    it.effect('should handle AI assessment chain with scoring', () =>
        withStore(
            runSagaTest('AI Assessment Chain', (ctx) =>
                Effect.gen(function* () {
                    yield* Effect.log('=== Starting AI Assessment Test ===')

                    const dialogId = 'dialog_assessment123'
                    const accountId = 'account_assessment123'

                    // Create AI assessment saga
                    const aiAssessmentSaga = createSaga('ai-assessor',
                        Effect.gen(function* () {
                            yield* Effect.log('AI assessment saga started')

                            yield* pipe(
                                ctx.actions$,
                                Stream.filter(matchers.ofTypes('dialogs/messageReceived', 'dialogs/messageSent')),
                                Stream.runForEach((action: any) =>
                                    Effect.gen(function* () {
                                        const { dialogId } = action.payload

                                        // Simulate AI processing delay
                                        yield* Effect.sleep(Duration.millis(300))

                                        // Generate assessment
                                        const assessment = {
                                            continuationScore: Math.random() * 0.3 + 0.7, // 0.7-1.0
                                            trend: 'rising' as const,
                                            scoringFactors: {
                                                engagement: Math.random() * 0.3 + 0.7,
                                                relevance: Math.random() * 0.3 + 0.7,
                                                tone: Math.random() * 0.3 + 0.7,
                                                quality: Math.random() * 0.3 + 0.7,
                                                goalProximity: Math.random() * 0.3 + 0.7
                                            },
                                            issues: [],
                                            confidence: Math.random() * 0.2 + 0.8,
                                            assessedAt: Date.now(),
                                            messageCount: action.payload.message.sequenceNumber || 1
                                        }

                                        yield* ctx.dispatch(dialogSlice.actions.assessed({
                                            dialogId,
                                            assessment
                                        }))

                                        // Check if assessment triggers alerts
                                        if (assessment.continuationScore < 0.3) {
                                            yield* ctx.dispatch(dialogSlice.actions.operatorAlerted({
                                                dialogId,
                                                alert: {
                                                    urgency: 'high',
                                                    reason: 'Low continuation score detected',
                                                    triggerScore: assessment.continuationScore,
                                                    alertedAt: Date.now()
                                                }
                                            }))
                                        }
                                    })
                                )
                            )
                        })
                    )

                    // Start AI assessment saga
                    yield* ctx.runSaga(aiAssessmentSaga)

                    // Create dialog first
                    yield* ctx.dispatch(dialogSlice.actions.created({
                        dialogId,
                        accountId,
                        playerSteamId64: '76561198888888888',
                        contextMessage: 'Testing AI assessment'
                    }))

                    // Send a message to trigger assessment
                    yield* ctx.dispatch(dialogSlice.actions.messageReceived({
                        dialogId,
                        message: {
                            id: 'msg_assess_1',
                            from: 'player',
                            text: 'This is a test message for AI assessment',
                            ts: Date.now(),
                            sequenceNumber: 1
                        }
                    }))

                    // Wait for assessment
                    const assessmentAction = yield* ctx.waitFor(
                        matchers.ofType('dialogs/assessed'),
                        5000
                    )

                    assert.strictEqual(assessmentAction.payload.dialogId, dialogId)
                    assert.isTrue(typeof assessmentAction.payload.assessment.continuationScore === 'number')
                    assert.isTrue(assessmentAction.payload.assessment.continuationScore >= 0 &&
                                 assessmentAction.payload.assessment.continuationScore <= 1)
                    assert.strictEqual(assessmentAction.payload.assessment.trend, 'rising')

                    // Verify state contains assessment
                    yield* assertSaga.stateMatches(ctx,
                        (state) => state.dialogs.entities[dialogId]?.assessment !== null,
                        true
                    )

                    yield* Effect.log('=== AI Assessment Test Complete ===')
                })
            )
        )
    )

    it.effect('should trigger operator alerts based on dialog conditions', () =>
        withStore(
            runSagaTest('Operator Alert Triggering', (ctx) =>
                Effect.gen(function* () {
                    yield* Effect.log('=== Starting Operator Alert Test ===')

                    const dialogId = 'dialog_alert123'
                    const accountId = 'account_alert123'

                    // Create operator alert saga
                    const alertSaga = createSaga('alert-manager',
                        Effect.gen(function* () {
                            yield* Effect.log('Alert manager saga started')

                            yield* pipe(
                                ctx.actions$,
                                Stream.filter(matchers.ofType('dialogs/checkAlertConditions')),
                                Stream.runForEach((action: any) =>
                                    Effect.gen(function* () {
                                        const { dialogId, condition } = action.payload

                                        yield* Effect.sleep(Duration.millis(100))

                                        // Simulate different alert conditions
                                        if (condition === 'low_engagement') {
                                            yield* ctx.dispatch(dialogSlice.actions.operatorAlerted({
                                                dialogId,
                                                alert: {
                                                    urgency: 'medium',
                                                    reason: 'Player engagement dropping below threshold',
                                                    triggerScore: 0.25,
                                                    alertedAt: Date.now()
                                                }
                                            }))
                                        } else if (condition === 'explicit_rejection') {
                                            yield* ctx.dispatch(dialogSlice.actions.operatorAlerted({
                                                dialogId,
                                                alert: {
                                                    urgency: 'high',
                                                    reason: 'Player explicitly rejected offer',
                                                    triggerScore: 0.1,
                                                    alertedAt: Date.now()
                                                }
                                            }))
                                        } else if (condition === 'topic_drift') {
                                            yield* ctx.dispatch(dialogSlice.actions.operatorAlerted({
                                                dialogId,
                                                alert: {
                                                    urgency: 'low',
                                                    reason: 'Conversation drifting from target topic',
                                                    triggerScore: 0.45,
                                                    alertedAt: Date.now()
                                                }
                                            }))
                                        }
                                    })
                                )
                            )
                        })
                    )

                    // Start alert saga
                    yield* ctx.runSaga(alertSaga)

                    // Create dialog
                    yield* ctx.dispatch(dialogSlice.actions.created({
                        dialogId,
                        accountId,
                        playerSteamId64: '76561198777777777',
                        contextMessage: 'Testing operator alerts'
                    }))

                    // Test different alert conditions
                    const alertConditions = [
                        { condition: 'low_engagement', expectedUrgency: 'medium' },
                        { condition: 'explicit_rejection', expectedUrgency: 'high' },
                        { condition: 'topic_drift', expectedUrgency: 'low' }
                    ]

                    for (const { condition, expectedUrgency } of alertConditions) {
                        yield* ctx.dispatch({
                            type: 'dialogs/checkAlertConditions',
                            payload: { dialogId, condition }
                        })

                        const alertAction = yield* ctx.waitFor(
                            matchers.ofTypeWithPayload('dialogs/operatorAlerted',
                                (payload: any) => payload.dialogId === dialogId
                            ),
                            2000
                        )

                        assert.strictEqual(alertAction.payload.dialogId, dialogId)
                        assert.strictEqual(alertAction.payload.alert.urgency, expectedUrgency)
                        assert.isTrue(typeof alertAction.payload.alert.triggerScore === 'number')
                        assert.isTrue(alertAction.payload.alert.triggerScore >= 0 &&
                                     alertAction.payload.alert.triggerScore <= 1)

                        yield* Effect.log(`Alert triggered for ${condition}: ${expectedUrgency} urgency`)
                        yield* Effect.sleep(Duration.millis(50)) // Small delay between tests
                    }

                    // Verify final state has operator alert
                    yield* assertSaga.stateMatches(ctx,
                        (state) => state.dialogs.entities[dialogId]?.operatorAlert !== null,
                        true
                    )

                    yield* Effect.log('=== Operator Alert Test Complete ===')
                })
            )
        )
    )

    it.effect('should demonstrate complex async event chains with timing', () =>
        withStore(
            runSagaTest('Complex Async Event Chains', (ctx) =>
                Effect.gen(function* () {
                    yield* Effect.log('=== Starting Complex Event Chain Test ===')

                    const dialogId = 'dialog_complex123'
                    const accountId = 'account_complex123'

                    // Create complex orchestration saga
                    const orchestrationSaga = createSaga('complex-orchestrator',
                        Effect.gen(function* () {
                            yield* Effect.log('Complex orchestration saga started')

                            yield* pipe(
                                ctx.actions$,
                                Stream.filter(matchers.ofType('dialogs/startComplexFlow')),
                                Stream.runForEach((action: any) =>
                                    Effect.gen(function* () {
                                        const { dialogId } = action.payload

                                        // Phase 1: Dialog initialization
                                        yield* Effect.log('Phase 1: Dialog initialization')
                                        yield* Effect.sleep(Duration.millis(50))
                                        yield* ctx.dispatch(dialogSlice.actions.statusUpdated({
                                            dialogId,
                                            status: 'active'
                                        }))

                                        // Phase 2: Message exchange simulation
                                        yield* Effect.log('Phase 2: Message exchange')
                                        const messages = [
                                            { from: 'player', text: 'Hey, interested in trading?' },
                                            { from: 'account', text: 'Sure! What are you looking for?' },
                                            { from: 'player', text: 'I need some CS:GO skins' },
                                            { from: 'account', text: 'I have some great ones available!' }
                                        ]

                                        for (let i = 0; i < messages.length; i++) {
                                            const message = messages[i]
                                            yield* Effect.sleep(Duration.millis(150))

                                            if (message.from === 'player') {
                                                yield* ctx.dispatch(dialogSlice.actions.messageReceived({
                                                    dialogId,
                                                    message: {
                                                        id: `msg_${i + 1}`,
                                                        from: message.from,
                                                        text: message.text,
                                                        ts: Date.now(),
                                                        sequenceNumber: i + 1
                                                    }
                                                }))
                                            } else {
                                                yield* ctx.dispatch(dialogSlice.actions.messageSent({
                                                    dialogId,
                                                    message: {
                                                        id: `msg_${i + 1}`,
                                                        from: message.from,
                                                        text: message.text,
                                                        ts: Date.now(),
                                                        sequenceNumber: i + 1
                                                    }
                                                }))
                                            }
                                        }

                                        // Phase 3: AI assessment
                                        yield* Effect.log('Phase 3: AI assessment')
                                        yield* Effect.sleep(Duration.millis(200))
                                        yield* ctx.dispatch(dialogSlice.actions.assessed({
                                            dialogId,
                                            assessment: {
                                                continuationScore: 0.85,
                                                trend: 'rising',
                                                scoringFactors: {
                                                    engagement: 0.9,
                                                    relevance: 0.8,
                                                    tone: 0.85,
                                                    quality: 0.87,
                                                    goalProximity: 0.75
                                                },
                                                issues: [],
                                                confidence: 0.92,
                                                assessedAt: Date.now(),
                                                messageCount: 4
                                            }
                                        }))

                                        // Phase 4: Progress tracking
                                        yield* Effect.log('Phase 4: Progress tracking')
                                        const progressSteps = [0.25, 0.5, 0.75, 1.0]
                                        for (const progress of progressSteps) {
                                            yield* Effect.sleep(Duration.millis(100))
                                            yield* ctx.dispatch(dialogSlice.actions.progressUpdated({
                                                dialogId,
                                                progress
                                            }))
                                        }

                                        // Phase 5: Completion
                                        yield* Effect.log('Phase 5: Completion')
                                        yield* Effect.sleep(Duration.millis(100))
                                        yield* ctx.dispatch(dialogSlice.actions.statusUpdated({
                                            dialogId,
                                            status: 'completed'
                                        }))

                                        yield* ctx.dispatch({
                                            type: 'test/complexFlowCompleted',
                                            payload: { dialogId, totalDuration: Date.now() - action.payload.startTime }
                                        })
                                    })
                                )
                            )
                        })
                    )

                    // Start orchestration saga
                    yield* ctx.runSaga(orchestrationSaga)

                    // Create dialog first
                    yield* ctx.dispatch(dialogSlice.actions.created({
                        dialogId,
                        accountId,
                        playerSteamId64: '76561198666666666',
                        contextMessage: 'Testing complex event chains'
                    }))

                    // Start complex flow
                    const startTime = Date.now()
                    yield* ctx.dispatch({
                        type: 'dialogs/startComplexFlow',
                        payload: { dialogId, startTime }
                    })

                    // Wait for completion event
                    const completionAction = yield* ctx.waitFor(
                        matchers.ofType('test/complexFlowCompleted'),
                        10000
                    )

                    assert.strictEqual(completionAction.payload.dialogId, dialogId)
                    assert.isTrue(completionAction.payload.totalDuration > 0)

                    // Verify final dialog state
                    const finalState = yield* ctx.getState()
                    const dialog = finalState.dialogs.entities[dialogId]

                    assert.strictEqual(dialog.status, 'completed')
                    assert.strictEqual(dialog.messages.length, 4)
                    assert.strictEqual(dialog.progress, 1.0)
                    assert.isNotNull(dialog.assessment)
                    assert.strictEqual(dialog.assessment?.continuationScore, 0.85)

                    yield* Effect.log(`Complex flow completed in ${completionAction.payload.totalDuration}ms`)
                    yield* Effect.log('=== Complex Event Chain Test Complete ===')
                })
            )
        )
    )

    it.effect('should handle dialog message trimming and context management', () =>
        withStore(
            runSagaTest('Message Trimming and Context Management', (ctx) =>
                Effect.gen(function* () {
                    yield* Effect.log('=== Starting Message Trimming Test ===')

                    const dialogId = 'dialog_trimming123'
                    const accountId = 'account_trimming123'

                    // Create dialog
                    yield* ctx.dispatch(dialogSlice.actions.created({
                        dialogId,
                        accountId,
                        playerSteamId64: '76561198555555555',
                        contextMessage: 'Testing message trimming'
                    }))

                    // Send 55 messages (5 more than limit) to test trimming
                    const messageCount = 55
                    for (let i = 1; i <= messageCount; i++) {
                        const isPlayerMessage = i % 2 === 1
                        const action = isPlayerMessage ?
                            dialogSlice.actions.messageReceived :
                            dialogSlice.actions.messageSent

                        yield* ctx.dispatch(action({
                            dialogId,
                            message: {
                                id: `msg_${i}`,
                                from: isPlayerMessage ? 'player' : 'account',
                                text: `Message number ${i}`,
                                ts: Date.now(),
                                sequenceNumber: i
                            }
                        }))

                        // Small delay to ensure ordering
                        yield* Effect.sleep(Duration.millis(10))
                    }

                    // Verify message trimming occurred
                    const state = yield* ctx.getState()
                    const dialog = state.dialogs.entities[dialogId]

                    assert.strictEqual(dialog.messages.length, 50) // Should be trimmed to MAX_MESSAGES
                    assert.strictEqual(dialog.messageTrimmed, true)

                    // Verify we kept the last 50 messages
                    const firstKeptMessage = dialog.messages[0]
                    const lastKeptMessage = dialog.messages[49]

                    assert.strictEqual(firstKeptMessage.sequenceNumber, 6) // 55 - 50 + 1
                    assert.strictEqual(lastKeptMessage.sequenceNumber, 55)

                    yield* Effect.log(`Messages trimmed from ${messageCount} to ${dialog.messages.length}`)
                    yield* Effect.log('=== Message Trimming Test Complete ===')
                })
            )
        )
    )
})