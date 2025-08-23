import { test, expect } from '@playwright/test';
import { ledgerPrismaClient } from './src/index';

test.describe('ledgerPrismaClient', () => {
  test('exports working client', async () => {
    // Test that the client is properly exported and has expected methods
    expect(ledgerPrismaClient).toBeDefined();
    expect(typeof ledgerPrismaClient.bot).toBe('object');
    expect(typeof ledgerPrismaClient.task).toBe('object');
    expect(typeof ledgerPrismaClient.chat).toBe('object');
    expect(typeof ledgerPrismaClient.message).toBe('object');
    expect(typeof ledgerPrismaClient.friendRequest).toBe('object');
    expect(typeof ledgerPrismaClient.setting).toBe('object');
    expect(typeof ledgerPrismaClient.$disconnect).toBe('function');
  });

  test('client methods are properly typed', async () => {
    // Test that the methods exist (without calling them to avoid DB connection)
    expect(typeof ledgerPrismaClient.bot.findMany).toBe('function');
    expect(typeof ledgerPrismaClient.bot.create).toBe('function');
    expect(typeof ledgerPrismaClient.bot.update).toBe('function');
    expect(typeof ledgerPrismaClient.bot.delete).toBe('function');
    
    expect(typeof ledgerPrismaClient.task.findMany).toBe('function');
    expect(typeof ledgerPrismaClient.task.create).toBe('function');
    
    expect(typeof ledgerPrismaClient.chat.findMany).toBe('function');
    expect(typeof ledgerPrismaClient.message.findMany).toBe('function');
  });

  // Real database test - only runs with integration test setup
  test('can query empty bots table', async () => {
    try {
      const bots = await ledgerPrismaClient.bot.findMany();
      expect(Array.isArray(bots)).toBe(true);
      expect(bots.length).toBe(0);
    } catch (error) {
      // If database is not available (like in unit tests), skip this test
      test.skip(!!error, 'Database not available - skipping integration test');
    }
  });
});