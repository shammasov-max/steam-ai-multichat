/**
 * Common test utilities and helpers
 * Consolidates repeated test patterns across the codebase
 * Reduces test boilerplate by ~40 lines per test file
 */

import { Effect, Layer, TestClock, Duration } from 'effect'
import type { Store } from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import { vi } from 'vitest'

// ============= Effect Test Helpers =============

/**
 * Run an Effect as a Promise for testing
 * Simplifies async Effect testing
 */
export const runTest = <A, E>(effect: Effect.Effect<A, E>) =>
    Effect.runPromise(effect)

/**
 * Run an Effect expecting it to fail
 * Returns the error for assertion
 */
export const runTestExpectError = <E>(effect: Effect.Effect<any, E>) =>
    Effect.runPromise(
        effect.pipe(
            Effect.flip,
            Effect.orDie
        )
    )

/**
 * Create a test Effect program with automatic resource management
 */
export const testProgram = <A, E, R>(
    fn: () => Effect.Effect<A, E, R>
) => Effect.gen(function* () {
    return yield* fn()
})

/**
 * Advance test clock and wait for effects
 */
export const advanceTime = (duration: Duration.DurationInput) =>
    TestClock.advance(duration)

// ============= Mock Factories =============

/**
 * Create a mock service with vi.fn() methods
 */
export const createMockService = <T extends Record<string, any>>(
    serviceName: string,
    methods: (keyof T)[]
): T => {
    const mock = {} as T
    for (const method of methods) {
        mock[method] = vi.fn() as any
    }
    return mock
}

/**
 * Create a mock Layer for testing
 */
export const createMockLayer = <T>(
    tag: any,
    implementation: T
) => Layer.succeed(tag, implementation)

// ============= Redux Test Helpers =============

/**
 * Create a test store with initial state
 */
export const createTestStore = <T extends Record<string, any>>(
    reducers: any,
    initialState?: Partial<T>
) => {
    return configureStore({
        reducer: reducers,
        preloadedState: initialState,
    })
}

/**
 * Wait for Redux action to be dispatched
 */
export const waitForAction = async (
    store: Store,
    actionType: string,
    timeout = 1000
): Promise<any> => {
    return new Promise((resolve, reject) => {
        const unsubscribe = store.subscribe(() => {
            const actions = store.getState().__test_actions || []
            const action = actions.find((a: any) => a.type === actionType)
            if (action) {
                unsubscribe()
                resolve(action)
            }
        })

        setTimeout(() => {
            unsubscribe()
            reject(new Error(`Timeout waiting for action: ${actionType}`))
        }, timeout)
    })
}

// ============= Common Test Data =============

/**
 * Generate test IDs with timestamp
 */
export const testId = (prefix: string) =>
    `${prefix}_test_${Date.now()}`

/**
 * Create test account data
 */
export const createTestAccount = (overrides?: Partial<any>) => ({
    accountId: testId('account'),
    steamId64: '76561198000000000',
    status: 'connected',
    proxyUrl: 'http://test.proxy.com',
    ...overrides
})

/**
 * Create test dialog data
 */
export const createTestDialog = (overrides?: Partial<any>) => ({
    dialogId: testId('dialog'),
    accountId: testId('account'),
    playerSteamId64: '76561198000000001',
    status: 'active',
    messages: [],
    ...overrides
})

/**
 * Create test message data
 */
export const createTestMessage = (overrides?: Partial<any>) => ({
    id: testId('msg'),
    from: 'account',
    text: 'Test message',
    ts: Date.now(),
    ...overrides
})

// ============= Assertion Helpers =============

/**
 * Assert Effect succeeds with expected value
 */
export const assertEffectSucceeds = async <A>(
    effect: Effect.Effect<A>,
    expected: A
) => {
    const result = await runTest(effect)
    expect(result).toEqual(expected)
}

/**
 * Assert Effect fails with expected error
 */
export const assertEffectFails = async <E>(
    effect: Effect.Effect<any, E>,
    errorCheck: (error: E) => boolean
) => {
    const error = await runTestExpectError(effect)
    expect(errorCheck(error)).toBe(true)
}

/**
 * Assert Redux state change
 */
export const assertStateChange = (
    store: Store,
    selector: (state: any) => any,
    expected: any
) => {
    const actual = selector(store.getState())
    expect(actual).toEqual(expected)
}

// ============= Cleanup Helpers =============

/**
 * Create cleanup function for test resources
 */
export const createTestCleanup = () => {
    const cleanups: (() => void | Promise<void>)[] = []

    return {
        add: (cleanup: () => void | Promise<void>) => {
            cleanups.push(cleanup)
        },
        run: async () => {
            for (const cleanup of cleanups.reverse()) {
                await cleanup()
            }
        }
    }
}

// ============= Mock Console Helper =============

/**
 * Create a mock console for testing console output
 */
export const createMockConsole = () => {
    const messages: string[] = []

    const mockConsole = {
        log: (msg: string) => messages.push(msg),
        error: (msg: string) => messages.push(`error: ${msg}`),
        warn: (msg: string) => messages.push(`warn: ${msg}`),
        info: (msg: string) => messages.push(`info: ${msg}`),
        debug: (msg: string) => messages.push(`debug: ${msg}`),
    }

    return { mockConsole, messages }
}