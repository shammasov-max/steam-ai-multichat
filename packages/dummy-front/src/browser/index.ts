/**
 * Browser automation utilities for Redux/Effect testing
 *
 * This module provides comprehensive browser automation capabilities
 * with Redux DevTools integration and Effect-TS composition.
 */

// Core browser launcher
export {
    BrowserLauncherService,
    BrowserLauncherLayer,
    launchBrowserWithStore,
    cleanupBrowser,
    exportBrowserState,
    withBrowser,
    testConfigs,
    defaultBrowserConfig,
    type BrowserLauncher,
    type BrowserLauncherConfig,
} from './launcher'

// Redux DevTools integration
export {
    DevToolsService,
    DevToolsLayer,
    connectDevTools,
    createActionLogger,
    serializeState,
    type DevToolsConnection,
    type DevToolsMessage,
    type DevToolsSession,
    type SerializationOptions,
    type ActionLoggerOptions,
    type ActionLogger,
    type ActionLogEntry,
    type StateDiff,
} from './devtools'

/**
 * Browser test configuration presets
 */
export const browserPresets = {
    /** Fast headless testing for CI/CD */
    ci: {
        browserConfig: 'ci' as const,
        devToolsEnabled: false,
        debug: false,
    },

    /** Development mode with full DevTools support */
    development: {
        browserConfig: 'debug' as const,
        devToolsEnabled: true,
        debug: true,
    },

    /** Standard testing configuration */
    test: {
        browserConfig: 'headless' as const,
        devToolsEnabled: true,
        debug: false,
    },
} as const

/**
 * Helper to get browser configuration for environment
 */
export const getBrowserConfigForEnv = () => {
    const env = process.env.NODE_ENV

    switch (env) {
        case 'development':
            return browserPresets.development
        case 'test':
            return browserPresets.test
        case 'production':
        default:
            return browserPresets.ci
    }
}

/**
 * Complete browser testing setup with all integrations
 */
export const createBrowserTestEnvironment = () => {
    return {
        launcher: BrowserLauncherLayer,
        devtools: DevToolsLayer,
        preset: getBrowserConfigForEnv(),
    }
}

/**
 * Quick setup for basic browser testing
 */
export const quickBrowserSetup = withBrowser

/**
 * Re-export commonly used types
 */
export type { Browser, BrowserContext, Page } from 'playwright'