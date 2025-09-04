import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  testMatch: [
    'tests/**/*.spec.ts',
    'packages/**/*.spec.ts',
    'packages/**/*.test.ts'
  ],
  
  // Test organization
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/html-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  // Parallel execution
  fullyParallel: false, // Steam tests need sequential execution due to rate limits
  workers: process.env.CI ? 1 : 2,
  
  // Timeouts
  timeout: 60_000, // Increased for Steam operations
  expect: {
    timeout: 10_000,
  },
  
  // Global setup and teardown
  globalSetup: './tests/setup.ts',
  globalTeardown: './tests/setup.ts',
  
  // Test output
  outputDir: 'test-results',
  
  // Retry configuration
  retries: process.env.CI ? 2 : 0,
  
  // Environment variables
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    // Don't use browsers for API/integration tests
    headless: true,
  },
  
  // Project configurations for different test types
  projects: [
    {
      name: 'unit',
      testMatch: [
        'packages/isomorphic/**/*.spec.ts',
        'packages/dialogs/**/*.test.ts',
        'packages/steam-api/**/*.spec.ts'
      ],
      timeout: 10_000,
    },
    
    {
      name: 'integration',
      testMatch: [
        'tests/api-routes.spec.ts',
        'tests/app-core.spec.ts',
        'tests/app-integration.spec.ts',
        'tests/*-crud.spec.ts'
      ],
      timeout: 30_000,
      dependencies: ['unit'],
    },
    
    {
      name: 'e2e',
      testMatch: [
        'tests/e2e-*.spec.ts'
      ],
      timeout: 120_000, // E2E tests can take longer
      dependencies: ['integration'],
    },
    
    {
      name: 'steam',
      testMatch: [
        'tests/*steam*.spec.ts',
        'packages/steam-api/**/*.spec.ts'
      ],
      timeout: 180_000, // Steam operations can be slow
      workers: 1, // Force sequential execution for Steam tests
    }
  ],
});
