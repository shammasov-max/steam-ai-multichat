import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'
import { pipe } from 'effect/Function'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import {
    DialogManagerConfig,
    CreateDialogParams,
    CreateDialogResult,
    ProcessMessageParams,
    ProcessMessageResult,
    DialogState,
    ControlResult,
    Config as DialogConfig,
    UserInfo,
} from './types'
import { AIService } from './services/AIService'
import { ScoringEngine } from './services/ScoringEngine'
import { ContextCompressor } from './services/ContextCompressor'
import { LanguageDetector } from './services/LanguageDetector'
import { SimpleLogger, getScoringConfig, getContextConfig, getOpenAIConfig } from '@packages/isomorphic'

// Service Interface
interface DialogManagerOps {
    readonly createDialog: (params: CreateDialogParams) => Effect.Effect<CreateDialogResult, Error, DialogDepsTag>
    readonly processMessage: (params: ProcessMessageParams) => Effect.Effect<ProcessMessageResult, Error, DialogDepsTag>
    readonly getDialogState: (dialogId: string) => Effect.Effect<DialogState, Error, DialogDepsTag>
    readonly controlDialog: (dialogId: string, action: 'pause' | 'resume' | 'complete' | 'escalate') => Effect.Effect<ControlResult, Error, DialogDepsTag>
}

// Service Tag
export class DialogManagerService extends Context.Tag('DialogManager')<DialogManagerService, DialogManagerOps>() {}

// Dependencies as a single context
interface DialogDeps {
    readonly ai: AIService
    readonly scoring: ScoringEngine
    readonly compressor: ContextCompressor
    readonly detector: LanguageDetector
    readonly logger: SimpleLogger
    readonly config: DialogConfig
}

class DialogDepsTag extends Context.Tag('DialogDeps')<DialogDepsTag, DialogDeps>() {}

// Simplified configuration loading
const getConfig = (configPath?: string): DialogConfig => {
    try {
        const file = fs.readFileSync(configPath || path.join(__dirname, 'config', 'default.yaml'), 'utf8')
        return yaml.load(file) as DialogConfig
    } catch {
        return {
            scoring: {
                thresholds: { highSuccess: 0.7, moderateSuccess: 0.5, riskZone: 0.3, critical: 0.2 },
                weights: { userEngagement: 0.3, topicRelevance: 0.25, emotionalTone: 0.2, responseQuality: 0.15, goalProximity: 0.1 }
            },
            rejection: { firstRejectionScore: 0.4, secondRejectionScore: 0.2, thirdRejectionScore: 0.05, aggressiveRejectionScore: 0.1 },
            topicDrift: { allowedOfftopicMessages: 4, scorePenaltyPerDrift: 0.05, directReturnAttemptAfter: 5 },
            context: { compressionAfterMessages: 10, maxMessagesInContext: 20, keepLastMessagesVerbatim: 5 }
        }
    }
}

// Operations implementation
const ops: DialogManagerOps = {
    createDialog: (params) =>
        Effect.gen(function* () {
            const { logger } = yield* DialogDepsTag
            logger.info('Creating dialog', { params })
            return {
                dialogId: `dialog_${Date.now()}`,
                status: 'created' as const,
                initialState: { language: params.language, goal: params.goal, init: params.init }
            }
        }),

    processMessage: (params) =>
        Effect.gen(function* () {
            const { ai, scoring, compressor, detector, logger } = yield* DialogDepsTag
            
            // Mock data (replace with real DB when available)
            const dialog = { dialogId: params.dialogId, language: 'en', goal: 'mock goal', init: 'mock init', userInfo: {} }
            const messages: Array<{ content: string; role: 'USER' | 'ASSISTANT' }> = []
            const tokensUsed = 0
            
            const lang = detector.detect(params.message.text, dialog.language)
            const context = yield* Effect.promise(() => 
                compressor.compress(messages, dialog.goal, dialog.init, dialog.userInfo as UserInfo | undefined))
            const aiResp = yield* Effect.promise(() => ai.generateResponse(context, params.message.text, lang))
            const allMsgs = [...messages, { content: params.message.text, role: 'USER' as const }]
            const score = yield* Effect.promise(() => scoring.evaluateDialog(allMsgs, dialog.goal, dialog.init))
            
            const alert = score.continuationScore < 0.2 ? { required: true, urgency: 'critical' as const, reason: 'Low score' } :
                         score.issuesDetected?.some(i => i.severity === 'critical') ? { required: true, urgency: 'high' as const, reason: 'Critical issue' } :
                         score.continuationScore < 0.3 && score.trend === 'declining' ? { required: true, urgency: 'medium' as const, reason: 'Trending poorly' } :
                         undefined
            
            logger.info('Message processed', { dialogId: params.dialogId, score: score.continuationScore })
            
            return {
                dialogId: dialog.dialogId,
                responseMessages: [{ text: aiResp.text, sequenceNumber: 1 }],
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
        }),

    getDialogState: (dialogId) =>
        Effect.succeed({
            dialogId,
            status: 'active' as const,
            totalMessages: 0,
            lastMessageAt: new Date(),
            continuationScore: 1.0,
            goalProgress: 0,
            tokensUsed: 0,
            language: 'en'
        }),

    controlDialog: (dialogId, action) =>
        Effect.gen(function* () {
            const { logger } = yield* DialogDepsTag
            logger.info('Dialog control', { dialogId, action })
            return {
                dialogId,
                action,
                success: true,
                newStatus: action === 'pause' ? 'paused' : action === 'complete' ? 'completed' : action === 'escalate' ? 'escalated' : 'active',
                message: `Dialog ${dialogId} ${action}d successfully`
            }
        })
}

// Layer creation (uses ConfigService)
export const DialogManagerLive = Layer.effect(
    DialogManagerService,
    Effect.gen(function* () {
        const openaiConfig = yield* getOpenAIConfig
        const scoringConfig = yield* getScoringConfig
        const contextConfig = yield* getContextConfig
        
        const deps: DialogDeps = {
            ai: new AIService(openaiConfig),
            scoring: new ScoringEngine(scoringConfig),
            compressor: new ContextCompressor(contextConfig),
            detector: new LanguageDetector(),
            logger: new SimpleLogger('DialogManager'),
            config: {
                scoring: scoringConfig,
                context: contextConfig,
                rejection: scoringConfig.rejection,
                topicDrift: scoringConfig.topicDrift
            }
        }
        
        // Provide deps to the operations
        const opsWithDeps = {
            createDialog: (params: CreateDialogParams) => ops.createDialog(params).pipe(Effect.provideService(DialogDepsTag, deps)),
            processMessage: (params: ProcessMessageParams) => ops.processMessage(params).pipe(Effect.provideService(DialogDepsTag, deps)),
            getDialogState: (dialogId: string) => ops.getDialogState(dialogId).pipe(Effect.provideService(DialogDepsTag, deps)),
            controlDialog: (dialogId: string, action: 'pause' | 'resume' | 'complete' | 'escalate') => ops.controlDialog(dialogId, action).pipe(Effect.provideService(DialogDepsTag, deps))
        }
        
        return opsWithDeps
    })
)

// Public API (requires ConfigService layer)
export const createDialogManagerWithConfig = () => {
    const layer = DialogManagerLive
    
    const createDialog = (params: CreateDialogParams) =>
        Effect.gen(function* () {
            const ops = yield* DialogManagerService
            return yield* ops.createDialog(params)
        }).pipe(Effect.provide(layer))
    
    const processMessage = (params: ProcessMessageParams) =>
        Effect.gen(function* () {
            const ops = yield* DialogManagerService
            return yield* ops.processMessage(params)
        }).pipe(Effect.provide(layer))
    
    const getDialogState = (dialogId: string) =>
        Effect.gen(function* () {
            const ops = yield* DialogManagerService
            return yield* ops.getDialogState(dialogId)
        }).pipe(Effect.provide(layer))
    
    const controlDialog = (dialogId: string, action: 'pause' | 'resume' | 'complete' | 'escalate') =>
        Effect.gen(function* () {
            const ops = yield* DialogManagerService
            return yield* ops.controlDialog(dialogId, action)
        }).pipe(Effect.provide(layer))
    
    return {
        createDialog: (params: CreateDialogParams) => 
            Effect.runPromise(createDialog(params) as Effect.Effect<CreateDialogResult, Error, never>),
        processMessage: (params: ProcessMessageParams) => 
            Effect.runPromise(processMessage(params) as Effect.Effect<ProcessMessageResult, Error, never>),
        getDialogState: (dialogId: string) => 
            Effect.runPromise(getDialogState(dialogId) as Effect.Effect<DialogState, Error, never>),
        controlDialog: (dialogId: string, action: 'pause' | 'resume' | 'complete' | 'escalate') => 
            Effect.runPromise(controlDialog(dialogId, action) as Effect.Effect<ControlResult, Error, never>)
    }
}

// Legacy API (for backward compatibility)
export const createDialogManager = (config: DialogManagerConfig) => {
    const layer = Layer.succeed(DialogManagerService, ops).pipe(
        Layer.provide(Layer.succeed(DialogDepsTag, {
            ai: new AIService(config.openai),
            scoring: new ScoringEngine(getConfig(config.configPath).scoring),
            compressor: new ContextCompressor(getConfig(config.configPath).context),
            detector: new LanguageDetector(),
            logger: new SimpleLogger('DialogManager'),
            config: getConfig(config.configPath)
        }))
    )
    
    const createDialog = (params: CreateDialogParams) =>
        Effect.gen(function* () {
            const ops = yield* DialogManagerService
            return yield* ops.createDialog(params)
        }).pipe(Effect.provide(layer))
    
    const processMessage = (params: ProcessMessageParams) =>
        Effect.gen(function* () {
            const ops = yield* DialogManagerService
            return yield* ops.processMessage(params)
        }).pipe(Effect.provide(layer))
    
    const getDialogState = (dialogId: string) =>
        Effect.gen(function* () {
            const ops = yield* DialogManagerService
            return yield* ops.getDialogState(dialogId)
        }).pipe(Effect.provide(layer))
    
    const controlDialog = (dialogId: string, action: 'pause' | 'resume' | 'complete' | 'escalate') =>
        Effect.gen(function* () {
            const ops = yield* DialogManagerService
            return yield* ops.controlDialog(dialogId, action)
        }).pipe(Effect.provide(layer))
    
    return {
        createDialog: (params: CreateDialogParams) => 
            Effect.runPromise(createDialog(params) as Effect.Effect<CreateDialogResult, Error, never>),
        processMessage: (params: ProcessMessageParams) => 
            Effect.runPromise(processMessage(params) as Effect.Effect<ProcessMessageResult, Error, never>),
        getDialogState: (dialogId: string) => 
            Effect.runPromise(getDialogState(dialogId) as Effect.Effect<DialogState, Error, never>),
        controlDialog: (dialogId: string, action: 'pause' | 'resume' | 'complete' | 'escalate') => 
            Effect.runPromise(controlDialog(dialogId, action) as Effect.Effect<ControlResult, Error, never>)
    }
}