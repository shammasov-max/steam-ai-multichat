import { Effect, Context, Layer, Runtime, Schedule, Duration, pipe } from 'effect'
import { chromium, firefox, webkit, type Browser, type BrowserContext, type Page } from 'playwright'
import type { LaunchOptions, BrowserContextOptions } from 'playwright'
import type { TestStore, RootState } from '../store/store-factory'
import type { DummyFrontConfig } from '../store/config'
import { ConfigService } from '../store/config'

/**
 * Browser launcher configuration
 */
export interface BrowserLauncherConfig {
    /** Browser type to launch */
    browserType: 'chromium' | 'firefox' | 'webkit'
    /** Launch in headless mode */
    headless: boolean
    /** Enable debug mode */
    debug: boolean
    /** Slow down operations for debugging */
    slowMo?: number
    /** Enable Redux DevTools */
    enableDevTools: boolean
    /** DevTools server port */
    devToolsPort?: number
    /** Custom launch options */
    launchOptions?: LaunchOptions
    /** Custom context options */
    contextOptions?: BrowserContextOptions
}

/**
 * Default browser launcher configuration
 */
export const defaultBrowserConfig: BrowserLauncherConfig = {
    browserType: 'chromium',
    headless: !process.env.HEADED,
    debug: process.env.NODE_ENV === 'development',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    enableDevTools: true,
    devToolsPort: 8000,
}

/**
 * Browser launcher service for managing browser instances
 */
export interface BrowserLauncher {
    /** Launch a new browser instance */
    readonly launch: Effect.Effect<Browser, Error>
    /** Create a new browser context */
    readonly createContext: (browser: Browser) => Effect.Effect<BrowserContext, Error>
    /** Create a new page with Redux store integration */
    readonly createPageWithStore: (
        context: BrowserContext,
        store: TestStore
    ) => Effect.Effect<Page, Error>
    /** Launch browser with store integration */
    readonly launchWithStore: (store: TestStore) => Effect.Effect<{
        browser: Browser
        context: BrowserContext
        page: Page
    }, Error>
    /** Close browser and cleanup resources */
    readonly cleanup: (browser: Browser) => Effect.Effect<void>
    /** Export current state for debugging */
    readonly exportState: (page: Page) => Effect.Effect<RootState>
}

/**
 * Browser launcher service tag
 */
export class BrowserLauncherService extends Context.Tag('BrowserLauncherService')<
    BrowserLauncherService,
    BrowserLauncher
>() {}

/**
 * Create browser launcher implementation
 */
const createBrowserLauncher = (
    config: BrowserLauncherConfig,
    dummyConfig: DummyFrontConfig
): BrowserLauncher => ({
    launch: Effect.gen(function* () {
        yield* Effect.log('Launching browser', { browserType: config.browserType })

        const launchOptions: LaunchOptions = {
            headless: config.headless,
            slowMo: config.slowMo,
            devtools: config.debug && config.enableDevTools,
            args: [
                // Essential Chrome flags for testing
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',

                // Memory optimizations
                '--memory-pressure-off',
                '--max_old_space_size=4096',

                // DevTools support
                ...(config.enableDevTools ? [
                    '--remote-debugging-port=9222',
                    '--remote-debugging-address=0.0.0.0',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--allow-running-insecure-content',
                    '--disable-site-isolation-trials',
                ] : []),

                // Debug mode flags
                ...(config.debug ? [
                    '--enable-logging',
                    '--log-level=0',
                    '--verbose',
                ] : []),
            ],
            ...config.launchOptions,
        }

        const browserFactory = {
            chromium: () => chromium.launch(launchOptions),
            firefox: () => firefox.launch(launchOptions),
            webkit: () => webkit.launch(launchOptions),
        }

        const browser = yield* Effect.tryPromise({
            try: () => browserFactory[config.browserType](),
            catch: (error) => new Error(`Failed to launch ${config.browserType}: ${error}`),
        })

        yield* Effect.log('Browser launched successfully', {
            browserType: config.browserType,
            version: browser.version(),
        })

        return browser
    }),

    createContext: (browser: Browser) =>
        Effect.gen(function* () {
            yield* Effect.log('Creating browser context')

            const contextOptions: BrowserContextOptions = {
                viewport: { width: 1280, height: 720 },
                ignoreHTTPSErrors: true,
                permissions: ['clipboard-read', 'clipboard-write'],
                reducedMotion: 'reduce',
                colorScheme: 'light',
                extraHTTPHeaders: {
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                ...config.contextOptions,
            }

            const context = yield* Effect.tryPromise({
                try: () => browser.newContext(contextOptions),
                catch: (error) => new Error(`Failed to create browser context: ${error}`),
            })

            // Set up error handling
            context.on('pageerror', (error) => {
                console.error('[Page Error]', error)
            })

            context.on('console', (msg) => {
                if (config.debug) {
                    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`)
                }
            })

            yield* Effect.log('Browser context created successfully')
            return context
        }),

    createPageWithStore: (context: BrowserContext, store: TestStore) =>
        Effect.gen(function* () {
            yield* Effect.log('Creating page with store integration')

            const page = yield* Effect.tryPromise({
                try: () => context.newPage(),
                catch: (error) => new Error(`Failed to create page: ${error}`),
            })

            // Inject Redux store into page
            yield* Effect.tryPromise({
                try: () =>
                    page.addInitScript((serializedStore) => {
                        // Make store available globally for DevTools
                        ;(window as any).__REDUX_STORE__ = {
                            getState: () => JSON.parse(serializedStore),
                            dispatch: (action: any) => {
                                // Send action back to test environment
                                window.postMessage({ type: 'REDUX_ACTION', action }, '*')
                            },
                        }

                        // Enable Redux DevTools if available
                        if ((window as any).__REDUX_DEVTOOLS_EXTENSION__) {
                            const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({
                                name: 'dummy-front-test',
                                realtime: true,
                            })

                            devTools.subscribe((message: any) => {
                                if (message.type === 'DISPATCH') {
                                    window.postMessage({
                                        type: 'DEVTOOLS_ACTION',
                                        payload: message.payload,
                                    }, '*')
                                }
                            })

                            // Send initial state
                            devTools.init(JSON.parse(serializedStore))

                            // Make DevTools available globally
                            ;(window as any).__REDUX_DEVTOOLS__ = devTools
                        }
                    }, JSON.stringify(store.getState())),
                catch: (error) => new Error(`Failed to inject store: ${error}`),
            })

            // Listen for Redux actions from browser
            yield* Effect.tryPromise({
                try: () =>
                    page.exposeFunction('__dispatchAction', (action: any) => {
                        store.dispatch(action)
                    }),
                catch: (error) => new Error(`Failed to expose dispatch function: ${error}`),
            })

            // Set up page error handling
            page.on('pageerror', (error) => {
                console.error('[Page Error]', error.message)
            })

            page.on('console', (msg) => {
                if (config.debug) {
                    const level = msg.type()
                    const text = msg.text()
                    console.log(`[Browser Console] [${level.toUpperCase()}] ${text}`)
                }
            })

            // Handle Redux DevTools messages
            yield* Effect.tryPromise({
                try: () =>
                    page.evaluateOnNewDocument(() => {
                        window.addEventListener('message', (event) => {
                            if (event.data.type === 'REDUX_ACTION') {
                                ;(window as any).__dispatchAction?.(event.data.action)
                            }
                        })
                    }),
                catch: (error) => new Error(`Failed to set up message handling: ${error}`),
            })

            yield* Effect.log('Page created with store integration')
            return page
        }),

    launchWithStore: (store: TestStore) =>
        Effect.gen(function* () {
            yield* Effect.log('Launching browser with store integration')

            const browser = yield* Effect.suspend(() =>
                Effect.gen(function* () {
                    return yield* Effect.gen(function* () {
                        const browser = yield* Effect.tryPromise({
                            try: () => {
                                const launchOptions: LaunchOptions = {
                                    headless: config.headless,
                                    slowMo: config.slowMo,
                                    devtools: config.debug && config.enableDevTools,
                                    args: [
                                        '--no-sandbox',
                                        '--disable-setuid-sandbox',
                                        '--disable-dev-shm-usage',
                                        '--disable-accelerated-2d-canvas',
                                        '--no-first-run',
                                        '--no-zygote',
                                        '--disable-gpu',
                                        '--memory-pressure-off',
                                        '--max_old_space_size=4096',
                                        ...(config.enableDevTools ? [
                                            '--remote-debugging-port=9222',
                                            '--remote-debugging-address=0.0.0.0',
                                            '--disable-web-security',
                                            '--disable-features=VizDisplayCompositor',
                                            '--allow-running-insecure-content',
                                            '--disable-site-isolation-trials',
                                        ] : []),
                                        ...(config.debug ? [
                                            '--enable-logging',
                                            '--log-level=0',
                                            '--verbose',
                                        ] : []),
                                    ],
                                    ...config.launchOptions,
                                }

                                const browserFactory = {
                                    chromium: () => chromium.launch(launchOptions),
                                    firefox: () => firefox.launch(launchOptions),
                                    webkit: () => webkit.launch(launchOptions),
                                }

                                return browserFactory[config.browserType]()
                            },
                            catch: (error) => new Error(`Failed to launch ${config.browserType}: ${error}`),
                        })

                        return browser
                    })
                })
            )

            const context = yield* Effect.tryPromise({
                try: () =>
                    browser.newContext({
                        viewport: { width: 1280, height: 720 },
                        ignoreHTTPSErrors: true,
                        permissions: ['clipboard-read', 'clipboard-write'],
                        reducedMotion: 'reduce',
                        colorScheme: 'light',
                        extraHTTPHeaders: {
                            'Accept-Language': 'en-US,en;q=0.9',
                        },
                        ...config.contextOptions,
                    }),
                catch: (error) => new Error(`Failed to create browser context: ${error}`),
            })

            const page = yield* Effect.tryPromise({
                try: () => context.newPage(),
                catch: (error) => new Error(`Failed to create page: ${error}`),
            })

            // Inject store and set up DevTools
            yield* Effect.tryPromise({
                try: () =>
                    page.addInitScript((serializedStore) => {
                        ;(window as any).__REDUX_STORE__ = {
                            getState: () => JSON.parse(serializedStore),
                            dispatch: (action: any) => {
                                window.postMessage({ type: 'REDUX_ACTION', action }, '*')
                            },
                        }

                        if ((window as any).__REDUX_DEVTOOLS_EXTENSION__) {
                            const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({
                                name: 'dummy-front-test',
                                realtime: true,
                            })

                            devTools.init(JSON.parse(serializedStore))
                            ;(window as any).__REDUX_DEVTOOLS__ = devTools
                        }
                    }, JSON.stringify(store.getState())),
                catch: (error) => new Error(`Failed to inject store: ${error}`),
            })

            yield* Effect.log('Browser launched with store integration successfully')

            return { browser, context, page }
        }),

    cleanup: (browser: Browser) =>
        Effect.gen(function* () {
            yield* Effect.log('Cleaning up browser resources')

            yield* Effect.tryPromise({
                try: () => browser.close(),
                catch: (error) => new Error(`Failed to close browser: ${error}`),
            }).pipe(
                Effect.retry(Schedule.exponential(Duration.millis(100)).pipe(Schedule.recurs(3))),
                Effect.orElse(() => Effect.log('Failed to close browser gracefully'))
            )

            yield* Effect.log('Browser cleanup completed')
        }),

    exportState: (page: Page) =>
        Effect.gen(function* () {
            yield* Effect.log('Exporting current state from browser')

            const state = yield* Effect.tryPromise({
                try: () =>
                    page.evaluate(() => {
                        const store = (window as any).__REDUX_STORE__
                        return store ? store.getState() : null
                    }),
                catch: (error) => new Error(`Failed to export state: ${error}`),
            })

            if (!state) {
                return yield* Effect.fail(new Error('No Redux store found in browser'))
            }

            yield* Effect.log('State exported successfully')
            return state as RootState
        }),
})

/**
 * Browser launcher layer
 */
export const BrowserLauncherLayer = Layer.effect(
    BrowserLauncherService,
    Effect.gen(function* () {
        const dummyConfig = yield* ConfigService

        const browserConfig: BrowserLauncherConfig = {
            ...defaultBrowserConfig,
            enableDevTools: dummyConfig.enableDevTools,
            devToolsPort: dummyConfig.devToolsOptions?.port || 8000,
            debug: dummyConfig.debug,
        }

        return createBrowserLauncher(browserConfig, dummyConfig)
    })
)

/**
 * Helper to launch browser with Effect runtime
 */
export const launchBrowserWithStore = (store: TestStore) =>
    Effect.gen(function* () {
        const launcher = yield* BrowserLauncherService
        return yield* launcher.launchWithStore(store)
    })

/**
 * Helper to cleanup browser resources
 */
export const cleanupBrowser = (browser: Browser) =>
    Effect.gen(function* () {
        const launcher = yield* BrowserLauncherService
        return yield* launcher.cleanup(browser)
    })

/**
 * Helper to export state from browser page
 */
export const exportBrowserState = (page: Page) =>
    Effect.gen(function* () {
        const launcher = yield* BrowserLauncherService
        return yield* launcher.exportState(page)
    })

/**
 * Effect to run browser test with automatic cleanup
 */
export const withBrowser = <A, E>(
    test: (browser: Browser, context: BrowserContext, page: Page) => Effect.Effect<A, E>
) =>
    Effect.gen(function* () {
        const launcher = yield* BrowserLauncherService

        // Create store for testing
        const { createTestStore } = yield* import('../store/store-factory')
        const { store } = yield* createTestStore

        // Launch browser with store
        const { browser, context, page } = yield* launcher.launchWithStore(store)

        // Add finalizer for cleanup
        yield* Effect.addFinalizer(() => launcher.cleanup(browser))

        // Run the test
        return yield* test(browser, context, page)
    })

/**
 * Browser configuration for different test scenarios
 */
export const testConfigs = {
    /** Fast headless testing */
    headless: {
        ...defaultBrowserConfig,
        headless: true,
        slowMo: 0,
        debug: false,
    },

    /** Visual debugging mode */
    debug: {
        ...defaultBrowserConfig,
        headless: false,
        slowMo: 500,
        debug: true,
        enableDevTools: true,
    },

    /** CI/CD optimized configuration */
    ci: {
        ...defaultBrowserConfig,
        headless: true,
        slowMo: 0,
        debug: false,
        enableDevTools: false,
        launchOptions: {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
            ],
        },
    },
} as const

/**
 * Export types for external use
 */
export type { BrowserLauncherConfig, BrowserLauncher }