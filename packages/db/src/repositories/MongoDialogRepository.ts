import { Effect, Layer, Context, pipe, Option } from 'effect'
import * as S from 'effect/Schema'
import { Collection } from 'mongodb'
import {
    DialogSchema,
    DialogMsgSchema,
    type Dialog,
    type DialogMsg,
    type DialogStatus,
    type Language,
    type UserInfo,
    type ScoringFactors,
    type Issue,
    type OperatorAlert,
    type DialogMsgFrom,
    type Urgency
} from '@packages/isomorphic/src/slices/dialogs.js'
import {
    Database,
    EntityNotFoundError,
    RepositoryError,
    validateEntity,
    saveEvent,
    createEvent,
    type BaseRepository
} from './base/BaseRepository.js'
import { MongoDatabase } from '../MongoDatabase.js'
import type { EventRecord } from '../types.js'

// ============= DialogRepository Interface =============

export interface DialogRepository extends BaseRepository<Dialog, string> {
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

class MongoDialogRepositoryImpl implements DialogRepository {
    private collection: Collection<Dialog>
    
    constructor(private readonly db: MongoDatabase) {
        if (!db.dialogs) {
            throw new Error('Dialogs collection not initialized')
        }
        this.collection = db.dialogs
    }
    
    // ============= Base Repository Methods =============
    
    findById = (id: string): Effect.Effect<Option.Option<Dialog>> =>
        Effect.gen(function* () {
            try {
                const dialog = yield* Effect.tryPromise({
                    try: () => this.collection.findOne({ dialogId: id }),
                    catch: error => new RepositoryError({
                        message: `Failed to find dialog by ID: ${id}`,
                        cause: error
                    })
                })
                
                if (!dialog) return Option.none()
                
                const validated = yield* validateEntity(DialogSchema)(dialog)
                return Option.some(validated)
            } catch (error) {
                return Option.none()
            }
        })
    
    findAll = (options?: { limit?: number; offset?: number }): Effect.Effect<readonly Dialog[]> =>
        Effect.gen(function* () {
            const limit = options?.limit || 1000
            const skip = options?.offset || 0
            
            const dialogs = yield* Effect.tryPromise({
                try: () => this.collection
                    .find({})
                    .skip(skip)
                    .limit(limit)
                    .toArray(),
                catch: error => new RepositoryError({
                    message: 'Failed to find all dialogs',
                    cause: error
                })
            })
            
            return dialogs
        })
    
    findMany = (ids: readonly string[]): Effect.Effect<readonly Dialog[]> =>
        Effect.gen(function* () {
            const dialogs = yield* Effect.tryPromise({
                try: () => this.collection
                    .find({ dialogId: { $in: ids as string[] } })
                    .toArray(),
                catch: error => new RepositoryError({
                    message: 'Failed to find multiple dialogs',
                    cause: error
                })
            })
            
            return dialogs
        })
    
    save = (dialog: Dialog): Effect.Effect<Dialog> =>
        Effect.gen(function* () {
            // Validate dialog
            const validated = yield* validateEntity(DialogSchema)(dialog)
            
            // Save to MongoDB
            yield* Effect.tryPromise({
                try: () => this.collection.replaceOne(
                    { dialogId: validated.dialogId },
                    validated,
                    { upsert: true }
                ),
                catch: error => new RepositoryError({
                    message: `Failed to save dialog: ${validated.dialogId}`,
                    cause: error
                })
            })
            
            // Emit event
            const event = createEvent(
                'dialogs/saved',
                'dialog',
                validated.dialogId,
                validated
            )
            
            yield* saveEvent(this.db, event)
            return validated
        })
    
    saveMany = (dialogs: readonly Dialog[]): Effect.Effect<readonly Dialog[]> =>
        Effect.all(dialogs.map(dialog => this.save(dialog)))
    
    update = (id: string, updates: Partial<Dialog>): Effect.Effect<Dialog> =>
        Effect.gen(function* () {
            const result = yield* Effect.tryPromise({
                try: () => this.collection.findOneAndUpdate(
                    { dialogId: id },
                    { $set: updates },
                    { returnDocument: 'after' }
                ),
                catch: error => new RepositoryError({
                    message: `Failed to update dialog: ${id}`,
                    cause: error
                })
            })
            
            if (!result) {
                yield* Effect.fail(new EntityNotFoundError({
                    entityType: 'dialog',
                    id
                }))
            }
            
            return result as Dialog
        })
    
    delete = (id: string): Effect.Effect<void> =>
        Effect.gen(function* () {
            yield* Effect.tryPromise({
                try: () => this.collection.deleteOne({ dialogId: id }),
                catch: error => new RepositoryError({
                    message: `Failed to delete dialog: ${id}`,
                    cause: error
                })
            })
            
            // Emit deletion event
            const event = createEvent(
                'dialogs/deleted',
                'dialog',
                id,
                { dialogId: id }
            )
            
            yield* saveEvent(this.db, event)
        })
    
    deleteMany = (ids: readonly string[]): Effect.Effect<void> =>
        Effect.all(ids.map(id => this.delete(id)), { discard: true })
    
    exists = (id: string): Effect.Effect<boolean> =>
        Effect.gen(function* () {
            const count = yield* Effect.tryPromise({
                try: () => this.collection.countDocuments({ dialogId: id }),
                catch: error => new RepositoryError({
                    message: `Failed to check dialog existence: ${id}`,
                    cause: error
                })
            })
            
            return count > 0
        })
    
    count = (): Effect.Effect<number> =>
        Effect.tryPromise({
            try: () => this.collection.countDocuments({}),
            catch: error => new RepositoryError({
                message: 'Failed to count dialogs',
                cause: error
            })
        })
    
    // ============= Dialog-Specific Methods =============
    
    findByAccountId = (accountId: string): Effect.Effect<readonly Dialog[]> =>
        Effect.tryPromise({
            try: () => this.collection.find({ accountId }).toArray(),
            catch: error => new RepositoryError({
                message: `Failed to find dialogs by account: ${accountId}`,
                cause: error
            })
        })
    
    findByPlayerSteamId = (playerSteamId64: string): Effect.Effect<readonly Dialog[]> =>
        Effect.tryPromise({
            try: () => this.collection.find({ playerSteamId64 }).toArray(),
            catch: error => new RepositoryError({
                message: `Failed to find dialogs by player: ${playerSteamId64}`,
                cause: error
            })
        })
    
    findByStatus = (status: DialogStatus): Effect.Effect<readonly Dialog[]> =>
        Effect.tryPromise({
            try: () => this.collection.find({ status }).toArray(),
            catch: error => new RepositoryError({
                message: `Failed to find dialogs by status: ${status}`,
                cause: error
            })
        })
    
    findActive = (): Effect.Effect<readonly Dialog[]> =>
        this.findByStatus('active')
    
    findEscalated = (): Effect.Effect<readonly Dialog[]> =>
        this.findByStatus('escalated')
    
    findByLanguage = (language: Language): Effect.Effect<readonly Dialog[]> =>
        Effect.tryPromise({
            try: () => this.collection.find({ language }).toArray(),
            catch: error => new RepositoryError({
                message: `Failed to find dialogs by language: ${language}`,
                cause: error
            })
        })
    
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
    
    addMessage = (
        dialogId: string,
        message: Omit<DialogMsg, 'id'> & { id?: string }
    ): Effect.Effect<Dialog> =>
        Effect.gen(function* () {
            const messageId = message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            const newMessage: DialogMsg = {
                ...message,
                id: messageId
            }
            
            // Validate message
            yield* validateEntity(DialogMsgSchema)(newMessage)
            
            // Update dialog with new message and trim to last 50
            const dialog = yield* Effect.tryPromise({
                try: () => this.collection.findOneAndUpdate(
                    { dialogId },
                    {
                        $push: {
                            messages: {
                                $each: [newMessage],
                                $slice: -50
                            }
                        },
                        $set: {
                            lastMessageAt: message.ts,
                        },
                        $inc: {
                            totalMessages: 1
                        }
                    },
                    { returnDocument: 'after' }
                ),
                catch: error => new RepositoryError({
                    message: `Failed to add message to dialog: ${dialogId}`,
                    cause: error
                })
            })
            
            if (!dialog) {
                yield* Effect.fail(new EntityNotFoundError({
                    entityType: 'dialog',
                    id: dialogId
                }))
            }
            
            // Emit message event
            const eventType = message.from === 'account' 
                ? 'dialogs/messageSent'
                : 'dialogs/messageReceived'
            
            const event = createEvent(
                eventType,
                'dialog',
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
            
            yield* saveEvent(this.db, event)
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
                yield* Effect.fail(new EntityNotFoundError({
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
                yield* Effect.fail(new EntityNotFoundError({
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
    
    updateStatus = (dialogId: string, status: DialogStatus, reason?: string): Effect.Effect<Dialog> =>
        Effect.gen(function* () {
            const dialog = yield* this.update(dialogId, { status })
            
            // Emit status event
            const event = createEvent(
                'dialogs/statusUpdated',
                'dialog',
                dialogId,
                {
                    dialogId,
                    status,
                    ...(reason && { reason })
                },
                'event'
            )
            
            yield* saveEvent(this.db, event)
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
            const updates: Partial<Dialog> = {
                continuationScore: assessment.continuationScore,
                trend: assessment.trend,
                scoringFactors: assessment.factors,
                ...(assessment.issuesDetected && { issuesDetected: assessment.issuesDetected })
            }
            
            const dialog = yield* this.update(dialogId, updates)
            
            // Emit assessment event
            const event = createEvent(
                'dialogs/assessed',
                'dialog',
                dialogId,
                {
                    dialogId,
                    ...assessment
                },
                'event'
            )
            
            yield* saveEvent(this.db, event)
            return dialog
        })
    
    updateGoalProgress = (dialogId: string, progress: number, tokensUsed: number): Effect.Effect<Dialog> =>
        Effect.gen(function* () {
            const dialog = yield* this.update(dialogId, {
                goalProgress: progress,
                tokensUsed
            })
            
            // Emit progress event
            const event = createEvent(
                'dialogs/progressUpdated',
                'dialog',
                dialogId,
                {
                    dialogId,
                    goalProgress: progress,
                    tokensUsed
                },
                'event'
            )
            
            yield* saveEvent(this.db, event)
            return dialog
        })
    
    setOperatorAlert = (dialogId: string, alert: OperatorAlert): Effect.Effect<Dialog> =>
        Effect.gen(function* () {
            const dialog = yield* this.update(dialogId, { operatorAlert: alert })
            
            // Emit alert event
            const event = createEvent(
                'dialogs/operatorAlerted',
                'dialog',
                dialogId,
                {
                    dialogId,
                    ...alert
                },
                'event'
            )
            
            yield* saveEvent(this.db, event)
            return dialog
        })
    
    clearOperatorAlert = (dialogId: string): Effect.Effect<Dialog> =>
        this.update(dialogId, { operatorAlert: undefined })
    
    // ============= Analytics Methods =============
    
    getAverageScore = (): Effect.Effect<number> =>
        Effect.gen(function* () {
            const pipeline = [
                { $group: { _id: null, avgScore: { $avg: '$continuationScore' } } }
            ]
            
            const results = yield* Effect.tryPromise({
                try: () => this.collection.aggregate(pipeline).toArray(),
                catch: error => new RepositoryError({
                    message: 'Failed to get average score',
                    cause: error
                })
            })
            
            return results.length > 0 ? results[0].avgScore : 0
        })
    
    getStatusCounts = (): Effect.Effect<Record<DialogStatus, number>> =>
        Effect.gen(function* () {
            const pipeline = [
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]
            
            const results = yield* Effect.tryPromise({
                try: () => this.collection.aggregate(pipeline).toArray(),
                catch: error => new RepositoryError({
                    message: 'Failed to get status counts',
                    cause: error
                })
            })
            
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
            const pipeline = [
                { $group: { _id: '$language', count: { $sum: 1 } } }
            ]
            
            const results = yield* Effect.tryPromise({
                try: () => this.collection.aggregate(pipeline).toArray(),
                catch: error => new RepositoryError({
                    message: 'Failed to get language counts',
                    cause: error
                })
            })
            
            const counts: Record<string, number> = {}
            
            for (const result of results) {
                counts[result._id] = result.count
            }
            
            return counts as Record<Language, number>
        })
    
    getTotalTokensUsed = (): Effect.Effect<number> =>
        Effect.gen(function* () {
            const pipeline = [
                { $group: { _id: null, totalTokens: { $sum: '$tokensUsed' } } }
            ]
            
            const results = yield* Effect.tryPromise({
                try: () => this.collection.aggregate(pipeline).toArray(),
                catch: error => new RepositoryError({
                    message: 'Failed to get total tokens used',
                    cause: error
                })
            })
            
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

// ============= Layer =============

export const MongoDialogRepositoryLive = Layer.effect(
    DialogRepository,
    Effect.gen(function* () {
        const db = yield* Database
        return new MongoDialogRepositoryImpl(db)
    })
)