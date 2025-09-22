import { assert, describe, it } from '@effect/vitest'
import { Effect } from 'effect'

// Import scenario builder and related types
import { ScenarioBuilder, createScenario } from '../test-utils/scenario-builder'
import type { Account } from '@packages/isomorphic/src/slices/accounts'
import type { Dialog } from '@packages/isomorphic/src/slices/dialogs'

describe('ScenarioBuilder', () => {
    describe('Account Creation', () => {
        it.effect('should create disconnected account by default', () =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()
                const accountId = builder.createAccount()

                const actions = builder.getActions()
                assert.isTrue(actions.length > 0)

                // Find account creation action
                const createAction = actions.find((action) => action.type === 'accounts/created')
                assert.isDefined(createAction)

                const account = createAction.payload.account as Account
                assert.strictEqual(account.accountId, accountId)
                assert.strictEqual(account.status, 'disconnected')
                assert.isDefined(account.steamId64)
                assert.isDefined(account.accountName)
                assert.isDefined(account.proxy)
            })
        )

        it.effect('should create connected account', () =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()
                const accountId = builder.createAccount({ status: 'connected' })

                const actions = builder.getActions()

                // Should have creation action and connected action
                const createAction = actions.find((action) => action.type === 'accounts/created')
                const connectedAction = actions.find((action) => action.type === 'accounts/connected')

                assert.isDefined(createAction)
                assert.isDefined(connectedAction)

                const account = createAction.payload.account as Account
                assert.strictEqual(account.status, 'connected')
                assert.isDefined(account.connectedAt)

                assert.strictEqual(connectedAction.payload.accountId, accountId)
            })
        )

        it.effect('should create account with authentication error', () =>
            Effect.gen(function* () {
                const errorReason = 'Invalid Steam credentials'
                const builder = new ScenarioBuilder()
                const accountId = builder.createAccount({
                    status: 'error',
                    error: errorReason
                })

                const actions = builder.getActions()

                // Should have creation and error actions
                const createAction = actions.find((action) => action.type === 'accounts/created')
                const errorAction = actions.find((action) => action.type === 'accounts/authenticationFailed')

                assert.isDefined(createAction)
                assert.isDefined(errorAction)

                const account = createAction.payload.account as Account
                assert.strictEqual(account.status, 'error')
                assert.strictEqual(account.lastError, errorReason)

                assert.strictEqual(errorAction.payload.accountId, accountId)
                assert.strictEqual(errorAction.payload.reason, errorReason)
            })
        )

        it.effect('should create account with custom properties', () =>
            Effect.gen(function* () {
                const customProps = {
                    steamId64: '76561198123456789',
                    accountName: 'custom_test_account',
                    proxy: 'http://custom-proxy.example.com:8080',
                }

                const builder = new ScenarioBuilder()
                const accountId = builder.createAccount(customProps)

                const actions = builder.getActions()
                const createAction = actions.find((action) => action.type === 'accounts/created')
                assert.isDefined(createAction)

                const account = createAction.payload.account as Account
                assert.strictEqual(account.accountId, accountId)
                assert.strictEqual(account.steamId64, customProps.steamId64)
                assert.strictEqual(account.accountName, customProps.accountName)
                assert.strictEqual(account.proxy, customProps.proxy)
            })
        )
    })

    describe('Dialog Creation', () => {
        it.effect('should create dialog with default settings', () =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()
                const accountId = builder.connectedAccount()
                const dialogId = builder.createDialog({ accountId })

                const actions = builder.getActions()

                // Find dialog creation action
                const createDialogAction = actions.find((action) => action.type === 'dialogs/created')
                assert.isDefined(createDialogAction)

                assert.strictEqual(createDialogAction.payload.dialogId, dialogId)
                assert.strictEqual(createDialogAction.payload.accountId, accountId)
                assert.isDefined(createDialogAction.payload.partnerId)
                assert.isDefined(createDialogAction.payload.startedAt)

                // Should have message actions
                const messageActions = actions.filter((action) =>
                    action.type === 'dialogs/messageReceived' || action.type === 'dialogs/messageSent'
                )
                assert.strictEqual(messageActions.length, 5) // Default message count
            })
        )

        it.effect('should create dialog with custom message count', () =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()
                const accountId = builder.connectedAccount()
                const messageCount = 10

                const dialogId = builder.createDialog({ accountId, messageCount })

                const actions = builder.getActions()
                const messageActions = actions.filter((action) =>
                    action.type === 'dialogs/messageReceived' || action.type === 'dialogs/messageSent'
                )

                assert.strictEqual(messageActions.length, messageCount)

                // Verify message pattern (alternating user/assistant)
                messageActions.forEach((action, index) => {
                    const expectedType = index % 2 === 0 ? 'dialogs/messageReceived' : 'dialogs/messageSent'
                    assert.strictEqual(action.type, expectedType)
                    assert.strictEqual(action.payload.dialogId, dialogId)
                })
            })
        )

        it.effect('should create dialog with assessment', () =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()
                const accountId = builder.connectedAccount()
                const continuationScore = 0.85

                const dialogId = builder.createDialog({
                    accountId,
                    withAssessment: true,
                    continuationScore,
                })

                const actions = builder.getActions()

                // Find assessment action
                const assessmentAction = actions.find((action) => action.type === 'dialogs/assessed')
                assert.isDefined(assessmentAction)

                assert.strictEqual(assessmentAction.payload.dialogId, dialogId)

                const assessment = assessmentAction.payload.assessment
                assert.strictEqual(assessment.continuationScore, continuationScore)
                assert.strictEqual(assessment.trend, 'stable')
                assert.isDefined(assessment.scoringFactors)
                assert.isDefined(assessment.lastAssessedAt)
                assert.strictEqual(assessment.assessmentCount, 1)
            })
        )

        it.effect('should create dialog with operator alert', () =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()
                const accountId = builder.connectedAccount()

                const dialogId = builder.createDialog({
                    accountId,
                    operatorAlerted: true,
                })

                const actions = builder.getActions()

                // Find operator alert action
                const alertAction = actions.find((action) => action.type === 'dialogs/operatorAlerted')
                assert.isDefined(alertAction)

                assert.strictEqual(alertAction.payload.dialogId, dialogId)

                const alert = alertAction.payload.alert
                assert.strictEqual(alert.reason, 'Low continuation score')
                assert.strictEqual(alert.urgency, 'medium')
                assert.isDefined(alert.timestamp)
            })
        )
    })

    describe('System Configuration', () => {
        it.effect('should configure system with default values', () =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()
                builder.configureSystem()

                const actions = builder.getActions()
                const configAction = actions.find((action) => action.type === 'system/configUpdated')
                assert.isDefined(configAction)

                const config = configAction.payload.config
                assert.strictEqual(config.rateLimitPerMinute, 60)
                assert.strictEqual(config.maxDialogsPerAccount, 5)
                assert.strictEqual(config.openAIApiKey, 'test-api-key')
            })
        )

        it.effect('should configure system with custom values', () =>
            Effect.gen(function* () {
                const customConfig = {
                    rateLimitPerMinute: 120,
                    maxDialogsPerAccount: 10,
                    openAIApiKey: 'custom-test-key',
                }

                const builder = new ScenarioBuilder()
                builder.configureSystem(customConfig)

                const actions = builder.getActions()
                const configAction = actions.find((action) => action.type === 'system/configUpdated')
                assert.isDefined(configAction)

                const config = configAction.payload.config
                assert.strictEqual(config.rateLimitPerMinute, customConfig.rateLimitPerMinute)
                assert.strictEqual(config.maxDialogsPerAccount, customConfig.maxDialogsPerAccount)
                assert.strictEqual(config.openAIApiKey, customConfig.openAIApiKey)
            })
        )
    })

    describe('Predefined Scenarios', () => {
        it.effect('should create account with failed authentication', () =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()
                const accountId = builder.accountWithFailedAuth('Steam Guard required')

                const actions = builder.getActions()
                const createAction = actions.find((action) => action.type === 'accounts/created')
                const errorAction = actions.find((action) => action.type === 'accounts/authenticationFailed')

                assert.isDefined(createAction)
                assert.isDefined(errorAction)

                const account = createAction.payload.account as Account
                assert.strictEqual(account.status, 'error')
                assert.strictEqual(account.lastError, 'Steam Guard required')

                assert.strictEqual(errorAction.payload.reason, 'Steam Guard required')
            })
        )

        it.effect('should create dialog nearing continuation limit', () =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()
                const accountId = builder.connectedAccount()
                const dialogId = builder.dialogNearingLimit(accountId)

                const actions = builder.getActions()

                // Should have assessment with low score
                const assessmentAction = actions.find((action) => action.type === 'dialogs/assessed')
                assert.isDefined(assessmentAction)

                const assessment = assessmentAction.payload.assessment
                assert.strictEqual(assessment.continuationScore, 0.35)

                // Should have more messages than default
                const messageActions = actions.filter((action) =>
                    action.type === 'dialogs/messageReceived' || action.type === 'dialogs/messageSent'
                )
                assert.strictEqual(messageActions.length, 10)
            })
        )

        it.effect('should create dialog with alert', () =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()
                const accountId = builder.connectedAccount()
                const dialogId = builder.dialogWithAlert(accountId)

                const actions = builder.getActions()

                // Should have assessment with very low score
                const assessmentAction = actions.find((action) => action.type === 'dialogs/assessed')
                assert.isDefined(assessmentAction)
                assert.strictEqual(assessmentAction.payload.assessment.continuationScore, 0.25)

                // Should have operator alert
                const alertAction = actions.find((action) => action.type === 'dialogs/operatorAlerted')
                assert.isDefined(alertAction)
                assert.strictEqual(alertAction.payload.alert.urgency, 'medium')
            })
        )
    })

    describe('Complex Scenarios', () => {
        it.effect('should create complex scenario with multiple entities', () =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()
                const result = builder.complexScenario()

                assert.strictEqual(result.accountIds.length, 3)
                assert.isTrue(result.actions.length > 20) // Should have many actions

                const actions = result.actions

                // Should have system config
                const configActions = actions.filter((action) => action.type === 'system/configUpdated')
                assert.strictEqual(configActions.length, 1)

                // Should have multiple accounts
                const accountActions = actions.filter((action) => action.type === 'accounts/created')
                assert.strictEqual(accountActions.length, 3)

                // Should have multiple dialogs
                const dialogActions = actions.filter((action) => action.type === 'dialogs/created')
                assert.isTrue(dialogActions.length >= 3)

                // Should have at least one assessment
                const assessmentActions = actions.filter((action) => action.type === 'dialogs/assessed')
                assert.isTrue(assessmentActions.length >= 1)

                // Should have at least one operator alert
                const alertActions = actions.filter((action) => action.type === 'dialogs/operatorAlerted')
                assert.isTrue(alertActions.length >= 1)
            })
        )

        it.effect('should create saga test scenario', () =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()
                const result = builder.sagaTestScenario()

                assert.isDefined(result.accountId)
                assert.isDefined(result.dialogId)
                assert.isTrue(result.actions.length > 0)

                const actions = result.actions

                // Should have account
                const accountAction = actions.find((action) => action.type === 'accounts/created')
                assert.isDefined(accountAction)

                // Should have dialog
                const dialogAction = actions.find((action) => action.type === 'dialogs/created')
                assert.isDefined(dialogAction)

                // Should have messages but no assessment (for testing)
                const messageActions = actions.filter((action) =>
                    action.type === 'dialogs/messageReceived' || action.type === 'dialogs/messageSent'
                )
                assert.strictEqual(messageActions.length, 3)

                const assessmentActions = actions.filter((action) => action.type === 'dialogs/assessed')
                assert.strictEqual(assessmentActions.length, 0)
            })
        )
    })

    describe('Builder State Management', () => {
        it.effect('should accumulate actions across multiple calls', () =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()

                // Create multiple entities
                const account1 = builder.createAccount()
                const account2 = builder.createAccount()
                builder.configureSystem()

                const actions = builder.getActions()
                assert.isTrue(actions.length >= 3) // At least 3 actions

                // Should have unique account IDs
                assert.notStrictEqual(account1, account2)
            })
        )

        it.effect('should clear actions when requested', () =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()

                // Create some actions
                builder.createAccount()
                builder.configureSystem()

                let actions = builder.getActions()
                assert.isTrue(actions.length > 0)

                // Clear actions
                builder.clear()

                actions = builder.getActions()
                assert.strictEqual(actions.length, 0)
            })
        )

        it.effect('should generate unique IDs for entities', () =>
            Effect.gen(function* () {
                const builder = new ScenarioBuilder()

                // Create multiple accounts
                const accountIds = Array.from({ length: 5 }, () => builder.createAccount())

                // All IDs should be unique
                const uniqueIds = new Set(accountIds)
                assert.strictEqual(uniqueIds.size, accountIds.length)

                // All IDs should have correct prefix
                accountIds.forEach((id) => {
                    assert.isTrue(id.startsWith('account_'))
                })
            })
        )
    })
})

describe('createScenario Convenience Functions', () => {
    describe('Static Factory Methods', () => {
        it.effect('should create simple account scenario', () =>
            Effect.gen(function* () {
                const scenario = createScenario.simpleAccount()

                assert.isDefined(scenario.accountId)
                assert.isTrue(scenario.accountId.startsWith('account_'))
                assert.isTrue(scenario.actions.length > 0)

                // Should have account creation and connection
                const createAction = scenario.actions.find((action) => action.type === 'accounts/created')
                const connectedAction = scenario.actions.find((action) => action.type === 'accounts/connected')

                assert.isDefined(createAction)
                assert.isDefined(connectedAction)
            })
        )

        it.effect('should create account with dialog scenario', () =>
            Effect.gen(function* () {
                const scenario = createScenario.accountWithDialog()

                assert.isDefined(scenario.accountId)
                assert.isDefined(scenario.dialogId)
                assert.isTrue(scenario.actions.length > 0)

                // Should have both account and dialog creation
                const accountAction = scenario.actions.find((action) => action.type === 'accounts/created')
                const dialogAction = scenario.actions.find((action) => action.type === 'dialogs/created')

                assert.isDefined(accountAction)
                assert.isDefined(dialogAction)

                // Dialog should belong to account
                assert.strictEqual(dialogAction.payload.accountId, scenario.accountId)
            })
        )

        it.effect('should create failed auth scenario', () =>
            Effect.gen(function* () {
                const scenario = createScenario.accountWithFailedAuth()

                assert.isDefined(scenario.accountId)
                assert.isTrue(scenario.actions.length > 0)

                // Should have error action
                const errorAction = scenario.actions.find((action) => action.type === 'accounts/authenticationFailed')
                assert.isDefined(errorAction)
                assert.strictEqual(errorAction.payload.accountId, scenario.accountId)
            })
        )

        it.effect('should create full system scenario', () =>
            Effect.gen(function* () {
                const scenario = createScenario.fullSystem()

                assert.isDefined(scenario.accountIds)
                assert.isTrue(scenario.accountIds.length >= 3)
                assert.isTrue(scenario.actions.length > 20)

                // Should have comprehensive setup
                const configActions = scenario.actions.filter((action) => action.type === 'system/configUpdated')
                const accountActions = scenario.actions.filter((action) => action.type === 'accounts/created')
                const dialogActions = scenario.actions.filter((action) => action.type === 'dialogs/created')

                assert.isTrue(configActions.length >= 1)
                assert.isTrue(accountActions.length >= 3)
                assert.isTrue(dialogActions.length >= 3)
            })
        )

        it.effect('should create custom scenario with builder function', () =>
            Effect.gen(function* () {
                const actions = createScenario.custom((builder) => {
                    builder.configureSystem({ rateLimitPerMinute: 200 })
                    builder.createAccount({ accountName: 'custom_account' })
                })

                assert.isTrue(actions.length > 0)

                // Should have custom config
                const configAction = actions.find((action) => action.type === 'system/configUpdated')
                assert.isDefined(configAction)
                assert.strictEqual(configAction.payload.config.rateLimitPerMinute, 200)

                // Should have custom account
                const accountAction = actions.find((action) => action.type === 'accounts/created')
                assert.isDefined(accountAction)
                assert.strictEqual(accountAction.payload.account.accountName, 'custom_account')
            })
        )
    })
})