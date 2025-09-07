import { Effect, Context, Option } from 'effect'
import {
    DialogSchema,
    DialogMsgSchema,
    type Dialog,
    type DialogMsg,
    type DialogStatus,
    type Language,
    type ScoringFactors,
    type Issue,
    type OperatorAlert
} from '@packages/isomorphic/src/slices/dialogs'
import { Database, EntityNotFoundError, validateEntity, RepositoryError } from './base/BaseRepository'
import { MongoRepositoryBase } from './base/MongoRepositoryFactory'
import { dialogEventFactory } from './base/EventFactory'
import type { MongoDatabase } from '../MongoDatabase'

// ============= DialogRepository Interface =============

export interface DialogRepository extends MongoRepositoryBase<Dialog, 'dialog'> {
    // Find operations
    readonly findByAccountId: (accountId: string) => Effect.Effect<readonly Dialog[]>
    readonly findByPlayerSteamId: (playerSteamId64: string) => Effect.Effect<readonly Dialog[]>
    readonly findByStatus: (status: DialogStatus) => Effect.Effect<readonly Dialog[]>
    readonly findActive: () => Effect.Effect<readonly Dialog[]>
    readonly findEscalated: () => Effect.Effect<readonly Dialog[]>
    readonly findByLanguage: (language: Language) => Effect.Effect<readonly Dialog[]>
    readonly findNeedingAttention: () => Effect.Effect<readonly Dialog[]>
    readonly findByContinuationScore: (minScore: number, maxScore: number) => Effect.Effect<readonly Dialog[]>
    
    // Message operations
    readonly addMessage: (
        dialogId: string,
        message: Omit<DialogMsg, 'id'> & { id?: string }
    ) => Effect.Effect<Dialog>
    readonly getMessages: (dialogId: string, limit?: number) => Effect.Effect<readonly DialogMsg[]>
    readonly getMessageCount: (dialogId: string) => Effect.Effect<number>
    readonly getLastMessage: (dialogId: string) => Effect.Effect<Option.Option<DialogMsg>>
    
    // Status operations
    readonly updateStatus: (dialogId: string, status: DialogStatus, reason?: string) => Effect.Effect<Dialog>
    readonly pauseDialog: (dialogId: string, reason?: string) => Effect.Effect<Dialog>
    readonly resumeDialog: (dialogId: string) => Effect.Effect<Dialog>
    readonly completeDialog: (dialogId: string) => Effect.Effect<Dialog>
    readonly escalateDialog: (dialogId: string, reason: string) => Effect.Effect<Dialog>
    
    // AI Assessment operations
    readonly updateAssessment: (
        dialogId: string,
        assessment: {
            continuationScore: number
            trend: 'rising' | 'stable' | 'declining'
            factors: ScoringFactors
            issuesDetected?: Issue[]
        }
    ) => Effect.Effect<Dialog>
    readonly updateGoalProgress: (dialogId: string, progress: number, tokensUsed: number) => Effect.Effect<Dialog>
    readonly setOperatorAlert: (dialogId: string, alert: OperatorAlert) => Effect.Effect<Dialog>
    readonly clearOperatorAlert: (dialogId: string) => Effect.Effect<Dialog>
    
    // Analytics
    readonly getAverageScore: () => Effect.Effect<number>
    readonly getStatusCounts: () => Effect.Effect<Record<DialogStatus, number>>
    readonly getLanguageCounts: () => Effect.Effect<Record<Language, number>>
    readonly getTotalTokensUsed: () => Effect.Effect<number>
    readonly getDialogsWithIssues: () => Effect.Effect<readonly Dialog[]>
    readonly getTopPerformingDialogs: (limit?: number) => Effect.Effect<readonly Dialog[]>
}

// ============= Context Tag =============

export class DialogRepository extends Context.Tag("DialogRepository")<
    DialogRepository,
    DialogRepository
>() {}

// ============= MongoDB Implementation =============

class MongoDialogRepositoryImpl extends MongoRepositoryBase<Dialog, 'dialog'> implements DialogRepository {
    constructor(db: MongoDatabase) {
        super(db, {
            collectionName: 'dialogs',
            entityType: 'dialog',
            idField: 'dialogId',
            schema: DialogSchema,
            eventFactory: dialogEventFactory
        })
    }
    
    // Find operations
    findByAccountId = (accountId: string): Effect.Effect<readonly Dialog[]> =>
        this.findByField('accountId', accountId)
    
    findByPlayerSteamId = (playerSteamId64: string): Effect.Effect<readonly Dialog[]> =>
        this.findByField('playerSteamId64', playerSteamId64)
    
    findByStatus = (status: DialogStatus): Effect.Effect<readonly Dialog[]> =>
        this.findByField('status', status)
    
    findActive = (): Effect.Effect<readonly Dialog[]> =>
        this.findByStatus('active')
    
    findEscalated = (): Effect.Effect<readonly Dialog[]> =>
        this.findByStatus('escalated')
    
    findByLanguage = (language: Language): Effect.Effect<readonly Dialog[]> =>
        this.findByField('language', language)
    
    findNeedingAttention = (): Effect.Effect<readonly Dialog[]> =>
        Effect.tryPromise({
            try: () => this.collection.find({
                $or: [
                    { 'operatorAlert.required': true },
                    { continuationScore: { $lt: 0.3 } },
                    { trend: 'declining' },
                    { 'issuesDetected.severity': 'critical' }
                ]
            }).toArray(),
            catch: error => new RepositoryError({
                message: 'Failed to find dialogs needing attention',
                cause: error
            })
        })
    
    findByContinuationScore = (minScore: number, maxScore: number): Effect.Effect<readonly Dialog[]> =>
        Effect.tryPromise({
            try: () => this.collection.find({
                continuationScore: { $gte: minScore, $lte: maxScore }
            }).toArray(),
            catch: error => new RepositoryError({
                message: `Failed to find dialogs by score range: ${minScore}-${maxScore}`,
                cause: error
            })
        })
    
    // Message operations
    addMessage = (
        dialogId: string,
        message: Omit<DialogMsg, 'id'> & { id?: string }
    ): Effect.Effect<Dialog> =>
        Effect.gen(function* () {
            const messageId = message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            const newMessage: DialogMsg = { ...message, id: messageId }
            
            yield* validateEntity(DialogMsgSchema)(newMessage)
            
            const dialog = yield* Effect.tryPromise({
                try: () => this.collection.findOneAndUpdate(
                    { dialogId },
                    {
                        $push: { messages: { $each: [newMessage], $slice: -50 } },
                        $set: { lastMessageAt: message.ts },
                        $inc: { totalMessages: 1 }
                    },
                    { returnDocument: 'after' }
                ),
                catch: error => new RepositoryError({
                    message: `Failed to add message to dialog: ${dialogId}`,
                    cause: error
                })
            })
            
            if (!dialog) {
                return yield* Effect.fail(new EntityNotFoundError({
                    entityType: 'dialog',
                    id: dialogId
                }))
            }
            
            const eventType = message.from === 'account' 
                ? 'dialogs/messageSent'
                : 'dialogs/messageReceived'
            
            yield* dialogEventFactory.createAndSave(
                this.db,
                eventType,
                dialogId,
                {
                    dialogId,
                    from: message.from,
                    text: message.text,
                    messageId,
                    ts: message.ts,
                    ...(message.sequenceNumber !== undefined && { sequenceNumber: message.sequenceNumber })
                },
                'event'
            )
            
            return dialog as Dialog
        })
    
    getMessages = (dialogId: string, limit?: number): Effect.Effect<readonly DialogMsg[]> =>
        Effect.gen(function* () {
            const dialog = yield* Effect.tryPromise({
                try: () => this.collection.findOne(
                    { dialogId },
                    { projection: { messages: 1 } }
                ),
                catch: error => new RepositoryError({
                    message: `Failed to get messages for dialog: ${dialogId}`,
                    cause: error
                })
            })
            
            if (!dialog) {
                return yield* Effect.fail(new EntityNotFoundError({
                    entityType: 'dialog',
                    id: dialogId
                }))
            }
            
            const messages = dialog!.messages || []
            return limit ? messages.slice(-limit) : messages
        })
    
    getMessageCount = (dialogId: string): Effect.Effect<number> =>
        Effect.gen(function* () {
            const dialog = yield* Effect.tryPromise({
                try: () => this.collection.findOne(
                    { dialogId },
                    { projection: { totalMessages: 1 } }
                ),
                catch: error => new RepositoryError({
                    message: `Failed to get message count for dialog: ${dialogId}`,
                    cause: error
                })
            })
            
            if (!dialog) {
                return yield* Effect.fail(new EntityNotFoundError({
                    entityType: 'dialog',
                    id: dialogId
                }))
            }
            
            return dialog!.totalMessages || 0
        })
    
    getLastMessage = (dialogId: string): Effect.Effect<Option.Option<DialogMsg>> =>
        Effect.gen(function* () {
            const messages = yield* this.getMessages(dialogId, 1)
            return messages.length > 0 ? Option.some(messages[0]) : Option.none()
        })
    
    // Status operations
    updateStatus = (dialogId: string, status: DialogStatus, reason?: string): Effect.Effect<Dialog> =>
        Effect.gen(function* () {
            const dialog = yield* this.update(dialogId, { status })
            
            yield* dialogEventFactory.createAndSave(
                this.db,
                'dialogs/statusUpdated',
                dialogId,
                { dialogId, status, ...(reason && { reason }) },
                'event'
            )
            
            return dialog
        })
    
    pauseDialog = (dialogId: string, reason?: string): Effect.Effect<Dialog> =>
        this.updateStatus(dialogId, 'paused', reason)
    
    resumeDialog = (dialogId: string): Effect.Effect<Dialog> =>
        this.updateStatus(dialogId, 'active')
    
    completeDialog = (dialogId: string): Effect.Effect<Dialog> =>
        this.updateStatus(dialogId, 'completed')
    
    escalateDialog = (dialogId: string, reason: string): Effect.Effect<Dialog> =>
        this.updateStatus(dialogId, 'escalated', reason)
    
    // AI Assessment operations
    updateAssessment = (
        dialogId: string,
        assessment: {
            continuationScore: number
            trend: 'rising' | 'stable' | 'declining'
            factors: ScoringFactors
            issuesDetected?: Issue[]
        }
    ): Effect.Effect<Dialog> =>
        Effect.gen(function* () {
            const dialog = yield* this.update(dialogId, {
                continuationScore: assessment.continuationScore,
                trend: assessment.trend,
                scoringFactors: assessment.factors,
                ...(assessment.issuesDetected && { issuesDetected: assessment.issuesDetected })
            })
            
            yield* dialogEventFactory.createAndSave(
                this.db,
                'dialogs/assessed',
                dialogId,
                { dialogId, ...assessment },
                'event'
            )
            
            return dialog
        })
    
    updateGoalProgress = (dialogId: string, progress: number, tokensUsed: number): Effect.Effect<Dialog> =>
        Effect.gen(function* () {
            const dialog = yield* this.update(dialogId, {
                goalProgress: progress,
                tokensUsed
            })
            
            yield* dialogEventFactory.createAndSave(
                this.db,
                'dialogs/progressUpdated',
                dialogId,
                { dialogId, goalProgress: progress, tokensUsed },
                'event'
            )
            
            return dialog
        })
    
    setOperatorAlert = (dialogId: string, alert: OperatorAlert): Effect.Effect<Dialog> =>
        Effect.gen(function* () {
            const dialog = yield* this.update(dialogId, { operatorAlert: alert })
            
            yield* dialogEventFactory.createAndSave(
                this.db,
                'dialogs/operatorAlerted',
                dialogId,
                { dialogId, ...alert },
                'event'
            )
            
            return dialog
        })
    
    clearOperatorAlert = (dialogId: string): Effect.Effect<Dialog> =>
        this.update(dialogId, { operatorAlert: undefined })
    
    // Analytics
    getAverageScore = (): Effect.Effect<number> =>
        Effect.gen(function* () {
            const results = yield* this.aggregate<{ _id: null; avgScore: number }>([
                { $group: { _id: null, avgScore: { $avg: '$continuationScore' } } }
            ])
            return results.length > 0 ? results[0].avgScore : 0
        })
    
    getStatusCounts = (): Effect.Effect<Record<DialogStatus, number>> =>
        Effect.gen(function* () {
            const results = yield* this.aggregate<{ _id: string; count: number }>([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ])
            
            const counts: Record<string, number> = {
                created: 0,
                active: 0,
                paused: 0,
                completed: 0,
                escalated: 0
            }
            
            for (const result of results) {
                counts[result._id] = result.count
            }
            
            return counts as Record<DialogStatus, number>
        })
    
    getLanguageCounts = (): Effect.Effect<Record<Language, number>> =>
        Effect.gen(function* () {
            const results = yield* this.aggregate<{ _id: string; count: number }>([
                { $group: { _id: '$language', count: { $sum: 1 } } }
            ])
            
            const counts: Record<string, number> = {}
            for (const result of results) {
                counts[result._id] = result.count
            }
            
            return counts as Record<Language, number>
        })
    
    getTotalTokensUsed = (): Effect.Effect<number> =>
        Effect.gen(function* () {
            const results = yield* this.aggregate<{ _id: null; totalTokens: number }>([
                { $group: { _id: null, totalTokens: { $sum: '$tokensUsed' } } }
            ])
            return results.length > 0 ? results[0].totalTokens : 0
        })
    
    getDialogsWithIssues = (): Effect.Effect<readonly Dialog[]> =>
        Effect.tryPromise({
            try: () => this.collection.find({
                issuesDetected: { $exists: true, $ne: [] }
            }).toArray(),
            catch: error => new RepositoryError({
                message: 'Failed to get dialogs with issues',
                cause: error
            })
        })
    
    getTopPerformingDialogs = (limit: number = 10): Effect.Effect<readonly Dialog[]> =>
        Effect.tryPromise({
            try: () => this.collection
                .find({})
                .sort({ continuationScore: -1 })
                .limit(limit)
                .toArray(),
            catch: error => new RepositoryError({
                message: 'Failed to get top performing dialogs',
                cause: error
            })
        })
}

import { createRepositoryLayer } from './base/LayerUtils'

// ============= Layer =============

export const MongoDialogRepositoryLive = createRepositoryLayer(
    DialogRepository,
    db => new MongoDialogRepositoryImpl(db)
)