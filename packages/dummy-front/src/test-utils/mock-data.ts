import { typeid } from 'typeid-js'
import type { Account } from '@packages/isomorphic/src/slices/accounts'
import type { Dialog, DialogMessage } from '@packages/isomorphic/src/slices/dialogs'

/**
 * Mock data generators for testing
 */

/**
 * Generate random Steam ID 64
 */
export const generateSteamId64 = (): string => {
    // Steam ID64 format: 76561197960265728 + account number
    const baseId = BigInt('76561197960265728')
    const accountNum = BigInt(Math.floor(Math.random() * 1000000000))
    return (baseId + accountNum).toString()
}

/**
 * Generate random proxy URL
 */
export const generateProxyUrl = (): string => {
    const providers = ['proxy1', 'proxy2', 'proxy3', 'fastproxy', 'secureproxy']
    const provider = providers[Math.floor(Math.random() * providers.length)]
    const port = 8000 + Math.floor(Math.random() * 1000)
    return `http://${provider}.example.com:${port}`
}

/**
 * Generate random account name
 */
export const generateAccountName = (): string => {
    const adjectives = ['swift', 'brave', 'clever', 'mighty', 'silent']
    const nouns = ['falcon', 'tiger', 'wolf', 'eagle', 'dragon']
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const num = Math.floor(Math.random() * 9999)
    return `${adj}_${noun}_${num}`
}

/**
 * Generate mock account
 */
export const mockAccount = (overrides?: Partial<Account>): Account => ({
    accountId: typeid('account').toString(),
    steamId64: generateSteamId64(),
    accountName: generateAccountName(),
    displayName: null,
    status: 'disconnected',
    proxy: generateProxyUrl(),
    rateLimitedUntil: null,
    lastError: null,
    connectedAt: null,
    maFile: null,
    lastDisconnectReason: null,
    lastEventTime: Date.now(),
    ...overrides,
})

/**
 * Generate conversation messages
 */
export const generateConversation = (length: number = 5): DialogMessage[] => {
    const templates = {
        user: [
            'Hi, how are you?',
            'What games do you play?',
            'Nice to meet you!',
            'Do you want to trade?',
            'What level are you?',
            'Are you online often?',
            'Cool profile!',
            'Thanks for accepting!',
        ],
        assistant: [
            "I'm doing well, thanks for asking!",
            'I mostly play CS2 and Dota 2',
            'Nice to meet you too!',
            'Sure, what are you looking for?',
            "I'm level 42, been playing for years",
            'Usually in the evenings',
            'Thanks! Yours is nice too',
            'No problem, happy to connect!',
        ],
    }

    const messages: DialogMessage[] = []
    for (let i = 0; i < length; i++) {
        const role = i % 2 === 0 ? 'user' : 'assistant'
        const templateList = templates[role]
        const content = templateList[i % templateList.length]

        messages.push({
            role,
            content,
            timestamp: Date.now() - (length - i) * 60000, // 1 minute apart
        })
    }

    return messages
}

/**
 * Generate mock dialog
 */
export const mockDialog = (overrides?: Partial<Dialog>): Dialog => {
    const messages = generateConversation(5)

    return {
        dialogId: typeid('dialog').toString(),
        accountId: typeid('account').toString(),
        partnerId: `partner_${Math.random().toString(36).substr(2, 9)}`,
        status: 'active',
        startedAt: Date.now() - 3600000, // 1 hour ago
        messages,
        assessment: {
            continuationScore: 0.75,
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
        },
        metadata: {
            agentEnabled: true,
            lastActivityAt: Date.now(),
            messageCount: messages.length,
            operatorAlerted: false,
        },
        progress: {
            stage: 'conversation',
            stageStartedAt: Date.now() - 3600000,
        },
        ...overrides,
    }
}

/**
 * Generate batch of test accounts
 */
export const generateAccounts = (count: number): Account[] => {
    return Array.from({ length: count }, (_, i) =>
        mockAccount({
            accountName: `test_account_${i}`,
            status: i % 3 === 0 ? 'connected' : 'disconnected',
            connectedAt: i % 3 === 0 ? Date.now() : null,
        })
    )
}

/**
 * Generate batch of test dialogs
 */
export const generateDialogs = (count: number, accountIds: string[]): Dialog[] => {
    return Array.from({ length: count }, (_, i) => {
        const accountId = accountIds[i % accountIds.length]
        const messageCount = 3 + Math.floor(Math.random() * 10)

        return mockDialog({
            accountId,
            messages: generateConversation(messageCount),
            assessment: {
                continuationScore: 0.3 + Math.random() * 0.6,
                trend: ['rising', 'stable', 'declining'][Math.floor(Math.random() * 3)] as any,
                lastAssessedAt: Date.now(),
                assessmentCount: 1 + Math.floor(Math.random() * 5),
                scoringFactors: {
                    engagement: 0.5 + Math.random() * 0.5,
                    relevance: 0.5 + Math.random() * 0.5,
                    tone: 0.5 + Math.random() * 0.5,
                    quality: 0.5 + Math.random() * 0.5,
                    goalProximity: 0.5 + Math.random() * 0.5,
                },
                issues: Math.random() > 0.7
                    ? [{
                          type: 'low_engagement',
                          severity: 'medium',
                          message: 'Partner seems disinterested',
                          detectedAt: Date.now(),
                      }]
                    : [],
            },
        })
    })
}

/**
 * Test data presets
 */
export const testData = {
    /**
     * Single account with no dialogs
     */
    singleAccount: () => ({
        accounts: [mockAccount({ status: 'connected', connectedAt: Date.now() })],
        dialogs: [],
    }),

    /**
     * Multiple accounts with various states
     */
    multipleAccounts: () => ({
        accounts: [
            mockAccount({ accountName: 'connected_account', status: 'connected', connectedAt: Date.now() }),
            mockAccount({ accountName: 'disconnected_account', status: 'disconnected' }),
            mockAccount({
                accountName: 'error_account',
                status: 'error',
                lastError: 'Authentication failed',
            }),
            mockAccount({
                accountName: 'rate_limited',
                status: 'connected',
                rateLimitedUntil: Date.now() + 60000,
            }),
        ],
        dialogs: [],
    }),

    /**
     * Account with active dialogs
     */
    activeDialogs: () => {
        const account = mockAccount({ status: 'connected', connectedAt: Date.now() })
        const dialogs = generateDialogs(3, [account.accountId])

        return {
            accounts: [account],
            dialogs,
        }
    },

    /**
     * Complex scenario with multiple accounts and dialogs
     */
    complexScenario: () => {
        const accounts = generateAccounts(5)
        const accountIds = accounts.map((a) => a.accountId)
        const dialogs = generateDialogs(10, accountIds)

        return {
            accounts,
            dialogs,
        }
    },

    /**
     * Stress test data
     */
    stressTest: () => {
        const accounts = generateAccounts(100)
        const accountIds = accounts.map((a) => a.accountId)
        const dialogs = generateDialogs(500, accountIds)

        return {
            accounts,
            dialogs,
        }
    },
}