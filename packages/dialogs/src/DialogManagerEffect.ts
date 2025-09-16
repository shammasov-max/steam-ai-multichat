import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'
import { pipe } from 'effect/Function'
import {
    DialogManagerConfig,
    CreateDialogParams,
    CreateDialogResult,
    ProcessMessageParams,
    ProcessMessageResult,
    DialogState,
    ControlResult,
    UserInfo,
    CompressedContext
} from './types'
import { AIServiceEffect, type AIResponse } from './services/AIServiceEffect'
import { ScoringEngineEffect, type ScoringResult } from './services/ScoringEngineEffect'
import { ContextCompressorEffect } from './services/ContextCompressorEffect'
import { LanguageDetector } from './services/LanguageDetectorEffect'
import { Logger, LoggerLayer } from '@packages/isomorphic'

// Message type for internal use
interface Message {
    content: string
    role: 'USER' | 'ASSISTANT' | 'SYSTEM'
    timestamp: number
    sequenceNumber: number
}

// Service Interface
interface DialogManagerOps {
    readonly createDialog: (params: CreateDialogParams) => Effect.Effect<CreateDialogResult, Error>
    readonly processMessage: (params: ProcessMessageParams) => Effect.Effect<ProcessMessageResult, Error>
    readonly getDialogState: (dialogId: string) => Effect.Effect<DialogState, Error>
    readonly controlDialog: (dialogId: string, action: 'pause' | 'resume' | 'complete' | 'escalate') => Effect.Effect<ControlResult, Error>
}

// Service Tag
export class DialogManagerService extends Context.Tag('DialogManager')<DialogManagerService, DialogManagerOps>() {}


// Implementation with proper Effect service dependencies
const makeDialogManager = Effect.gen(function* () {
    const ai = yield* AIServiceEffect
    const scoring = yield* ScoringEngineEffect
    const compressor = yield* ContextCompressorEffect
    const detector = yield* LanguageDetector
    const logger = yield* Logger

    const createDialog = (params: CreateDialogParams): Effect.Effect<CreateDialogResult, Error> =>
        Effect.gen(function* () {
            logger.info('Creating dialog', { params })
            return {
                dialogId: `dialog_${Date.now()}`,
                status: 'created' as const,
                initialState: { 
                    language: params.language, 
                    goal: params.goal, 
                    init: params.init 
                }
            }
        })

    const processMessage = (params: ProcessMessageParams): Effect.Effect<ProcessMessageResult, Error> =>
        Effect.gen(function* () {
            // Mock dialog data (replace with real DB when available)
            const dialog = { 
                dialogId: params.dialogId, 
                language: 'en', 
                goal: 'mock goal', 
                init: 'mock init', 
                userInfo: {} as UserInfo 
            }
            const messages: Message[] = []
            let tokensUsed = 0
            
            // Detect language
            const lang = yield* detector.detect(params.message.text, dialog.language)
            
            // Compress context
            const context: CompressedContext = yield* compressor.compress(
                messages, 
                dialog.goal, 
                dialog.init, 
                dialog.userInfo
            )
            
            // Generate AI response
            const aiResp: AIResponse = yield* ai.generateResponse(
                context, 
                params.message.text, 
                lang
            )
            
            // Evaluate dialog
            const allMsgs = [...messages, { 
                content: params.message.text, 
                role: 'USER' as const,
                timestamp: Date.now(),
                sequenceNumber: messages.length + 1
            }]
            const score: ScoringResult = yield* scoring.evaluateDialog(
                allMsgs, 
                dialog.goal, 
                dialog.init
            )
            
            // Determine if operator alert is needed
            const alert = score.continuationScore < 0.2 
                ? { required: true, urgency: 'critical' as const, reason: 'Low score' }
                : score.issuesDetected?.some((i: any) => i.severity === 'critical') 
                    ? { required: true, urgency: 'high' as const, reason: 'Critical issue' }
                    : score.continuationScore < 0.3 && score.trend === 'declining' 
                        ? { required: true, urgency: 'medium' as const, reason: 'Trending poorly' }
                        : undefined
            
            logger.info('Message processed', { 
                dialogId: params.dialogId, 
                score: score.continuationScore 
            })
            
            return {
                dialogId: dialog.dialogId,
                responseMessages: [{ 
                    text: aiResp.text, 
                    sequenceNumber: 1 
                }],
                successAssessment: {
                    continuationScore: score.continuationScore,
                    trend: score.trend,
                    factors: score.factors,
                    ...(score.issuesDetected && { issuesDetected: score.issuesDetected }),
                    ...(alert && { operatorAlert: alert })
                },
                dialogState: {
                    totalMessages: messages.length + 2,
                    goalProgress: score.goalProgress,
                    languageActive: lang,
                    tokensUsed: tokensUsed + aiResp.tokensUsed
                }
            }
        })

    const getDialogState = (dialogId: string): Effect.Effect<DialogState, Error> =>
        Effect.succeed({
            dialogId,
            status: 'active' as const,
            totalMessages: 0,
            lastMessageAt: new Date(),
            continuationScore: 1.0,
            goalProgress: 0,
            tokensUsed: 0,
            language: 'en'
        })

    const controlDialog = (dialogId: string, action: 'pause' | 'resume' | 'complete' | 'escalate'): Effect.Effect<ControlResult, Error> =>
        Effect.gen(function* () {
            logger.info('Dialog control', { dialogId, action })
            
            const newStatus = action === 'pause' ? 'paused' 
                : action === 'complete' ? 'completed' 
                : action === 'escalate' ? 'escalated' 
                : 'active'
                
            return {
                dialogId,
                action,
                success: true,
                newStatus,
                message: `Dialog ${dialogId} ${action}d successfully`
            }
        })

    return {
        createDialog,
        processMessage,
        getDialogState,
        controlDialog
    } satisfies DialogManagerOps
})

// Layer creation - composes all required services
export const DialogManagerLive = Layer.effect(
    DialogManagerService,
    makeDialogManager
).pipe(
    Layer.provide(LoggerLayer('DialogManager'))
)

// Export the complete layer with all dialog services
export const DialogManagerWithServices = pipe(
    DialogManagerLive,
    // Note: The consumer must provide the dialog services
    // Use either DialogServicesLive, makeDialogServicesLayer, or DialogServicesWithConfig
)

// Helper function to run with all required layers
export const runWithDialogManager = <A, E>(
    effect: Effect.Effect<A, E, DialogManagerService>,
    aiConfig: { apiKey: string, model?: string }
) => {
    const { makeDialogServicesLayer } = require('./services')
    return pipe(
        effect,
        Effect.provide(DialogManagerLive),
        Effect.provide(makeDialogServicesLayer(aiConfig))
    )
}

// Convenience functions for common operations
export const createDialog = (params: CreateDialogParams) =>
    Effect.gen(function* () {
        const manager = yield* DialogManagerService
        return yield* manager.createDialog(params)
    })

export const processMessage = (params: ProcessMessageParams) =>
    Effect.gen(function* () {
        const manager = yield* DialogManagerService
        return yield* manager.processMessage(params)
    })

export const getDialogState = (dialogId: string) =>
    Effect.gen(function* () {
        const manager = yield* DialogManagerService
        return yield* manager.getDialogState(dialogId)
    })

export const controlDialog = (dialogId: string, action: 'pause' | 'resume' | 'complete' | 'escalate') =>
    Effect.gen(function* () {
        const manager = yield* DialogManagerService
        return yield* manager.controlDialog(dialogId, action)
    })