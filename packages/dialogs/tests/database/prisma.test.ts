import { test, expect } from '@playwright/test';
import { dialogsPrismaClient, DialogStatus } from '@local/prisma';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Prisma Database Tests', () => {
  let prisma: typeof dialogsPrismaClient;

  test.beforeAll(async () => {
    prisma = dialogsPrismaClient;
  });

  test.beforeEach(async () => {
    // Clean up database before each test
    await TestHelpers.cleanupDatabase();
  });

  test.afterAll(async () => {
    await TestHelpers.cleanupDatabase();
    await TestHelpers.disconnectDatabase();
  });

  test.describe('Dialog Model Operations', () => {
    test('should create dialog with required fields', async () => {
      const dialogData = {
        externalId: 'test-ext-001',
        status: DialogStatus.ACTIVE,
        language: 'en',
        goal: 'Test dialog creation',
        completionCriteria: {
          type: 'user_agreement',
          keywords: ['yes', 'agree', 'sure']
        }
      };

      const dialog = await prisma.dialog.create({
        data: dialogData
      });

      expect(dialog.id).toBeTruthy();
      expect(dialog.externalId).toBe(dialogData.externalId);
      expect(dialog.status).toBe(DialogStatus.ACTIVE);
      expect(dialog.language).toBe('en');
      expect(dialog.goal).toBe(dialogData.goal);
      expect(dialog.completionCriteria).toEqual(dialogData.completionCriteria);
      expect(dialog.createdAt).toBeInstanceOf(Date);
      expect(dialog.updatedAt).toBeInstanceOf(Date);
    });

    test('should create dialog with all optional fields', async () => {
      const fullDialogData = {
        externalId: 'test-ext-002',
        status: DialogStatus.ACTIVE,
        language: 'zh',
        userInfo: {
          age: 25,
          gender: 'male',
          country: 'China',
          city: 'Beijing',
          games: ['LOL', 'DOTA2']
        },
        goal: '提供高级游戏指导服务',
        completionCriteria: {
          type: 'user_agreement',
          keywords: ['是的', '好的', '同意']
        },
        negotiationSettings: {
          startImmediately: true,
          maxConsecutiveMessages: 10,
          revivalTimeoutHours: 24,
          maxRevivalAttempts: 3
        },
        referenceContext: '当前春节促销活动'
      };

      const dialog = await prisma.dialog.create({
        data: fullDialogData
      });

      expect(dialog.userInfo).toEqual(fullDialogData.userInfo);
      expect(dialog.negotiationSettings).toEqual(fullDialogData.negotiationSettings);
      expect(dialog.referenceContext).toBe(fullDialogData.referenceContext);
    });

    test('should enforce unique external ID constraint', async () => {
      const dialogData = {
        externalId: 'unique-test',
        status: DialogStatus.ACTIVE,
        language: 'en',
        goal: 'Test uniqueness',
        completionCriteria: { type: 'user_agreement' }
      };

      await prisma.dialog.create({ data: dialogData });

      // Attempt to create another dialog with same external ID
      await expect(
        prisma.dialog.create({ data: dialogData })
      ).rejects.toThrow();
    });

    test('should find dialog by external ID', async () => {
      const externalId = 'find-test-001';
      const dialogData = {
        externalId,
        status: DialogStatus.ACTIVE,
        language: 'en',
        goal: 'Test find operation',
        completionCriteria: { type: 'user_agreement' }
      };

      await prisma.dialog.create({ data: dialogData });

      const foundDialog = await prisma.dialog.findUnique({
        where: { externalId }
      });

      expect(foundDialog).toBeTruthy();
      expect(foundDialog!.externalId).toBe(externalId);
    });

    test('should update dialog status', async () => {
      const dialog = await prisma.dialog.create({
        data: {
          externalId: 'update-test-001',
          status: DialogStatus.ACTIVE,
          language: 'en',
          goal: 'Test update',
          completionCriteria: { type: 'user_agreement' }
        }
      });

      const updatedDialog = await prisma.dialog.update({
        where: { id: dialog.id },
        data: { status: DialogStatus.PAUSED }
      });

      expect(updatedDialog.status).toBe(DialogStatus.PAUSED);
      expect(updatedDialog.updatedAt.getTime()).toBeGreaterThan(dialog.updatedAt.getTime());
    });

    test('should delete dialog and cascade to related records', async () => {
      const dialog = await prisma.dialog.create({
        data: {
          externalId: 'delete-test-001',
          status: DialogStatus.ACTIVE,
          language: 'en',
          goal: 'Test deletion',
          completionCriteria: { type: 'user_agreement' }
        }
      });

      // Create related message
      await prisma.message.create({
        data: {
          dialogId: dialog.id,
          role: 'USER',
          content: 'Test message',
          sequenceNumber: 1
        }
      });

      // Create related state
      await prisma.dialogState.create({
        data: {
          dialogId: dialog.id,
          continuationScore: 0.8,
          currentStrategy: 'initial',
          tokensUsed: 100,
          goalProgress: 0.2
        }
      });

      // Delete dialog
      await prisma.dialog.delete({
        where: { id: dialog.id }
      });

      // Verify dialog and related records are deleted
      const deletedDialog = await prisma.dialog.findUnique({
        where: { id: dialog.id }
      });
      expect(deletedDialog).toBeNull();

      const relatedMessages = await prisma.message.findMany({
        where: { dialogId: dialog.id }
      });
      expect(relatedMessages).toHaveLength(0);

      const relatedStates = await prisma.dialogState.findMany({
        where: { dialogId: dialog.id }
      });
      expect(relatedStates).toHaveLength(0);
    });
  });

  test.describe('Message Model Operations', () => {
    test('should create user message', async () => {
      const dialog = await prisma.dialog.create({
        data: {
          externalId: 'msg-test-001',
          status: DialogStatus.ACTIVE,
          language: 'en',
          goal: 'Test messages',
          completionCriteria: { type: 'user_agreement' }
        }
      });

      const messageData = {
        dialogId: dialog.id,
        role: 'USER' as const,
        content: 'Hello, I want to learn about your service',
        sequenceNumber: 1,
        metadata: {
          detectedLanguage: 'en',
          timestamp: new Date().toISOString()
        }
      };

      const message = await prisma.message.create({
        data: messageData
      });

      expect(message.id).toBeTruthy();
      expect(message.dialogId).toBe(dialog.id);
      expect(message.role).toBe('USER');
      expect(message.content).toBe(messageData.content);
      expect(message.sequenceNumber).toBe(1);
      expect(message.metadata).toEqual(messageData.metadata);
      expect(message.createdAt).toBeInstanceOf(Date);
    });

    test('should create assistant message', async () => {
      const dialog = await prisma.dialog.create({
        data: {
          externalId: 'msg-test-002',
          status: DialogStatus.ACTIVE,
          language: 'en',
          goal: 'Test assistant messages',
          completionCriteria: { type: 'user_agreement' }
        }
      });

      const messageData = {
        dialogId: dialog.id,
        role: 'ASSISTANT' as const,
        content: 'Hello! I would be happy to tell you about our gaming coaching service.',
        sequenceNumber: 2,
        metadata: {
          tokensUsed: 150,
          strategy: 'engagement'
        }
      };

      const message = await prisma.message.create({
        data: messageData
      });

      expect(message.role).toBe('ASSISTANT');
      expect(message.metadata).toEqual(messageData.metadata);
    });

    test('should maintain message order with sequence numbers', async () => {
      const dialog = await prisma.dialog.create({
        data: {
          externalId: 'sequence-test-001',
          status: DialogStatus.ACTIVE,
          language: 'en',
          goal: 'Test sequence',
          completionCriteria: { type: 'user_agreement' }
        }
      });

      const messages = [
        { role: 'USER' as const, content: 'First message', sequenceNumber: 1 },
        { role: 'ASSISTANT' as const, content: 'Second message', sequenceNumber: 2 },
        { role: 'USER' as const, content: 'Third message', sequenceNumber: 3 },
        { role: 'ASSISTANT' as const, content: 'Fourth message', sequenceNumber: 4 }
      ];

      for (const msgData of messages) {
        await prisma.message.create({
          data: {
            dialogId: dialog.id,
            ...msgData
          }
        });
      }

      const retrievedMessages = await prisma.message.findMany({
        where: { dialogId: dialog.id },
        orderBy: { sequenceNumber: 'asc' }
      });

      expect(retrievedMessages).toHaveLength(4);
      retrievedMessages.forEach((msg, index) => {
        expect(msg.sequenceNumber).toBe(index + 1);
        expect(msg.content).toBe(messages[index].content);
      });
    });

    test('should retrieve messages with dialog relationship', async () => {
      const dialog = await prisma.dialog.create({
        data: {
          externalId: 'relation-test-001',
          status: DialogStatus.ACTIVE,
          language: 'ja',
          goal: 'テストメッセージ関係',
          completionCriteria: { type: 'user_agreement' }
        }
      });

      await prisma.message.create({
        data: {
          dialogId: dialog.id,
          role: 'USER',
          content: 'こんにちは',
          sequenceNumber: 1
        }
      });

      const dialogWithMessages = await prisma.dialog.findUnique({
        where: { id: dialog.id },
        include: { messages: true }
      });

      expect(dialogWithMessages!.messages).toHaveLength(1);
      expect(dialogWithMessages!.messages[0].content).toBe('こんにちは');
    });
  });

  test.describe('DialogState Model Operations', () => {
    test('should create dialog state', async () => {
      const dialog = await prisma.dialog.create({
        data: {
          externalId: 'state-test-001',
          status: DialogStatus.ACTIVE,
          language: 'en',
          goal: 'Test state creation',
          completionCriteria: { type: 'user_agreement' }
        }
      });

      const stateData = {
        dialogId: dialog.id,
        continuationScore: 0.75,
        compressedContext: JSON.stringify({
          summary: 'User is interested in the service',
          keyFacts: ['User asked about pricing'],
          recentMessages: []
        }),
        currentStrategy: 'persuasion',
        tokensUsed: 250,
        goalProgress: 0.4,
        issuesDetected: [
          {
            type: 'low_engagement',
            severity: 'medium',
            description: 'User responses are getting shorter'
          }
        ]
      };

      const state = await prisma.dialogState.create({
        data: stateData
      });

      expect(state.id).toBeTruthy();
      expect(state.dialogId).toBe(dialog.id);
      expect(state.continuationScore).toBe(0.75);
      expect(state.currentStrategy).toBe('persuasion');
      expect(state.tokensUsed).toBe(250);
      expect(state.goalProgress).toBe(0.4);
      expect(state.issuesDetected).toEqual(stateData.issuesDetected);
      expect(state.createdAt).toBeInstanceOf(Date);
    });

    test('should retrieve latest dialog state', async () => {
      const dialog = await prisma.dialog.create({
        data: {
          externalId: 'latest-state-test',
          status: DialogStatus.ACTIVE,
          language: 'en',
          goal: 'Test latest state',
          completionCriteria: { type: 'user_agreement' }
        }
      });

      // Create multiple states with different timestamps
      await TestHelpers.wait(10); // Small delay to ensure different timestamps
      const state1 = await prisma.dialogState.create({
        data: {
          dialogId: dialog.id,
          continuationScore: 0.6,
          currentStrategy: 'initial',
          tokensUsed: 100,
          goalProgress: 0.1
        }
      });

      await TestHelpers.wait(10);
      const state2 = await prisma.dialogState.create({
        data: {
          dialogId: dialog.id,
          continuationScore: 0.8,
          currentStrategy: 'engagement',
          tokensUsed: 200,
          goalProgress: 0.3
        }
      });

      const latestState = await prisma.dialogState.findFirst({
        where: { dialogId: dialog.id },
        orderBy: { createdAt: 'desc' }
      });

      expect(latestState!.id).toBe(state2.id);
      expect(latestState!.continuationScore).toBe(0.8);
    });

    test('should track dialog state history', async () => {
      const dialog = await prisma.dialog.create({
        data: {
          externalId: 'history-test-001',
          status: DialogStatus.ACTIVE,
          language: 'zh',
          goal: '追踪状态历史',
          completionCriteria: { type: 'user_agreement' }
        }
      });

      const stateHistory = [
        { score: 1.0, strategy: 'initial', tokens: 0, progress: 0 },
        { score: 0.8, strategy: 'engagement', tokens: 150, progress: 0.2 },
        { score: 0.6, strategy: 'persuasion', tokens: 300, progress: 0.4 },
        { score: 0.4, strategy: 'objection_handling', tokens: 450, progress: 0.3 }
      ];

      for (const state of stateHistory) {
        await prisma.dialogState.create({
          data: {
            dialogId: dialog.id,
            continuationScore: state.score,
            currentStrategy: state.strategy,
            tokensUsed: state.tokens,
            goalProgress: state.progress
          }
        });
        await TestHelpers.wait(5); // Ensure different timestamps
      }

      const allStates = await prisma.dialogState.findMany({
        where: { dialogId: dialog.id },
        orderBy: { createdAt: 'asc' }
      });

      expect(allStates).toHaveLength(4);
      expect(allStates[0].continuationScore).toBe(1.0);
      expect(allStates[3].continuationScore).toBe(0.4);
      expect(allStates[3].tokensUsed).toBe(450);
    });
  });

  test.describe('Log Model Operations', () => {
    test('should create log entry', async () => {
      const dialog = await prisma.dialog.create({
        data: {
          externalId: 'log-test-001',
          status: DialogStatus.ACTIVE,
          language: 'en',
          goal: 'Test logging',
          completionCriteria: { type: 'user_agreement' }
        }
      });

      const logData = {
        dialogId: dialog.id,
        level: 'INFO' as const,
        data: {
          action: 'message_processed',
          userMessage: 'Tell me about pricing',
          aiResponse: 'Our service starts at $29.99 per month',
          tokensUsed: 180
        },
        text: 'User asked about pricing',
        fullJson: {
          timestamp: new Date().toISOString(),
          sessionId: 'test-session-001',
          additionalData: { feature: 'pricing_inquiry' }
        }
      };

      const log = await prisma.log.create({
        data: logData
      });

      expect(log.id).toBeTruthy();
      expect(log.dialogId).toBe(dialog.id);
      expect(log.level).toBe('INFO');
      expect(log.data).toEqual(logData.data);
      expect(log.text).toBe(logData.text);
      expect(log.fullJson).toEqual(logData.fullJson);
      expect(log.datetime).toBeInstanceOf(Date);
    });

    test('should create log without dialog association', async () => {
      const logData = {
        level: 'ERROR' as const,
        data: {
          action: 'system_error',
          error: 'Database connection failed',
          component: 'DialogManager'
        },
        text: 'System error occurred'
      };

      const log = await prisma.log.create({
        data: logData
      });

      expect(log.dialogId).toBeNull();
      expect(log.level).toBe('ERROR');
    });

    test('should retrieve logs for specific dialog', async () => {
      const dialog = await prisma.dialog.create({
        data: {
          externalId: 'log-retrieval-test',
          status: DialogStatus.ACTIVE,
          language: 'en',
          goal: 'Test log retrieval',
          completionCriteria: { type: 'user_agreement' }
        }
      });

      const logEntries = [
        { level: 'INFO' as const, text: 'Dialog created' },
        { level: 'INFO' as const, text: 'First message processed' },
        { level: 'DEBUG' as const, text: 'Context compressed' },
        { level: 'INFO' as const, text: 'Second message processed' }
      ];

      for (const entry of logEntries) {
        await prisma.log.create({
          data: {
            dialogId: dialog.id,
            level: entry.level,
            data: { action: 'test' },
            text: entry.text
          }
        });
      }

      const dialogLogs = await prisma.log.findMany({
        where: { dialogId: dialog.id },
        orderBy: { datetime: 'asc' }
      });

      expect(dialogLogs).toHaveLength(4);
      expect(dialogLogs[0].text).toBe('Dialog created');
      expect(dialogLogs[3].text).toBe('Second message processed');
    });

    test('should filter logs by level', async () => {
      const dialog = await prisma.dialog.create({
        data: {
          externalId: 'log-level-test',
          status: DialogStatus.ACTIVE,
          language: 'en',
          goal: 'Test log levels',
          completionCriteria: { type: 'user_agreement' }
        }
      });

      await prisma.log.createMany({
        data: [
          {
            dialogId: dialog.id,
            level: 'DEBUG',
            data: { action: 'debug_action' },
            text: 'Debug message'
          },
          {
            dialogId: dialog.id,
            level: 'INFO',
            data: { action: 'info_action' },
            text: 'Info message'
          },
          {
            dialogId: dialog.id,
            level: 'ERROR',
            data: { action: 'error_action' },
            text: 'Error message'
          }
        ]
      });

      const errorLogs = await prisma.log.findMany({
        where: {
          dialogId: dialog.id,
          level: 'ERROR'
        }
      });

      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].text).toBe('Error message');
    });
  });

  test.describe('Complex Queries and Relationships', () => {
    test('should retrieve dialog with all related data', async () => {
      const dialog = await prisma.dialog.create({
        data: {
          externalId: 'full-relation-test',
          status: DialogStatus.ACTIVE,
          language: 'ko',
          goal: '전체 관계 테스트',
          completionCriteria: { type: 'user_agreement' }
        }
      });

      // Create messages
      await prisma.message.createMany({
        data: [
          {
            dialogId: dialog.id,
            role: 'USER',
            content: '안녕하세요',
            sequenceNumber: 1
          },
          {
            dialogId: dialog.id,
            role: 'ASSISTANT',
            content: '안녕하세요! 도움이 필요하신가요?',
            sequenceNumber: 2
          }
        ]
      });

      // Create states
      await prisma.dialogState.create({
        data: {
          dialogId: dialog.id,
          continuationScore: 0.9,
          currentStrategy: 'greeting',
          tokensUsed: 120,
          goalProgress: 0.1
        }
      });

      // Create logs
      await prisma.log.create({
        data: {
          dialogId: dialog.id,
          level: 'INFO',
          data: { action: 'dialog_created' },
          text: 'Dialog created successfully'
        }
      });

      const fullDialog = await prisma.dialog.findUnique({
        where: { id: dialog.id },
        include: {
          messages: {
            orderBy: { sequenceNumber: 'asc' }
          },
          states: {
            orderBy: { createdAt: 'desc' }
          },
          logs: {
            orderBy: { datetime: 'asc' }
          }
        }
      });

      expect(fullDialog!.messages).toHaveLength(2);
      expect(fullDialog!.states).toHaveLength(1);
      expect(fullDialog!.logs).toHaveLength(1);
      expect(fullDialog!.messages[0].content).toBe('안녕하세요');
      expect(fullDialog!.states[0].continuationScore).toBe(0.9);
    });

    test('should handle concurrent dialog operations', async () => {
      const dialogData = {
        externalId: 'concurrent-test',
        status: DialogStatus.ACTIVE,
        language: 'en',
        goal: 'Test concurrent operations',
        completionCriteria: { type: 'user_agreement' }
      };

      const dialog = await prisma.dialog.create({ data: dialogData });

      // Simulate concurrent message creation
      const messagePromises = Array.from({ length: 5 }, (_, i) =>
        prisma.message.create({
          data: {
            dialogId: dialog.id,
            role: i % 2 === 0 ? 'USER' : 'ASSISTANT',
            content: `Concurrent message ${i + 1}`,
            sequenceNumber: i + 1
          }
        })
      );

      const messages = await Promise.all(messagePromises);
      expect(messages).toHaveLength(5);

      const allMessages = await prisma.message.findMany({
        where: { dialogId: dialog.id },
        orderBy: { sequenceNumber: 'asc' }
      });

      expect(allMessages).toHaveLength(5);
      allMessages.forEach((msg, index) => {
        expect(msg.sequenceNumber).toBe(index + 1);
      });
    });

    test('should aggregate dialog statistics', async () => {
      // Create multiple dialogs
      const dialogs = await Promise.all([
        prisma.dialog.create({
          data: {
            externalId: 'stats-1',
            status: DialogStatus.ACTIVE,
            language: 'en',
            goal: 'Stats test 1',
            completionCriteria: { type: 'user_agreement' }
          }
        }),
        prisma.dialog.create({
          data: {
            externalId: 'stats-2',
            status: DialogStatus.COMPLETED,
            language: 'zh',
            goal: 'Stats test 2',
            completionCriteria: { type: 'user_agreement' }
          }
        }),
        prisma.dialog.create({
          data: {
            externalId: 'stats-3',
            status: DialogStatus.PAUSED,
            language: 'ja',
            goal: 'Stats test 3',
            completionCriteria: { type: 'user_agreement' }
          }
        })
      ]);

      // Add messages to each dialog
      for (let i = 0; i < dialogs.length; i++) {
        await prisma.message.createMany({
          data: Array.from({ length: (i + 1) * 2 }, (_, j) => ({
            dialogId: dialogs[i].id,
            role: j % 2 === 0 ? 'USER' : 'ASSISTANT',
            content: `Message ${j + 1}`,
            sequenceNumber: j + 1
          }))
        });
      }

      // Get dialog counts by status
      const statusCounts = await prisma.dialog.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      });

      expect(statusCounts).toHaveLength(3);
      expect(statusCounts.find(s => s.status === 'ACTIVE')?._count.id).toBe(1);
      expect(statusCounts.find(s => s.status === 'COMPLETED')?._count.id).toBe(1);
      expect(statusCounts.find(s => s.status === 'PAUSED')?._count.id).toBe(1);

      // Get message counts per dialog
      const messageCounts = await prisma.message.groupBy({
        by: ['dialogId'],
        _count: {
          id: true
        }
      });

      expect(messageCounts).toHaveLength(3);
      const counts = messageCounts.map(mc => mc._count.id).sort();
      expect(counts).toEqual([2, 4, 6]);
    });
  });

  test.describe('Data Integrity and Constraints', () => {
    test('should handle JSON field validation', async () => {
      const dialog = await prisma.dialog.create({
        data: {
          externalId: 'json-validation-test',
          status: DialogStatus.ACTIVE,
          language: 'en',
          goal: 'Test JSON validation',
          completionCriteria: {
            type: 'custom',
            customCondition: 'Complex validation rule',
            metadata: {
              validationType: 'advanced',
              rules: ['rule1', 'rule2'],
              config: { strict: true }
            }
          },
          userInfo: {
            preferences: {
              language: 'en',
              timezone: 'UTC',
              notifications: {
                email: true,
                sms: false
              }
            }
          }
        }
      });

      expect(dialog.completionCriteria).toHaveProperty('metadata');
      expect(dialog.userInfo).toHaveProperty('preferences');
    });

    test('should maintain referential integrity on deletion', async () => {
      const dialog = await prisma.dialog.create({
        data: {
          externalId: 'integrity-test',
          status: DialogStatus.ACTIVE,
          language: 'en',
          goal: 'Test referential integrity',
          completionCriteria: { type: 'user_agreement' }
        }
      });

      const message = await prisma.message.create({
        data: {
          dialogId: dialog.id,
          role: 'USER',
          content: 'Test message for integrity',
          sequenceNumber: 1
        }
      });

      // Delete dialog should cascade delete messages
      await prisma.dialog.delete({
        where: { id: dialog.id }
      });

      const orphanedMessage = await prisma.message.findUnique({
        where: { id: message.id }
      });

      expect(orphanedMessage).toBeNull();
    });

    test('should handle large JSON payloads', async () => {
      const largeUserInfo = {
        profile: {
          name: 'Test User',
          preferences: Array.from({ length: 100 }, (_, i) => ({
            key: `preference_${i}`,
            value: `value_${i}`,
            metadata: {
              priority: i % 5,
              tags: [`tag1_${i}`, `tag2_${i}`],
              config: { enabled: i % 2 === 0 }
            }
          }))
        },
        history: Array.from({ length: 50 }, (_, i) => ({
          action: `action_${i}`,
          timestamp: new Date(Date.now() - i * 1000).toISOString(),
          data: { step: i, success: true }
        }))
      };

      const dialog = await prisma.dialog.create({
        data: {
          externalId: 'large-json-test',
          status: DialogStatus.ACTIVE,
          language: 'en',
          goal: 'Test large JSON handling',
          completionCriteria: { type: 'user_agreement' },
          userInfo: largeUserInfo
        }
      });

      const retrievedDialog = await prisma.dialog.findUnique({
        where: { id: dialog.id }
      });

      expect(retrievedDialog!.userInfo).toEqual(largeUserInfo);
      expect(retrievedDialog!.userInfo.profile.preferences).toHaveLength(100);
      expect(retrievedDialog!.userInfo.history).toHaveLength(50);
    });
  });
});