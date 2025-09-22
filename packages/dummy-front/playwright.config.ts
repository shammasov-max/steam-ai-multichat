import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for headless browser testing with Redux DevTools support
 *
 * Features:
 * - Headless browser testing (configurable via HEADED env var)
 * - Chrome/Chromium as primary browser
 * - Redux DevTools support in development
 * - Test timeout settings
 * - Report generation
 * - Debug mode for troubleshooting
 */
export default defineConfig({
    // Test directory
    testDir: './src/tests',

    // Run tests in files in parallel
    fullyParallel: true,

    // Fail the build on CI if you accidentally left test.only in the source code
    forbidOnly: !!process.env.CI,

    // Retry on CI only
    retries: process.env.CI ? 2 : 0,

    // Opt out of parallel tests on CI
    workers: process.env.CI ? 1 : undefined,

    // Reporter to use
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results.json' }],
        process.env.CI ? ['github'] : ['list'],
    ],

    // Global test timeout
    timeout: 30_000,

    // Expect timeout for assertions
    expect: {
        timeout: 5_000,
    },

    // Shared settings for all the projects below
    use: {
        // Base URL for tests
        baseURL: 'http://localhost:5173',

        // Collect trace when retrying the failed test
        trace: 'on-first-retry',

        // Record video on failure
        video: 'retain-on-failure',

        // Take screenshot on failure
        screenshot: 'only-on-failure',

        // Browser context options
        ignoreHTTPSErrors: true,

        // Viewport size
        viewport: { width: 1280, height: 720 },

        // User agent (use Chrome user agent for consistency)
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',

        // Permissions for Redux DevTools access
        permissions: ['clipboard-read', 'clipboard-write'],

        // Extra HTTP headers
        extraHTTPHeaders: {
            'Accept-Language': 'en-US,en;q=0.9',
        },
    },

    // Configure projects for major browsers
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Launch options for Chrome/Chromium
                launchOptions: {
                    // Run in headed mode if HEADED env var is set
                    headless: !process.env.HEADED,

                    // Chrome-specific args for Redux DevTools support
                    args: [
                        // Enable remote debugging (required for DevTools connection)
                        '--remote-debugging-port=9222',
                        '--remote-debugging-address=0.0.0.0',

                        // Disable web security for local development
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor',

                        // Allow insecure content for local testing
                        '--allow-running-insecure-content',

                        // Disable CORS for local development
                        '--disable-site-isolation-trials',

                        // Performance optimizations for headless mode
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process',
                        '--disable-gpu',

                        // Memory optimizations
                        '--memory-pressure-off',
                        '--max_old_space_size=4096',

                        // DevTools specific flags
                        '--enable-logging',
                        '--log-level=0',

                        // Extension support for Redux DevTools
                        ...(process.env.NODE_ENV === 'development' ? [
                            '--disable-extensions-except=/tmp/redux-devtools',
                            '--load-extension=/tmp/redux-devtools',
                        ] : []),
                    ],

                    // DevTools configuration
                    devtools: process.env.NODE_ENV === 'development',

                    // Slow down for debugging if needed
                    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
                },

                // Context options for Redux DevTools
                contextOptions: {
                    // Reduce animations for faster testing
                    reducedMotion: 'reduce',

                    // Force color scheme
                    colorScheme: 'light',

                    // Extra permissions for DevTools
                    permissions: ['clipboard-read', 'clipboard-write'],
                },
            },
        },

        // Optional: Firefox for cross-browser testing
        ...(process.env.CROSS_BROWSER ? [{
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        }] : []),

        // Optional: Safari for cross-browser testing (macOS only)
        ...(process.env.CROSS_BROWSER && process.platform === 'darwin' ? [{
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        }] : []),
    ],

    // Web server configuration for local development
    webServer: process.env.CI ? undefined : {
        command: 'yarn dev',
        port: 5173,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
        env: {
            NODE_ENV: 'test',
            VITE_ENABLE_DEVTOOLS: 'true',
            VITE_DEVTOOLS_PORT: '8000',
        },
    },

    // Global setup and teardown
    globalSetup: process.env.NODE_ENV === 'development'
        ? require.resolve('./src/browser/global-setup.ts')
        : undefined,
    globalTeardown: process.env.NODE_ENV === 'development'
        ? require.resolve('./src/browser/global-teardown.ts')
        : undefined,

    // Output directory for test artifacts
    outputDir: 'test-results/',

    // Preserve output directory
    preserveOutput: 'failures-only',
})