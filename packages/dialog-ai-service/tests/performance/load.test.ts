import { test, expect } from '@playwright/test';
import { DialogManager } from '../../src/DialogManager';
import { TestHelpers } from '../utils/test-helpers';
import { TestData } from '../fixtures/test-data';

test.describe('Performance and Load Tests', () => {
  let dialogManager: DialogManager;

  test.beforeAll(async () => {
    dialogManager = new DialogManager({
      database: { url: process.env.DATABASE_URL! },
      openai: { 
        apiKey: process.env.OPENAI_API_KEY || 'test-key',
        model: 'gpt-3.5-turbo',
        maxTokensPerRequest: 2000
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

  test.describe('Dialog Creation Performance', () => {
    test('should create single dialog within performance threshold', async () => {
      const startTime = Date.now();
      
      const result = await dialogManager.createDialog(
        TestHelpers.createMockDialogParams({
          externalId: 'perf-single-create'
        })
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.status).toBe('created');
      expect(duration).toBeLessThan(3000); // 3 seconds max
      
      console.log(`Single dialog creation took: ${duration}ms`);
    });

    test('should create multiple dialogs efficiently', async () => {
      const dialogCount = 10;
      const startTime = Date.now();
      
      const promises = Array.from({ length: dialogCount }, (_, i) =>
        dialogManager.createDialog(
          TestHelpers.createMockDialogParams({
            externalId: `perf-multi-create-${i}`,
            language: ['en', 'zh', 'ja', 'ko', 'es'][i % 5] as any
          })
        )
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgDuration = duration / dialogCount;

      expect(results).toHaveLength(dialogCount);
      results.forEach(result => {
        expect(result.status).toBe('created');
      });
      
      expect(avgDuration).toBeLessThan(1000); // 1 second average per dialog
      expect(duration).toBeLessThan(15000); // 15 seconds total
      
      console.log(`${dialogCount} dialogs created in ${duration}ms (${avgDuration.toFixed(2)}ms avg)`);
    });

    test('should handle concurrent dialog creation under load', async () => {
      const batchCount = 3;
      const dialogsPerBatch = 5;
      const totalDialogs = batchCount * dialogsPerBatch;
      
      const startTime = Date.now();
      
      const batchPromises = Array.from({ length: batchCount }, (_, batchIndex) =>
        Promise.all(
          Array.from({ length: dialogsPerBatch }, (_, dialogIndex) =>
            dialogManager.createDialog(
              TestHelpers.createMockDialogParams({
                externalId: `perf-batch-${batchIndex}-dialog-${dialogIndex}`
              })
            )
          )
        )
      );

      const batchResults = await Promise.all(batchPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const allResults = batchResults.flat();
      expect(allResults).toHaveLength(totalDialogs);
      
      const avgDuration = duration / totalDialogs;
      expect(avgDuration).toBeLessThan(2000); // 2 seconds average per dialog under concurrent load
      
      console.log(`${totalDialogs} concurrent dialogs created in ${duration}ms (${avgDuration.toFixed(2)}ms avg)`);
    });

    test('should maintain performance with complex dialog parameters', async () => {
      const complexParams = {
        externalId: 'perf-complex-dialog',
        language: 'zh' as const,
        userInfo: {
          country: 'China',
          city: 'Shanghai',
          age: 28,
          gender: 'male' as const,
          games: Array.from({ length: 20 }, (_, i) => `Game${i}`),
          preferences: {
            gameTypes: ['Strategy', 'RPG', 'Action', 'Simulation'],
            playTime: 'Evening',
            experience: 'Intermediate',
            goals: ['Improve ranking', 'Learn new strategies', 'Team coordination']
          },
          history: Array.from({ length: 50 }, (_, i) => ({
            date: new Date(Date.now() - i * 86400000).toISOString(),
            activity: `Activity ${i}`,
            result: `Result ${i}`
          }))
        },
        goal: '为用户提供个性化的高级游戏指导服务，包括实时指导、策略分析、技能提升和排名优化',
        completionCriteria: {
          type: 'user_agreement' as const,
          keywords: ['是的', '好的', '同意', '可以', '注册', '订阅'],
          customCondition: '用户必须确认理解服务条款并同意付费订阅'
        },
        negotiationSettings: {
          startImmediately: true,
          maxConsecutiveMessages: 20,
          revivalTimeoutHours: 72,
          maxRevivalAttempts: 5
        },
        referenceContext: '当前春节特别优惠活动，新用户首月半价，专业教练一对一指导，包含详细的游戏分析报告和个人提升计划'
      };

      const startTime = Date.now();
      const result = await dialogManager.createDialog(complexParams);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.status).toBe('created');
      expect(duration).toBeLessThan(5000); // 5 seconds for complex dialog
      
      console.log(`Complex dialog creation took: ${duration}ms`);
    });
  });

  test.describe('Message Processing Performance', () => {
    let testDialogId: string;

    test.beforeEach(async () => {
      const createResult = await dialogManager.createDialog(
        TestHelpers.createMockDialogParams({
          externalId: 'perf-message-test'
        })
      );
      testDialogId = createResult.dialogId;
    });

    test('should process single message within performance threshold', async () => {
      const startTime = Date.now();
      
      const result = await dialogManager.processMessage({
        dialogId: testDialogId,
        message: TestHelpers.createMockUserMessage('Hello, tell me about your gaming service')
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.responseMessages).toHaveLength(1);
      expect(result.responseMessages[0].text).toBeTruthy();
      expect(duration).toBeLessThan(8000); // 8 seconds max for AI processing
      
      console.log(`Single message processing took: ${duration}ms`);
    });

    test('should maintain performance with message sequence', async () => {
      const messages = [
        'Hello, what is this service about?',
        'That sounds interesting, tell me more',
        'What games do you support?',
        'How much does it cost?',
        'What are the features included?',
        'Is there a free trial?',
        'How do I sign up?',
        'Yes, I want to try it'
      ];

      const durations: number[] = [];
      
      for (let i = 0; i < messages.length; i++) {
        const startTime = Date.now();
        
        const result = await dialogManager.processMessage({
          dialogId: testDialogId,
          message: TestHelpers.createMockUserMessage(messages[i])
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        durations.push(duration);

        expect(result.responseMessages[0].text).toBeTruthy();
        expect(duration).toBeLessThan(10000); // 10 seconds max per message
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      expect(avgDuration).toBeLessThan(8000); // 8 seconds average
      
      console.log(`Message sequence average processing time: ${avgDuration.toFixed(2)}ms`);
      console.log(`Processing times: ${durations.map(d => d.toString()).join(', ')}ms`);
    });

    test('should handle rapid message processing', async () => {
      const messageCount = 5;
      const messages = Array.from({ length: messageCount }, (_, i) => 
        `Rapid message ${i + 1}: Tell me about your service features`
      );

      const startTime = Date.now();
      
      // Process messages sequentially to avoid overwhelming the AI service
      const results = [];
      for (const message of messages) {
        const result = await dialogManager.processMessage({
          dialogId: testDialogId,
          message: TestHelpers.createMockUserMessage(message)
        });
        results.push(result);
      }
      
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      const avgDuration = totalDuration / messageCount;

      expect(results).toHaveLength(messageCount);
      results.forEach(result => {
        expect(result.responseMessages[0].text).toBeTruthy();
      });
      
      expect(avgDuration).toBeLessThan(10000); // 10 seconds average per message
      
      console.log(`${messageCount} rapid messages processed in ${totalDuration}ms (${avgDuration.toFixed(2)}ms avg)`);
    });

    test('should handle long conversation context efficiently', async () => {
      // Create a conversation with many messages to test context compression
      const conversationLength = 25;
      const conversationMessages = Array.from({ length: conversationLength }, (_, i) =>
        `Message ${i + 1}: This is part of a long conversation about gaming services. ` +
        'I want to understand all the features, pricing, and benefits. ' +
        'Please provide detailed information about your coaching methodology.'
      );

      const durations: number[] = [];
      
      for (let i = 0; i < conversationLength; i++) {
        const startTime = Date.now();
        
        const result = await dialogManager.processMessage({
          dialogId: testDialogId,
          message: TestHelpers.createMockUserMessage(conversationMessages[i])
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        durations.push(duration);

        expect(result.responseMessages[0].text).toBeTruthy();
        
        // Performance should remain reasonable even with growing context
        expect(duration).toBeLessThan(12000); // 12 seconds max
        
        // Token usage should not grow exponentially due to compression
        expect(result.dialogState.tokensUsed).toBeLessThan(20000);
      }

      // Performance should not degrade significantly over time
      const firstHalf = durations.slice(0, Math.floor(conversationLength / 2));
      const secondHalf = durations.slice(Math.floor(conversationLength / 2));
      
      const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      // Second half should not be more than 50% slower than first half
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5);
      
      console.log(`Long conversation - First half avg: ${firstHalfAvg.toFixed(2)}ms, Second half avg: ${secondHalfAvg.toFixed(2)}ms`);
    });
  });

  test.describe('Database Performance', () => {
    test('should handle bulk dialog state retrieval efficiently', async () => {
      const dialogCount = 20;
      
      // Create multiple dialogs
      const createPromises = Array.from({ length: dialogCount }, (_, i) =>
        dialogManager.createDialog(
          TestHelpers.createMockDialogParams({
            externalId: `perf-state-retrieval-${i}`
          })
        )
      );

      const createResults = await Promise.all(createPromises);
      const dialogIds = createResults.map(r => r.dialogId);

      // Retrieve all dialog states
      const startTime = Date.now();
      
      const statePromises = dialogIds.map(id => dialogManager.getDialogState(id));
      const states = await Promise.all(statePromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgDuration = duration / dialogCount;

      expect(states).toHaveLength(dialogCount);
      states.forEach(state => {
        expect(state.dialogId).toBeTruthy();
        expect(state.status).toBe('active');
      });
      
      expect(avgDuration).toBeLessThan(500); // 500ms average per state retrieval
      
      console.log(`${dialogCount} state retrievals completed in ${duration}ms (${avgDuration.toFixed(2)}ms avg)`);
    });

    test('should handle concurrent dialog control operations', async () => {
      const dialogCount = 10;
      
      // Create dialogs
      const createPromises = Array.from({ length: dialogCount }, (_, i) =>
        dialogManager.createDialog(
          TestHelpers.createMockDialogParams({
            externalId: `perf-control-ops-${i}`
          })
        )
      );

      const createResults = await Promise.all(createPromises);
      const dialogIds = createResults.map(r => r.dialogId);

      // Perform control operations concurrently
      const startTime = Date.now();
      
      const controlPromises = dialogIds.map((id, index) => {
        const action = ['pause', 'resume', 'complete', 'escalate'][index % 4] as any;
        return dialogManager.controlDialog(id, action);
      });

      const controlResults = await Promise.all(controlPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgDuration = duration / dialogCount;

      expect(controlResults).toHaveLength(dialogCount);
      controlResults.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      expect(avgDuration).toBeLessThan(1000); // 1 second average per control operation
      
      console.log(`${dialogCount} control operations completed in ${duration}ms (${avgDuration.toFixed(2)}ms avg)`);
    });

    test('should maintain performance with large user info objects', async () => {
      const largeUserInfoCount = 5;
      
      const createPromises = Array.from({ length: largeUserInfoCount }, (_, i) => {
        const largeUserInfo = {
          basicInfo: {
            name: `User ${i}`,
            age: 20 + i,
            country: 'TestCountry',
            city: 'TestCity'
          },
          gamePreferences: Array.from({ length: 100 }, (_, j) => ({
            gameId: `game-${j}`,
            preference: Math.random(),
            playtime: Math.random() * 1000,
            achievements: Array.from({ length: 10 }, (_, k) => `achievement-${k}`)
          })),
          history: Array.from({ length: 500 }, (_, j) => ({
            timestamp: new Date(Date.now() - j * 86400000).toISOString(),
            action: `action-${j}`,
            data: {
              details: `detail-${j}`,
              metadata: {
                score: Math.random() * 100,
                duration: Math.random() * 3600,
                tags: [`tag1-${j}`, `tag2-${j}`]
              }
            }
          }))
        };

        return dialogManager.createDialog(
          TestHelpers.createMockDialogParams({
            externalId: `perf-large-userinfo-${i}`,
            userInfo: largeUserInfo
          })
        );
      });

      const startTime = Date.now();
      const results = await Promise.all(createPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgDuration = duration / largeUserInfoCount;

      expect(results).toHaveLength(largeUserInfoCount);
      results.forEach(result => {
        expect(result.status).toBe('created');
      });
      
      expect(avgDuration).toBeLessThan(3000); // 3 seconds average for large user info
      
      console.log(`${largeUserInfoCount} dialogs with large user info created in ${duration}ms (${avgDuration.toFixed(2)}ms avg)`);
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('should handle multiple concurrent dialogs without memory leaks', async () => {
      const dialogCount = 15;
      const messagesPerDialog = 5;
      
      // Record initial memory usage
      const initialMemory = process.memoryUsage();
      
      // Create dialogs and process messages
      const dialogPromises = Array.from({ length: dialogCount }, async (_, i) => {
        const createResult = await dialogManager.createDialog(
          TestHelpers.createMockDialogParams({
            externalId: `memory-test-dialog-${i}`
          })
        );

        const messagePromises = Array.from({ length: messagesPerDialog }, (_, j) =>
          dialogManager.processMessage({
            dialogId: createResult.dialogId,
            message: TestHelpers.createMockUserMessage(`Message ${j + 1} for dialog ${i}`)
          })
        );

        return Promise.all(messagePromises);
      });

      await Promise.all(dialogPromises);
      
      // Check memory usage after operations
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
      
      // Memory increase should be reasonable (less than 100MB for this test)
      expect(memoryIncreaseMB).toBeLessThan(100);
      
      console.log(`Memory usage increased by ${memoryIncreaseMB.toFixed(2)}MB for ${dialogCount} dialogs with ${messagesPerDialog} messages each`);
      console.log(`Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB, Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    });

    test('should efficiently manage context compression memory', async () => {
      const createResult = await dialogManager.createDialog(
        TestHelpers.createMockDialogParams({
          externalId: 'memory-compression-test'
        })
      );

      const initialMemory = process.memoryUsage();
      
      // Create a very long conversation to test compression
      for (let i = 0; i < 30; i++) {
        await dialogManager.processMessage({
          dialogId: createResult.dialogId,
          message: TestHelpers.createMockUserMessage(
            `Long message ${i + 1}: ` + 'This is a very long message with lots of content. '.repeat(20)
          )
        });
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
      
      // Memory should not grow linearly with message count due to compression
      expect(memoryIncreaseMB).toBeLessThan(50);
      
      console.log(`Memory usage for 30 long messages: ${memoryIncreaseMB.toFixed(2)}MB increase`);
    });
  });

  test.describe('Scalability Tests', () => {
    test('should maintain performance under simulated production load', async () => {
      const concurrentDialogs = 8;
      const messagesPerDialog = 10;
      
      console.log(`Starting production load simulation: ${concurrentDialogs} concurrent dialogs, ${messagesPerDialog} messages each`);
      
      const startTime = Date.now();
      
      const dialogPromises = Array.from({ length: concurrentDialogs }, async (_, dialogIndex) => {
        const createResult = await dialogManager.createDialog(
          TestHelpers.createMockDialogParams({
            externalId: `production-load-dialog-${dialogIndex}`,
            language: ['en', 'zh', 'ja', 'ko'][dialogIndex % 4] as any
          })
        );

        const dialogStartTime = Date.now();
        
        // Process messages sequentially within each dialog (more realistic)
        for (let msgIndex = 0; msgIndex < messagesPerDialog; msgIndex++) {
          await dialogManager.processMessage({
            dialogId: createResult.dialogId,
            message: TestHelpers.createMockUserMessage(
              `Production load message ${msgIndex + 1} for dialog ${dialogIndex}`
            )
          });
        }
        
        const dialogEndTime = Date.now();
        return {
          dialogIndex,
          duration: dialogEndTime - dialogStartTime,
          dialogId: createResult.dialogId
        };
      });

      const results = await Promise.all(dialogPromises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      
      const avgDialogDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      const avgMessageDuration = avgDialogDuration / messagesPerDialog;
      
      expect(results).toHaveLength(concurrentDialogs);
      expect(avgMessageDuration).toBeLessThan(8000); // 8 seconds average per message under load
      expect(totalDuration).toBeLessThan(120000); // 2 minutes total for entire load test
      
      console.log(`Production load test completed in ${totalDuration}ms`);
      console.log(`Average dialog duration: ${avgDialogDuration.toFixed(2)}ms`);
      console.log(`Average message duration: ${avgMessageDuration.toFixed(2)}ms`);
    });

    test('should handle burst traffic patterns', async () => {
      const burstSize = 12;
      const burstCount = 3;
      const delayBetweenBursts = 2000; // 2 seconds
      
      console.log(`Testing burst pattern: ${burstCount} bursts of ${burstSize} dialogs each`);
      
      const allResults = [];
      
      for (let burst = 0; burst < burstCount; burst++) {
        console.log(`Starting burst ${burst + 1}`);
        
        const burstStartTime = Date.now();
        
        const burstPromises = Array.from({ length: burstSize }, (_, i) =>
          dialogManager.createDialog(
            TestHelpers.createMockDialogParams({
              externalId: `burst-${burst}-dialog-${i}`
            })
          )
        );

        const burstResults = await Promise.all(burstPromises);
        const burstEndTime = Date.now();
        const burstDuration = burstEndTime - burstStartTime;
        
        expect(burstResults).toHaveLength(burstSize);
        burstResults.forEach(result => {
          expect(result.status).toBe('created');
        });
        
        allResults.push({
          burst,
          duration: burstDuration,
          avgPerDialog: burstDuration / burstSize
        });
        
        console.log(`Burst ${burst + 1} completed in ${burstDuration}ms (${(burstDuration / burstSize).toFixed(2)}ms avg per dialog)`);
        
        // Wait between bursts (except for the last one)
        if (burst < burstCount - 1) {
          await TestHelpers.wait(delayBetweenBursts);
        }
      }
      
      // Verify performance consistency across bursts
      const avgBurstDuration = allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length;
      const maxBurstDuration = Math.max(...allResults.map(r => r.duration));
      
      // Max burst should not be more than 2x average (accounting for potential cold starts)
      expect(maxBurstDuration).toBeLessThan(avgBurstDuration * 2);
      
      console.log(`Burst test summary - Average: ${avgBurstDuration.toFixed(2)}ms, Max: ${maxBurstDuration}ms`);
    });
  });
});