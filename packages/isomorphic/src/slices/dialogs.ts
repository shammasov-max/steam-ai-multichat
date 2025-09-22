import * as S from 'effect/Schema'
import { PayloadAction } from '@reduxjs/toolkit'
import {
    createEntitySlice,
    type EntityActionPayload,
    addEntity,
    type EntityState,
} from '../base/createEntitySlice'
import { Draft } from '@reduxjs/toolkit'
import { AccountId, DialogId } from '../types/branded'
import { createUnionSchema, createEntitySchema, withAnnotations, nullable, type InferSchema } from '../utils/schema-helpers'
import { createErrorClass } from '../utils/error-factories'

// ============= Constants =============

const MAX_MESSAGES = 50 // Limit messages per dialog to control snapshot size

// ============= Core Schemas - Using Utilities =============

// Before: 4 lines → After: 1 line (per union)
export const DialogMsgFromSchema = createUnionSchema('DialogMsgFrom', ['account', 'player', 'system'] as const)
export const DialogStatusSchema = createUnionSchema('DialogStatus', ['active', 'paused', 'completed', 'escalated', 'created'] as const)
export const LanguageSchema = createUnionSchema('Language', ['zh', 'ja', 'ko', 'en', 'es'] as const)
export const GenderSchema = createUnionSchema('Gender', ['male', 'female', 'other'] as const)
export const UrgencySchema = createUnionSchema('Urgency', ['low', 'medium', 'high', 'critical'] as const)
export const TrendSchema = createUnionSchema('Trend', ['rising', 'stable', 'declining'] as const)
export const IssueTypeSchema = createUnionSchema('IssueType', ['explicit_rejection', 'topic_drift', 'aggressive_response', 'low_engagement'] as const)
export const SeveritySchema = createUnionSchema('Severity', ['low', 'medium', 'high', 'critical'] as const)

// Infer types instead of explicit exports (saves 8 lines)
type DialogMsgFrom = InferSchema<typeof DialogMsgFromSchema>
type DialogStatus = InferSchema<typeof DialogStatusSchema>
type Language = InferSchema<typeof LanguageSchema>
type Gender = InferSchema<typeof GenderSchema>
type Urgency = InferSchema<typeof UrgencySchema>
type Trend = InferSchema<typeof TrendSchema>
type IssueType = InferSchema<typeof IssueTypeSchema>
type Severity = InferSchema<typeof SeveritySchema>

// ============= Entity Schemas - Using Utilities =============

export const DialogMsgSchema = S.Struct({
    id: withAnnotations(S.String, 'Message ID', 'Unique message identifier'),
    from: withAnnotations(DialogMsgFromSchema, 'Sender', 'Message sender type'),
    text: withAnnotations(S.String, 'Text', 'Message content'),
    ts: withAnnotations(S.Number, 'Timestamp', 'UTC epoch milliseconds'),
    sequenceNumber: S.optional(withAnnotations(S.Number, 'Sequence Number', 'Message sequence in conversation')),
}).annotations({ title: 'Dialog Message' })

export const UserInfoSchema = S.Struct({
    country: S.optional(withAnnotations(S.String, 'Country')),
    city: S.optional(withAnnotations(S.String, 'City')),
    age: S.optional(withAnnotations(S.Number, 'Age')),
    gender: S.optional(withAnnotations(GenderSchema, 'Gender')),
    games: S.optional(withAnnotations(S.Array(S.String), 'Games', 'List of games user plays')),
}).annotations({ title: 'User Info' })

export const ScoringFactorsSchema = S.Struct({
    userEngagement: withAnnotations(S.Number, 'User Engagement', 'Score 0-1'),
    topicRelevance: withAnnotations(S.Number, 'Topic Relevance', 'Score 0-1'),
    tone: withAnnotations(S.Number, 'Tone', 'Score 0-1'),
    conversationQuality: withAnnotations(S.Number, 'Conversation Quality', 'Score 0-1'),
    goalProximity: withAnnotations(S.Number, 'Goal Proximity', 'Score 0-1'),
})

export const AssessmentResultSchema = S.Struct({
    dialogId: DialogId,
    assessmentId: withAnnotations(S.String, 'Assessment ID'),
    timestamp: withAnnotations(S.Number, 'Timestamp', 'Assessment time'),
    continuationScore: withAnnotations(S.Number, 'Continuation Score', '0-1 score'),
    trend: withAnnotations(TrendSchema, 'Score Trend'),
    scoringFactors: ScoringFactorsSchema,
    issues: S.Array(S.Struct({
        type: IssueTypeSchema,
        severity: SeveritySchema,
        description: S.String,
    })),
    suggestions: S.Array(withAnnotations(S.String, 'Suggestion')),
    detectedLanguage: nullable(LanguageSchema),
    confidence: withAnnotations(S.Number, 'Confidence', 'Model confidence 0-1'),
})

export const OperatorAlertSchema = S.Struct({
    alertId: withAnnotations(S.String, 'Alert ID'),
    dialogId: DialogId,
    accountId: AccountId,
    timestamp: withAnnotations(S.Number, 'Alert Time'),
    urgency: UrgencySchema,
    reason: withAnnotations(S.String, 'Alert Reason'),
    suggestedAction: nullable(S.String),
})

// Main dialog schema - using createEntitySchema would save ~10 lines
export const DialogSchema = S.Struct({
    dialogId: DialogId,
    accountId: AccountId,
    playerSteamId64: withAnnotations(S.String, 'Player Steam ID'),
    status: DialogStatusSchema,
    messages: withAnnotations(S.Array(DialogMsgSchema), 'Messages'),
    messageTrimmed: withAnnotations(S.Boolean, 'Messages Trimmed', 'True if old messages removed'),
    contextMessage: nullable(withAnnotations(S.String, 'Context Message')),
    metadata: S.optional(S.Struct({
        userInfo: S.optional(UserInfoSchema),
        targetGameId: nullable(S.String),
        language: nullable(LanguageSchema),
        startedAt: S.Number,
        lastActivityAt: S.Number,
    })),
    assessment: nullable(AssessmentResultSchema),
    operatorAlert: nullable(OperatorAlertSchema),
    agentEnabled: withAnnotations(S.Boolean, 'Agent Enabled'),
    goal: nullable(withAnnotations(S.String, 'Dialog Goal')),
    progress: S.optional(S.Number),
    createdAt: S.Number,
    updatedAt: S.Number,
}).annotations({
    title: 'Dialog',
    indexes: [
        { fields: { dialogId: 1 }, options: { unique: true } },
        { fields: { accountId: 1 } },
        { fields: { status: 1 } },
    ],
})

// Export Dialog type for external use
export type Dialog = InferSchema<typeof DialogSchema>

// ============= Error Classes using Error-Factories =============

export const DialogNotFoundError = createErrorClass('DialogNotFoundError')({
    dialogId: 'string'
})

export const DialogAssessmentError = createErrorClass('DialogAssessmentError')({
    dialogId: 'string',
    message: 'string',
    assessmentType: 'string | undefined'
})

// ============= Event Payloads =============

export const DialogCreatedPayloadSchema = S.Struct({
    dialogId: DialogId,
    accountId: AccountId,
    playerSteamId64: S.String,
    contextMessage: S.optional(S.String),
})
export type DialogCreatedPayload = InferSchema<typeof DialogCreatedPayloadSchema>

export const MessageReceivedPayloadSchema = S.Struct({
    dialogId: DialogId,
    message: DialogMsgSchema,
})
export type MessageReceivedPayload = InferSchema<typeof MessageReceivedPayloadSchema>

export const MessageSentPayloadSchema = S.Struct({
    dialogId: DialogId,
    message: DialogMsgSchema,
})
export type MessageSentPayload = InferSchema<typeof MessageSentPayloadSchema>

export const DialogAssessedPayloadSchema = S.Struct({
    dialogId: DialogId,
    assessment: AssessmentResultSchema,
})
export type DialogAssessedPayload = InferSchema<typeof DialogAssessedPayloadSchema>

export const DialogStatusUpdatedPayloadSchema = S.Struct({
    dialogId: DialogId,
    status: DialogStatusSchema,
})
export type DialogStatusUpdatedPayload = InferSchema<typeof DialogStatusUpdatedPayloadSchema>

export const OperatorAlertPayloadSchema = S.Struct({
    dialogId: DialogId,
    alert: OperatorAlertSchema,
})
export type OperatorAlertPayload = InferSchema<typeof OperatorAlertPayloadSchema>

export const DialogProgressUpdatedPayloadSchema = S.Struct({
    dialogId: DialogId,
    progress: S.Number,
})
export type DialogProgressUpdatedPayload = InferSchema<typeof DialogProgressUpdatedPayloadSchema>

// Legacy alias for compatibility
export const DialogMessageReceivedPayloadSchema = MessageReceivedPayloadSchema
export type DialogMessageReceivedPayload = MessageReceivedPayload

// ============= Additional Types for Export =============

export type DialogMsg = InferSchema<typeof DialogMsgSchema>
export type UserInfo = InferSchema<typeof UserInfoSchema>
export type ScoringFactors = InferSchema<typeof ScoringFactorsSchema>
export type Issue = {
    type: InferSchema<typeof IssueTypeSchema>
    severity: InferSchema<typeof SeveritySchema>
    description: string
}

// Issue schema for export (referenced in index.ts)
export const IssueSchema = S.Struct({
    type: IssueTypeSchema,
    severity: SeveritySchema,
    description: S.String,
})

// ============= Create Slice =============

export const dialogSlice = createEntitySlice({
    name: 'dialog',
    initialEntities: [] as Draft<Dialog>[],
    entitySchema: DialogSchema as S.Schema<any, unknown, never>,
    entityReducers: {
        // Event: dialogs/messageReceived
        messageReceived: (
            dialog: Draft<Dialog>,
            payload: EntityActionPayload<'dialog', { message: DialogMsg }>
        ) => {
            dialog.messages.push(payload.message)
            dialog.updatedAt = Date.now()

            // Trim messages if over limit
            if (dialog.messages.length > MAX_MESSAGES) {
                dialog.messages = dialog.messages.slice(-MAX_MESSAGES)
                dialog.messageTrimmed = true
            }

            // Update metadata last activity
            if (dialog.metadata) {
                dialog.metadata.lastActivityAt = Date.now()
            }
        },

        // Event: dialogs/messageSent
        messageSent: (
            dialog: Draft<Dialog>,
            payload: EntityActionPayload<'dialog', { message: DialogMsg }>
        ) => {
            dialog.messages.push(payload.message)
            dialog.updatedAt = Date.now()

            // Trim messages if over limit
            if (dialog.messages.length > MAX_MESSAGES) {
                dialog.messages = dialog.messages.slice(-MAX_MESSAGES)
                dialog.messageTrimmed = true
            }

            // Update metadata last activity
            if (dialog.metadata) {
                dialog.metadata.lastActivityAt = Date.now()
            }
        },

        // Event: dialogs/assessed
        assessed: (
            dialog: Draft<Dialog>,
            payload: EntityActionPayload<'dialog', { assessment: InferSchema<typeof AssessmentResultSchema> }>
        ) => {
            dialog.assessment = payload.assessment as any
            dialog.updatedAt = Date.now()
        },

        // Event: dialogs/statusUpdated
        statusUpdated: (
            dialog: Draft<Dialog>,
            payload: EntityActionPayload<'dialog', { status: InferSchema<typeof DialogStatusSchema> }>
        ) => {
            dialog.status = payload.status
            dialog.updatedAt = Date.now()
        },

        // Event: dialogs/operatorAlerted
        operatorAlerted: (
            dialog: Draft<Dialog>,
            payload: EntityActionPayload<'dialog', { alert: InferSchema<typeof OperatorAlertSchema> }>
        ) => {
            dialog.operatorAlert = payload.alert
            dialog.updatedAt = Date.now()
        },

        // Event: dialogs/progressUpdated
        progressUpdated: (
            dialog: Draft<Dialog>,
            payload: EntityActionPayload<'dialog', { progress: number }>
        ) => {
            dialog.progress = payload.progress
            dialog.updatedAt = Date.now()
        },
    },
    extraReducers: {
        // Event: dialogs/created - creates new dialog entity
        created: (
            state: Draft<EntityState<Dialog>>,
            action: PayloadAction<{
                dialogId: string
                accountId: string
                playerSteamId64: string
                contextMessage?: string
            }>
        ) => {
            const newDialog: Dialog = {
                dialogId: action.payload.dialogId as any,
                accountId: action.payload.accountId as any,
                playerSteamId64: action.payload.playerSteamId64,
                status: 'created',
                messages: [],
                messageTrimmed: false,
                contextMessage: action.payload.contextMessage || null,
                metadata: {
                    startedAt: Date.now(),
                    lastActivityAt: Date.now(),
                    language: null,
                    targetGameId: null,
                },
                assessment: null,
                operatorAlert: null,
                agentEnabled: true,
                goal: null,
                progress: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }
            addEntity(state, newDialog, 'dialog')
        },
    },
})

// ============= Exports =============

export const { actions: dialogActions, reducer: dialogReducer } = dialogSlice
export default dialogSlice