import * as S from 'effect/Schema'
import { PayloadAction } from '@reduxjs/toolkit'
import { 
    createEntitySlice, 
    type EntityActionPayload,
    addEntity,
    type EntityState
} from '../base/createEntitySlice'
import { Draft } from '@reduxjs/toolkit'
import { AccountId, DialogId } from '../types/branded'

// ============= Constants =============

const MAX_MESSAGES = 50 // Limit messages per dialog to control snapshot size

// ============= Core Schemas =============

export const DialogMsgFromSchema = S.Union(
    S.Literal('account'),
    S.Literal('player'),
    S.Literal('system')
)
export type DialogMsgFrom = S.Schema.Type<typeof DialogMsgFromSchema>

export const DialogStatusSchema = S.Union(
    S.Literal('active'),
    S.Literal('paused'),
    S.Literal('completed'),
    S.Literal('escalated'),
    S.Literal('created')
)
export type DialogStatus = S.Schema.Type<typeof DialogStatusSchema>

export const LanguageSchema = S.Union(
    S.Literal('zh'),
    S.Literal('ja'),
    S.Literal('ko'),
    S.Literal('en'),
    S.Literal('es')
)
export type Language = S.Schema.Type<typeof LanguageSchema>

export const GenderSchema = S.Union(
    S.Literal('male'),
    S.Literal('female'),
    S.Literal('other')
)
export type Gender = S.Schema.Type<typeof GenderSchema>

export const UrgencySchema = S.Union(
    S.Literal('low'),
    S.Literal('medium'),
    S.Literal('high'),
    S.Literal('critical')
)
export type Urgency = S.Schema.Type<typeof UrgencySchema>

export const TrendSchema = S.Union(
    S.Literal('rising'),
    S.Literal('stable'),
    S.Literal('declining')
)
export type Trend = S.Schema.Type<typeof TrendSchema>

export const IssueTypeSchema = S.Union(
    S.Literal('explicit_rejection'),
    S.Literal('topic_drift'),
    S.Literal('aggressive_response'),
    S.Literal('low_engagement')
)
export type IssueType = S.Schema.Type<typeof IssueTypeSchema>

export const SeveritySchema = S.Union(
    S.Literal('low'),
    S.Literal('medium'),
    S.Literal('high'),
    S.Literal('critical')
)
export type Severity = S.Schema.Type<typeof SeveritySchema>

// ============= Entity Schemas =============

export const DialogMsgSchema = S.Struct({
    id: S.String.annotations({ title: "Message ID", description: "Unique message identifier" }),
    from: DialogMsgFromSchema.annotations({ title: "Sender", description: "Message sender type" }),
    text: S.String.annotations({ title: "Text", description: "Message content" }),
    ts: S.Number.annotations({ title: "Timestamp", description: "UTC epoch milliseconds" }),
    sequenceNumber: S.optional(S.Number.annotations({ title: "Sequence Number", description: "Message sequence in conversation" }))
}).annotations({ title: "Dialog Message", description: "Individual dialog message" })

export const UserInfoSchema = S.Struct({
    country: S.optional(S.String.annotations({ title: "Country" })),
    city: S.optional(S.String.annotations({ title: "City" })),
    age: S.optional(S.Number.annotations({ title: "Age" })),
    gender: S.optional(GenderSchema.annotations({ title: "Gender" })),
    games: S.optional(S.Array(S.String).annotations({ title: "Games", description: "List of games user plays" }))
}).annotations({ title: "User Info", description: "User demographic and preference information" })

export const ScoringFactorsSchema = S.Struct({
    userEngagement: S.Number.annotations({ title: "User Engagement", description: "Score 0-1" }),
    topicRelevance: S.Number.annotations({ title: "Topic Relevance", description: "Score 0-1" }),
    emotionalTone: S.Number.annotations({ title: "Emotional Tone", description: "Score 0-1" }),
    responseQuality: S.Number.annotations({ title: "Response Quality", description: "Score 0-1" }),
    goalProximity: S.Number.annotations({ title: "Goal Proximity", description: "Score 0-1" })
}).annotations({ title: "Scoring Factors", description: "AI assessment scoring factors" })

export const IssueSchema = S.Struct({
    type: IssueTypeSchema.annotations({ title: "Issue Type" }),
    severity: SeveritySchema.annotations({ title: "Severity" }),
    description: S.String.annotations({ title: "Description" })
}).annotations({ title: "Issue", description: "Detected dialog issue" })

export const OperatorAlertSchema = S.Struct({
    required: S.Boolean.annotations({ title: "Required" }),
    urgency: UrgencySchema.annotations({ title: "Urgency" }),
    reason: S.String.annotations({ title: "Reason" })
}).annotations({ title: "Operator Alert" })

export const DialogSchema = S.Struct({
    dialogId: DialogId.annotations({ title: "Dialog ID", description: "Unique dialog identifier" }),
    accountId: AccountId.annotations({ title: "Account ID", description: "Associated account identifier" }),
    playerSteamId64: S.String.annotations({ title: "Player Steam ID", description: "Player's Steam 64-bit ID" }),
    status: DialogStatusSchema.annotations({ title: "Status", description: "Current dialog status" }),
    language: LanguageSchema.annotations({ title: "Language", description: "Dialog language" }),
    goal: S.String.annotations({ title: "Goal", description: "Dialog goal/objective" }),
    init: S.String.annotations({ title: "Init", description: "Initial instructions and context" }),
    userInfo: S.optional(UserInfoSchema),
    messages: S.Array(DialogMsgSchema).annotations({ title: "Messages", description: "Dialog message history" }),
    continuationScore: S.Number.annotations({ title: "Continuation Score", description: "AI assessment score 0-1" }),
    trend: TrendSchema.annotations({ title: "Trend", description: "Score trend direction" }),
    scoringFactors: S.optional(ScoringFactorsSchema),
    issuesDetected: S.Array(IssueSchema).annotations({ title: "Issues Detected", description: "List of detected issues" }),
    goalProgress: S.Number.annotations({ title: "Goal Progress", description: "Progress towards goal 0-1" }),
    tokensUsed: S.Number.annotations({ title: "Tokens Used", description: "Total OpenAI tokens consumed" }),
    operatorAlert: S.optional(OperatorAlertSchema),
    lastMessageAt: S.optional(S.Number.annotations({ title: "Last Message At", description: "Timestamp of last message" })),
    totalMessages: S.Number.annotations({ title: "Total Messages", description: "Total message count" })
}).annotations({ title: "Dialog", description: "AI-powered dialog conversation entity" })

// Derive types from schemas
export type DialogMsg = S.Schema.Type<typeof DialogMsgSchema>
export type UserInfo = S.Schema.Type<typeof UserInfoSchema>
export type ScoringFactors = S.Schema.Type<typeof ScoringFactorsSchema>
export type Issue = S.Schema.Type<typeof IssueSchema>
export type OperatorAlert = S.Schema.Type<typeof OperatorAlertSchema>
export type Dialog = S.Schema.Type<typeof DialogSchema>

// ============= Event Payload Schemas =============

export const DialogCreatedPayloadSchema = S.Struct({
    dialogId: DialogId,
    accountId: AccountId,
    playerSteamId64: S.String,
    language: LanguageSchema,
    goal: S.String,
    init: S.String,
    userInfo: S.optional(UserInfoSchema)
})
export type DialogCreatedPayload = S.Schema.Type<typeof DialogCreatedPayloadSchema>

export const MessageReceivedPayloadSchema = S.Struct({
    dialogId: DialogId,
    from: DialogMsgFromSchema,
    text: S.String,
    messageId: S.optional(S.String),
    ts: S.optional(S.Number)
})
export type MessageReceivedPayload = S.Schema.Type<typeof MessageReceivedPayloadSchema>

export const MessageSentPayloadSchema = S.Struct({
    dialogId: DialogId,
    text: S.String,
    sequenceNumber: S.optional(S.Number),
    messageId: S.optional(S.String),
    ts: S.optional(S.Number)
})
export type MessageSentPayload = S.Schema.Type<typeof MessageSentPayloadSchema>

export const DialogAssessedPayloadSchema = S.Struct({
    dialogId: DialogId,
    continuationScore: S.Number,
    trend: TrendSchema,
    factors: ScoringFactorsSchema,
    issuesDetected: S.optional(S.Array(IssueSchema))
})
export type DialogAssessedPayload = S.Schema.Type<typeof DialogAssessedPayloadSchema>

export const DialogStatusUpdatedPayloadSchema = S.Struct({
    dialogId: DialogId,
    status: DialogStatusSchema,
    reason: S.optional(S.String)
})
export type DialogStatusUpdatedPayload = S.Schema.Type<typeof DialogStatusUpdatedPayloadSchema>

export const OperatorAlertPayloadSchema = S.Struct({
    dialogId: DialogId,
    required: S.Boolean,
    urgency: UrgencySchema,
    reason: S.String
})
export type OperatorAlertPayload = S.Schema.Type<typeof OperatorAlertPayloadSchema>

export const DialogProgressUpdatedPayloadSchema = S.Struct({
    dialogId: DialogId,
    goalProgress: S.Number,
    tokensUsed: S.Number
})
export type DialogProgressUpdatedPayload = S.Schema.Type<typeof DialogProgressUpdatedPayloadSchema>

// ============= Helper Functions =============

function trimMessages(messages: DialogMsg[]): DialogMsg[] {
    if (messages.length > MAX_MESSAGES) {
        // Keep only the last MAX_MESSAGES messages
        return messages.slice(messages.length - MAX_MESSAGES)
    }
    return messages
}

// ============= Create Slice =============

export const dialogSlice = createEntitySlice({
    name: 'dialog',
    initialEntities: [],
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
            const newMessage: DialogMsg = {
                id: payload.messageId,
                from: payload.from,
                text: payload.text,
                ts: payload.ts,
                ...(payload.sequenceNumber !== undefined && { sequenceNumber: payload.sequenceNumber })
            }
            
            dialog.messages = trimMessages([...dialog.messages, newMessage])
            dialog.lastMessageAt = payload.ts
            dialog.totalMessages = dialog.totalMessages + 1
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
            const newMessage: DialogMsg = {
                id: payload.messageId,
                from: 'account',
                text: payload.text,
                ts: payload.ts,
                ...(payload.sequenceNumber !== undefined && { sequenceNumber: payload.sequenceNumber })
            }
            
            dialog.messages = trimMessages([...dialog.messages, newMessage])
            dialog.lastMessageAt = payload.ts
            dialog.totalMessages = dialog.totalMessages + 1
        },
        
        // Event: dialogs/assessed
        'assessed': (
            dialog,
            payload: EntityActionPayload<'dialog', {
                continuationScore: number
                trend: 'rising' | 'stable' | 'declining'
                factors: ScoringFactors
                issuesDetected?: Issue[]
            }>
        ) => {
            dialog.continuationScore = payload.continuationScore
            dialog.trend = payload.trend
            dialog.scoringFactors = payload.factors
            if (payload.issuesDetected) {
                dialog.issuesDetected = payload.issuesDetected
            }
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
                urgency: 'low' | 'medium' | 'high' | 'critical'
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
        // Event: dialogs/created - creates new entity
        created: (
            state: Draft<EntityState<Dialog>>,
            action: PayloadAction<DialogCreatedPayload>
        ) => {
            const newDialog: Dialog = {
                dialogId: action.payload.dialogId,
                accountId: action.payload.accountId,
                playerSteamId64: action.payload.playerSteamId64,
                status: 'created',
                language: action.payload.language,
                goal: action.payload.goal,
                init: action.payload.init,
                ...(action.payload.userInfo && { userInfo: action.payload.userInfo }),
                messages: [],
                continuationScore: 1.0,
                trend: 'stable',
                issuesDetected: [],
                goalProgress: 0,
                tokensUsed: 0,
                totalMessages: 0
            }
            
            addEntity(state, newDialog, 'dialog')
        }
    }
    
    // entitySchema: DialogSchema // Schema compatibility will be addressed in future refactor
})

// ============= Exports =============

export const { actions: dialogActions, reducer: dialogReducer } = dialogSlice
export default dialogSlice
