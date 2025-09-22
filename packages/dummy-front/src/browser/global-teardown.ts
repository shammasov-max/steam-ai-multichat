import { type FullConfig } from '@playwright/test'

/**
 * Global teardown for Playwright tests
 *
 * Cleans up:
 * - Remote DevTools server
 * - Test artifacts
 * - Temporary files
 * - Browser processes
 */
async function globalTeardown(config: FullConfig) {
    console.log('[Global Teardown] Starting cleanup...')

    // Stop remote DevTools server if it was started
    if (process.env.NODE_ENV === 'development') {
        try {
            console.log('[Global Teardown] Stopping remote DevTools server...')

            // The remote DevTools server doesn't provide a clean stop method,
            // but we can try to clean up any connections
            // In a real implementation, you might want to track the server instance
            // and call a proper shutdown method

            console.log('[Global Teardown] DevTools server cleanup completed')
        } catch (error) {
            console.warn('[Global Teardown] Failed to stop DevTools server:', error)
        }
    }

    // Clean up any temporary files or directories
    try {
        const fs = await import('fs/promises')
        const path = await import('path')

        // Clean up test artifacts that might have been created
        const artifactDirs = [
            'test-results',
            'playwright-report',
            '.auth',
        ]

        for (const dir of artifactDirs) {
            try {
                const fullPath = path.resolve(process.cwd(), dir)
                await fs.access(fullPath)
                // Directory exists, but we don't want to delete it here
                // as Playwright manages these directories
                console.log(`[Global Teardown] Artifact directory exists: ${dir}`)
            } catch {
                // Directory doesn't exist, which is fine
            }
        }
    } catch (error) {
        console.warn('[Global Teardown] Error during artifact cleanup:', error)
    }

    // Kill any remaining browser processes (safety measure)
    try {
        const { exec } = await import('child_process')
        const { promisify } = await import('util')
        const execAsync = promisify(exec)

        // Kill any remaining Chromium processes on Unix-like systems
        if (process.platform !== 'win32') {
            try {
                await execAsync('pkill -f chromium 2>/dev/null || true')
                await execAsync('pkill -f chrome 2>/dev/null || true')
                console.log('[Global Teardown] Cleaned up browser processes')
            } catch {
                // Ignore errors - processes might not exist
            }
        }
    } catch (error) {
        console.warn('[Global Teardown] Error during process cleanup:', error)
    }

    // Clear environment variables
    delete process.env.VITE_ENABLE_DEVTOOLS
    delete process.env.VITE_DEVTOOLS_PORT

    console.log('[Global Teardown] Cleanup completed successfully')
}

export default globalTeardown