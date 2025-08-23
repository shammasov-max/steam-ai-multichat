import { dialogsPrismaClient, DialogStatus } from '@local/prisma';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  DialogManagerConfig,
  CreateDialogParams,
  CreateDialogResult,
  ProcessMessageParams,
  ProcessMessageResult,
  DialogState,
  ControlResult,
  Config
} from './types';
import { AIService } from './services/AIService';
import { ScoringEngine } from './services/ScoringEngine';
import { ContextCompressor } from './services/ContextCompressor';
import { LanguageDetector } from './services/LanguageDetector';

export class DialogManager {
  private prisma: typeof dialogsPrismaClient;
  private aiService: AIService;
  private scoringEngine: ScoringEngine;
  private contextCompressor: ContextCompressor;
  private languageDetector: LanguageDetector;
  private config: Config;

  constructor(config: DialogManagerConfig) {
    this.prisma = dialogsPrismaClient;
    this.config = this.loadConfig(config.configPath);
    this.aiService = new AIService(config.openai);
    this.scoringEngine = new ScoringEngine(this.config.scoring);
    this.contextCompressor = new ContextCompressor(this.config.context);
    this.languageDetector = new LanguageDetector();
  }

  private loadConfig(configPath?: string): Config {
    const defaultConfigPath = path.join(__dirname, 'config', 'default.yaml');
    const pathToUse = configPath || defaultConfigPath;
    
    try {
      const configFile = fs.readFileSync(pathToUse, 'utf8');
      return yaml.load(configFile) as Config;
    } catch (error) {
      console.warn(`Could not load config from ${pathToUse}, using defaults`);
      return this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): Config {
    return {
      scoring: {
        thresholds: {
          highSuccess: 0.7,
          moderateSuccess: 0.5,
          riskZone: 0.3,
          critical: 0.2
        },
        weights: {
          userEngagement: 0.30,
          topicRelevance: 0.25,
          emotionalTone: 0.20,
          responseQuality: 0.15,
          goalProximity: 0.10
        }
      },
      rejection: {
        firstRejectionScore: 0.4,
        secondRejectionScore: 0.2,
        thirdRejectionScore: 0.05,
        aggressiveRejectionScore: 0.1
      },
      topicDrift: {
        allowedOfftopicMessages: 4,
        scorePenaltyPerDrift: 0.05,
        directReturnAttemptAfter: 5
      },
      context: {
        compressionAfterMessages: 10,
        maxMessagesInContext: 20,
        keepLastMessagesVerbatim: 5
      }
    };
  }

  async createDialog(params: CreateDialogParams): Promise<CreateDialogResult> {
    try {
      const dialog = await this.prisma.dialog.create({
        data: {
          externalId: params.externalId,
          language: params.language,
          userInfo: params.userInfo,
          goal: params.goal,
          completionCriteria: params.completionCriteria,
          negotiationSettings: params.negotiationSettings,
          referenceContext: params.referenceContext,
          status: DialogStatus.ACTIVE
        }
      });

      await this.prisma.dialogState.create({
        data: {
          dialogId: dialog.id,
          continuationScore: 1.0,
          currentStrategy: 'initial',
          tokensUsed: 0,
          goalProgress: 0,
          compressedContext: null,
          issuesDetected: undefined
        }
      });

      await this.logEvent(dialog.id, 'INFO', { action: 'dialog_created', params });

      return {
        dialogId: dialog.id,
        status: 'created',
        initialState: {
          language: params.language,
          goal: params.goal,
          completionCriteria: params.completionCriteria
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logEvent(null, 'ERROR', { action: 'dialog_creation_failed', error: errorMessage });
      throw error;
    }
  }

  async processMessage(params: ProcessMessageParams): Promise<ProcessMessageResult> {
    try {
      const dialog = await this.prisma.dialog.findUnique({
        where: { id: params.dialogId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          },
          states: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!dialog) {
        throw new Error(`Dialog ${params.dialogId} not found`);
      }

      if (dialog.status !== DialogStatus.ACTIVE) {
        throw new Error(`Dialog ${params.dialogId} is not active (status: ${dialog.status})`);
      }

      const detectedLanguage = this.languageDetector.detect(params.message.text, dialog.language);

      const nextSequenceNumber = dialog.messages.length + 1;
      await this.prisma.message.create({
        data: {
          dialogId: dialog.id,
          role: 'USER',
          content: params.message.text,
          sequenceNumber: nextSequenceNumber,
          metadata: { detectedLanguage }
        }
      });

      const context = await this.contextCompressor.compress(
        dialog.messages,
        dialog.goal,
        dialog.userInfo,
        dialog.referenceContext || undefined
      );

      const aiResponse = await this.aiService.generateResponse(
        context,
        params.message.text,
        detectedLanguage,
        dialog.completionCriteria
      );

      await this.prisma.message.create({
        data: {
          dialogId: dialog.id,
          role: 'ASSISTANT',
          content: aiResponse.text,
          sequenceNumber: nextSequenceNumber + 1,
          metadata: { tokensUsed: aiResponse.tokensUsed }
        }
      });

      const allMessages = [...dialog.messages, { content: params.message.text, role: 'USER' as const }];
      const scoringResult = await this.scoringEngine.evaluateDialog(
        allMessages,
        dialog.goal,
        dialog.completionCriteria
      );

      const currentState = dialog.states[0];
      const totalTokens = (currentState?.tokensUsed || 0) + aiResponse.tokensUsed;

      await this.prisma.dialogState.create({
        data: {
          dialogId: dialog.id,
          continuationScore: scoringResult.continuationScore,
          currentStrategy: aiResponse.strategy || 'default',
          tokensUsed: totalTokens,
          goalProgress: scoringResult.goalProgress,
          compressedContext: JSON.stringify(context),
          issuesDetected: scoringResult.issuesDetected
        }
      });

      const operatorAlert = this.determineOperatorAlert(scoringResult);

      await this.logEvent(dialog.id, 'INFO', {
        action: 'message_processed',
        userMessage: params.message.text,
        aiResponse: aiResponse.text,
        score: scoringResult.continuationScore
      });

      return {
        dialogId: dialog.id,
        responseMessages: [{
          text: aiResponse.text,
          sequenceNumber: nextSequenceNumber + 1
        }],
        successAssessment: {
          continuationScore: scoringResult.continuationScore,
          trend: scoringResult.trend,
          factors: scoringResult.factors,
          issuesDetected: scoringResult.issuesDetected,
          operatorAlert
        },
        dialogState: {
          totalMessages: dialog.messages.length + 2,
          goalProgress: scoringResult.goalProgress,
          languageActive: detectedLanguage,
          tokensUsed: totalTokens
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logEvent(params.dialogId, 'ERROR', {
        action: 'message_processing_failed',
        error: errorMessage
      });
      throw error;
    }
  }

  async getDialogState(dialogId: string): Promise<DialogState> {
    const dialog = await this.prisma.dialog.findUnique({
      where: { id: dialogId },
      include: {
        messages: true,
        states: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!dialog) {
      throw new Error(`Dialog ${dialogId} not found`);
    }

    const latestState = dialog.states[0];
    const lastMessage = dialog.messages[dialog.messages.length - 1];

    return {
      dialogId: dialog.id,
      status: dialog.status.toLowerCase() as any,
      totalMessages: dialog.messages.length,
      lastMessageAt: lastMessage?.createdAt || dialog.createdAt,
      continuationScore: latestState?.continuationScore || 1.0,
      goalProgress: latestState?.goalProgress || 0,
      tokensUsed: latestState?.tokensUsed || 0,
      language: dialog.language
    };
  }

  async controlDialog(dialogId: string, action: 'pause' | 'resume' | 'complete' | 'escalate'): Promise<ControlResult> {
    try {
      const dialog = await this.prisma.dialog.findUnique({
        where: { id: dialogId }
      });

      if (!dialog) {
        throw new Error(`Dialog ${dialogId} not found`);
      }

      const statusMap = {
        pause: DialogStatus.PAUSED,
        resume: DialogStatus.ACTIVE,
        complete: DialogStatus.COMPLETED,
        escalate: DialogStatus.ESCALATED
      };

      const newStatus = statusMap[action];
      const previousStatus = dialog.status;

      await this.prisma.dialog.update({
        where: { id: dialogId },
        data: { status: newStatus }
      });

      await this.logEvent(dialogId, 'INFO', {
        action: 'dialog_control',
        controlAction: action,
        previousStatus,
        newStatus
      });

      return {
        dialogId,
        action,
        success: true,
        newStatus: newStatus.toLowerCase() as any,
        message: `Dialog ${action} successful`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logEvent(dialogId, 'ERROR', {
        action: 'dialog_control_failed',
        controlAction: action,
        error: errorMessage
      });
      throw error;
    }
  }

  private determineOperatorAlert(scoringResult: any): any {
    const score = scoringResult.continuationScore;
    
    if (score < this.config.scoring.thresholds.critical) {
      return {
        required: true,
        urgency: 'critical',
        reason: 'Dialog success score critically low'
      };
    }
    
    if (scoringResult.issuesDetected?.some((issue: any) => issue.severity === 'critical')) {
      return {
        required: true,
        urgency: 'high',
        reason: 'Critical issue detected in dialog'
      };
    }
    
    if (score < this.config.scoring.thresholds.riskZone) {
      return {
        required: true,
        urgency: 'medium',
        reason: 'Dialog entering risk zone'
      };
    }
    
    return undefined;
  }

  private async logEvent(dialogId: string | null, level: 'DEBUG' | 'INFO' | 'ERROR', data: any): Promise<void> {
    await this.prisma.log.create({
      data: {
        dialogId,
        level,
        data,
        text: JSON.stringify(data).substring(0, 500),
        fullJson: data
      }
    });
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}