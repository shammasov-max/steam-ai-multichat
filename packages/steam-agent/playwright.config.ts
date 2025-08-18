import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 180000, // 3 minutes for Steam operations
  expect: {
    timeout: 30000
  },
  fullyParallel: false, // Steam tests should run sequentially
  workers: 1, // Single worker to avoid Steam rate limits
  retries: 0, // No retries for integration tests
  reporter: [
    ['html'],
    ['line']
  ],
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'steam-integration',
      testMatch: '**/*.spec.ts',
    },
  ],
});