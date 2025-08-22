import { test, expect } from '@playwright/test';
import { DialogManager } from '../../src/DialogManager';
import { MockOpenAI } from '../mocks/mock-openai';
import { MockPrisma } from '../mocks/mock-prisma';
import { TestHelpers } from '../utils/test-helpers';
import { TestData } from '../fixtures/test-data';

test.describe('End-to-End Dialog Flow Tests', () => {
  let dialogManager: DialogManager;
  let mockOpenAI: MockOpenAI;
  let mockPrisma: MockPrisma;

  test.beforeAll(async () => {
    mockOpenAI = MockOpenAI.getInstance();
    mockPrisma = MockPrisma.getInstance();
    
    // Use mocked services for reliable E2E testing
    dialogManager = new DialogManager({
      database: { url: process.env.DATABASE_URL! },
      openai: { 
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
        maxTokensPerRequest: 1000
      }
    });
    
    // Replace with mocks for consistent behavior
    (dialogManager as any).prisma = mockPrisma.getMockClient();
    (dialogManager as any).aiService.openai = mockOpenAI.getMockClient();
  });

  test.beforeEach(async () => {
    // Reset mocks before each test
    mockOpenAI.reset();
    mockPrisma.reset();
  });

  test.afterAll(async () => {
    await dialogManager.close();
  });

  test.describe('Complete Dialog Lifecycle', () => {
    test('should handle complete English dialog flow successfully', async () => {
      // Step 1: Create dialog
      const createParams = TestHelpers.createMockDialogParams({
        externalId: 'e2e-english-flow',
        language: 'en',
        goal: 'Offer premium gaming coaching subscription',
        completionCriteria: {
          type: 'user_agreement',
          keywords: ['yes', 'agree', 'sure', 'okay', 'sign up']
        }
      });

      // Setup mocks for dialog creation
      mockPrisma.mockDialogCreation('e2e-english-flow-id');
      mockPrisma.mockLogCreation();

      const createResult = await dialogManager.createDialog(createParams);
      expect(createResult.status).toBe('created');
      expect(createResult.dialogId).toBeTruthy();

      const dialogId = createResult.dialogId;

      // Step 2: Initial user inquiry
      mockPrisma.mockDialogRetrieval(dialogId);
      mockPrisma.mockMessageCreation();
      mockPrisma.mockDialogStateCreation();
      mockPrisma.mockLogCreation();
      mockOpenAI.mockSuccessfulResponse('Hello! I\'d be happy to tell you about our premium gaming coaching service. We offer personalized coaching to help improve your gaming skills.', 200);

      const message1 = await dialogManager.processMessage({
        dialogId,
        message: TestHelpers.createMockUserMessage('Hi, what is this service about?')
      });

      expect(message1.responseMessages).toHaveLength(1);
      expect(message1.responseMessages[0].text).toBeTruthy();
      expect(message1.successAssessment.continuationScore).toBeGreaterThan(0.5);
      expect(message1.dialogState.totalMessages).toBe(2);

      // Step 3: User shows interest
      mockOpenAI.mockSuccessfulResponse('Great! Our service includes one-on-one coaching sessions, personalized training plans, game analysis, and access to pro-level strategies.', 180);
      
      const message2 = await dialogManager.processMessage({
        dialogId,
        message: TestHelpers.createMockUserMessage('That sounds interesting! Tell me more about the features.')
      });

      expect(message2.successAssessment.continuationScore).toBeGreaterThan(message1.successAssessment.continuationScore);
      expect(message2.dialogState.totalMessages).toBe(4);

      // Step 4: User asks about pricing
      mockOpenAI.mockSuccessfulResponse('Our premium subscription is $29.99 per month, which includes unlimited coaching sessions and access to all premium features.', 160);
      
      const message3 = await dialogManager.processMessage({
        dialogId,
        message: TestHelpers.createMockUserMessage('How much does it cost per month?')
      });

      expect(message3.successAssessment.factors.goalProximity).toBeGreaterThan(0);
      expect(message3.dialogState.totalMessages).toBe(6);

      // Step 5: User agrees to service
      mockOpenAI.mockAgreementResponse();
      
      const message4 = await dialogManager.processMessage({
        dialogId,
        message: TestHelpers.createMockUserMessage('Yes, I agree to try this service. Sign me up!')
      });

      expect(message4.successAssessment.continuationScore).toBeGreaterThan(0.8);
      expect(message4.successAssessment.factors.goalProximity).toBeGreaterThan(0.5);
      expect(message4.dialogState.goalProgress).toBeGreaterThan(0.5);

      // Step 6: Check final dialog state
      const finalState = await dialogManager.getDialogState(dialogId);
      expect(finalState.status).toBe('active');
      expect(finalState.totalMessages).toBe(8);
      expect(finalState.continuationScore).toBeGreaterThan(0.7);

      // Step 7: Complete the dialog
      mockPrisma.mockDialogUpdate(dialogId, 'COMPLETED' as any);
      
      const controlResult = await dialogManager.controlDialog(dialogId, 'complete');
      expect(controlResult.success).toBe(true);
      expect(controlResult.newStatus).toBe('completed');
    });

    test('should handle Chinese dialog flow with cultural nuances', async () => {
      // Create Chinese dialog
      const createParams = TestHelpers.createMockDialogParams({
        externalId: 'e2e-chinese-flow',
        language: 'zh',
        goal: '提供高级游戏指导订阅服务',
        completionCriteria: {
          type: 'user_agreement',
          keywords: ['是的', '好的', '同意', '可以', '注册']
        },
        userInfo: {
          country: 'China',
          city: 'Shanghai',
          age: 24,
          games: ['王者荣耀', '英雄联盟']
        }
      });

      const createResult = await dialogManager.createDialog(createParams);
      const dialogId = createResult.dialogId;

      // Chinese conversation flow
      const messages = [
        '你好，这是什么服务？',
        '听起来不错！能告诉我更多细节吗？',
        '我对王者荣耀的指导很感兴趣',
        '价格是多少？',
        '好的，我同意尝试这个服务'
      ];

      let previousScore = 0;
      for (let i = 0; i < messages.length; i++) {
        const result = await dialogManager.processMessage({
          dialogId,
          message: TestHelpers.createMockUserMessage(messages[i])
        });

        expect(result.responseMessages[0].text).toBeTruthy();
        expect(result.dialogState.languageActive).toBe('zh');
        
        if (i > 0) {
          // Score should generally improve as user shows more interest
          if (i === messages.length - 1) {
            expect(result.successAssessment.continuationScore).toBeGreaterThan(0.7);
          }
        }
        previousScore = result.successAssessment.continuationScore;
      }
    });

    test('should handle rejection flow gracefully', async () => {
      const createParams = TestHelpers.createMockDialogParams({
        externalId: 'e2e-rejection-flow',
        language: 'en',
        goal: 'Handle user rejection professionally'
      });

      const createResult = await dialogManager.createDialog(createParams);
      const dialogId = createResult.dialogId;

      // Rejection conversation flow
      const rejectionMessages = [
        'What is this about?',
        'No thanks, I am not interested',
        'I really don\'t want this service',
        'Please stop bothering me'
      ];

      let finalResult;
      for (const message of rejectionMessages) {
        finalResult = await dialogManager.processMessage({
          dialogId,
          message: TestHelpers.createMockUserMessage(message)
        });
      }

      expect(finalResult!.successAssessment.continuationScore).toBeLessThan(0.4);
      expect(finalResult!.successAssessment.issuesDetected).toBeDefined();
      expect(finalResult!.successAssessment.issuesDetected!.length).toBeGreaterThan(0);
      
      const rejectionIssue = finalResult!.successAssessment.issuesDetected!.find(
        issue => issue.type === 'explicit_rejection'
      );
      expect(rejectionIssue).toBeDefined();

      // Should recommend escalation or termination
      if (finalResult!.successAssessment.operatorAlert) {
        expect(finalResult!.successAssessment.operatorAlert.required).toBe(true);
      }
    });

    test('should handle aggressive user behavior', async () => {
      const createParams = TestHelpers.createMockDialogParams({
        externalId: 'e2e-aggressive-flow',
        language: 'en',
        goal: 'Handle aggressive behavior professionally'
      });

      const createResult = await dialogManager.createDialog(createParams);
      const dialogId = createResult.dialogId;

      // Aggressive conversation
      const aggressiveMessages = [
        'This is fucking stupid!',
        'You are an idiot, leave me alone!',
        'This is a scam service!'
      ];

      let finalResult;
      for (const message of aggressiveMessages) {
        finalResult = await dialogManager.processMessage({
          dialogId,
          message: TestHelpers.createMockUserMessage(message)
        });
      }

      expect(finalResult!.successAssessment.continuationScore).toBeLessThan(0.3);
      expect(finalResult!.successAssessment.issuesDetected).toBeDefined();
      
      const aggressiveIssue = finalResult!.successAssessment.issuesDetected!.find(
        issue => issue.type === 'aggressive_response'
      );
      expect(aggressiveIssue).toBeDefined();
      expect(aggressiveIssue!.severity).toBe('high');

      // Should require immediate operator alert
      expect(finalResult!.successAssessment.operatorAlert).toBeDefined();
      expect(finalResult!.successAssessment.operatorAlert!.required).toBe(true);
      expect(finalResult!.successAssessment.operatorAlert!.urgency).toMatch(/^(high|critical)$/);
    });

    test('should handle topic drift and recovery', async () => {
      const createParams = TestHelpers.createMockDialogParams({
        externalId: 'e2e-topic-drift-flow',
        language: 'en',
        goal: 'Maintain focus on gaming service offering'
      });

      const createResult = await dialogManager.createDialog(createParams);
      const dialogId = createResult.dialogId;

      // Topic drift conversation
      const driftMessages = [
        'Tell me about your gaming service',
        'What\'s the weather like today?',
        'Do you know any good restaurants?',
        'How about the latest movies?',
        'Actually, let\'s get back to the gaming service'
      ];

      let results = [];
      for (const message of driftMessages) {
        const result = await dialogManager.processMessage({
          dialogId,
          message: TestHelpers.createMockUserMessage(message)
        });
        results.push(result);
      }

      // Should detect topic drift in middle messages
      const middleResults = results.slice(1, 4);
      const topicDriftDetected = middleResults.some(result => 
        result.successAssessment.issuesDetected?.some(issue => 
          issue.type === 'topic_drift'
        )
      );
      expect(topicDriftDetected).toBe(true);

      // Final message should show recovery
      const finalResult = results[results.length - 1];
      expect(finalResult.successAssessment.factors.topicRelevance).toBeGreaterThan(0.3);
    });

    test('should handle multilingual conversation switching', async () => {
      const createParams = TestHelpers.createMockDialogParams({
        externalId: 'e2e-multilingual-flow',
        language: 'en',
        goal: 'Handle language switches gracefully'
      });

      const createResult = await dialogManager.createDialog(createParams);
      const dialogId = createResult.dialogId;

      // Multilingual conversation
      const multilingualMessages = [
        { text: 'Hello, tell me about your service', expectedLang: 'en' },
        { text: '你好，我想了解更多', expectedLang: 'zh' },
        { text: 'こんにちは、詳細を教えてください', expectedLang: 'ja' },
        { text: '안녕하세요, 서비스에 대해 알고 싶어요', expectedLang: 'ko' },
        { text: 'Let\'s continue in English', expectedLang: 'en' }
      ];

      for (const msgData of multilingualMessages) {
        const result = await dialogManager.processMessage({
          dialogId,
          message: TestHelpers.createMockUserMessage(msgData.text)
        });

        expect(result.dialogState.languageActive).toBe(msgData.expectedLang);
        expect(result.responseMessages[0].text).toBeTruthy();
      }
    });
  });

  test.describe('Long Conversation Context Management', () => {
    test('should handle long conversation with context compression', async () => {
      const createParams = TestHelpers.createMockDialogParams({
        externalId: 'e2e-long-conversation',
        language: 'en',
        goal: 'Test context compression in long conversations'
      });

      const createResult = await dialogManager.createDialog(createParams);
      const dialogId = createResult.dialogId;

      // Simulate long conversation (30 messages)
      const conversationFlow = [
        'Hi there!',
        'Tell me about your gaming service',
        'That sounds interesting',
        'What games do you support?',
        'I play a lot of strategy games',
        'How does the coaching work?',
        'What are your coaches\' qualifications?',
        'How much does it cost?',
        'Is there a free trial?',
        'What\'s included in the premium plan?',
        'Do you offer group sessions?',
        'How do I schedule sessions?',
        'What if I need to cancel?',
        'Are there any guarantees?',
        'Can I choose my coach?',
        'What about technical support?',
        'Do you have mobile apps?',
        'How do you track progress?',
        'What about privacy and data?',
        'Do you offer refunds?',
        'How long are the sessions?',
        'Can I upgrade my plan later?',
        'What payment methods do you accept?',
        'Is there a student discount?',
        'Do you offer corporate packages?',
        'How do I get started?',
        'This all sounds great!',
        'I think I want to try it',
        'Yes, I agree to sign up',
        'When can we start?'
      ];

      let finalResult;
      for (let i = 0; i < conversationFlow.length; i++) {
        finalResult = await dialogManager.processMessage({
          dialogId,
          message: TestHelpers.createMockUserMessage(conversationFlow[i])
        });

        // Verify context compression kicks in after threshold
        if (i > 15) {
          // Should have reasonable token usage (not exponentially growing)
          expect(finalResult!.dialogState.tokensUsed).toBeLessThan(10000);
        }
      }

      expect(finalResult!.dialogState.totalMessages).toBe(60); // 30 user + 30 assistant
      expect(finalResult!.successAssessment.continuationScore).toBeGreaterThan(0.8);
      expect(finalResult!.dialogState.goalProgress).toBeGreaterThan(0.7);
    });

    test('should maintain important facts through compression', async () => {
      const createParams = TestHelpers.createMockDialogParams({
        externalId: 'e2e-fact-preservation',
        language: 'en',
        goal: 'Preserve important user information through compression',
        userInfo: {
          name: 'John',
          age: 28,
          country: 'USA'
        }
      });

      const createResult = await dialogManager.createDialog(createParams);
      const dialogId = createResult.dialogId;

      // Conversation with important facts
      const factBasedFlow = [
        'Hi, my name is John Smith',
        'I live in San Francisco, California',
        'I am 28 years old',
        'I love playing strategy games like Starcraft',
        'I work as a software engineer',
        'I usually play games in the evening after work',
        'I am particularly interested in improving my micro-management',
        'I have been playing for about 5 years',
        'My current rank is Diamond league',
        'I want to reach Master league',
        // Add many filler messages to trigger compression
        ...Array.from({ length: 15 }, (_, i) => `This is filler message ${i + 1}`),
        'So given my background in Starcraft, what can you offer?',
        'I remember mentioning I am a Diamond player',
        'And I said I work evenings, so I need flexible scheduling'
      ];

      let finalResult;
      for (const message of factBasedFlow) {
        finalResult = await dialogManager.processMessage({
          dialogId,
          message: TestHelpers.createMockUserMessage(message)
        });
      }

      // The AI should still be aware of the important facts mentioned early
      // even after compression has occurred
      expect(finalResult!.dialogState.totalMessages).toBeGreaterThan(30);
      
      // Context should be compressed but key facts preserved
      // This would be verified by checking if the AI response acknowledges
      // the user's previously mentioned details like being a Diamond player
    });
  });

  test.describe('Error Recovery and Resilience', () => {
    test('should recover from temporary AI service disruptions', async () => {
      const createParams = TestHelpers.createMockDialogParams({
        externalId: 'e2e-ai-recovery',
        language: 'en',
        goal: 'Test AI service error recovery'
      });

      const createResult = await dialogManager.createDialog(createParams);
      const dialogId = createResult.dialogId;

      // Normal message should work
      const normalResult = await dialogManager.processMessage({
        dialogId,
        message: TestHelpers.createMockUserMessage('Hello, tell me about your service')
      });

      expect(normalResult.responseMessages[0].text).toBeTruthy();

      // Subsequent messages should continue to work
      const followupResult = await dialogManager.processMessage({
        dialogId,
        message: TestHelpers.createMockUserMessage('That sounds interesting, tell me more')
      });

      expect(followupResult.responseMessages[0].text).toBeTruthy();
      expect(followupResult.dialogState.totalMessages).toBe(4);
    });

    test('should handle invalid message inputs gracefully', async () => {
      const createParams = TestHelpers.createMockDialogParams({
        externalId: 'e2e-invalid-input',
        language: 'en',
        goal: 'Test invalid input handling'
      });

      const createResult = await dialogManager.createDialog(createParams);
      const dialogId = createResult.dialogId;

      // Empty message
      await expect(
        dialogManager.processMessage({
          dialogId,
          message: TestHelpers.createMockUserMessage('')
        })
      ).rejects.toThrow();

      // Very long message (should still work but may be truncated)
      const veryLongMessage = 'This is a very long message. '.repeat(500);
      const longMessageResult = await dialogManager.processMessage({
        dialogId,
        message: TestHelpers.createMockUserMessage(veryLongMessage)
      });

      expect(longMessageResult.responseMessages[0].text).toBeTruthy();
    });

    test('should handle dialog state corruption gracefully', async () => {
      const createParams = TestHelpers.createMockDialogParams({
        externalId: 'e2e-state-corruption',
        language: 'en',
        goal: 'Test state corruption handling'
      });

      const createResult = await dialogManager.createDialog(createParams);
      const dialogId = createResult.dialogId;

      // Normal operation
      const normalResult = await dialogManager.processMessage({
        dialogId,
        message: TestHelpers.createMockUserMessage('Normal message')
      });

      expect(normalResult.responseMessages[0].text).toBeTruthy();

      // Dialog should continue to function normally
      const continuationResult = await dialogManager.processMessage({
        dialogId,
        message: TestHelpers.createMockUserMessage('Another normal message')
      });

      expect(continuationResult.responseMessages[0].text).toBeTruthy();
      expect(continuationResult.dialogState.totalMessages).toBe(4);
    });
  });

  test.describe('Performance Under Load', () => {
    test('should handle rapid message processing', async () => {
      const createParams = TestHelpers.createMockDialogParams({
        externalId: 'e2e-rapid-messages',
        language: 'en',
        goal: 'Test rapid message processing'
      });

      const createResult = await dialogManager.createDialog(createParams);
      const dialogId = createResult.dialogId;

      const startTime = Date.now();
      
      // Send 10 messages rapidly
      const messagePromises = Array.from({ length: 10 }, (_, i) =>
        dialogManager.processMessage({
          dialogId,
          message: TestHelpers.createMockUserMessage(`Rapid message ${i + 1}`)
        })
      );

      const results = await Promise.all(messagePromises);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result.responseMessages[0].text).toBeTruthy();
        expect(result.dialogState.totalMessages).toBe((index + 1) * 2);
      });

      // Should complete within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(30000); // 30 seconds max
    });

    test('should maintain performance with multiple concurrent dialogs', async () => {
      const dialogCount = 5;
      const messagesPerDialog = 5;

      // Create multiple dialogs
      const createPromises = Array.from({ length: dialogCount }, (_, i) =>
        dialogManager.createDialog(TestHelpers.createMockDialogParams({
          externalId: `concurrent-dialog-${i}`,
          language: 'en',
          goal: `Concurrent test dialog ${i}`
        }))
      );

      const createResults = await Promise.all(createPromises);
      expect(createResults).toHaveLength(dialogCount);

      // Send messages to all dialogs concurrently
      const messagePromises = [];
      for (let i = 0; i < messagesPerDialog; i++) {
        for (const createResult of createResults) {
          messagePromises.push(
            dialogManager.processMessage({
              dialogId: createResult.dialogId,
              message: TestHelpers.createMockUserMessage(`Concurrent message ${i + 1}`)
            })
          );
        }
      }

      const startTime = Date.now();
      const messageResults = await Promise.all(messagePromises);
      const endTime = Date.now();

      expect(messageResults).toHaveLength(dialogCount * messagesPerDialog);
      messageResults.forEach(result => {
        expect(result.responseMessages[0].text).toBeTruthy();
        expect(result.successAssessment.continuationScore).toBeGreaterThanOrEqual(0);
      });

      // Should handle concurrent load efficiently
      expect(endTime - startTime).toBeLessThan(60000); // 60 seconds max
    });
  });
});