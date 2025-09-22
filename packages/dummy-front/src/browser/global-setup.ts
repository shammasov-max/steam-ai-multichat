import { chromium, type FullConfig } from '@playwright/test'
import { Effect, Layer } from 'effect'

/**
 * Global setup for Playwright tests
 *
 * Sets up:
 * - Remote DevTools server
 * - Browser debugging ports
 * - Test environment variables
 * - Cleanup handlers
 */
async function globalSetup(config: FullConfig) {
    console.log('[Global Setup] Starting Playwright test environment setup...')

    // Set up environment variables for tests
    process.env.NODE_ENV = 'test'
    process.env.VITE_ENABLE_DEVTOOLS = 'true'
    process.env.VITE_DEVTOOLS_PORT = '8000'

    // Start remote DevTools server if in development
    if (process.env.NODE_ENV === 'development') {
        try {
            console.log('[Global Setup] Starting remote DevTools server on port 8000...')

            // Import and start the remote DevTools server
            const { start } = await import('remotedev-server')

            await start({
                port: 8000,
                hostname: 'localhost',
                autoSelectFiles: true,
            })

            console.log('[Global Setup] Remote DevTools server started successfully')
        } catch (error) {
            console.warn('[Global Setup] Failed to start DevTools server:', error)
            // Don't fail the setup if DevTools server can't start
        }
    }

    // Verify browser can launch
    try {
        console.log('[Global Setup] Verifying browser launch...')

        const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage'],
        })

        await browser.close()
        console.log('[Global Setup] Browser verification successful')
    } catch (error) {
        console.error('[Global Setup] Browser launch verification failed:', error)
        throw error
    }

    // Set up cleanup handlers
    const cleanup = () => {
        console.log('[Global Setup] Cleanup handler called')
        // Additional cleanup if needed
    }

    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
    process.on('exit', cleanup)

    console.log('[Global Setup] Setup completed successfully')
}

export default globalSetup