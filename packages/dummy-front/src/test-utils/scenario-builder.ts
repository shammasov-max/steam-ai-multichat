import { typeid } from 'typeid-js'
import type { UnknownAction } from '@reduxjs/toolkit'

// Import types from isomorphic package
import type { Account } from '@packages/isomorphic/src/slices/accounts'
import type { Dialog, DialogMessage } from '@packages/isomorphic/src/slices/dialogs'
import type { SystemState } from '@packages/isomorphic/src/slices/system'
import { accountsSlice } from '@packages/isomorphic/src/slices/accounts'
import { dialogsSlice } from '@packages/isomorphic/src/slices/dialogs'
import { systemSlice } from '@packages/isomorphic/src/slices/system'

/**
 * Scenario builder for creating test data and state setups
 */
export class ScenarioBuilder {
    private actions: UnknownAction[] = []

    /**
     * Create a test account with specific state
     */
    createAccount(options: {
        status?: 'disconnected' | 'connecting' | 'connected' | 'error'
        steamId64?: string
        accountName?: string
        proxy?: string
        error?: string
    } = {}): string {
        const accountId = typeid('account').toString()
        const steamId64 = options.steamId64 || `7656119${Math.floor(Math.random() * 900000000) + 100000000}`

        const account: Account = {
            accountId,
            steamId64,
            accountName: options.accountName || `test_account_${Math.random().toString(36).substr(2, 9)}`,
            displayName: null,
            status: options.status || 'disconnected',
            proxy: options.proxy || `http://proxy${Math.floor(Math.random() * 10)}.example.com:8080`,
            rateLimitedUntil: null,
            lastError: options.error || null,
            connectedAt: options.status === 'connected' ? Date.now() : null,
            maFile: null,
            lastDisconnectReason: null,
            lastEventTime: Date.now(),
        }

        // Create action to add account
        this.actions.push({
            type: 'accounts/created',
            payload: { account },
        })

        // If connected, add connected event
        if (options.status === 'connected') {
            this.actions.push(
                accountsSlice.actions.connected({
                    accountId,
                    ts: Date.now(),
                })
            )
        }

        // If error, add error event
        if (options.status === 'error' && options.error) {
            this.actions.push(
                accountsSlice.actions.authenticationFailed({
                    accountId,
                    reason: options.error,
                })
            )
        }

        return accountId
    }

    /**
     * Create account with failed authentication
     */
    accountWithFailedAuth(reason = 'Invalid credentials'): string {
        return this.createAccount({
            status: 'error',
            error: reason,
        })
    }

    /**
     * Create connected account ready for dialogs
     */
    connectedAccount(): string {
        return this.createAccount({
            status: 'connected',
        })
    }

    /**
     * Create a dialog with messages
     */
    createDialog(options: {
        accountId: string
        messageCount?: number
        withAssessment?: boolean
        continuationScore?: number
        operatorAlerted?: boolean
    }): string {
        const dialogId = typeid('dialog').toString()
        const partnerId = `partner_${Math.random().toString(36).substr(2, 9)}`

        const messages: DialogMessage[] = []
        const messageCount = options.messageCount || 5

        // Generate messages
        for (let i = 0; i < messageCount; i++) {
            messages.push({
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: `Test message ${i + 1}`,
                timestamp: Date.now() - (messageCount - i) * 1000,
            })
        }

        const dialog: Dialog = {
            dialogId,
            accountId: options.accountId,
            partnerId,
            status: 'active',
            startedAt: Date.now() - messageCount * 1000,
            messages,
            assessment: options.withAssessment
                ? {
                      continuationScore: options.continuationScore || 0.75,
                      trend: 'stable',
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
                : undefined,
            metadata: {
                agentEnabled: true,
                lastActivityAt: Date.now(),
                messageCount,
                operatorAlerted: options.operatorAlerted || false,
            },
            progress: {
                stage: 'conversation',
                stageStartedAt: Date.now() - messageCount * 1000,
            },
        }

        // Create dialog
        this.actions.push(
            dialogsSlice.actions.created({
                dialogId,
                accountId: options.accountId,
                partnerId,
                startedAt: dialog.startedAt,
            })
        )

        // Add messages
        messages.forEach((msg) => {
            if (msg.role === 'user') {
                this.actions.push(
                    dialogsSlice.actions.messageReceived({
                        dialogId,
                        message: msg,
                    })
                )
            } else {
                this.actions.push(
                    dialogsSlice.actions.messageSent({
                        dialogId,
                        message: msg,
                    })
                )
            }
        })

        // Add assessment if requested
        if (options.withAssessment && dialog.assessment) {
            this.actions.push(
                dialogsSlice.actions.assessed({
                    dialogId,
                    assessment: dialog.assessment,
                })
            )
        }

        // Add operator alert if requested
        if (options.operatorAlerted) {
            this.actions.push(
                dialogsSlice.actions.operatorAlerted({
                    dialogId,
                    alert: {
                        reason: 'Low continuation score',
                        urgency: 'medium',
                        timestamp: Date.now(),
                    },
                })
            )
        }

        return dialogId
    }

    /**
     * Create dialog nearing continuation threshold
     */
    dialogNearingLimit(accountId: string): string {
        return this.createDialog({
            accountId,
            messageCount: 10,
            withAssessment: true,
            continuationScore: 0.35, // Just above threshold
        })
    }

    /**
     * Create dialog with operator alert
     */
    dialogWithAlert(accountId: string): string {
        return this.createDialog({
            accountId,
            messageCount: 8,
            withAssessment: true,
            continuationScore: 0.25, // Below threshold
            operatorAlerted: true,
        })
    }

    /**
     * Setup system configuration
     */
    configureSystem(options: {
        rateLimitPerMinute?: number
        maxDialogsPerAccount?: number
        openAIApiKey?: string
    } = {}) {
        this.actions.push(
            systemSlice.actions.configUpdated({
                config: {
                    rateLimitPerMinute: options.rateLimitPerMinute || 60,
                    maxDialogsPerAccount: options.maxDialogsPerAccount || 5,
                    openAIApiKey: options.openAIApiKey || 'test-api-key',
                },
            })
        )
    }

    /**
     * Create a complex scenario with multiple accounts and dialogs
     */
    complexScenario() {
        // Configure system
        this.configureSystem()

        // Create multiple accounts
        const account1 = this.connectedAccount()
        const account2 = this.connectedAccount()
        const account3 = this.accountWithFailedAuth()

        // Create dialogs for connected accounts
        this.createDialog({ accountId: account1, messageCount: 15 })
        this.dialogNearingLimit(account1)
        this.createDialog({ accountId: account2, messageCount: 5 })
        this.dialogWithAlert(account2)

        return {
            accountIds: [account1, account2, account3],
            actions: this.actions,
        }
    }

    /**
     * Create a saga test scenario
     */
    sagaTestScenario() {
        const accountId = this.connectedAccount()
        const dialogId = this.createDialog({
            accountId,
            messageCount: 3,
            withAssessment: false,
        })

        return {
            accountId,
            dialogId,
            actions: this.actions,
        }
    }

    /**
     * Get all actions to dispatch
     */
    getActions(): UnknownAction[] {
        return [...this.actions]
    }

    /**
     * Clear all actions
     */
    clear() {
        this.actions = []
    }

    /**
     * Static factory methods for common scenarios
     */
    static simpleAccount() {
        const builder = new ScenarioBuilder()
        const accountId = builder.connectedAccount()
        return { accountId, actions: builder.getActions() }
    }

    static accountWithDialog() {
        const builder = new ScenarioBuilder()
        const accountId = builder.connectedAccount()
        const dialogId = builder.createDialog({ accountId })
        return { accountId, dialogId, actions: builder.getActions() }
    }

    static fullSystem() {
        const builder = new ScenarioBuilder()
        return builder.complexScenario()
    }
}

/**
 * Export convenience functions
 */
export const createScenario = {
    /**
     * Create a simple connected account
     */
    simpleAccount: () => ScenarioBuilder.simpleAccount(),

    /**
     * Create account with active dialog
     */
    accountWithDialog: () => ScenarioBuilder.accountWithDialog(),

    /**
     * Create account with failed authentication
     */
    accountWithFailedAuth: () => {
        const builder = new ScenarioBuilder()
        const accountId = builder.accountWithFailedAuth()
        return { accountId, actions: builder.getActions() }
    },

    /**
     * Create dialog nearing continuation limit
     */
    dialogNearingLimit: () => {
        const builder = new ScenarioBuilder()
        const accountId = builder.connectedAccount()
        const dialogId = builder.dialogNearingLimit(accountId)
        return { accountId, dialogId, actions: builder.getActions() }
    },

    /**
     * Create complex multi-account scenario
     */
    fullSystem: () => ScenarioBuilder.fullSystem(),

    /**
     * Custom scenario with builder
     */
    custom: (fn: (builder: ScenarioBuilder) => void) => {
        const builder = new ScenarioBuilder()
        fn(builder)
        return builder.getActions()
    },
}