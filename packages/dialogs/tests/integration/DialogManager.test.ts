import { test, expect } from '@playwright/test';
import { DialogManager } from '../../src/DialogManager';
import { MockOpenAI } from '../mocks/mock-openai';
import { MockPrisma } from '../mocks/mock-prisma';
import { TestHelpers } from '../utils/test-helpers';
import { TestData } from '../fixtures/test-data';

test.describe('DialogManager Integration Tests', () => {
  let dialogManager: DialogManager;
  let mockOpenAI: MockOpenAI;
  let mockPrisma: MockPrisma;

  test.beforeEach(() => {
    mockOpenAI = MockOpenAI.getInstance();
    mockPrisma = MockPrisma.getInstance();
    
    mockOpenAI.reset();
    mockPrisma.reset();

    // Create DialogManager with test configuration
    dialogManager = new DialogManager(TestData.configs.full);
    
    // Replace dependencies with mocks
    (dialogManager as any).prisma = mockPrisma.getMockClient();
    (dialogManager as any).aiService.openai = mockOpenAI.getMockClient();
  });

  test.afterEach(() => {
    mockOpenAI.reset();
    mockPrisma.reset();
  });

  test.describe('Dialog Creation', () => {
    test('should create dialog successfully with valid parameters', async () => {
      const params = TestHelpers.createMockDialogParams();
      mockPrisma.mockDialogCreation('test-dialog-123');

      const result = await dialogManager.createDialog(params);

      expect(result.dialogId).toBe('test-dialog-123');
      expect(result.status).toBe('created');
      expect(result.initialState.language).toBe(params.language);
      expect(result.initialState.goal).toBe(params.goal);
      
      mockPrisma.verifyDialogCreated(params.externalId);
    });

    test('should create dialog with minimal parameters', async () => {
      const minimalParams = {
        externalId: 'minimal-test',
        language: 'en' as const,
        goal: 'Simple test goal',
        completionCriteria: { type: 'user_agreement' as const }
      };
      
      mockPrisma.mockDialogCreation('minimal-dialog-id');

      const result = await dialogManager.createDialog(minimalParams);

      expect(result.dialogId).toBe('minimal-dialog-id');
      expect(result.status).toBe('created');
    });

    test('should create dialog with Chinese language parameters', async () => {
      const chineseParams = TestHelpers.createMockDialogParams({
        language: 'zh',
        goal: '提供高级游戏指导订阅服务',
        completionCriteria: {
          type: 'user_agreement',
          keywords: ['是的', '好的', '同意', '可以']
        }
      });
      
      mockPrisma.mockDialogCreation('chinese-dialog-id');

      const result = await dialogManager.createDialog(chineseParams);

      expect(result.dialogId).toBe('chinese-dialog-id');
      expect(result.initialState.language).toBe('zh');
    });

    test('should create dialog with complex completion criteria', async () => {
      const complexParams = TestHelpers.createMockDialogParams({
        completionCriteria: {
          type: 'link_sent',
          requiredLinkPattern: 'https://example.com/signup/*',
          customCondition: 'User must receive registration link'
        }
      });
      
      mockPrisma.mockDialogCreation('complex-dialog-id');

      const result = await dialogManager.createDialog(complexParams);

      expect(result.dialogId).toBe('complex-dialog-id');
      expect(result.initialState.completionCriteria.type).toBe('link_sent');
    });

    test('should create dialog with negotiation settings', async () => {
      const negotiationParams = TestHelpers.createMockDialogParams({
        negotiationSettings: {
          startImmediately: true,
          maxConsecutiveMessages: 15,
          revivalTimeoutHours: 48,
          maxRevivalAttempts: 5
        }
      });
      
      mockPrisma.mockDialogCreation('negotiation-dialog-id');

      const result = await dialogManager.createDialog(negotiationParams);

      expect(result.dialogId).toBe('negotiation-dialog-id');
      expect(result.status).toBe('created');
    });

    test('should handle database errors during dialog creation', async () => {
      const params = TestHelpers.createMockDialogParams();
      mockPrisma.mockDatabaseError(new Error('Database connection failed'));

      await expect(dialogManager.createDialog(params)).rejects.toThrow('Database connection failed');
    });

    test('should log dialog creation events', async () => {
      const params = TestHelpers.createMockDialogParams();
      mockPrisma.mockDialogCreation('logged-dialog-id');
      mockPrisma.mockLogCreation();

      await dialogManager.createDialog(params);

      const logCalls = mockPrisma.getCallHistory().logCreates;
      expect(logCalls.length).toBeGreaterThan(0);
      
      const createLog = logCalls.find(call => 
        call.args[0].data.data.action === 'dialog_created'
      );
      expect(createLog).toBeDefined();
    });
  });

  test.describe('Message Processing', () => {
    test('should process message successfully', async () => {
      const dialogId = 'test-dialog-process';
      mockPrisma.mockDialogRetrieval(dialogId);
      mockPrisma.mockMessageCreation('new-message-id');
      mockPrisma.mockDialogStateCreation();
      mockPrisma.mockLogCreation();
      mockOpenAI.mockSuccessfulResponse('Great question! Our service offers...', 200);

      const messageParams = {
        dialogId,
        message: TestHelpers.createMockUserMessage('Tell me about your service')
      };

      const result = await dialogManager.processMessage(messageParams);

      expect(result.dialogId).toBe(dialogId);
      expect(result.responseMessages).toHaveLength(1);
      expect(result.responseMessages[0].text).toContain('Great question');
      expect(result.successAssessment.continuationScore).toBeGreaterThanOrEqual(0);
      expect(result.successAssessment.continuationScore).toBeLessThanOrEqual(1);
      expect(result.dialogState.totalMessages).toBeGreaterThan(0);
    });

    test('should process Chinese message correctly', async () => {
      const dialogId = 'chinese-dialog-process';
      mockPrisma.mockDialogRetrieval(dialogId);
      mockPrisma.mockMessageCreation();
      mockPrisma.mockDialogStateCreation();
      mockPrisma.mockLogCreation();
      mockOpenAI.mockChineseResponse();

      const messageParams = {
        dialogId,
        message: TestHelpers.createMockUserMessage('告诉我关于你们的服务')
      };

      const result = await dialogManager.processMessage(messageParams);

      expect(result.dialogId).toBe(dialogId);
      expect(result.responseMessages[0].text).toContain('游戏指导服务');
      expect(result.dialogState.languageActive).toBe('zh');
    });

    test('should process Japanese message correctly', async () => {
      const dialogId = 'japanese-dialog-process';
      mockPrisma.mockDialogRetrieval(dialogId);
      mockPrisma.mockMessageCreation();
      mockPrisma.mockDialogStateCreation();
      mockPrisma.mockLogCreation();
      mockOpenAI.mockJapaneseResponse();

      const messageParams = {
        dialogId,
        message: TestHelpers.createMockUserMessage('サービスについて教えてください')
      };

      const result = await dialogManager.processMessage(messageParams);

      expect(result.dialogId).toBe(dialogId);
      expect(result.responseMessages[0].text).toContain('ゲームコーチング');
      expect(result.dialogState.languageActive).toBe('ja');
    });

    test('should handle dialog not found error', async () => {
      mockPrisma.mockDialogNotFound();

      const messageParams = {
        dialogId: 'non-existent-dialog',
        message: TestHelpers.createMockUserMessage('Test message')
      };

      await expect(dialogManager.processMessage(messageParams)).rejects.toThrow('Dialog non-existent-dialog not found');
    });

    test('should handle inactive dialog status', async () => {
      const dialogId = 'inactive-dialog';
      
      // Mock dialog with COMPLETED status
      const mockDialog = {
        id: dialogId,
        status: 'COMPLETED',
        language: 'en',
        messages: [],
        states: []
      };
      mockPrisma.getMockClient().dialog.findUnique.resolves(mockDialog);

      const messageParams = {
        dialogId,
        message: TestHelpers.createMockUserMessage('Test message')
      };

      await expect(dialogManager.processMessage(messageParams)).rejects.toThrow('Dialog inactive-dialog is not active');
    });

    test('should calculate continuation score and detect issues', async () => {
      const dialogId = 'scoring-dialog';
      
      // Mock dialog with rejection messages
      const mockDialog = {
        id: dialogId,
        status: 'ACTIVE',
        language: 'en',
        goal: 'Get user agreement',
        completionCriteria: { type: 'user_agreement' },
        userInfo: { age: 25 },
        messages: [
          { role: 'USER', content: 'No thanks, not interested' },
          { role: 'ASSISTANT', content: 'I understand your concerns' }
        ],
        states: [{ tokensUsed: 100, continuationScore: 0.8 }]
      };
      mockPrisma.getMockClient().dialog.findUnique.resolves(mockDialog);
      mockPrisma.mockMessageCreation();
      mockPrisma.mockDialogStateCreation();
      mockPrisma.mockLogCreation();
      mockOpenAI.mockRejectionResponse();

      const messageParams = {
        dialogId,
        message: TestHelpers.createMockUserMessage('I really don\'t want this service')
      };

      const result = await dialogManager.processMessage(messageParams);

      expect(result.successAssessment.continuationScore).toBeLessThan(0.7);
      expect(result.successAssessment.issuesDetected).toBeDefined();
      expect(result.successAssessment.issuesDetected!.length).toBeGreaterThan(0);
    });

    test('should track token usage correctly', async () => {
      const dialogId = 'token-tracking-dialog';
      mockPrisma.mockDialogRetrieval(dialogId);
      mockPrisma.mockMessageCreation();
      mockPrisma.mockDialogStateCreation();
      mockPrisma.mockLogCreation();
      mockOpenAI.mockSuccessfulResponse('Response', 300);

      const messageParams = {
        dialogId,
        message: TestHelpers.createMockUserMessage('Test token tracking')
      };

      const result = await dialogManager.processMessage(messageParams);

      expect(result.dialogState.tokensUsed).toBeGreaterThan(0);
      // Should include previous tokens (150) + new tokens (300)
      expect(result.dialogState.tokensUsed).toBe(450);
    });

    test('should generate operator alerts for critical issues', async () => {
      const dialogId = 'critical-dialog';
      
      // Mock dialog with aggressive rejection
      const mockDialog = {
        id: dialogId,
        status: 'ACTIVE',
        language: 'en',
        goal: 'Get user agreement',
        completionCriteria: { type: 'user_agreement' },
        userInfo: { age: 25 },
        messages: [
          { role: 'USER', content: 'This is fucking stupid!' },
          { role: 'ASSISTANT', content: 'I apologize for any frustration' }
        ],
        states: [{ tokensUsed: 100, continuationScore: 0.1 }]
      };
      mockPrisma.getMockClient().dialog.findUnique.resolves(mockDialog);
      mockPrisma.mockMessageCreation();
      mockPrisma.mockDialogStateCreation();
      mockPrisma.mockLogCreation();
      mockOpenAI.mockSuccessfulResponse('I understand your frustration', 150);

      const messageParams = {
        dialogId,
        message: TestHelpers.createMockUserMessage('Leave me alone you idiot!')
      };

      const result = await dialogManager.processMessage(messageParams);

      expect(result.successAssessment.operatorAlert).toBeDefined();
      expect(result.successAssessment.operatorAlert!.required).toBe(true);
      expect(result.successAssessment.operatorAlert!.urgency).toMatch(/^(medium|high|critical)$/);
    });

    test('should handle OpenAI API errors during message processing', async () => {
      const dialogId = 'ai-error-dialog';
      mockPrisma.mockDialogRetrieval(dialogId);
      mockOpenAI.mockConnectionError();

      const messageParams = {
        dialogId,
        message: TestHelpers.createMockUserMessage('This should fail')
      };

      await expect(dialogManager.processMessage(messageParams)).rejects.toThrow('Failed to generate AI response');
    });

    test('should compress context for long conversations', async () => {
      const dialogId = 'long-conversation-dialog';
      
      // Mock dialog with many messages
      const longMessageHistory = Array.from({ length: 25 }, (_, i) => ({
        role: i % 2 === 0 ? 'USER' : 'ASSISTANT',
        content: `Message ${i}`,
        createdAt: new Date(Date.now() + i * 1000)
      }));
      
      const mockDialog = {
        id: dialogId,
        status: 'ACTIVE',
        language: 'en',
        goal: 'Long conversation test',
        completionCriteria: { type: 'user_agreement' },
        userInfo: { age: 25 },
        referenceContext: 'Test context',
        messages: longMessageHistory,
        states: [{ tokensUsed: 1000, continuationScore: 0.7 }]
      };
      
      mockPrisma.getMockClient().dialog.findUnique.resolves(mockDialog);
      mockPrisma.mockMessageCreation();
      mockPrisma.mockDialogStateCreation();
      mockPrisma.mockLogCreation();
      mockOpenAI.mockSuccessfulResponse('Compressed context response', 200);

      const messageParams = {
        dialogId,
        message: TestHelpers.createMockUserMessage('Continue conversation')
      };

      const result = await dialogManager.processMessage(messageParams);

      expect(result.dialogId).toBe(dialogId);
      expect(result.responseMessages[0].text).toBe('Compressed context response');
      
      // Verify that context compression was used
      const chatCalls = mockOpenAI.getCallHistory().chatCalls;
      expect(chatCalls.length).toBeGreaterThan(0);
    });
  });

  test.describe('Dialog State Management', () => {
    test('should retrieve dialog state successfully', async () => {
      const dialogId = 'state-retrieval-dialog';
      mockPrisma.mockDialogRetrieval(dialogId);

      const state = await dialogManager.getDialogState(dialogId);

      expect(state.dialogId).toBe(dialogId);
      expect(state.status).toMatch(/^(active|paused|completed|escalated)$/);
      expect(typeof state.totalMessages).toBe('number');
      expect(typeof state.continuationScore).toBe('number');
      expect(typeof state.goalProgress).toBe('number');
      expect(typeof state.tokensUsed).toBe('number');
      expect(typeof state.language).toBe('string');
      expect(state.lastMessageAt).toBeInstanceOf(Date);
    });

    test('should handle dialog not found for state retrieval', async () => {
      mockPrisma.mockDialogNotFound();

      await expect(dialogManager.getDialogState('non-existent')).rejects.toThrow('Dialog non-existent not found');
    });

    test('should return correct state for dialog without messages', async () => {
      const dialogId = 'empty-dialog';
      
      const mockDialog = {
        id: dialogId,
        status: 'ACTIVE',
        language: 'en',
        createdAt: new Date(),
        messages: [],
        states: []
      };
      mockPrisma.getMockClient().dialog.findUnique.resolves(mockDialog);

      const state = await dialogManager.getDialogState(dialogId);

      expect(state.totalMessages).toBe(0);
      expect(state.continuationScore).toBe(1.0);
      expect(state.goalProgress).toBe(0);
      expect(state.tokensUsed).toBe(0);
      expect(state.lastMessageAt).toEqual(mockDialog.createdAt);
    });
  });

  test.describe('Dialog Control Operations', () => {
    test('should pause dialog successfully', async () => {
      const dialogId = 'pause-dialog';
      
      const mockDialog = {
        id: dialogId,
        status: 'ACTIVE'
      };
      mockPrisma.getMockClient().dialog.findUnique.resolves(mockDialog);
      mockPrisma.mockDialogUpdate(dialogId, 'PAUSED' as any);
      mockPrisma.mockLogCreation();

      const result = await dialogManager.controlDialog(dialogId, 'pause');

      expect(result.dialogId).toBe(dialogId);
      expect(result.action).toBe('pause');
      expect(result.success).toBe(true);
      expect(result.newStatus).toBe('paused');
    });

    test('should resume dialog successfully', async () => {
      const dialogId = 'resume-dialog';
      
      const mockDialog = {
        id: dialogId,
        status: 'PAUSED'
      };
      mockPrisma.getMockClient().dialog.findUnique.resolves(mockDialog);
      mockPrisma.mockDialogUpdate(dialogId, 'ACTIVE' as any);
      mockPrisma.mockLogCreation();

      const result = await dialogManager.controlDialog(dialogId, 'resume');

      expect(result.dialogId).toBe(dialogId);
      expect(result.action).toBe('resume');
      expect(result.success).toBe(true);
      expect(result.newStatus).toBe('active');
    });

    test('should complete dialog successfully', async () => {
      const dialogId = 'complete-dialog';
      
      const mockDialog = {
        id: dialogId,
        status: 'ACTIVE'
      };
      mockPrisma.getMockClient().dialog.findUnique.resolves(mockDialog);
      mockPrisma.mockDialogUpdate(dialogId, 'COMPLETED' as any);
      mockPrisma.mockLogCreation();

      const result = await dialogManager.controlDialog(dialogId, 'complete');

      expect(result.dialogId).toBe(dialogId);
      expect(result.action).toBe('complete');
      expect(result.success).toBe(true);
      expect(result.newStatus).toBe('completed');
    });

    test('should escalate dialog successfully', async () => {
      const dialogId = 'escalate-dialog';
      
      const mockDialog = {
        id: dialogId,
        status: 'ACTIVE'
      };
      mockPrisma.getMockClient().dialog.findUnique.resolves(mockDialog);
      mockPrisma.mockDialogUpdate(dialogId, 'ESCALATED' as any);
      mockPrisma.mockLogCreation();

      const result = await dialogManager.controlDialog(dialogId, 'escalate');

      expect(result.dialogId).toBe(dialogId);
      expect(result.action).toBe('escalate');
      expect(result.success).toBe(true);
      expect(result.newStatus).toBe('escalated');
    });

    test('should handle control operation on non-existent dialog', async () => {
      mockPrisma.mockDialogNotFound();

      await expect(dialogManager.controlDialog('non-existent', 'pause')).rejects.toThrow('Dialog non-existent not found');
    });

    test('should log control operations', async () => {
      const dialogId = 'log-control-dialog';
      
      const mockDialog = {
        id: dialogId,
        status: 'ACTIVE'
      };
      mockPrisma.getMockClient().dialog.findUnique.resolves(mockDialog);
      mockPrisma.mockDialogUpdate(dialogId, 'PAUSED' as any);
      mockPrisma.mockLogCreation();

      await dialogManager.controlDialog(dialogId, 'pause');

      const logCalls = mockPrisma.getCallHistory().logCreates;
      const controlLog = logCalls.find(call => 
        call.args[0].data.data.action === 'dialog_control'
      );
      expect(controlLog).toBeDefined();
      expect(controlLog.args[0].data.data.controlAction).toBe('pause');
    });

    test('should handle database errors during control operations', async () => {
      const dialogId = 'error-control-dialog';
      
      const mockDialog = {
        id: dialogId,
        status: 'ACTIVE'
      };
      mockPrisma.getMockClient().dialog.findUnique.resolves(mockDialog);
      mockPrisma.getMockClient().dialog.update.rejects(new Error('Update failed'));
      mockPrisma.mockLogCreation();

      await expect(dialogManager.controlDialog(dialogId, 'pause')).rejects.toThrow('Update failed');
    });
  });

  test.describe('Configuration and Setup', () => {
    test('should load configuration from provided path', () => {
      const configPath = './test-config.yaml';
      const manager = new DialogManager({
        ...TestData.configs.minimal,
        configPath
      });
      
      // Should not throw and should have default config
      expect((manager as any).config).toBeDefined();
    });

    test('should use default configuration when file not found', () => {
      const manager = new DialogManager({
        ...TestData.configs.minimal,
        configPath: './non-existent-config.yaml'
      });
      
      expect((manager as any).config.scoring.thresholds.highSuccess).toBe(0.7);
      expect((manager as any).config.scoring.thresholds.critical).toBe(0.2);
    });

    test('should initialize all services correctly', () => {
      const manager = new DialogManager(TestData.configs.full);
      
      expect((manager as any).prisma).toBeDefined();
      expect((manager as any).aiService).toBeDefined();
      expect((manager as any).scoringEngine).toBeDefined();
      expect((manager as any).contextCompressor).toBeDefined();
      expect((manager as any).languageDetector).toBeDefined();
    });

    test('should close database connection', async () => {
      const manager = new DialogManager(TestData.configs.minimal);
      (manager as any).prisma = mockPrisma.getMockClient();
      
      await manager.close();
      
      expect(mockPrisma.getMockClient().$disconnect.called).toBe(true);
    });
  });

  test.describe('Error Handling and Logging', () => {
    test('should log errors during dialog creation', async () => {
      const params = TestHelpers.createMockDialogParams();
      mockPrisma.mockDatabaseError(new Error('Creation failed'));
      mockPrisma.mockLogCreation();

      try {
        await dialogManager.createDialog(params);
      } catch (error) {
        // Expected to throw
      }

      const logCalls = mockPrisma.getCallHistory().logCreates;
      const errorLog = logCalls.find(call => 
        call.args[0].data.level === 'ERROR' &&
        call.args[0].data.data.action === 'dialog_creation_failed'
      );
      expect(errorLog).toBeDefined();
    });

    test('should log errors during message processing', async () => {
      const dialogId = 'error-processing-dialog';
      mockPrisma.mockDialogRetrieval(dialogId);
      mockOpenAI.mockConnectionError();
      mockPrisma.mockLogCreation();

      const messageParams = {
        dialogId,
        message: TestHelpers.createMockUserMessage('Error test')
      };

      try {
        await dialogManager.processMessage(messageParams);
      } catch (error) {
        // Expected to throw
      }

      const logCalls = mockPrisma.getCallHistory().logCreates;
      const errorLog = logCalls.find(call => 
        call.args[0].data.level === 'ERROR' &&
        call.args[0].data.data.action === 'message_processing_failed'
      );
      expect(errorLog).toBeDefined();
    });

    test('should log errors during control operations', async () => {
      const dialogId = 'error-control-dialog';
      mockPrisma.mockDialogNotFound();
      mockPrisma.mockLogCreation();

      try {
        await dialogManager.controlDialog(dialogId, 'pause');
      } catch (error) {
        // Expected to throw
      }

      const logCalls = mockPrisma.getCallHistory().logCreates;
      const errorLog = logCalls.find(call => 
        call.args[0].data.level === 'ERROR' &&
        call.args[0].data.data.action === 'dialog_control_failed'
      );
      expect(errorLog).toBeDefined();
    });
  });
});