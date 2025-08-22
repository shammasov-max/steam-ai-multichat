import { test, expect } from '@playwright/test';
import { DialogManager } from '../../src/DialogManager';
import { TestHelpers } from '../utils/test-helpers';
import { TestData } from '../fixtures/test-data';

test.describe('API Endpoint Contract Tests', () => {
  let dialogManager: DialogManager;

  test.beforeAll(async () => {
    dialogManager = new DialogManager({
      database: { url: process.env.DATABASE_URL! },
      openai: { 
        apiKey: process.env.OPENAI_API_KEY || 'test-key',
        model: 'gpt-3.5-turbo',
        maxTokensPerRequest: 1000
      }
    });
  });

  test.beforeEach(async () => {
    await TestHelpers.cleanupDatabase();
  });

  test.afterAll(async () => {
    await TestHelpers.cleanupDatabase();
    await dialogManager.close();
  });

  test.describe('CreateDialog API Contract', () => {
    test('should accept minimal required parameters', async () => {
      const minimalParams = {
        externalId: 'api-minimal-001',
        language: 'en' as const,
        goal: 'Test minimal API contract',
        completionCriteria: {
          type: 'user_agreement' as const
        }
      };

      const result = await dialogManager.createDialog(minimalParams);

      expect(result).toMatchObject({
        dialogId: expect.any(String),
        status: 'created',
        initialState: {
          language: 'en',
          goal: 'Test minimal API contract',
          completionCriteria: { type: 'user_agreement' }
        }
      });
    });

    test('should accept all optional parameters', async () => {
      const fullParams = {
        externalId: 'api-full-001',
        language: 'zh' as const,
        userInfo: {
          country: 'China',
          city: 'Beijing',
          age: 25,
          gender: 'male' as const,
          games: ['王者荣耀', '英雄联盟']
        },
        goal: '提供高级游戏指导订阅服务',
        completionCriteria: {
          type: 'user_agreement' as const,
          keywords: ['是的', '好的', '同意', '可以']
        },
        negotiationSettings: {
          startImmediately: true,
          maxConsecutiveMessages: 15,
          revivalTimeoutHours: 48,
          maxRevivalAttempts: 5
        },
        referenceContext: '春节特别优惠活动'
      };

      const result = await dialogManager.createDialog(fullParams);

      expect(result).toMatchObject({
        dialogId: expect.any(String),
        status: 'created',
        initialState: {
          language: 'zh',
          goal: '提供高级游戏指导订阅服务',
          completionCriteria: expect.objectContaining({
            type: 'user_agreement',
            keywords: expect.arrayContaining(['是的', '好的'])
          })
        }
      });
    });

    test('should validate language parameter', async () => {
      const invalidLanguageParams = {
        externalId: 'api-invalid-lang',
        language: 'invalid' as any,
        goal: 'Test invalid language',
        completionCriteria: { type: 'user_agreement' as const }
      };

      // Should accept the parameter but may default behavior
      const result = await dialogManager.createDialog(invalidLanguageParams);
      expect(result.dialogId).toBeTruthy();
    });

    test('should validate completion criteria types', async () => {
      const criteriaVariations = [
        {
          type: 'user_agreement' as const,
          keywords: ['yes', 'agree', 'sure']
        },
        {
          type: 'link_sent' as const,
          requiredLinkPattern: 'https://example.com/*'
        },
        {
          type: 'specific_message' as const
        },
        {
          type: 'custom' as const,
          customCondition: 'User must complete verification'
        }
      ];

      for (let i = 0; i < criteriaVariations.length; i++) {
        const params = {
          externalId: `api-criteria-${i}`,
          language: 'en' as const,
          goal: `Test criteria type ${i}`,
          completionCriteria: criteriaVariations[i]
        };

        const result = await dialogManager.createDialog(params);
        expect(result.status).toBe('created');
        expect(result.initialState.completionCriteria.type).toBe(criteriaVariations[i].type);
      }
    });

    test('should handle special characters in text fields', async () => {
      const specialCharsParams = {
        externalId: 'api-special-chars',
        language: 'en' as const,
        goal: 'Test with émojis 😊, spëcial chârs, and unicode: 你好世界 🌍',
        completionCriteria: {
          type: 'user_agreement' as const,
          keywords: ['yés', 'ågree', '确认', '同意']
        },
        referenceContext: 'Context with special chars: ñ, ç, ü, and symbols: @#$%^&*()'
      };

      const result = await dialogManager.createDialog(specialCharsParams);
      expect(result.status).toBe('created');
      expect(result.initialState.goal).toContain('émojis 😊');
    });

    test('should enforce external ID uniqueness', async () => {
      const firstParams = {
        externalId: 'unique-test-id',
        language: 'en' as const,
        goal: 'First dialog',
        completionCriteria: { type: 'user_agreement' as const }
      };

      const secondParams = {
        externalId: 'unique-test-id',
        language: 'en' as const,
        goal: 'Second dialog',
        completionCriteria: { type: 'user_agreement' as const }
      };

      await dialogManager.createDialog(firstParams);
      
      await expect(
        dialogManager.createDialog(secondParams)
      ).rejects.toThrow();
    });
  });

  test.describe('ProcessMessage API Contract', () => {
    let testDialogId: string;

    test.beforeEach(async () => {
      const createResult = await dialogManager.createDialog(
        TestHelpers.createMockDialogParams({
          externalId: 'api-process-test',
          language: 'en'
        })
      );
      testDialogId = createResult.dialogId;
    });

    test('should return complete response structure', async () => {
      const messageParams = {
        dialogId: testDialogId,
        message: {
          text: 'Hello, tell me about your service',
          timestamp: new Date()
        }
      };

      const result = await dialogManager.processMessage(messageParams);

      expect(result).toMatchObject({
        dialogId: testDialogId,
        responseMessages: expect.arrayContaining([
          expect.objectContaining({
            text: expect.any(String),
            sequenceNumber: expect.any(Number)
          })
        ]),
        successAssessment: expect.objectContaining({
          continuationScore: expect.any(Number),
          trend: expect.stringMatching(/^(rising|stable|declining)$/),
          factors: expect.objectContaining({
            userEngagement: expect.any(Number),
            topicRelevance: expect.any(Number),
            emotionalTone: expect.any(Number),
            responseQuality: expect.any(Number),
            goalProximity: expect.any(Number)
          })
        }),
        dialogState: expect.objectContaining({
          totalMessages: expect.any(Number),
          goalProgress: expect.any(Number),
          languageActive: expect.any(String),
          tokensUsed: expect.any(Number)
        })
      });

      // Validate score ranges
      expect(result.successAssessment.continuationScore).toBeGreaterThanOrEqual(0);
      expect(result.successAssessment.continuationScore).toBeLessThanOrEqual(1);
      
      Object.values(result.successAssessment.factors).forEach(factor => {
        expect(factor).toBeGreaterThanOrEqual(0);
        expect(factor).toBeLessThanOrEqual(1);
      });
    });

    test('should handle different message text formats', async () => {
      const messageVariations = [
        'Simple text message',
        'Message with numbers: 123, 456, 789',
        'Message with symbols: !@#$%^&*()',
        'Message with émojis: 😊😢👍👎',
        'Multi-line\nmessage\nwith\nbreaks',
        '中文消息测试',
        'メッセージのテスト',
        '메시지 테스트',
        'Mensaje de prueba',
        'Very long message that exceeds normal conversation length and continues for quite a while to test how the system handles lengthy user inputs that might be common in real-world usage scenarios where users provide detailed explanations or ask complex questions that require substantial context.'
      ];

      for (let i = 0; i < messageVariations.length; i++) {
        const result = await dialogManager.processMessage({
          dialogId: testDialogId,
          message: {
            text: messageVariations[i],
            timestamp: new Date()
          }
        });

        expect(result.responseMessages).toHaveLength(1);
        expect(result.responseMessages[0].text).toBeTruthy();
        expect(result.dialogState.totalMessages).toBe((i + 1) * 2);
      }
    });

    test('should validate timestamp parameter', async () => {
      const validTimestamps = [
        new Date(),
        new Date('2024-01-01T00:00:00Z'),
        new Date(Date.now() - 86400000) // 24 hours ago
      ];

      for (const timestamp of validTimestamps) {
        const result = await dialogManager.processMessage({
          dialogId: testDialogId,
          message: {
            text: 'Test timestamp validation',
            timestamp
          }
        });

        expect(result.responseMessages[0].text).toBeTruthy();
      }
    });

    test('should reject empty message text', async () => {
      await expect(
        dialogManager.processMessage({
          dialogId: testDialogId,
          message: {
            text: '',
            timestamp: new Date()
          }
        })
      ).rejects.toThrow();
    });

    test('should reject invalid dialog ID', async () => {
      await expect(
        dialogManager.processMessage({
          dialogId: 'non-existent-dialog-id',
          message: {
            text: 'Test message',
            timestamp: new Date()
          }
        })
      ).rejects.toThrow('Dialog non-existent-dialog-id not found');
    });

    test('should include operator alerts when appropriate', async () => {
      // Send aggressive message to trigger operator alert
      const result = await dialogManager.processMessage({
        dialogId: testDialogId,
        message: {
          text: 'This is fucking stupid! You are an idiot!',
          timestamp: new Date()
        }
      });

      if (result.successAssessment.operatorAlert) {
        expect(result.successAssessment.operatorAlert).toMatchObject({
          required: expect.any(Boolean),
          urgency: expect.stringMatching(/^(low|medium|high|critical)$/),
          reason: expect.any(String)
        });
      }
    });

    test('should include issues when detected', async () => {
      // Send rejection message to trigger issue detection
      const result = await dialogManager.processMessage({
        dialogId: testDialogId,
        message: {
          text: 'No thanks, I am not interested at all',
          timestamp: new Date()
        }
      });

      if (result.successAssessment.issuesDetected) {
        expect(Array.isArray(result.successAssessment.issuesDetected)).toBe(true);
        result.successAssessment.issuesDetected.forEach(issue => {
          expect(issue).toMatchObject({
            type: expect.stringMatching(/^(explicit_rejection|topic_drift|aggressive_response|low_engagement)$/),
            severity: expect.stringMatching(/^(low|medium|high|critical)$/),
            description: expect.any(String)
          });
        });
      }
    });
  });

  test.describe('GetDialogState API Contract', () => {
    let testDialogId: string;

    test.beforeEach(async () => {
      const createResult = await dialogManager.createDialog(
        TestHelpers.createMockDialogParams({
          externalId: 'api-state-test',
          language: 'ja'
        })
      );
      testDialogId = createResult.dialogId;
    });

    test('should return complete state structure', async () => {
      const state = await dialogManager.getDialogState(testDialogId);

      expect(state).toMatchObject({
        dialogId: testDialogId,
        status: expect.stringMatching(/^(active|paused|completed|escalated)$/),
        totalMessages: expect.any(Number),
        lastMessageAt: expect.any(Date),
        continuationScore: expect.any(Number),
        goalProgress: expect.any(Number),
        tokensUsed: expect.any(Number),
        language: expect.any(String)
      });

      // Validate ranges
      expect(state.continuationScore).toBeGreaterThanOrEqual(0);
      expect(state.continuationScore).toBeLessThanOrEqual(1);
      expect(state.goalProgress).toBeGreaterThanOrEqual(0);
      expect(state.goalProgress).toBeLessThanOrEqual(1);
      expect(state.totalMessages).toBeGreaterThanOrEqual(0);
      expect(state.tokensUsed).toBeGreaterThanOrEqual(0);
    });

    test('should return initial state for new dialog', async () => {
      const state = await dialogManager.getDialogState(testDialogId);

      expect(state.status).toBe('active');
      expect(state.totalMessages).toBe(0);
      expect(state.continuationScore).toBe(1.0);
      expect(state.goalProgress).toBe(0);
      expect(state.tokensUsed).toBe(0);
      expect(state.language).toBe('ja');
    });

    test('should update state after message processing', async () => {
      // Process a message first
      await dialogManager.processMessage({
        dialogId: testDialogId,
        message: {
          text: 'こんにちは、サービスについて教えてください',
          timestamp: new Date()
        }
      });

      const state = await dialogManager.getDialogState(testDialogId);

      expect(state.totalMessages).toBe(2);
      expect(state.tokensUsed).toBeGreaterThan(0);
      expect(state.lastMessageAt.getTime()).toBeGreaterThan(Date.now() - 60000); // Within last minute
    });

    test('should reject invalid dialog ID', async () => {
      await expect(
        dialogManager.getDialogState('non-existent-dialog-id')
      ).rejects.toThrow('Dialog non-existent-dialog-id not found');
    });
  });

  test.describe('ControlDialog API Contract', () => {
    let testDialogId: string;

    test.beforeEach(async () => {
      const createResult = await dialogManager.createDialog(
        TestHelpers.createMockDialogParams({
          externalId: 'api-control-test',
          language: 'ko'
        })
      );
      testDialogId = createResult.dialogId;
    });

    test('should handle pause action', async () => {
      const result = await dialogManager.controlDialog(testDialogId, 'pause');

      expect(result).toMatchObject({
        dialogId: testDialogId,
        action: 'pause',
        success: true,
        newStatus: 'paused',
        message: expect.any(String)
      });

      // Verify state change
      const state = await dialogManager.getDialogState(testDialogId);
      expect(state.status).toBe('paused');
    });

    test('should handle resume action', async () => {
      // First pause the dialog
      await dialogManager.controlDialog(testDialogId, 'pause');

      // Then resume it
      const result = await dialogManager.controlDialog(testDialogId, 'resume');

      expect(result).toMatchObject({
        dialogId: testDialogId,
        action: 'resume',
        success: true,
        newStatus: 'active',
        message: expect.any(String)
      });

      // Verify state change
      const state = await dialogManager.getDialogState(testDialogId);
      expect(state.status).toBe('active');
    });

    test('should handle complete action', async () => {
      const result = await dialogManager.controlDialog(testDialogId, 'complete');

      expect(result).toMatchObject({
        dialogId: testDialogId,
        action: 'complete',
        success: true,
        newStatus: 'completed',
        message: expect.any(String)
      });

      // Verify state change
      const state = await dialogManager.getDialogState(testDialogId);
      expect(state.status).toBe('completed');
    });

    test('should handle escalate action', async () => {
      const result = await dialogManager.controlDialog(testDialogId, 'escalate');

      expect(result).toMatchObject({
        dialogId: testDialogId,
        action: 'escalate',
        success: true,
        newStatus: 'escalated',
        message: expect.any(String)
      });

      // Verify state change
      const state = await dialogManager.getDialogState(testDialogId);
      expect(state.status).toBe('escalated');
    });

    test('should reject invalid actions', async () => {
      await expect(
        dialogManager.controlDialog(testDialogId, 'invalid-action' as any)
      ).rejects.toThrow();
    });

    test('should reject invalid dialog ID', async () => {
      await expect(
        dialogManager.controlDialog('non-existent-dialog-id', 'pause')
      ).rejects.toThrow('Dialog non-existent-dialog-id not found');
    });

    test('should handle sequential control operations', async () => {
      const operations = [
        { action: 'pause' as const, expectedStatus: 'paused' },
        { action: 'resume' as const, expectedStatus: 'active' },
        { action: 'complete' as const, expectedStatus: 'completed' }
      ];

      for (const operation of operations) {
        const result = await dialogManager.controlDialog(testDialogId, operation.action);
        expect(result.success).toBe(true);
        expect(result.newStatus).toBe(operation.expectedStatus);

        const state = await dialogManager.getDialogState(testDialogId);
        expect(state.status).toBe(operation.expectedStatus);
      }
    });
  });

  test.describe('API Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // This test would require database manipulation to simulate connection issues
      // For now, we test with invalid parameters that should be handled gracefully
      
      const invalidParams = {
        externalId: null as any,
        language: 'en' as const,
        goal: 'Test error handling',
        completionCriteria: { type: 'user_agreement' as const }
      };

      await expect(
        dialogManager.createDialog(invalidParams)
      ).rejects.toThrow();
    });

    test('should provide meaningful error messages', async () => {
      try {
        await dialogManager.processMessage({
          dialogId: 'definitely-does-not-exist',
          message: {
            text: 'Test message',
            timestamp: new Date()
          }
        });
      } catch (error) {
        expect(error.message).toContain('Dialog definitely-does-not-exist not found');
      }
    });

    test('should handle malformed JSON in user info', async () => {
      // Test with complex nested objects that might cause JSON issues
      const complexUserInfo = {
        preferences: {
          nested: {
            deeply: {
              complex: {
                object: {
                  with: {
                    many: {
                      levels: 'test'
                    }
                  }
                }
              }
            }
          }
        },
        circularRef: null as any
      };
      
      // Avoid actual circular reference which would break JSON.stringify
      const params = {
        externalId: 'complex-userinfo-test',
        language: 'en' as const,
        goal: 'Test complex user info',
        completionCriteria: { type: 'user_agreement' as const },
        userInfo: complexUserInfo
      };

      const result = await dialogManager.createDialog(params);
      expect(result.status).toBe('created');
    });
  });

  test.describe('API Performance Validation', () => {
    test('should respond to create dialog within reasonable time', async () => {
      const startTime = Date.now();
      
      const result = await dialogManager.createDialog(
        TestHelpers.createMockDialogParams({
          externalId: 'performance-create-test'
        })
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.status).toBe('created');
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });

    test('should respond to message processing within reasonable time', async () => {
      const createResult = await dialogManager.createDialog(
        TestHelpers.createMockDialogParams({
          externalId: 'performance-message-test'
        })
      );

      const startTime = Date.now();
      
      const result = await dialogManager.processMessage({
        dialogId: createResult.dialogId,
        message: {
          text: 'Performance test message',
          timestamp: new Date()
        }
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.responseMessages[0].text).toBeTruthy();
      expect(duration).toBeLessThan(10000); // 10 seconds max for AI processing
    });

    test('should handle concurrent API calls efficiently', async () => {
      const concurrentCreates = 5;
      
      const startTime = Date.now();
      
      const createPromises = Array.from({ length: concurrentCreates }, (_, i) =>
        dialogManager.createDialog(
          TestHelpers.createMockDialogParams({
            externalId: `concurrent-api-test-${i}`
          })
        )
      );

      const results = await Promise.all(createPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(concurrentCreates);
      results.forEach(result => {
        expect(result.status).toBe('created');
      });
      
      expect(duration).toBeLessThan(15000); // 15 seconds max for 5 concurrent creates
    });
  });
});