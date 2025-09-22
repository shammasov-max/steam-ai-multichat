import { Effect, Context, Layer, Runtime, Stream, Queue, pipe } from 'effect'
import type { UnknownAction } from '@reduxjs/toolkit'
import type { Page } from 'playwright'
import type { RootState, TestStore } from '../store/store-factory'
import type { DummyFrontConfig } from '../store/config'

/**
 * Redux DevTools connection interface
 */
export interface DevToolsConnection {
    /** Send action to DevTools */
    readonly send: (action: UnknownAction, state: RootState) => Effect.Effect<void>
    /** Initialize DevTools with state */
    readonly init: (state: RootState) => Effect.Effect<void>
    /** Subscribe to DevTools messages */
    readonly subscribe: (
        handler: (message: DevToolsMessage) => Effect.Effect<void>
    ) => Effect.Effect<void>
    /** Disconnect from DevTools */
    readonly disconnect: Effect.Effect<void>
    /** Export current session */
    readonly exportSession: Effect.Effect<DevToolsSession>
}

/**
 * DevTools message types
 */
export interface DevToolsMessage {
    type: 'DISPATCH' | 'ACTION' | 'STATE' | 'COMMIT' | 'ROLLBACK' | 'RESET' | 'JUMP_TO_STATE'
    payload?: any
    state?: string
    id?: string
    source?: string
}

/**
 * DevTools session data for export
 */
export interface DevToolsSession {
    actions: Array<{
        action: UnknownAction
        state: RootState
        timestamp: number
        id: string
    }>
    currentStateIndex: number
    totalActions: number
    sessionId: string
    startTime: number
    endTime?: number
}

/**
 * State serialization options
 */
export interface SerializationOptions {
    /** Maximum depth for object serialization */
    maxDepth: number
    /** Whether to include function properties */
    includeFunctions: boolean
    /** Custom replacer function */
    replacer?: (key: string, value: any) => any
    /** Whether to prettify JSON output */
    prettify: boolean
}

/**
 * Default serialization options
 */
const defaultSerializationOptions: SerializationOptions = {
    maxDepth: 10,
    includeFunctions: false,
    prettify: true,
}

/**
 * DevTools service for managing Redux DevTools integration
 */
export interface DevToolsService {
    /** Create connection to DevTools */
    readonly connect: (page: Page, store: TestStore) => Effect.Effect<DevToolsConnection>
    /** Setup remote DevTools server */
    readonly setupRemoteServer: (port?: number) => Effect.Effect<void>
    /** Serialize state for DevTools */
    readonly serializeState: (
        state: RootState,
        options?: Partial<SerializationOptions>
    ) => Effect.Effect<string>
    /** Deserialize state from DevTools */
    readonly deserializeState: (serialized: string) => Effect.Effect<RootState>
    /** Create action logger */
    readonly createActionLogger: (
        store: TestStore,
        options?: ActionLoggerOptions
    ) => Effect.Effect<ActionLogger>
}

/**
 * Action logger configuration
 */
export interface ActionLoggerOptions {
    /** Enable console logging */
    enableConsole: boolean
    /** Enable file logging */
    enableFile: boolean
    /** Log file path */
    logFile?: string
    /** Filter actions by type */
    actionFilter?: (action: UnknownAction) => boolean
    /** Include state diff */
    includeDiff: boolean
    /** Include timing information */
    includeTiming: boolean
}

/**
 * Action logger interface
 */
export interface ActionLogger {
    /** Log an action */
    readonly log: (action: UnknownAction, prevState: RootState, nextState: RootState) => Effect.Effect<void>
    /** Get logged actions */
    readonly getActions: Effect.Effect<Array<ActionLogEntry>>
    /** Clear action log */
    readonly clear: Effect.Effect<void>
    /** Export log to file */
    readonly export: (filePath: string) => Effect.Effect<void>
}

/**
 * Action log entry
 */
export interface ActionLogEntry {
    action: UnknownAction
    prevState: RootState
    nextState: RootState
    timestamp: number
    duration: number
    diff?: StateDiff
}

/**
 * State difference representation
 */
export interface StateDiff {
    added: Record<string, any>
    deleted: Record<string, any>
    modified: Record<string, any>
}

/**
 * DevTools service tag
 */
export class DevToolsService extends Context.Tag('DevToolsService')<
    DevToolsService,
    DevToolsService
>() {}

/**
 * Create DevTools service implementation
 */
const createDevToolsService = (config: DummyFrontConfig): DevToolsService => ({
    connect: (page: Page, store: TestStore) =>
        Effect.gen(function* () {
            yield* Effect.log('Connecting to Redux DevTools')

            // Generate unique session ID
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            const startTime = Date.now()
            const actions: Array<any> = []

            // Inject DevTools connection script
            yield* Effect.tryPromise({
                try: () =>
                    page.addInitScript((config) => {
                        // Check for DevTools extension
                        if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
                            const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({
                                name: 'dummy-front-test',
                                realtime: true,
                                trace: true,
                                traceLimit: 25,
                                actionCreators: {},
                                serialize: {
                                    options: {
                                        undefined: true,
                                        function: true,
                                        symbol: true,
                                    },
                                },
                            })

                            // Store DevTools instance globally
                            ;(window as any).__REDUX_DEVTOOLS__ = devTools

                            // Set up message handling
                            devTools.subscribe((message: any) => {
                                window.postMessage({
                                    type: 'DEVTOOLS_MESSAGE',
                                    payload: message,
                                }, '*')
                            })

                            console.log('[DevTools] Connected successfully')
                        } else {
                            console.warn('[DevTools] Extension not found, using mock implementation')

                            // Mock DevTools for testing
                            ;(window as any).__REDUX_DEVTOOLS__ = {
                                send: (action: any, state: any) => {
                                    console.log('[DevTools Mock] Action:', action.type, action)
                                    console.log('[DevTools Mock] State:', state)
                                },
                                init: (state: any) => {
                                    console.log('[DevTools Mock] Initial state:', state)
                                },
                                subscribe: () => () => {},
                                unsubscribe: () => {},
                                disconnect: () => {},
                            }
                        }
                    }, config),
                catch: (error) => new Error(`Failed to inject DevTools script: ${error}`),
            })

            // Set up message listener
            const messageQueue = yield* Queue.unbounded<DevToolsMessage>()

            yield* Effect.tryPromise({
                try: () =>
                    page.exposeFunction('__handleDevToolsMessage', (message: DevToolsMessage) => {
                        Queue.unsafeOffer(messageQueue, message)
                    }),
                catch: (error) => new Error(`Failed to expose DevTools message handler: ${error}`),
            })

            // Set up page message listener
            yield* Effect.tryPromise({
                try: () =>
                    page.evaluateOnNewDocument(() => {
                        window.addEventListener('message', (event) => {
                            if (event.data.type === 'DEVTOOLS_MESSAGE') {
                                ;(window as any).__handleDevToolsMessage?.(event.data.payload)
                            }
                        })
                    }),
                catch: (error) => new Error(`Failed to set up message listener: ${error}`),
            })

            const connection: DevToolsConnection = {
                send: (action: UnknownAction, state: RootState) =>
                    Effect.gen(function* () {
                        yield* Effect.tryPromise({
                            try: () =>
                                page.evaluate(
                                    ({ action, state }) => {
                                        const devTools = (window as any).__REDUX_DEVTOOLS__
                                        if (devTools) {
                                            devTools.send(action, state)
                                        }
                                    },
                                    { action, state }
                                ),
                            catch: (error) => new Error(`Failed to send action to DevTools: ${error}`),
                        })

                        // Store action for session export
                        actions.push({
                            action,
                            state,
                            timestamp: Date.now(),
                            id: `action_${actions.length}`,
                        })
                    }),

                init: (state: RootState) =>
                    Effect.gen(function* () {
                        yield* Effect.tryPromise({
                            try: () =>
                                page.evaluate(
                                    (state) => {
                                        const devTools = (window as any).__REDUX_DEVTOOLS__
                                        if (devTools) {
                                            devTools.init(state)
                                        }
                                    },
                                    state
                                ),
                            catch: (error) => new Error(`Failed to initialize DevTools: ${error}`),
                        })

                        yield* Effect.log('DevTools initialized with state')
                    }),

                subscribe: (handler: (message: DevToolsMessage) => Effect.Effect<void>) =>
                    Effect.gen(function* () {
                        const messageStream = Stream.fromQueue(messageQueue)

                        yield* pipe(
                            messageStream,
                            Stream.runForEach(handler),
                            Effect.fork
                        )

                        yield* Effect.log('Subscribed to DevTools messages')
                    }),

                disconnect: Effect.gen(function* () {
                    yield* Effect.tryPromise({
                        try: () =>
                            page.evaluate(() => {
                                const devTools = (window as any).__REDUX_DEVTOOLS__
                                if (devTools && devTools.disconnect) {
                                    devTools.disconnect()
                                }
                            }),
                        catch: (error) => new Error(`Failed to disconnect DevTools: ${error}`),
                    })

                    yield* Effect.log('DevTools disconnected')
                }),

                exportSession: Effect.gen(function* () {
                    const session: DevToolsSession = {
                        actions,
                        currentStateIndex: actions.length - 1,
                        totalActions: actions.length,
                        sessionId,
                        startTime,
                        endTime: Date.now(),
                    }

                    yield* Effect.log('DevTools session exported', {
                        sessionId,
                        totalActions: actions.length,
                        duration: Date.now() - startTime,
                    })

                    return session
                }),
            }

            yield* Effect.log('DevTools connection established', { sessionId })
            return connection
        }),

    setupRemoteServer: (port = 8000) =>
        Effect.gen(function* () {
            yield* Effect.log('Setting up remote DevTools server', { port })

            // This would typically start a remote Redux DevTools server
            // For now, we'll just log the setup
            yield* Effect.tryPromise({
                try: async () => {
                    // Import and start the remote server
                    const { start } = await import('remotedev-server')
                    return start({ port, hostname: 'localhost' })
                },
                catch: (error) => new Error(`Failed to start DevTools server: ${error}`),
            })

            yield* Effect.log('Remote DevTools server started', { port })
        }),

    serializeState: (state: RootState, options?: Partial<SerializationOptions>) =>
        Effect.gen(function* () {
            const opts = { ...defaultSerializationOptions, ...options }

            const serialized = yield* Effect.try({
                try: () => {
                    const replacer = opts.replacer || ((key: string, value: any) => {
                        // Handle functions
                        if (!opts.includeFunctions && typeof value === 'function') {
                            return '[Function]'
                        }

                        // Handle circular references and max depth
                        if (typeof value === 'object' && value !== null) {
                            // Simple depth tracking (could be improved)
                            const depth = key.split('.').length
                            if (depth > opts.maxDepth) {
                                return '[Max Depth Exceeded]'
                            }
                        }

                        return value
                    })

                    return JSON.stringify(state, replacer, opts.prettify ? 2 : 0)
                },
                catch: (error) => new Error(`Failed to serialize state: ${error}`),
            })

            return serialized
        }),

    deserializeState: (serialized: string) =>
        Effect.gen(function* () {
            const state = yield* Effect.try({
                try: () => JSON.parse(serialized) as RootState,
                catch: (error) => new Error(`Failed to deserialize state: ${error}`),
            })

            return state
        }),

    createActionLogger: (store: TestStore, options?: ActionLoggerOptions) =>
        Effect.gen(function* () {
            const opts: ActionLoggerOptions = {
                enableConsole: true,
                enableFile: false,
                includeDiff: true,
                includeTiming: true,
                ...options,
            }

            const logEntries: ActionLogEntry[] = []

            const logger: ActionLogger = {
                log: (action: UnknownAction, prevState: RootState, nextState: RootState) =>
                    Effect.gen(function* () {
                        const timestamp = Date.now()

                        // Apply action filter if provided
                        if (opts.actionFilter && !opts.actionFilter(action)) {
                            return
                        }

                        // Calculate state diff if requested
                        let diff: StateDiff | undefined
                        if (opts.includeDiff) {
                            diff = yield* calculateStateDiff(prevState, nextState)
                        }

                        const entry: ActionLogEntry = {
                            action,
                            prevState,
                            nextState,
                            timestamp,
                            duration: 0, // Could be measured with performance.now()
                            diff,
                        }

                        logEntries.push(entry)

                        // Console logging
                        if (opts.enableConsole) {
                            console.group(`[Action] ${action.type}`)
                            console.log('Action:', action)
                            if (opts.includeTiming) {
                                console.log('Timestamp:', new Date(timestamp).toISOString())
                            }
                            if (diff) {
                                console.log('State diff:', diff)
                            }
                            console.groupEnd()
                        }

                        // File logging (would be implemented with fs operations)
                        if (opts.enableFile && opts.logFile) {
                            yield* Effect.log('Would write to log file', { logFile: opts.logFile })
                        }
                    }),

                getActions: Effect.succeed(logEntries),

                clear: Effect.sync(() => {
                    logEntries.length = 0
                }),

                export: (filePath: string) =>
                    Effect.gen(function* () {
                        const exportData = {
                            entries: logEntries,
                            metadata: {
                                totalActions: logEntries.length,
                                exportTime: Date.now(),
                                filePath,
                            },
                        }

                        yield* Effect.log('Would export action log', { filePath, totalActions: logEntries.length })
                        // File writing would be implemented here
                    }),
            }

            yield* Effect.log('Action logger created', { options: opts })
            return logger
        }),
})

/**
 * Calculate difference between two states
 */
const calculateStateDiff = (prevState: RootState, nextState: RootState): Effect.Effect<StateDiff> =>
    Effect.gen(function* () {
        const diff: StateDiff = {
            added: {},
            deleted: {},
            modified: {},
        }

        // Simple diff calculation (could be enhanced with proper deep diff library)
        const prevKeys = Object.keys(prevState)
        const nextKeys = Object.keys(nextState)

        // Find added keys
        for (const key of nextKeys) {
            if (!prevKeys.includes(key)) {
                diff.added[key] = (nextState as any)[key]
            }
        }

        // Find deleted keys
        for (const key of prevKeys) {
            if (!nextKeys.includes(key)) {
                diff.deleted[key] = (prevState as any)[key]
            }
        }

        // Find modified keys
        for (const key of nextKeys) {
            if (prevKeys.includes(key)) {
                const prevValue = (prevState as any)[key]
                const nextValue = (nextState as any)[key]

                if (JSON.stringify(prevValue) !== JSON.stringify(nextValue)) {
                    diff.modified[key] = {
                        prev: prevValue,
                        next: nextValue,
                    }
                }
            }
        }

        return diff
    })

/**
 * DevTools service layer
 */
export const DevToolsLayer = Layer.effect(
    DevToolsService,
    Effect.gen(function* () {
        const { ConfigService } = yield* import('../store/config')
        const config = yield* ConfigService
        return createDevToolsService(config)
    })
)

/**
 * Helper to connect DevTools to a store
 */
export const connectDevTools = (page: Page, store: TestStore) =>
    Effect.gen(function* () {
        const devTools = yield* DevToolsService
        return yield* devTools.connect(page, store)
    })

/**
 * Helper to create action logger
 */
export const createActionLogger = (store: TestStore, options?: ActionLoggerOptions) =>
    Effect.gen(function* () {
        const devTools = yield* DevToolsService
        return yield* devTools.createActionLogger(store, options)
    })

/**
 * Helper to serialize state
 */
export const serializeState = (state: RootState, options?: Partial<SerializationOptions>) =>
    Effect.gen(function* () {
        const devTools = yield* DevToolsService
        return yield* devTools.serializeState(state, options)
    })

/**
 * Export types for external use
 */
export type {
    DevToolsConnection,
    DevToolsMessage,
    DevToolsSession,
    SerializationOptions,
    ActionLoggerOptions,
    ActionLogger,
    ActionLogEntry,
    StateDiff,
}