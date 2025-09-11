import { Effect } from 'effect'
import { 
    createSaga, 
    SagaEffects
} from '@packages/isomorphic'
import { accountSlice, dialogSlice } from './simple-store'

// Mock account status saga
export const accountStatusSaga = createSaga('accountStatus', Effect.gen(function* () {
    console.log('🤖 Account Status Saga started')
    
    // Get account IDs from current state
    const state = yield* SagaEffects.select((s: any) => s)
    const accountIds = state.accounts.ids
    
    if (accountIds.length === 0) {
        console.log('⚠️  No accounts found')
        return
    }
    
    const firstAccountId = accountIds[0]
    const secondAccountId = accountIds[1] || firstAccountId
    
    // Wait 2 seconds then connect the "connecting" account
    yield* Effect.sleep(2000)
    yield* SagaEffects.put(accountSlice.actions.connected({
        accountId: firstAccountId,
        ts: Date.now()
    }))
    console.log('✅ Account connected')

    // Wait 3 seconds then disconnect another account
    yield* Effect.sleep(3000)
    yield* SagaEffects.put(accountSlice.actions.disconnected({
        accountId: secondAccountId,
        ts: Date.now()
    }))
    console.log('❌ Account disconnected')

    // Wait 2 seconds then reconnect
    yield* Effect.sleep(2000)
    yield* SagaEffects.put(accountSlice.actions.connected({
        accountId: secondAccountId,
        ts: Date.now()
    }))
    console.log('🔄 Account reconnected')
}))

// Mock dialog workflow saga
export const dialogWorkflowSaga = createSaga('dialogWorkflow', Effect.gen(function* () {
    console.log('💬 Dialog Workflow Saga started')
    
    // Get current state to find existing dialogs
    const state = yield* SagaEffects.select((s: any) => s)
    const dialogIds = state.dialogs.ids
    
    if (dialogIds.length === 0) {
        console.log('⚠️  No dialogs found, skipping workflow')
        return
    }
    
    const firstDialogId = dialogIds[0]
    
    // Wait 1 second then add a message to existing dialog
    yield* Effect.sleep(1000)
    yield* SagaEffects.put(dialogSlice.actions.messageReceived({
        dialogId: firstDialogId,
        from: 'player',
        text: 'Actually, I also play Valorant sometimes. Do you?',
        messageId: `msg_${Date.now()}`,
        ts: Date.now()
    }))
    console.log('📨 Player message added to dialog')

    // Wait 2 seconds then respond as account
    yield* Effect.sleep(2000)
    yield* SagaEffects.put(dialogSlice.actions.messageSent({
        dialogId: firstDialogId,
        text: 'Nice! I love tactical shooters. Valorant is pretty fun, though I prefer CS2.',
        messageId: `msg_${Date.now()}`,
        ts: Date.now()
    }))
    console.log('📤 Account response sent')

    console.log('⏭️ Dialog saga completed')

    // Wait 3 seconds then update assessment scores for first dialog
    yield* Effect.sleep(3000)
    yield* SagaEffects.put(dialogSlice.actions.assessed({
        dialogId: firstDialogId,
        continuationScore: 0.92,
        trend: 'rising'
    }))
    console.log('📊 Dialog assessment updated')

    // Wait 1 second then trigger operator alert
    yield* Effect.sleep(1000)
    yield* SagaEffects.put(dialogSlice.actions.operatorAlerted({
        dialogId: firstDialogId,
        required: true,
        urgency: 'medium',
        reason: 'User asking sensitive questions about personal information'
    }))
    console.log('🚨 Operator alert triggered')

    // Wait 2 seconds then update progress
    yield* Effect.sleep(2000)
    yield* SagaEffects.put(dialogSlice.actions.progressUpdated({
        dialogId: firstDialogId,
        goalProgress: 0.65,
        tokensUsed: 445
    }))
    console.log('📈 Dialog progress updated')
    
    console.log('✅ Dialog workflow saga completed')
}))

// Combined root saga
export const rootSaga = Effect.gen(function* () {
    console.log('🚀 Starting all mock sagas...')
    
    // Fork both sagas to run concurrently
    yield* Effect.fork(accountStatusSaga.effect)
    yield* Effect.fork(dialogWorkflowSaga.effect)
    
    // Keep running forever
    yield* Effect.never
})