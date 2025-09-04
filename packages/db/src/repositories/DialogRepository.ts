import { Effect, Layer, Context, pipe, Option } from 'effect'
import * as S from 'effect/Schema'
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
    AbstractRepository,
    Database,
    EntityNotFoundError,
    RepositoryError,
    validateEntity,
    saveEvent,
    type BaseRepository
} from './base/Repository.js'
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

// ============= Implementation =============

class DialogRepositoryImpl extends AbstractRepository<Dialog, string> {
    protected readonly entityName = 'dialog'
    protected readonly idField = 'dialogId' as const
    protected readonly schema = DialogSchema
    
    findByAccountId = (accountId: string): Effect.Effect<readonly Dialog[]> =>
        Effect.gen(function* () {
            const all = yield* this.findAll()
            return all.filter(d => d.accountId === accountId)
        })
    
    findByPlayerSteamId = (playerSteamId64: string): Effect.Effect<readonly Dialog[]> =>
        Effect.gen(function* () {
            const all = yield* this.findAll()
            return all.filter(d => d.playerSteamId64 === playerSteamId64)
        })
    
    findByStatus = (status: DialogStatus): Effect.Effect<readonly Dialog[]> =>
        Effect.gen(function* () {
            const all = yield* this.findAll()
            return all.filter(d => d.status === status)
        })
    
    findActive = (): Effect.Effect<readonly Dialog[]> =>
        this.findByStatus('active')
    
    findEscalated = (): Effect.Effect<readonly Dialog[]> =>
        this.findByStatus('escalated')
    
    findByLanguage = (language: Language): Effect.Effect<readonly Dialog[]> =>
        Effect.gen(function* () {
            const all = yield* this.findAll()
            return all.filter(d => d.language === language)
        })
    
    findNeedingAttention = (): Effect.Effect<readonly Dialog[]> =>
        Effect.gen(function* () {
            const all = yield* this.findAll()
            return all.filter(d => 
                d.operatorAlert?.required ||
                d.continuationScore < 0.3 ||
                d.trend === 'declining' ||
                d.issuesDetected.some(i => i.severity === 'critical')
            )
        })
    
    findByContinuationScore = (minScore: number, maxScore: number): Effect.Effect<readonly Dialog[]> =>
        Effect.gen(function* () {
            const all = yield* this.findAll()
            return all.filter(d => 
                d.continuationScore >= minScore && 
                d.continuationScore <= maxScore
            )
        })
    
    addMessage = (
        dialogId: string,
        message: Omit<DialogMsg, 'id'> & { id?: string }
    ): Effect.Effect<Dialog> =>
        Effect.gen(function* () {
            const dialogOpt = yield* this.findById(dialogId)
            const dialog = yield* pipe(
                dialogOpt,
                Option.match({
                    onNone: () => Effect.fail(new EntityNotFoundError({
                        entityType: 'dialog',
                        id: dialogId
                    })),
                    onSome: Effect.succeed
                })
            )
            
            const messageId = message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            const newMessage: DialogMsg = {
                ...message,
                id: messageId
            }
            
            // Validate message
            yield* validateEntity(DialogMsgSchema)(newMessage)
            
            // Create appropriate event based on sender
            const eventType = message.from === 'account' 
                ? 'dialogs/messageSent'
                : 'dialogs/messageReceived'
            
            const event: EventRecord = {
                id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: eventType,
                payload: {
                    dialogId,
                    from: message.from,
                    text: message.text,
                    messageId,
                    ts: message.ts,
                    ...(message.sequenceNumber !== undefined && { sequenceNumber: message.sequenceNumber })
                },
                meta: {
                    schemaVersion: '1.0.0',
                    id: dialogId,
                    ts: message.ts,
                    aggregate: 'dialog',
                    kind: 'event'
                },
                timestamp: Date.now()
            }
            
            yield* saveEvent(this.db, event)
            
            // Update dialog with new message
            const updated = {
                ...dialog,
                messages: [...dialog.messages, newMessage].slice(-50), // Keep last 50 messages
                lastMessageAt: message.ts,
                totalMessages: dialog.totalMessages + 1
            }
            
            return yield* this.save(updated)
        })
    
    getMessages = (dialogId: string, limit?: number): Effect.Effect<readonly DialogMsg[]> =>
        Effect.gen(function* () {
            const dialogOpt = yield* this.findById(dialogId)
            const dialog = yield* pipe(
                dialogOpt,
                Option.match({
                    onNone: () => Effect.fail(new EntityNotFoundError({
                        entityType: 'dialog',
                        id: dialogId
                    })),
                    onSome: Effect.succeed
                })
            )
            
            const messages = dialog.messages
            return limit ? messages.slice(-limit) : messages
        })
    
    getMessageCount = (dialogId: string): Effect.Effect<number> =>
        Effect.gen(function* () {
            const dialogOpt = yield* this.findById(dialogId)
            const dialog = yield* pipe(
                dialogOpt,
                Option.match({
                    onNone: () => Effect.fail(new EntityNotFoundError({
                        entityType: 'dialog',
                        id: dialogId
                    })),
                    onSome: Effect.succeed
                })
            )
            
            return dialog.totalMessages
        })
    
    getLastMessage = (dialogId: string): Effect.Effect<Option.Option<DialogMsg>> =>
        Effect.gen(function* () {
            const messages = yield* this.getMessages(dialogId)
            const last = messages[messages.length - 1]
            return last ? Option.some(last) : Option.none()
        })
    
    updateStatus = (dialogId: string, status: DialogStatus, reason?: string): Effect.Effect<Dialog> =>
        Effect.gen(function* () {
            const event: EventRecord = {
                id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'dialogs/statusUpdated',
                payload: {
                    dialogId,
                    status,
                    ...(reason && { reason })
                },
                meta: {
                    schemaVersion: '1.0.0',
                    id: dialogId,
                    ts: Date.now(),
                    aggregate: 'dialog',
                    kind: 'event'
                },
                timestamp: Date.now()
            }
            
            yield* saveEvent(this.db, event)
            return yield* this.update(dialogId, { status })
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
            const event: EventRecord = {
                id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'dialogs/assessed',
                payload: {
                    dialogId,
                    ...assessment
                },
                meta: {
                    schemaVersion: '1.0.0',
                    id: dialogId,
                    ts: Date.now(),
                    aggregate: 'dialog',
                    kind: 'event'
                },
                timestamp: Date.now()
            }
            
            yield* saveEvent(this.db, event)
            
            return yield* this.update(dialogId, {
                continuationScore: assessment.continuationScore,
                trend: assessment.trend,
                scoringFactors: assessment.factors,
                ...(assessment.issuesDetected && { issuesDetected: assessment.issuesDetected })
            })
        })
    
    updateGoalProgress = (dialogId: string, progress: number, tokensUsed: number): Effect.Effect<Dialog> =>
        Effect.gen(function* () {
            const event: EventRecord = {
                id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'dialogs/progressUpdated',
                payload: {
                    dialogId,
                    goalProgress: progress,
                    tokensUsed
                },
                meta: {
                    schemaVersion: '1.0.0',
                    id: dialogId,
                    ts: Date.now(),
                    aggregate: 'dialog',
                    kind: 'event'
                },
                timestamp: Date.now()
            }
            
            yield* saveEvent(this.db, event)
            
            return yield* this.update(dialogId, {
                goalProgress: progress,
                tokensUsed
            })
        })
    
    setOperatorAlert = (dialogId: string, alert: OperatorAlert): Effect.Effect<Dialog> =>
        Effect.gen(function* () {
            const event: EventRecord = {
                id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'dialogs/operatorAlerted',
                payload: {
                    dialogId,
                    ...alert
                },
                meta: {
                    schemaVersion: '1.0.0',
                    id: dialogId,
                    ts: Date.now(),
                    aggregate: 'dialog',
                    kind: 'event'
                },
                timestamp: Date.now()
            }
            
            yield* saveEvent(this.db, event)
            
            return yield* this.update(dialogId, { operatorAlert: alert })
        })
    
    clearOperatorAlert = (dialogId: string): Effect.Effect<Dialog> =>
        Effect.gen(function* () {
            return yield* this.update(dialogId, { operatorAlert: undefined })
        })
    
    getAverageScore = (): Effect.Effect<number> =>
        Effect.gen(function* () {
            const all = yield* this.findAll()
            if (all.length === 0) return 0
            
            const sum = all.reduce((acc, d) => acc + d.continuationScore, 0)
            return sum / all.length
        })
    
    getStatusCounts = (): Effect.Effect<Record<DialogStatus, number>> =>
        Effect.gen(function* () {
            const all = yield* this.findAll()
            const counts: Record<string, number> = {
                created: 0,
                active: 0,
                paused: 0,
                completed: 0,
                escalated: 0
            }
            
            for (const dialog of all) {
                counts[dialog.status] = (counts[dialog.status] || 0) + 1
            }
            
            return counts as Record<DialogStatus, number>
        })
    
    getLanguageCounts = (): Effect.Effect<Record<Language, number>> =>
        Effect.gen(function* () {
            const all = yield* this.findAll()
            const counts: Record<string, number> = {}
            
            for (const dialog of all) {
                counts[dialog.language] = (counts[dialog.language] || 0) + 1
            }
            
            return counts as Record<Language, number>
        })
    
    getTotalTokensUsed = (): Effect.Effect<number> =>
        Effect.gen(function* () {
            const all = yield* this.findAll()
            return all.reduce((sum, d) => sum + d.tokensUsed, 0)
        })
    
    getDialogsWithIssues = (): Effect.Effect<readonly Dialog[]> =>
        Effect.gen(function* () {
            const all = yield* this.findAll()
            return all.filter(d => d.issuesDetected.length > 0)
        })
    
    getTopPerformingDialogs = (limit: number = 10): Effect.Effect<readonly Dialog[]> =>
        Effect.gen(function* () {
            const all = yield* this.findAll()
            return all
                .sort((a, b) => b.continuationScore - a.continuationScore)
                .slice(0, limit)
        })
}

// ============= Layer =============

export const DialogRepositoryLive = Layer.effect(
    DialogRepository,
    Effect.gen(function* () {
        const db = yield* Database
        return new DialogRepositoryImpl(db)
    })
)