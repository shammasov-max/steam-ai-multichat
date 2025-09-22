import { Effect, Runtime, Layer, Context, Logger, LogLevel } from 'effect'
import type { UnknownAction } from '@reduxjs/toolkit'

/**
 * Configuration for the dummy-front store
 */
export interface DummyFrontConfig {
    /** Enable Redux DevTools */
    enableDevTools: boolean
    /** DevTools connection options */
    devToolsOptions?: {
        /** Remote connection host */
        host?: string
        /** Remote connection port */
        port?: number
        /** Instance name for DevTools */
        name?: string
        /** Enable action serialization */
        serialize?: boolean
    }
    /** Enable debug logging */
    debug: boolean
    /** Initial delay before starting tests (ms) */
    startupDelay?: number
    /** Maximum wait time for saga events (ms) */
    sagaTimeout?: number
}

/**
 * Default configuration
 */
export const defaultConfig: DummyFrontConfig = {
    enableDevTools: true,
    devToolsOptions: {
        host: 'localhost',
        port: 8000,
        name: 'dummy-front-tests',
        serialize: true,
    },
    debug: process.env.NODE_ENV === 'development',
    startupDelay: 100,
    sagaTimeout: 5000,
}

/**
 * Configuration service
 */
export class ConfigService extends Context.Tag('ConfigService')<ConfigService, DummyFrontConfig>() {}

/**
 * Configuration layer
 */
export const ConfigLayer = Layer.succeed(ConfigService, defaultConfig)

/**
 * Logger configuration for testing
 */
export const TestLoggerLayer = Logger.replace(
    Logger.defaultLogger,
    Logger.make(({ logLevel, message, annotations }) => {
        const timestamp = new Date().toISOString()
        const level = logLevel.label.toUpperCase()
        console.log(`[${timestamp}] [${level}] ${message}`, annotations)
    })
).pipe(Layer.merge(Logger.minimumLogLevel(LogLevel.Info)))

/**
 * Helper to create remote DevTools enhancer
 */
export const createDevToolsEnhancer = (config: DummyFrontConfig) => {
    if (!config.enableDevTools) {
        return undefined
    }

    // In browser environment, use redux-devtools-extension
    if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
        return (window as any).__REDUX_DEVTOOLS_EXTENSION__({
            name: config.devToolsOptions?.name || 'dummy-front',
            serialize: config.devToolsOptions?.serialize,
        })
    }

    // For remote connection (when running in headless browser)
    if (config.devToolsOptions?.host && config.devToolsOptions?.port) {
        try {
            const { composeWithDevTools } = require('remote-redux-devtools')
            return composeWithDevTools({
                hostname: config.devToolsOptions.host,
                port: config.devToolsOptions.port,
                name: config.devToolsOptions.name,
                realtime: true,
            })()
        } catch (error) {
            console.warn('Remote DevTools not available:', error)
        }
    }

    return undefined
}

/**
 * Test event for waiting in sagas
 */
export interface TestEvent extends UnknownAction {
    type: string
    payload?: unknown
    meta?: {
        testId?: string
        timestamp?: number
    }
}

/**
 * Create a test event
 */
export const createTestEvent = (type: string, payload?: unknown, testId?: string): TestEvent => ({
    type,
    payload,
    meta: {
        testId,
        timestamp: Date.now(),
    },
})