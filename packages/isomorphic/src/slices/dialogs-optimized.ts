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

// Type inference instead of explicit export
type Dialog = InferSchema<typeof DialogSchema>

// ============= Event Payloads =============

// These could also use schema utilities but kept for clarity
export const DialogMessageReceivedPayloadSchema = S.Struct({
    dialogId: DialogId,
    message: DialogMsgSchema,
})
type DialogMessageReceivedPayload = InferSchema<typeof DialogMessageReceivedPayloadSchema>

// ... rest of the file remains the same as original ...