import { test, expect } from '@playwright/test'
import { Effect, pipe } from 'effect'
import { withBrowser, BrowserLauncherLayer } from '../browser/launcher'
import { connectDevTools, DevToolsLayer } from '../browser/devtools'
import { withStore, StoreLayer, dispatch, selectState } from '../store/store-factory'
import { ConfigLayer } from '../store/config'
import { accountSlice as accountsSlice } from '@packages/isomorphic/src/slices/accounts'

/**
 * Example browser test demonstrating Redux DevTools integration
 */
test.describe('Browser Redux Integration', () => {
    test('should launch browser with Redux store integration', async () => {
        // Run Effect-based test with browser and store
        const result = await Effect.runPromise(
            pipe(
                withBrowser((browser, context, page) =>
                    Effect.gen(function* () {
                        // Navigate to a simple page
                        yield* Effect.tryPromise({
                            try: () => page.goto('data:text/html,<html><body><h1>Test Page</h1></body></html>'),
                            catch: (error) => new Error(`Failed to navigate: ${error}`),
                        })

                        // Verify page loaded
                        const title = yield* Effect.tryPromise({
                            try: () => page.textContent('h1'),
                            catch: (error) => new Error(`Failed to get title: ${error}`),
                        })

                        if (title !== 'Test Page') {
                            return yield* Effect.fail(new Error(`Unexpected title: ${title}`))
                        }

                        // Verify Redux store is available in browser
                        const hasStore = yield* Effect.tryPromise({
                            try: () =>
                                page.evaluate(() => {
                                    return !!(window as any).__REDUX_STORE__
                                }),
                            catch: (error) => new Error(`Failed to check store: ${error}`),
                        })

                        if (!hasStore) {
                            return yield* Effect.fail(new Error('Redux store not available in browser'))
                        }

                        return { success: true, title, hasStore }
                    })
                ),
                Effect.provide(BrowserLauncherLayer),
                Effect.provide(StoreLayer),
                Effect.provide(ConfigLayer)
            )
        )

        expect(result.success).toBe(true)
        expect(result.title).toBe('Test Page')
        expect(result.hasStore).toBe(true)
    })

    test('should connect Redux DevTools and log actions', async () => {
        const result = await Effect.runPromise(
            pipe(
                withStore(
                    Effect.gen(function* () {
                        // Create a simple test page
                        const html = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <title>Redux DevTools Test</title>
                                <script>
                                    // Mock Redux DevTools extension
                                    window.__REDUX_DEVTOOLS_EXTENSION__ = {
                                        connect: (options) => ({
                                            init: (state) => console.log('DevTools init:', state),
                                            send: (action, state) => console.log('DevTools send:', action.type, state),
                                            subscribe: () => () => {},
                                            disconnect: () => console.log('DevTools disconnected')
                                        })
                                    };
                                </script>
                            </head>
                            <body>
                                <h1>Redux DevTools Test</h1>
                                <div id="state-display"></div>
                            </body>
                            </html>
                        `

                        return yield* withBrowser((browser, context, page) =>
                            Effect.gen(function* () {
                                // Navigate to test page
                                yield* Effect.tryPromise({
                                    try: () => page.goto(`data:text/html,${encodeURIComponent(html)}`),
                                    catch: (error) => new Error(`Failed to navigate: ${error}`),
                                })

                                // Get store and connect DevTools
                                const { StoreService } = yield* import('../store/store-factory')
                                const store = yield* StoreService
                                const devToolsConnection = yield* connectDevTools(page, store)

                                // Initialize DevTools with current state
                                const currentState = yield* selectState((state) => state)
                                yield* devToolsConnection.init(currentState)

                                // Dispatch a test action
                                const testAction = accountsSlice.actions.connected({
                                    accountId: 'account_test123' as any,
                                    steamId64: '76561198000000001',
                                    status: 'connected',
                                    timestamp: Date.now(),
                                })

                                yield* dispatch(testAction)

                                // Send action to DevTools
                                const newState = yield* selectState((state) => state)
                                yield* devToolsConnection.send(testAction, newState)

                                // Verify DevTools connection exists
                                const hasDevTools = yield* Effect.tryPromise({
                                    try: () =>
                                        page.evaluate(() => {
                                            return !!(window as any).__REDUX_DEVTOOLS__
                                        }),
                                    catch: (error) => new Error(`Failed to check DevTools: ${error}`),
                                })

                                // Export DevTools session
                                const session = yield* devToolsConnection.exportSession

                                // Cleanup
                                yield* devToolsConnection.disconnect

                                return {
                                    hasDevTools,
                                    sessionActions: session.actions.length,
                                    stateHasAccount: 'accounts' in newState,
                                }
                            })
                        )
                    })
                ),
                Effect.provide(BrowserLauncherLayer),
                Effect.provide(DevToolsLayer),
                Effect.provide(ConfigLayer)
            )
        )

        expect(result.hasDevTools).toBe(true)
        expect(result.sessionActions).toBeGreaterThan(0)
        expect(result.stateHasAccount).toBe(true)
    })

    test('should export and serialize state correctly', async () => {
        const result = await Effect.runPromise(
            pipe(
                withStore(
                    Effect.gen(function* () {
                        // Dispatch some test actions to populate state
                        yield* dispatch(
                            accountsSlice.actions.connected({
                                accountId: 'account_test456' as any,
                                steamId64: '76561198000000002',
                                status: 'connected',
                                timestamp: Date.now(),
                            })
                        )

                        // Get current state
                        const state = yield* selectState((state) => state)

                        // Test state serialization
                        const { serializeState } = yield* import('../browser/devtools')
                        const serialized = yield* serializeState(state, {
                            prettify: true,
                            maxDepth: 5,
                        })

                        // Verify serialization
                        const parsed = JSON.parse(serialized)

                        return {
                            hasAccounts: 'accounts' in parsed,
                            hasDialogs: 'dialogs' in parsed,
                            hasSystem: 'system' in parsed,
                            serializedLength: serialized.length,
                            accountsCount: Object.keys(parsed.accounts?.entities || {}).length,
                        }
                    })
                ),
                Effect.provide(DevToolsLayer),
                Effect.provide(ConfigLayer)
            )
        )

        expect(result.hasAccounts).toBe(true)
        expect(result.hasDialogs).toBe(true)
        expect(result.hasSystem).toBe(true)
        expect(result.serializedLength).toBeGreaterThan(0)
        expect(result.accountsCount).toBeGreaterThanOrEqual(1)
    })
})