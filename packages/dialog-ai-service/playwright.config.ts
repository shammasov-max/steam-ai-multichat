import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    trace: 'on-first-retry',
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'unit-tests',
      testDir: './tests/unit',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'integration-tests', 
      testDir: './tests/integration',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'database-tests',
      testDir: './tests/database',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e-tests',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['unit-tests', 'integration-tests'],
    },
    {
      name: 'performance-tests',
      testDir: './tests/performance',
      use: { ...devices['Desktop Chrome'] },
      timeout: 60000,
    },
  ],
  globalSetup: require.resolve('./tests/setup/global-setup.ts'),
  globalTeardown: require.resolve('./tests/setup/global-teardown.ts'),
});