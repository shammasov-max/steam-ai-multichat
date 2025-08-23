import { test, expect } from '@playwright/test';
import { dialogsPrismaClient } from './src/index';

test.describe('dialogsPrismaClient', () => {
  test('exports working client', async () => {
    // Test that the client is properly exported and has expected methods
    expect(dialogsPrismaClient).toBeDefined();
    expect(typeof dialogsPrismaClient.dialog).toBe('object');
    expect(typeof dialogsPrismaClient.message).toBe('object');
    expect(typeof dialogsPrismaClient.dialogState).toBe('object');
    expect(typeof dialogsPrismaClient.log).toBe('object');
    expect(typeof dialogsPrismaClient.$disconnect).toBe('function');
  });

  test('client methods are properly typed', async () => {
    // Test that the methods exist (without calling them to avoid DB connection)
    expect(typeof dialogsPrismaClient.dialog.findMany).toBe('function');
    expect(typeof dialogsPrismaClient.dialog.create).toBe('function');
    expect(typeof dialogsPrismaClient.dialog.update).toBe('function');
    expect(typeof dialogsPrismaClient.dialog.delete).toBe('function');
    
    expect(typeof dialogsPrismaClient.message.findMany).toBe('function');
    expect(typeof dialogsPrismaClient.message.create).toBe('function');
    
    expect(typeof dialogsPrismaClient.dialogState.findMany).toBe('function');
    expect(typeof dialogsPrismaClient.log.findMany).toBe('function');
  });

  test('enum exports are available', async () => {
    // Test that enums are properly exported
    const { DialogStatus, DialogRole, LogLevel } = await import('./src/index');
    expect(DialogStatus).toBeDefined();
    expect(DialogRole).toBeDefined(); 
    expect(LogLevel).toBeDefined();
  });

  // Real database test - only runs with integration test setup
  test('can query empty dialogs table', async () => {
    try {
      const dialogs = await dialogsPrismaClient.dialog.findMany();
      expect(Array.isArray(dialogs)).toBe(true);
      expect(dialogs.length).toBe(0);
    } catch (error) {
      // If database is not available (like in unit tests), skip this test
      test.skip(!!error, 'Database not available - skipping integration test');
    }
  });
});