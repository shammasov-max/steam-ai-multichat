import { createUnifiedConfig } from '../../test-config/playwright.unified.config'

export default createUnifiedConfig({
  testDir: './tests',
  timeout: 30000, // 30 seconds default timeout per CLAUDE.md
  projects: [
    {
      name: 'unit',
      testMatch: '**/mock-*.spec.ts',
      use: {
        timeout: 10000, // 10 seconds for mock tests
      }
    },
    {
      name: 'integration',
      testMatch: '**/unified-*.spec.ts',
      use: {
        timeout: 30000, // 30 seconds for Steam operations per CLAUDE.md
      }
    },
  ],
  workers: 1, // Sequential execution to avoid Steam rate limits
})