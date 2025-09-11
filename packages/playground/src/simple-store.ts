import { Runtime } from 'effect'
import { combineReducers } from '@reduxjs/toolkit'
import { 
    createEffectStore, 
    createEntitySlice
} from '@packages/isomorphic'

const now = Date.now()

// Create account slice with initial data
const accountSlice = createEntitySlice({
    name: 'account',
    initialEntities: [
        {
            accountId: 'account_1',
            steamId64: '76561198123456789',
            label: 'MainBot_001',
            proxyUrl: 'http://proxy1.example.com:8080',
            status: 'connected',
            lastSeen: now - 300000
        },
        {
            accountId: 'account_2',
            steamId64: '76561198987654321',
            label: 'TestAccount_002', 
            proxyUrl: 'http://proxy2.example.com:8080',
            status: 'connecting',
            lastSeen: now - 600000
        },
        {
            accountId: 'account_3',
            steamId64: '76561198555444333',
            label: 'BackupBot_003',
            proxyUrl: 'http://proxy3.example.com:8080',
            status: 'disconnected',
            lastSeen: now - 900000
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
        },
        authenticationFailed: (account: any, _payload: any) => {
            account.status = 'authFailed'
        }
    }
})

// Create dialog slice with initial data
const dialogSlice = createEntitySlice({
    name: 'dialog',
    initialEntities: [
        {
            dialogId: 'dialog_1',
            accountId: 'account_1',
            playerSteamId64: '76561198999888777',
            status: 'active',
            language: 'en',
            goal: 'Engage in friendly conversation and build rapport',
            messages: [
                {
                    id: 'msg_1',
                    from: 'account',
                    text: 'Hey! I noticed we both play similar games. What\'s your favorite?',
                    ts: now - 120000
                },
                {
                    id: 'msg_2',
                    from: 'player',
                    text: 'Hi! I love CS2 and Dota 2. What about you?',
                    ts: now - 60000
                }
            ],
            continuationScore: 0.85,
            trend: 'rising',
            goalProgress: 0.3,
            tokensUsed: 245,
            lastMessageAt: now - 60000,
            totalMessages: 2
        },
        {
            dialogId: 'dialog_2',
            accountId: 'account_2',
            playerSteamId64: '76561198777666555', 
            status: 'created',
            language: 'zh',
            goal: 'Discuss gaming strategies and build friendship',
            messages: [],
            continuationScore: 1.0,
            trend: 'stable',
            goalProgress: 0,
            tokensUsed: 0,
            totalMessages: 0
        }
    ] as any[],
    entityReducers: {
        messageReceived: (dialog: any, payload: any) => {
            const newMessage = {
                id: payload.messageId,
                from: payload.from,
                text: payload.text,
                ts: payload.ts
            }
            dialog.messages = [...dialog.messages, newMessage].slice(-50)
            dialog.lastMessageAt = payload.ts
            dialog.totalMessages = dialog.totalMessages + 1
        },
        messageSent: (dialog: any, payload: any) => {
            const newMessage = {
                id: payload.messageId,
                from: 'account',
                text: payload.text,
                ts: payload.ts
            }
            dialog.messages = [...dialog.messages, newMessage].slice(-50)
            dialog.lastMessageAt = payload.ts
            dialog.totalMessages = dialog.totalMessages + 1
        },
        assessed: (dialog: any, payload: any) => {
            dialog.continuationScore = payload.continuationScore
            dialog.trend = payload.trend
        },
        operatorAlerted: (dialog: any, payload: any) => {
            dialog.operatorAlert = {
                required: payload.required,
                urgency: payload.urgency,
                reason: payload.reason
            }
        },
        progressUpdated: (dialog: any, payload: any) => {
            dialog.goalProgress = payload.goalProgress
            dialog.tokensUsed = payload.tokensUsed
        }
    }
})

// Create system slice
const systemSlice = createEntitySlice({
    name: 'system',
    initialEntities: [],
    entityReducers: {}
})

// Root reducer
const rootReducer = combineReducers({
    accounts: accountSlice.reducer,
    dialogs: dialogSlice.reducer,
    systems: systemSlice.reducer
})

export type RootState = ReturnType<typeof rootReducer>

// Create the effect store
export const store = createEffectStore({
    reducer: rootReducer,
    runtime: Runtime.defaultRuntime,
    debug: true,
    devTools: true
})

// Export slices for saga access
export { accountSlice, dialogSlice }

// Expose store globally for debugging
;(window as any).store = store

console.log('✅ Simple store created with initial data')
console.log('🔍 Initial state:', store.getState())

export default store