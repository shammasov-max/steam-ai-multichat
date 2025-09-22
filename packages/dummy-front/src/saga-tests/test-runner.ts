import { Effect, Stream, Queue, Fiber, pipe, Duration } from 'effect'
import type { UnknownAction } from '@reduxjs/toolkit'
import { createSaga, type EffectSaga } from '@packages/isomorphic/src/effect-redux/saga-bridge'
import { StoreService, ActionStream, type TestStore } from '../store/store-factory'
import { ConfigService } from '../store/config'

/**
 * Saga test context for running and asserting on sagas
 */
export interface SagaTestContext {
    /** The store instance */
    store: TestStore
    /** Action stream for monitoring */
    actions$: Stream.Stream<UnknownAction>
    /** Dispatch an action */
    dispatch: (action: UnknownAction) => Effect.Effect<void>
    /** Wait for a specific action */
    waitFor: (predicate: (action: UnknownAction) => boolean, timeout?: number) => Effect.Effect<UnknownAction>
    /** Run a saga */
    runSaga: <R>(saga: EffectSaga<R>) => Effect.Effect<void>
    /** Get current state */
    getState: () => Effect.Effect<any>
}

/**
 * Create a saga test runner
 */
export const createSagaTestRunner = Effect.gen(function* () {
    const store = yield* StoreService
    const { stream, emit } = yield* ActionStream
    const config = yield* ConfigService

    const context: SagaTestContext = {
        store,
        actions$: stream,

        dispatch: (action: UnknownAction) =>
            Effect.gen(function* () {
                yield* Effect.log(`Dispatching: ${action.type}`)
                yield* emit(action)
            }),

        waitFor: (predicate: (action: UnknownAction) => boolean, timeout?: number) =>
            Effect.gen(function* () {
                const timeoutMs = timeout ?? config.sagaTimeout ?? 5000
                yield* Effect.log(`Waiting for action (timeout: ${timeoutMs}ms)`)

                const result = yield* pipe(
                    stream,
                    Stream.filter(predicate),
                    Stream.take(1),
                    Stream.runHead,
                    Effect.timeout(Duration.millis(timeoutMs)),
                    Effect.flatMap((maybeAction) =>
                        maybeAction
                            ? Effect.succeed(maybeAction)
                            : Effect.fail(new Error('Action not received'))
                    ),
                    Effect.catchTag('TimeoutException', () =>
                        Effect.fail(new Error(`Timeout waiting for action after ${timeoutMs}ms`))
                    )
                )

                yield* Effect.log(`Received action: ${result.type}`)
                return result
            }),

        runSaga: <R>(saga: EffectSaga<R>) =>
            Effect.gen(function* () {
                yield* Effect.log(`Starting saga: ${saga.id}`)
                store.runSaga(saga)
            }),

        getState: () => Effect.succeed(store.getState()),
    }

    return context
})

/**
 * Saga test runner with automatic setup and teardown
 */
export const runSagaTest = <A, E>(
    testName: string,
    test: (ctx: SagaTestContext) => Effect.Effect<A, E, never>
) =>
    Effect.gen(function* () {
        yield* Effect.log(`=== Starting Saga Test: ${testName} ===`)

        const startTime = Date.now()
        const context = yield* createSagaTestRunner

        try {
            const result = yield* test(context)
            const duration = Date.now() - startTime

            yield* Effect.log(`=== Test Passed: ${testName} (${duration}ms) ===`)
            return result
        } catch (error) {
            const duration = Date.now() - startTime
            yield* Effect.log(`=== Test Failed: ${testName} (${duration}ms) ===`)
            throw error
        }
    })

/**
 * Action matchers for common patterns
 */
export const matchers = {
    /** Match action by type */
    ofType: (type: string) => (action: UnknownAction) => action.type === type,

    /** Match action by multiple types */
    ofTypes: (...types: string[]) => (action: UnknownAction) => types.includes(action.type),

    /** Match action with payload */
    withPayload: <T>(predicate: (payload: T) => boolean) => (action: any) =>
        action.payload && predicate(action.payload),

    /** Match action by type and payload */
    ofTypeWithPayload: <T>(type: string, predicate: (payload: T) => boolean) => (action: any) =>
        action.type === type && action.payload && predicate(action.payload),

    /** Match any action except specified types */
    notOfTypes: (...types: string[]) => (action: UnknownAction) => !types.includes(action.type),

    /** Match action with specific meta field */
    withMeta: (key: string, value?: any) => (action: any) => {
        if (!action.meta) return false
        if (value === undefined) return key in action.meta
        return action.meta[key] === value
    },

    /** Match test events */
    testEvent: (testId?: string) => (action: any) =>
        action.type.startsWith('TEST/') && (!testId || action.meta?.testId === testId),
}

/**
 * Saga effect builders for testing
 */
export const effects = {
    /** Create a test saga that waits for an action */
    waitForAction: (predicate: (action: UnknownAction) => boolean) =>
        createSaga('test-wait-saga',
            Effect.gen(function* () {
                const { stream } = yield* ActionStream
                const action = yield* pipe(
                    stream,
                    Stream.filter(predicate),
                    Stream.take(1),
                    Stream.runHead,
                    Effect.flatMap(Effect.fromNullable)
                )
                yield* Effect.log(`Saga received action: ${action.type}`)
                return action
            })
        ),

    /** Create a saga that dispatches actions in sequence */
    dispatchSequence: (...actions: UnknownAction[]) =>
        createSaga('test-dispatch-saga',
            Effect.gen(function* () {
                const store = yield* StoreService
                for (const action of actions) {
                    yield* Effect.log(`Saga dispatching: ${action.type}`)
                    store.dispatch(action)
                    yield* Effect.sleep(Duration.millis(10)) // Small delay between actions
                }
            })
        ),

    /** Create a saga that responds to specific actions */
    respondTo: (
        trigger: (action: UnknownAction) => boolean,
        response: (action: UnknownAction) => UnknownAction
    ) =>
        createSaga('test-respond-saga',
            Effect.gen(function* () {
                const { stream } = yield* ActionStream
                const store = yield* StoreService

                yield* pipe(
                    stream,
                    Stream.filter(trigger),
                    Stream.runForEach((action) =>
                        Effect.gen(function* () {
                            const responseAction = response(action)
                            yield* Effect.log(`Saga responding with: ${responseAction.type}`)
                            store.dispatch(responseAction)
                        })
                    )
                )
            })
        ),

    /** Create a saga that collects actions */
    collectActions: (count: number, predicate?: (action: UnknownAction) => boolean) =>
        createSaga('test-collect-saga',
            Effect.gen(function* () {
                const { stream } = yield* ActionStream
                const filter = predicate || (() => true)

                const actions = yield* pipe(
                    stream,
                    Stream.filter(filter),
                    Stream.take(count),
                    Stream.runCollect
                )

                yield* Effect.log(`Collected ${actions.length} actions`)
                return Array.from(actions)
            })
        ),
}

/**
 * Assertion helpers for saga tests
 */
export const assertSaga = {
    /** Assert that an action was dispatched */
    actionDispatched: (ctx: SagaTestContext, predicate: (action: UnknownAction) => boolean, timeout = 1000) =>
        pipe(
            ctx.waitFor(predicate, timeout),
            Effect.map(() => true),
            Effect.catchAll(() => Effect.fail(new Error('Expected action was not dispatched')))
        ),

    /** Assert that an action was NOT dispatched */
    actionNotDispatched: (ctx: SagaTestContext, predicate: (action: UnknownAction) => boolean, waitTime = 500) =>
        pipe(
            ctx.waitFor(predicate, waitTime),
            Effect.map(() => false),
            Effect.catchAll(() => Effect.succeed(true)),
            Effect.flatMap((notDispatched) =>
                notDispatched
                    ? Effect.succeed(true)
                    : Effect.fail(new Error('Unexpected action was dispatched'))
            )
        ),

    /** Assert state matches expectation */
    stateMatches: <T>(ctx: SagaTestContext, selector: (state: any) => T, expected: T) =>
        pipe(
            ctx.getState(),
            Effect.map(selector),
            Effect.flatMap((actual) =>
                JSON.stringify(actual) === JSON.stringify(expected)
                    ? Effect.succeed(true)
                    : Effect.fail(new Error(`State mismatch. Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`))
            )
        ),

    /** Assert action sequence */
    actionSequence: (ctx: SagaTestContext, types: string[], timeout = 5000) =>
        Effect.gen(function* () {
            const received: string[] = []

            for (const type of types) {
                const action = yield* ctx.waitFor(matchers.ofType(type), timeout)
                received.push(action.type)
            }

            return received.length === types.length
        }),
}