import { createUnifiedConfig } from '../../test-config/playwright.unified.config'
import path from 'path'

// Fix color environment variable conflicts
delete process.env.FORCE_COLOR

export default createUnifiedConfig({
  testDir: './tests',
  projects: ['dialogs'],
  overrides: {
    use: {
      baseURL: 'http://localhost:3000',
    },
    globalSetup: path.resolve('./tests/setup/global-setup.ts'),
    globalTeardown: path.resolve('./tests/setup/global-teardown.ts'),
  }
})
