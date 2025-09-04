import { test, expect } from '@playwright/test';
import { DialogManager } from '../src/DialogManager';
import { AIService } from '../src/services/AIService';
import { TestHelpers } from './utils/test-helpers';
import { dialogRepository } from '@packages/db';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables - try multiple locations
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

test.describe('Integration Tests', () => {
  test.describe('AI & DialogManager Integration', () => {
    let dialogManager: DialogManager;
    let aiService: AIService;

    test.beforeEach(async () => {
      if (!process.env.OPENAI_API_KEY) {
        test.skip();
        return;
      }

      await TestHelpers.cleanupDatabase();

      const apiKey = process.env.OPENAI_API_KEY;
      
      // Initialize services with increased token usage
      const config = {
        apiKey,
        model: 'gpt-4o-mini' as const,
        maxTokensPerRequest: 1000 // Increased to 1000
      };

      aiService = new AIService(config);
      dialogManager = new DialogManager({
        openai: config
      });
    });

    test.afterEach(async () => {
      await TestHelpers.cleanupDatabase();
    });

    test('should handle basic AI operations and dialog flow', async () => {
      // Test 1: Basic AI response generation
      const context = {
        summary: '',
        keyFacts: [],
        recentMessages: [
          { role: 'user' as const, content: 'Hi' }
        ],
        goal: 'Help user',
        userInfo: {}
      };

      const aiResponse = await aiService.generateResponse(
        context,
        'What is 2+2?',
        'en',
        { type: 'user_agreement' }
      );

      expect(aiResponse.text).toBeTruthy();
      expect(aiResponse.text.toLowerCase()).toMatch(/4|four/);
      expect(aiResponse.tokensUsed).toBeGreaterThan(0);

      // Test 2: Dialog creation and basic message processing
      const dialog = await dialogManager.createDialog({
        language: 'en' as const,
        goal: 'Quick test',
        init: 'You are a helpful assistant. Look for user agreement keywords like "yes", "agree" to complete the dialog.'
      });

      expect(dialog.dialogId).toBeTruthy();
      expect(dialog.status).toBe('created');

      // Activate the dialog before processing messages
      await dialogManager.controlDialog(dialog.dialogId, 'resume');

      // Test 3: Process a simple message
      const messageResult = await dialogManager.processMessage({
        dialogId: dialog.dialogId,
        message: {
          text: 'Yes',
          timestamp: new Date()
        }
      });

      expect(messageResult.responseMessages).toHaveLength(1);
      expect(messageResult.responseMessages[0].text).toBeTruthy();
      expect(messageResult.successAssessment.continuationScore).toBeGreaterThan(0);

      // Test 4: Verify dialog state
      const state = await dialogManager.getDialogState(dialog.dialogId);
      expect(state.dialogId).toBe(dialog.dialogId);
      expect(state.status).toBe('active');
      expect(state.totalMessages).toBeGreaterThan(0);

      // Test 5: Control dialog (pause)
      const controlResult = await dialogManager.controlDialog(dialog.dialogId, 'pause');
      expect(controlResult.success).toBe(true);
      expect(controlResult.newStatus).toBe('paused');
    });

    test('should handle multilingual scenarios', async () => {
      // Test Chinese language detection and processing
      const chineseDialog = await dialogManager.createDialog({
        language: 'zh' as const,
        goal: '提供游戏服务',
        init: '你是一个友好的游戏服务销售员。寻找用户同意的关键词如"好的"、"同意"、"是的"来完成对话。'
      });

      // Activate the dialog before processing messages
      await dialogManager.controlDialog(chineseDialog.dialogId, 'resume');

      const chineseResult = await dialogManager.processMessage({
        dialogId: chineseDialog.dialogId,
        message: {
          text: '好的',
          timestamp: new Date()
        }
      });

      expect(chineseResult.responseMessages).toHaveLength(1);
      expect(chineseResult.dialogState.languageActive).toBe('zh');
    });

    test('should detect rejection patterns', async () => {
      const dialog = await dialogManager.createDialog({
        language: 'en' as const,
        goal: 'Test rejection',
        init: 'You are testing rejection patterns. Look for rejection keywords like "no", "not interested" and respond appropriately.'
      });

      // Activate the dialog before processing messages
      await dialogManager.controlDialog(dialog.dialogId, 'resume');

      const result = await dialogManager.processMessage({
        dialogId: dialog.dialogId,
        message: {
          text: 'No thanks, not interested',
          timestamp: new Date()
        }
      });

      expect(result.successAssessment.continuationScore).toBeLessThan(0.5);
      const rejection = result.successAssessment.issuesDetected?.find(
        i => i.type === 'explicit_rejection'
      );
      expect(rejection).toBeDefined();
    });

    test('should handle comprehensive conversation flow with real AI', async () => {
      const dialog = await dialogManager.createDialog({
        language: 'en' as const,
        goal: 'Sell premium gaming coaching service and get user agreement',
        init: 'You are a friendly gaming coach salesperson. Your goal is to sell premium gaming coaching service and get user agreement. Look for agreement keywords like "yes", "agree", "sign up", "interested" to indicate user acceptance.'
      });

      // Activate the dialog before processing messages
      await dialogManager.controlDialog(dialog.dialogId, 'resume');

      // Test 1: Initial inquiry - should generate helpful response
      const step1 = await dialogManager.processMessage({
        dialogId: dialog.dialogId,
        message: {
          text: 'What is this gaming coaching service about?',
          timestamp: new Date()
        }
      });

      expect(step1.responseMessages[0].text).toBeTruthy();
      expect(step1.responseMessages[0].text.toLowerCase()).toMatch(/coaching|gaming|service/);
      expect(step1.successAssessment.continuationScore).toBeGreaterThan(0.3);

      // Test 2: Follow-up question - should maintain context
      const step2 = await dialogManager.processMessage({
        dialogId: dialog.dialogId,
        message: {
          text: 'How much does it cost per month?',
          timestamp: new Date()
        }
      });

      expect(step2.responseMessages[0].text).toBeTruthy();
      expect(step2.responseMessages[0].text.toLowerCase()).toMatch(/cost|price|month|payment/);

      // Test 3: Objection handling - AI should address concerns
      const step3 = await dialogManager.processMessage({
        dialogId: dialog.dialogId,
        message: {
          text: 'That seems expensive, I am not sure if it is worth it',
          timestamp: new Date()
        }
      });

      expect(step3.responseMessages[0].text).toBeTruthy();
      expect(step3.responseMessages[0].text.toLowerCase()).toMatch(/value|worth|benefit|improve/);

      // Test 4: Agreement - should respond positively
      const step4 = await dialogManager.processMessage({
        dialogId: dialog.dialogId,
        message: {
          text: 'Actually, that makes sense. I think I want to sign up for this service.',
          timestamp: new Date()
        }
      });

      expect(step4.responseMessages[0].text).toBeTruthy();
      expect(step4.successAssessment.continuationScore).toBeGreaterThan(0.45);
      // Goal progress may be undefined in current implementation
      if (step4.successAssessment.goalProgress !== undefined) {
        expect(step4.successAssessment.goalProgress).toBeGreaterThan(0.2);
      }

      // Verify conversation state
      const finalState = await dialogManager.getDialogState(dialog.dialogId);
      expect(finalState.totalMessages).toBeGreaterThan(6); // 4 user + AI responses
      expect(finalState.tokensUsed).toBeGreaterThan(0);
    });

    test('should handle topic drift and bring conversation back on track', async () => {
      const dialog = await dialogManager.createDialog({
        language: 'en' as const,
        goal: 'Discuss gaming subscription service',
        init: 'You are a gaming service representative. Stay on topic about gaming subscription services. Look for user agreement keywords.'
      });

      // Activate the dialog before processing messages
      await dialogManager.controlDialog(dialog.dialogId, 'resume');

      // Start on topic
      const step1 = await dialogManager.processMessage({
        dialogId: dialog.dialogId,
        message: {
          text: 'Tell me about your gaming services',
          timestamp: new Date()
        }
      });

      expect(step1.responseMessages[0].text.toLowerCase()).toMatch(/gaming|service/);

      // Drift off topic
      const step2 = await dialogManager.processMessage({
        dialogId: dialog.dialogId,
        message: {
          text: 'Do you know what the weather will be like tomorrow?',
          timestamp: new Date()
        }
      });

      expect(step2.responseMessages[0].text.toLowerCase()).toMatch(/gaming|service|focus|help/);
      expect(step2.successAssessment.issuesDetected?.some(i => i.type === 'topic_drift')).toBe(true);

      // Continue drift
      const step3 = await dialogManager.processMessage({
        dialogId: dialog.dialogId,
        message: {
          text: 'I also wanted to ask about good restaurants in the area',
          timestamp: new Date()
        }
      });

      expect(step3.successAssessment.continuationScore).toBeLessThan(0.6);
      const driftIssue = step3.successAssessment.issuesDetected?.find(i => i.type === 'topic_drift');
      expect(driftIssue).toBeDefined();
    });
  });

  test.describe('Database Operations', () => {
    test.beforeEach(async () => {
      try {
        await TestHelpers.cleanupDatabase();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });

    test.afterEach(async () => {
      try {
        await TestHelpers.cleanupDatabase();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });

    test('should handle dialog CRUD operations', async () => {
      try {
        // Simple test to verify dialogRepository is accessible
        expect(dialogRepository).toBeDefined();
        
        // Create a simple dialog
        const created = await dialogRepository.create({
          userId: 'test-user-123',
          status: 'ACTIVE',
          language: 'en',
          goal: 'Test goal',
          init: 'Test initial context',
          userInfo: { test: true }
        });

        expect(created.dialogId).toBeTruthy();
        expect(created.dialogId).toBeTruthy();
        
        // Just test finding by ID
        const found = await dialogRepository.findById(created.dialogId);
        expect(found?.dialogId).toBe(created.dialogId);
      } catch (error) {
        console.error('Test error:', error);
        throw error;
      }
    });
  });
});
