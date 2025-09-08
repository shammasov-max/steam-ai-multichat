// import { dialogRepository } from '@packages/db' // Removed as it doesn't exist in @packages/db
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
    Config,
    UserInfo,
} from './types'
import { AIService } from './services/AIService'
import { ScoringEngine } from './services/ScoringEngine'
import { ContextCompressor } from './services/ContextCompressor'
import { LanguageDetector } from './services/LanguageDetector'
import { SimpleLogger } from '@packages/isomorphic'

export class DialogManager {
    // private dialogRepo = dialogRepository // TODO: Fix when dialogRepository is available
    private aiService: AIService
    private scoringEngine: ScoringEngine
    private contextCompressor: ContextCompressor
    private languageDetector: LanguageDetector
    private config: Config
    private logger = new SimpleLogger('DialogManager')

    constructor(config: DialogManagerConfig) {
        this.config = this.loadConfig(config.configPath)
        this.aiService = new AIService(config.openai)
        this.scoringEngine = new ScoringEngine(this.config.scoring)
        this.contextCompressor = new ContextCompressor(this.config.context)
        this.languageDetector = new LanguageDetector()
    }

    private loadConfig(configPath?: string): Config {
        const defaultConfigPath = path.join(__dirname, 'config', 'default.yaml')
        const pathToUse = configPath || defaultConfigPath

        try {
            const configFile = fs.readFileSync(pathToUse, 'utf8')
            return yaml.load(configFile) as Config
        } catch {
            this.logger.warn('Could not load config file, using defaults', undefined, { configPath: pathToUse })
            return this.getDefaultConfig()
        }
    }

    private getDefaultConfig(): Config {
        return {
            scoring: {
                thresholds: {
                    highSuccess: 0.7,
                    moderateSuccess: 0.5,
                    riskZone: 0.3,
                    critical: 0.2,
                },
                weights: {
                    userEngagement: 0.3,
                    topicRelevance: 0.25,
                    emotionalTone: 0.2,
                    responseQuality: 0.15,
                    goalProximity: 0.1,
                },
            },
            rejection: {
                firstRejectionScore: 0.4,
                secondRejectionScore: 0.2,
                thirdRejectionScore: 0.05,
                aggressiveRejectionScore: 0.1,
            },
            topicDrift: {
                allowedOfftopicMessages: 4,
                scorePenaltyPerDrift: 0.05,
                directReturnAttemptAfter: 5,
            },
            context: {
                compressionAfterMessages: 10,
                maxMessagesInContext: 20,
                keepLastMessagesVerbatim: 5,
            },
        }
    }

    async createDialog(params: CreateDialogParams): Promise<CreateDialogResult> {
        try {
            // TODO: Uncomment when dialogRepo is available
            // const dialog = await this.dialogRepo.create({
            //     userId: 'system', // Default user ID for DialogManager created dialogs
            //     language: params.language,
            //     userInfo: params.userInfo,
            //     goal: params.goal,
            //     init: params.init,
            //     status: 'CREATED',
            // })

            // await this.dialogRepo.createState({
            //     dialogId: dialog.dialogId,
            //     continuationScore: 1.0,
            //     currentStrategy: 'initial',
            //     tokensUsed: 0,
            //     goalProgress: 0,
            //     compressedContext: null,
            //     issuesDetected: undefined,
            // })

            // await this.logEvent(dialog.dialogId, 'INFO', { action: 'dialog_created', params })

            // Temporary mock response until dialogRepo is available
            const mockDialogId = `dialog_${Date.now()}`
            
            return {
                dialogId: mockDialogId,
                status: 'created',
                initialState: {
                    language: params.language,
                    goal: params.goal,
                    init: params.init,
                },
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            // await this.logEvent(null, 'ERROR', {
            //     action: 'dialog_creation_failed',
            //     error: errorMessage,
            // })
            throw error
        }
    }

    async processMessage(params: ProcessMessageParams): Promise<ProcessMessageResult> {
        try {
            // TODO: Uncomment when dialogRepo is available
            // const dialog = await this.dialogRepo.findById(params.dialogId)

            // if (!dialog) {
            //     throw new Error(`Dialog ${params.dialogId} not found`)
            // }

            // if (dialog.status !== 'ACTIVE') {
            //     throw new Error(
            //         `Dialog ${params.dialogId} is not active (status: ${dialog.status})`
            //     )
            // }

            // const dialogMessages = await this.dialogRepo.findMessages(dialog.dialogId)
            // const latestState = await this.dialogRepo.getLatestState(dialog.dialogId)

            // Temporary mock data until dialogRepo is available
            const mockDialog = {
                dialogId: params.dialogId,
                language: 'en',
                goal: 'mock goal',
                init: 'mock init',
                userInfo: {},
                status: 'ACTIVE'
            }
            const dialogMessages: Array<{ content: string, role: 'USER' | 'ASSISTANT' }> = []
            const latestState = { tokensUsed: 0 }

            const detectedLanguage = this.languageDetector.detect(
                params.message.text,
                mockDialog.language
            )

            // const nextSequenceNumber =
            //     (await this.dialogRepo.getLastSequenceNumber(dialog.dialogId)) + 1
            // await this.dialogRepo.createMessage({
            //     dialogId: dialog.dialogId,
            //     role: 'USER',
            //     content: params.message.text,
            //     sequenceNumber: nextSequenceNumber,
            //     metadata: { detectedLanguage },
            // })

            const context = await this.contextCompressor.compress(
                dialogMessages,
                mockDialog.goal,
                mockDialog.init,
                mockDialog.userInfo as UserInfo | undefined
            )

            const aiResponse = await this.aiService.generateResponse(
                context,
                params.message.text,
                detectedLanguage
            )

            // await this.dialogRepo.createMessage({
            //     dialogId: dialog.dialogId,
            //     role: 'ASSISTANT',
            //     content: aiResponse.text,
            //     sequenceNumber: nextSequenceNumber + 1,
            //     metadata: { tokensUsed: aiResponse.tokensUsed },
            // })

            const allMessages = [
                ...dialogMessages,
                { content: params.message.text, role: 'USER' as const },
            ]
            const scoringResult = await this.scoringEngine.evaluateDialog(
                allMessages,
                mockDialog.goal,
                mockDialog.init
            )

            const totalTokens = (latestState?.tokensUsed || 0) + aiResponse.tokensUsed

            // await this.dialogRepo.createState({
            //     dialogId: dialog.dialogId,
            //     continuationScore: scoringResult.continuationScore,
            //     currentStrategy:
            //         (aiResponse.strategy as
            //             | 'initial'
            //             | 'soft_approach'
            //             | 'direct_offer'
            //             | 'revival_attempt'
            //             | 'topic_return'
            //             | 'fallback') || 'soft_approach',
            //     tokensUsed: totalTokens,
            //     goalProgress: scoringResult.goalProgress,
            //     compressedContext: JSON.stringify(context),
            //     issuesDetected: scoringResult.issuesDetected,
            // })

            const operatorAlert = this.determineOperatorAlert(scoringResult)

            // await this.logEvent(dialog.dialogId, 'INFO', {
            //     action: 'message_processed',
            //     userMessage: params.message.text,
            //     aiResponse: aiResponse.text,
            //     score: scoringResult.continuationScore,
            // })

            return {
                dialogId: mockDialog.dialogId,
                responseMessages: [
                    {
                        text: aiResponse.text,
                        sequenceNumber: 1, // nextSequenceNumber + 1,
                    },
                ],
                successAssessment: {
                    continuationScore: scoringResult.continuationScore,
                    trend: scoringResult.trend,
                    factors: scoringResult.factors,
                    ...(scoringResult.issuesDetected && { issuesDetected: scoringResult.issuesDetected }),
                    ...(operatorAlert && { operatorAlert }),
                },
                dialogState: {
                    totalMessages: dialogMessages.length + 2,
                    goalProgress: scoringResult.goalProgress,
                    languageActive: detectedLanguage,
                    tokensUsed: totalTokens,
                },
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            // await this.logEvent(params.dialogId, 'ERROR', {
            //     action: 'message_processing_failed',
            //     error: errorMessage,
            // })
            throw error
        }
    }

    async getDialogState(dialogId: string): Promise<DialogState> {
        // TODO: Uncomment when dialogRepo is available
        // const dialog = await this.dialogRepo.findById(dialogId)

        // if (!dialog) {
        //     throw new Error(`Dialog ${dialogId} not found`)
        // }

        // const dialogMessages = await this.dialogRepo.findMessages(dialogId)
        // const latestState = await this.dialogRepo.getLatestState(dialogId)
        // const lastMessage = dialogMessages[dialogMessages.length - 1]

        // Temporary mock response until dialogRepo is available
        return {
            dialogId: dialogId,
            status: 'active' as 'active' | 'paused' | 'completed' | 'escalated',
            totalMessages: 0,
            lastMessageAt: new Date(),
            continuationScore: 1.0,
            goalProgress: 0,
            tokensUsed: 0,
            language: 'en',
        }
    }

    async controlDialog(
        dialogId: string,
        action: 'pause' | 'resume' | 'complete' | 'escalate'
    ): Promise<ControlResult> {
        try {
            // TODO: Uncomment when dialogRepo is available
            // const dialog = await this.dialogRepo.findById(dialogId)

            // if (!dialog) {
            //     throw new Error(`Dialog ${dialogId} not found`)
            // }

            const statusMap = {
                pause: 'PAUSED' as const,
                resume: 'ACTIVE' as const,
                complete: 'COMPLETED' as const,
                escalate: 'ESCALATED' as const,
            }

            const newStatus = statusMap[action]
            // const previousStatus = dialog.status

            // await this.dialogRepo.updateStatus(dialogId, newStatus)

            // await this.logEvent(dialogId, 'INFO', {
            //     action: 'dialog_control',
            //     controlAction: action,
            //     previousStatus,
            //     newStatus,
            // })

            return {
                dialogId,
                action,
                success: true,
                newStatus: newStatus.toLowerCase() as
                    | 'active'
                    | 'paused'
                    | 'completed'
                    | 'escalated',
                message: `Dialog ${action} successful`,
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            // await this.logEvent(dialogId, 'ERROR', {
            //     action: 'dialog_control_failed',
            //     controlAction: action,
            //     error: errorMessage,
            // })
            throw error
        }
    }

    private determineOperatorAlert(
        scoringResult: ProcessMessageResult['successAssessment']
    ): ProcessMessageResult['successAssessment']['operatorAlert'] {
        const score = scoringResult.continuationScore

        if (score < this.config.scoring.thresholds.critical) {
            return {
                required: true,
                urgency: 'critical',
                reason: 'Dialog success score critically low',
            }
        }

        if (scoringResult.issuesDetected?.some(issue => issue.severity === 'critical')) {
            return {
                required: true,
                urgency: 'high',
                reason: 'Critical issue detected in dialog',
            }
        }

        if (score < this.config.scoring.thresholds.riskZone) {
            return {
                required: true,
                urgency: 'medium',
                reason: 'Dialog entering risk zone',
            }
        }

        return undefined
    }

    private async logEvent(
        dialogId: string | null,
        level: 'DEBUG' | 'INFO' | 'ERROR',
        data: Record<string, unknown>
    ): Promise<void> {
        // TODO: Uncomment when dialogRepo is available
        // await this.dialogRepo.createLog({
        //     dialogId,
        //     level,
        //     data,
        //     text: JSON.stringify(data).substring(0, 500),
        //     fullJson: data,
        //     messageId: null,
        //     botId: null,
        //     userId: null,
        // })
        
        // Temporary console logging until dialogRepo is available
        this.logger[level.toLowerCase() as 'debug' | 'info' | 'error'](`Dialog ${dialogId || 'unknown'}`, undefined, data)
    }

    async close(): Promise<void> {
        // No need to disconnect with Drizzle, connection pooling is handled automatically
    }
}
