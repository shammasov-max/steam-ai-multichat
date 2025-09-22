import { assert, describe, it } from '@effect/vitest'
import { Effect, Duration, pipe, Stream } from 'effect'
import { createSaga } from '@packages/isomorphic/src/effect-redux/saga-bridge'

// Import slices and actions
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
import { createAccountScenario, createSystemScenario } from '../scenarios/account-scenarios'

describe('Account Saga Tests', () => {
    it.effect('should handle account connection flow', () =>
        withStore(
            runSagaTest('Account Connection Flow', (ctx) =>
                Effect.gen(function* () {
                    yield* Effect.log('=== Starting Account Connection Test ===')

                    // Setup test account
                    const testAccount = createAccountScenario({
                        accountId: 'account_test123',
                        steamId64: '76561198000000001',
                        proxyUrl: 'http://proxy1.example.com:8080',
                        status: 'disconnected'
                    })

                    // Create saga that responds to connection requests
                    const connectionSaga = createSaga('connection-handler',
                        Effect.gen(function* () {
                            yield* Effect.log('Connection saga started')

                            // Wait for connection request
                            const connectionAction = yield* ctx.waitFor(
                                matchers.ofType('accounts/connect'),
                                3000
                            )

                            yield* Effect.log(`Processing connection for: ${connectionAction.payload?.accountId}`)

                            // Simulate connection delay
                            yield* Effect.sleep(Duration.millis(100))

                            // Dispatch connected event
                            yield* ctx.dispatch(accountSlice.actions.connected({
                                accountId: connectionAction.payload.accountId,
                                ts: Date.now()
                            }))
                        })
                    )

                    // Start the connection saga
                    yield* ctx.runSaga(connectionSaga)

                    // Dispatch connection request
                    yield* ctx.dispatch({
                        type: 'accounts/connect',
                        payload: { accountId: testAccount.accountId }
                    })

                    // Wait for connected event
                    const connectedAction = yield* ctx.waitFor(
                        matchers.ofType('accounts/connected')
                    )

                    // Verify the action payload
                    assert.strictEqual(connectedAction.payload.accountId, testAccount.accountId)
                    assert.isTrue(typeof connectedAction.payload.ts === 'number')

                    // Verify state update
                    yield* assertSaga.stateMatches(ctx,
                        (state) => state.accounts.entities[testAccount.accountId]?.status,
                        'connected'
                    )

                    yield* Effect.log('=== Account Connection Test Complete ===')
                })
            )
        )
    )

    it.effect('should handle authentication failure with proper error handling', () =>
        withStore(
            runSagaTest('Authentication Failure Handling', (ctx) =>
                Effect.gen(function* () {
                    yield* Effect.log('=== Starting Authentication Failure Test ===')

                    // Setup test account
                    const testAccount = createAccountScenario({
                        accountId: 'account_fail123',
                        steamId64: '76561198000000002',
                        proxyUrl: 'http://proxy2.example.com:8080',
                        status: 'disconnected'
                    })

                    // Create saga that simulates authentication failure
                    const authFailureSaga = createSaga('auth-failure-handler',
                        Effect.gen(function* () {
                            yield* Effect.log('Auth failure saga started')

                            // Wait for authentication attempt
                            const authAction = yield* ctx.waitFor(
                                matchers.ofType('accounts/authenticate'),
                                3000
                            )

                            yield* Effect.log(`Simulating auth failure for: ${authAction.payload?.accountId}`)

                            // Simulate authentication attempt delay
                            yield* Effect.sleep(Duration.millis(200))

                            // Dispatch authentication failed event
                            yield* ctx.dispatch(accountSlice.actions.authenticationFailed({
                                accountId: authAction.payload.accountId,
                                reason: 'Invalid credentials'
                            }))
                        })
                    )

                    // Start the auth failure saga
                    yield* ctx.runSaga(authFailureSaga)

                    // Dispatch authentication request
                    yield* ctx.dispatch({
                        type: 'accounts/authenticate',
                        payload: {
                            accountId: testAccount.accountId,
                            credentials: 'invalid'
                        }
                    })

                    // Wait for authentication failed event
                    const failedAction = yield* ctx.waitFor(
                        matchers.ofTypeWithPayload('accounts/authenticationFailed',
                            (payload: any) => payload.accountId === testAccount.accountId
                        )
                    )

                    // Verify the failure reason
                    assert.strictEqual(failedAction.payload.reason, 'Invalid credentials')

                    // Verify state update
                    yield* assertSaga.stateMatches(ctx,
                        (state) => state.accounts.entities[testAccount.accountId]?.status,
                        'authFailed'
                    )

                    yield* Effect.log('=== Authentication Failure Test Complete ===')
                })
            )
        )
    )

    it.effect('should enforce rate limiting for friend invites', () =>
        withStore(
            runSagaTest('Rate Limiting Enforcement', (ctx) =>
                Effect.gen(function* () {
                    yield* Effect.log('=== Starting Rate Limiting Test ===')

                    // Setup test accounts
                    const account1 = createAccountScenario({
                        accountId: 'account_rate1',
                        steamId64: '76561198000000003',
                        proxyUrl: 'http://proxy3.example.com:8080',
                        status: 'connected'
                    })

                    const account2 = createAccountScenario({
                        accountId: 'account_rate2',
                        steamId64: '76561198000000004',
                        proxyUrl: 'http://proxy4.example.com:8080',
                        status: 'connected'
                    })

                    // Setup system configuration for rate limiting
                    const systemConfig = createSystemScenario({
                        friendInviteRateLimit: {
                            maxPerMinute: 1,
                            windowMs: 60000
                        }
                    })

                    // Create rate limiting saga
                    const rateLimitSaga = createSaga('rate-limit-handler',
                        Effect.gen(function* () {
                            yield* Effect.log('Rate limit saga started')

                            const inviteAttempts = new Map<string, number[]>()

                            yield* pipe(
                                ctx.actions$,
                                Stream.filter(matchers.ofType('accounts/sendFriendInvite')),
                                Stream.runForEach((action: any) =>
                                    Effect.gen(function* () {
                                        const { accountId, targetSteamId } = action.payload
                                        const now = Date.now()

                                        // Get recent attempts for this account
                                        const attempts = inviteAttempts.get(accountId) || []
                                        const recentAttempts = attempts.filter(
                                            time => now - time < systemConfig.friendInviteRateLimit.windowMs
                                        )

                                        if (recentAttempts.length >= systemConfig.friendInviteRateLimit.maxPerMinute) {
                                            // Rate limited
                                            yield* ctx.dispatch({
                                                type: 'accounts/friendInviteRateLimited',
                                                payload: {
                                                    accountId,
                                                    targetSteamId,
                                                    retryAfter: systemConfig.friendInviteRateLimit.windowMs
                                                }
                                            })
                                        } else {
                                            // Allow invite
                                            recentAttempts.push(now)
                                            inviteAttempts.set(accountId, recentAttempts)

                                            yield* ctx.dispatch({
                                                type: 'accounts/friendInviteSent',
                                                payload: { accountId, targetSteamId, ts: now }
                                            })
                                        }
                                    })
                                )
                            )
                        })
                    )

                    // Start rate limiting saga
                    yield* ctx.runSaga(rateLimitSaga)

                    // Send first invite (should succeed)
                    yield* ctx.dispatch({
                        type: 'accounts/sendFriendInvite',
                        payload: {
                            accountId: account1.accountId,
                            targetSteamId: '76561198999999999'
                        }
                    })

                    // Wait for successful invite
                    yield* ctx.waitFor(matchers.ofType('accounts/friendInviteSent'))

                    // Send second invite immediately (should be rate limited)
                    yield* ctx.dispatch({
                        type: 'accounts/sendFriendInvite',
                        payload: {
                            accountId: account1.accountId,
                            targetSteamId: '76561198999999998'
                        }
                    })

                    // Wait for rate limit event
                    const rateLimitedAction = yield* ctx.waitFor(
                        matchers.ofType('accounts/friendInviteRateLimited')
                    )

                    // Verify rate limiting
                    assert.strictEqual(rateLimitedAction.payload.accountId, account1.accountId)
                    assert.isTrue(rateLimitedAction.payload.retryAfter > 0)

                    // Verify different account can still send invites
                    yield* ctx.dispatch({
                        type: 'accounts/sendFriendInvite',
                        payload: {
                            accountId: account2.accountId,
                            targetSteamId: '76561198999999997'
                        }
                    })

                    // Should succeed for different account
                    const successAction = yield* ctx.waitFor(
                        matchers.ofTypeWithPayload('accounts/friendInviteSent',
                            (payload: any) => payload.accountId === account2.accountId
                        )
                    )

                    assert.strictEqual(successAction.payload.accountId, account2.accountId)

                    yield* Effect.log('=== Rate Limiting Test Complete ===')
                })
            )
        )
    )

    it.effect('should handle complex action sequences with proper timing', () =>
        withStore(
            runSagaTest('Complex Action Sequence', (ctx) =>
                Effect.gen(function* () {
                    yield* Effect.log('=== Starting Complex Sequence Test ===')

                    const testAccount = createAccountScenario({
                        accountId: 'account_sequence',
                        steamId64: '76561198000000005',
                        proxyUrl: 'http://proxy5.example.com:8080',
                        status: 'disconnected'
                    })

                    // Create orchestration saga
                    const orchestrationSaga = createSaga('orchestration-handler',
                        Effect.gen(function* () {
                            yield* Effect.log('Orchestration saga started')

                            // Complex workflow: connect → authenticate → validate → ready
                            yield* pipe(
                                ctx.actions$,
                                Stream.filter(matchers.ofType('accounts/startSequence')),
                                Stream.runForEach((action: any) =>
                                    Effect.gen(function* () {
                                        const { accountId } = action.payload

                                        // Step 1: Connect
                                        yield* Effect.sleep(Duration.millis(50))
                                        yield* ctx.dispatch(accountSlice.actions.connected({
                                            accountId,
                                            ts: Date.now()
                                        }))

                                        // Step 2: Authenticate
                                        yield* Effect.sleep(Duration.millis(100))
                                        yield* ctx.dispatch({
                                            type: 'accounts/authenticated',
                                            payload: { accountId, sessionId: 'session_123' }
                                        })

                                        // Step 3: Validate
                                        yield* Effect.sleep(Duration.millis(75))
                                        yield* ctx.dispatch({
                                            type: 'accounts/validated',
                                            payload: { accountId, isValid: true }
                                        })

                                        // Step 4: Ready
                                        yield* Effect.sleep(Duration.millis(25))
                                        yield* ctx.dispatch({
                                            type: 'accounts/ready',
                                            payload: { accountId, readyAt: Date.now() }
                                        })
                                    })
                                )
                            )
                        })
                    )

                    // Start orchestration saga
                    yield* ctx.runSaga(orchestrationSaga)

                    // Start the sequence
                    yield* ctx.dispatch({
                        type: 'accounts/startSequence',
                        payload: { accountId: testAccount.accountId }
                    })

                    // Verify action sequence
                    const expectedSequence = [
                        'accounts/connected',
                        'accounts/authenticated',
                        'accounts/validated',
                        'accounts/ready'
                    ]

                    yield* assertSaga.actionSequence(ctx, expectedSequence, 5000)

                    // Verify final state
                    yield* assertSaga.stateMatches(ctx,
                        (state) => state.accounts.entities[testAccount.accountId]?.status,
                        'connected'
                    )

                    yield* Effect.log('=== Complex Sequence Test Complete ===')
                })
            )
        )
    )
})