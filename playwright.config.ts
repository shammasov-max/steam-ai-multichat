import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Run unit-style tests; no browsers are used
  testDir: './',
  testMatch: [
    'packages/isomorphic/**/*.spec.ts'
  ],
  reporter: 'list',
  fullyParallel: true,
  // Keep timeouts reasonable for unit tests
  timeout: 10_000,
  expect: {
    timeout: 2_000,
  },
  // No browser projects needed; Playwright Test is used as a generic test runner
  projects: [
    {
      name: 'unit',
    }
  ],
});
