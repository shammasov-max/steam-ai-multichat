import * as S from 'effect/Schema'
import { PayloadAction } from '@reduxjs/toolkit'
import { 
    type EntityActionPayload,
    addEntity,
    type EntityState
} from '../base/createEntitySlice'
import { createEntitySliceWithMemoization } from '../base/createEntitySliceWithMemoization'
import { Draft } from '@reduxjs/toolkit'
import { AccountId, DialogId } from '../types/branded'
import { createSelector } from 'reselect'

// Re-export types from original dialogs.ts (schemas are already exported via slices/index)
export type {
    Dialog,
    DialogMsg,
    UserInfo,
    ScoringFactors,
    Issue,
    OperatorAlert,
    DialogCreatedPayload,
    MessageReceivedPayload,
    MessageSentPayload,
    DialogAssessedPayload,
    DialogStatusUpdatedPayload,
    OperatorAlertPayload,
    DialogProgressUpdatedPayload,
    DialogMsgFrom,
    DialogStatus,
    Language,
    Gender,
    Urgency,
    Trend,
    IssueType,
    Severity
} from './dialogs'

// Import types we need
import type { 
    Dialog, 
    DialogStatus, 
    DialogMsgFrom,
    DialogMsg,
    ScoringFactors,
    Issue,
    Trend,
    Urgency
} from './dialogs'
import { DialogSchema } from './dialogs'

// ============= Constants =============

const MAX_MESSAGES = 50 // Limit messages per dialog to control snapshot size

// ============= Helper Functions =============

function trimMessages(messages: DialogMsg[]): DialogMsg[] {
    if (messages.length > MAX_MESSAGES) {
        // Keep only the last MAX_MESSAGES messages
        return messages.slice(messages.length - MAX_MESSAGES)
    }
    return messages
}

// ============= Create Memoized Slice =============

export const dialogSliceMemoized = createEntitySliceWithMemoization({
    name: 'dialog',
    initialEntities: [],
    entitySchema: DialogSchema as any,
    entityReducers: {
        // Event: dialogs/messageReceived
        'messageReceived': (
            dialog, 
            payload: EntityActionPayload<'dialog', { 
                from: DialogMsgFrom
                text: string
                messageId: string
                ts: number
                sequenceNumber?: number
            }>
        ) => {
            const message: DialogMsg = {
                id: payload.messageId,
                from: payload.from,
                text: payload.text,
                ts: payload.ts,
                sequenceNumber: payload.sequenceNumber
            }
            
            dialog.messages.push(message)
            dialog.messages = trimMessages(dialog.messages)
            dialog.lastMessageAt = payload.ts
            dialog.totalMessages++
        },
        
        // Event: dialogs/messageSent
        'messageSent': (
            dialog,
            payload: EntityActionPayload<'dialog', {
                text: string
                messageId: string
                ts: number
                sequenceNumber?: number
            }>
        ) => {
            const message: DialogMsg = {
                id: payload.messageId,
                from: 'account',
                text: payload.text,
                ts: payload.ts,
                sequenceNumber: payload.sequenceNumber
            }
            
            dialog.messages.push(message)
            dialog.messages = trimMessages(dialog.messages)
            dialog.lastMessageAt = payload.ts
            dialog.totalMessages++
        },
        
        // Event: dialogs/assessed
        'assessed': (
            dialog,
            payload: EntityActionPayload<'dialog', {
                continuationScore: number
                trend: Trend
                factors: ScoringFactors
                issuesDetected?: Issue[]
            }>
        ) => {
            dialog.continuationScore = payload.continuationScore
            dialog.trend = payload.trend
            dialog.scoringFactors = payload.factors
            dialog.issuesDetected = payload.issuesDetected || []
        },
        
        // Event: dialogs/statusUpdated
        'statusUpdated': (
            dialog,
            payload: EntityActionPayload<'dialog', {
                status: DialogStatus
                reason?: string
            }>
        ) => {
            dialog.status = payload.status
        },
        
        // Event: dialogs/operatorAlerted
        'operatorAlerted': (
            dialog,
            payload: EntityActionPayload<'dialog', {
                required: boolean
                urgency: Urgency
                reason: string
            }>
        ) => {
            dialog.operatorAlert = {
                required: payload.required,
                urgency: payload.urgency,
                reason: payload.reason
            }
        },
        
        // Event: dialogs/progressUpdated
        'progressUpdated': (
            dialog,
            payload: EntityActionPayload<'dialog', {
                goalProgress: number
                tokensUsed: number
            }>
        ) => {
            dialog.goalProgress = payload.goalProgress
            dialog.tokensUsed = payload.tokensUsed
        }
    },
    
    extraReducers: {
        // Event: dialogs/created
        'created': (
            state: Draft<EntityState<Dialog>>,
            action: PayloadAction<{
                dialogId: DialogId
                accountId: AccountId
                playerSteamId64: string
                language: string
                goal: string
                init: string
                userInfo?: any
            }>
        ) => {
            const newDialog: Dialog = {
                dialogId: action.payload.dialogId,
                accountId: action.payload.accountId,
                playerSteamId64: action.payload.playerSteamId64,
                status: 'created',
                language: action.payload.language as any,
                goal: action.payload.goal,
                init: action.payload.init,
                userInfo: action.payload.userInfo,
                messages: [],
                continuationScore: 1,
                trend: 'stable',
                issuesDetected: [],
                goalProgress: 0,
                tokensUsed: 0,
                totalMessages: 0
            }
            
            addEntity(state, newDialog, 'dialog')
        }
    }
})

// ============= Additional Memoized Selectors =============

// Get dialogs by status
export const selectDialogsByStatus = createSelector(
    [dialogSliceMemoized.selectAllEntities, (_state: any, status: DialogStatus) => status],
    (dialogs, status) => dialogs.filter(dialog => dialog.status === status)
)

// Get active dialogs
export const selectActiveDialogs = createSelector(
    [dialogSliceMemoized.selectAllEntities],
    dialogs => dialogs.filter(dialog => dialog.status === 'active')
)

// Get dialogs by account ID
export const selectDialogsByAccount = createSelector(
    [dialogSliceMemoized.selectAllEntities, (_state: any, accountId: string) => accountId],
    (dialogs, accountId) => dialogs.filter(dialog => dialog.accountId === accountId)
)

// Get dialogs by player Steam ID
export const selectDialogsByPlayer = createSelector(
    [dialogSliceMemoized.selectAllEntities, (_state: unknown, playerSteamId64: string) => playerSteamId64],
    (dialogs, playerSteamId64) => dialogs.filter(dialog => dialog.playerSteamId64 === playerSteamId64)
)

// Get dialogs needing operator attention
export const selectDialogsNeedingAttention = createSelector(
    [dialogSliceMemoized.selectAllEntities],
    dialogs => dialogs.filter(dialog => dialog.operatorAlert?.required === true)
)

// Get dialogs by urgency level
export const selectDialogsByUrgency = createSelector(
    [dialogSliceMemoized.selectAllEntities, (_state: unknown, urgency: Urgency) => urgency],
    (dialogs, urgency) => dialogs.filter(dialog => dialog.operatorAlert?.urgency === urgency)
)

// Get low-scoring dialogs (below threshold)
export const selectLowScoringDialogs = createSelector(
    [dialogSliceMemoized.selectAllEntities, (_state: any, threshold: number = 0.3) => threshold],
    (dialogs, threshold) => dialogs.filter(dialog => dialog.continuationScore < threshold)
)

// Get dialogs with declining trend
export const selectDecliningDialogs = createSelector(
    [dialogSliceMemoized.selectAllEntities],
    dialogs => dialogs.filter(dialog => dialog.trend === 'declining')
)

// Get dialogs by language
export const selectDialogsByLanguage = createSelector(
    [dialogSliceMemoized.selectAllEntities, (_state: any, language: string) => language],
    (dialogs, language) => dialogs.filter(dialog => dialog.language === language)
)

// Get recently active dialogs (had activity within specified milliseconds)
export const selectRecentlyActiveDialogs = createSelector(
    [dialogSliceMemoized.selectAllEntities, (_state: any, withinMs: number = 300000) => withinMs],
    (dialogs, withinMs) => {
        const now = Date.now()
        return dialogs.filter(dialog => 
            dialog.lastMessageAt && (now - dialog.lastMessageAt) <= withinMs
        )
    }
)

// Get dialogs with high token usage
export const selectHighTokenUsageDialogs = createSelector(
    [dialogSliceMemoized.selectAllEntities, (_state: any, threshold: number = 10000) => threshold],
    (dialogs, threshold) => dialogs.filter(dialog => dialog.tokensUsed > threshold)
)

// Get dialog statistics
export const selectDialogStatistics = createSelector(
    [dialogSliceMemoized.selectAllEntities],
    dialogs => ({
        total: dialogs.length,
        active: dialogs.filter(d => d.status === 'active').length,
        paused: dialogs.filter(d => d.status === 'paused').length,
        completed: dialogs.filter(d => d.status === 'completed').length,
        escalated: dialogs.filter(d => d.status === 'escalated').length,
        needingAttention: dialogs.filter(d => d.operatorAlert?.required).length,
        averageScore: dialogs.length > 0 
            ? dialogs.reduce((sum, d) => sum + d.continuationScore, 0) / dialogs.length 
            : 0,
        totalTokensUsed: dialogs.reduce((sum, d) => sum + d.tokensUsed, 0)
    })
)

// ============= Exports =============

export const { 
    actions: dialogActionsMemoized, 
    reducer: dialogReducerMemoized 
} = dialogSliceMemoized

export default dialogSliceMemoized