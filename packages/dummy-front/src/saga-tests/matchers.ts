import type { UnknownAction } from '@reduxjs/toolkit'
import { Effect, pipe, Stream, Duration } from 'effect'

/**
 * Advanced action matchers for saga testing
 */

/**
 * Create a matcher that combines multiple predicates with AND logic
 */
export const and = <T extends UnknownAction>(
    ...predicates: Array<(action: T) => boolean>
): ((action: T) => boolean) => {
    return (action: T) => predicates.every((predicate) => predicate(action))
}

/**
 * Create a matcher that combines multiple predicates with OR logic
 */
export const or = <T extends UnknownAction>(
    ...predicates: Array<(action: T) => boolean>
): ((action: T) => boolean) => {
    return (action: T) => predicates.some((predicate) => predicate(action))
}

/**
 * Create a matcher that negates a predicate
 */
export const not = <T extends UnknownAction>(
    predicate: (action: T) => boolean
): ((action: T) => boolean) => {
    return (action: T) => !predicate(action)
}

/**
 * Slice-specific matchers
 */
export const sliceMatchers = {
    /** Match any account slice action */
    isAccountAction: (action: UnknownAction) => action.type.startsWith('accounts/'),

    /** Match any dialog slice action */
    isDialogAction: (action: UnknownAction) => action.type.startsWith('dialogs/'),

    /** Match any system slice action */
    isSystemAction: (action: UnknownAction) => action.type.startsWith('system/'),

    /** Match entity creation actions */
    isCreationAction: (action: UnknownAction) => action.type.endsWith('/created'),

    /** Match entity update actions */
    isUpdateAction: (action: UnknownAction) =>
        !action.type.endsWith('/created') && !action.type.endsWith('/deleted'),

    /** Match entity deletion actions */
    isDeletionAction: (action: UnknownAction) => action.type.endsWith('/deleted'),
}

/**
 * Dialog-specific matchers
 */
export const dialogMatchers = {
    /** Match dialog with specific ID */
    withDialogId: (dialogId: string) => (action: any) =>
        action.payload?.dialogId === dialogId,

    /** Match message from specific role */
    fromRole: (role: 'user' | 'assistant') => (action: any) =>
        action.payload?.message?.role === role,

    /** Match assessment with score below threshold */
    lowScore: (threshold: number = 0.3) => (action: any) =>
        action.type === 'dialogs/assessed' &&
        action.payload?.assessment?.continuationScore < threshold,

    /** Match operator alert */
    isOperatorAlert: (action: UnknownAction) =>
        action.type === 'dialogs/operatorAlerted',

    /** Match specific dialog status */
    withStatus: (status: string) => (action: any) =>
        action.type === 'dialogs/statusUpdated' &&
        action.payload?.status === status,
}

/**
 * Account-specific matchers
 */
export const accountMatchers = {
    /** Match account with specific ID */
    withAccountId: (accountId: string) => (action: any) =>
        action.payload?.accountId === accountId,

    /** Match connected account */
    isConnected: (action: UnknownAction) =>
        action.type === 'accounts/connected',

    /** Match disconnected account */
    isDisconnected: (action: UnknownAction) =>
        action.type === 'accounts/disconnected',

    /** Match authentication failure */
    isAuthFailure: (action: UnknownAction) =>
        action.type === 'accounts/authenticationFailed',

    /** Match rate limited account */
    isRateLimited: (action: any) =>
        action.payload?.rateLimitedUntil && action.payload.rateLimitedUntil > Date.now(),
}

/**
 * Pattern matchers for complex scenarios
 */
export const patternMatchers = {
    /** Match action chain pattern */
    chainPattern: (types: string[]) => {
        let index = 0
        return (action: UnknownAction) => {
            if (index < types.length && action.type === types[index]) {
                index++
                return true
            }
            return false
        }
    },

    /** Match actions within time window */
    withinTimeWindow: (startTime: number, duration: number) => (action: any) => {
        const actionTime = action.meta?.timestamp || Date.now()
        return actionTime >= startTime && actionTime <= startTime + duration
    },

    /** Match actions with frequency */
    withFrequency: (type: string, minCount: number, timeWindow: number) => {
        const actions: number[] = []
        return (action: UnknownAction) => {
            if (action.type === type) {
                const now = Date.now()
                actions.push(now)
                // Remove old entries outside the window
                const cutoff = now - timeWindow
                while (actions.length > 0 && actions[0] < cutoff) {
                    actions.shift()
                }
                return actions.length >= minCount
            }
            return false
        }
    },
}

/**
 * Create action expectations for testing
 */
export class ActionExpectation {
    private expectations: Array<{
        matcher: (action: UnknownAction) => boolean
        description: string
        fulfilled: boolean
    }> = []

    /**
     * Expect an action of specific type
     */
    expect(type: string, description?: string) {
        this.expectations.push({
            matcher: (action) => action.type === type,
            description: description || `Action of type '${type}'`,
            fulfilled: false,
        })
        return this
    }

    /**
     * Expect an action matching predicate
     */
    expectMatch(
        matcher: (action: UnknownAction) => boolean,
        description: string
    ) {
        this.expectations.push({
            matcher,
            description,
            fulfilled: false,
        })
        return this
    }

    /**
     * Expect actions in specific order
     */
    expectSequence(...types: string[]) {
        types.forEach((type, index) => {
            this.expect(type, `Action ${index + 1} of type '${type}'`)
        })
        return this
    }

    /**
     * Check if action fulfills any expectation
     */
    check(action: UnknownAction): boolean {
        for (const expectation of this.expectations) {
            if (!expectation.fulfilled && expectation.matcher(action)) {
                expectation.fulfilled = true
                return true
            }
        }
        return false
    }

    /**
     * Get unfulfilled expectations
     */
    getUnfulfilled(): string[] {
        return this.expectations
            .filter((e) => !e.fulfilled)
            .map((e) => e.description)
    }

    /**
     * Check if all expectations are fulfilled
     */
    allFulfilled(): boolean {
        return this.expectations.every((e) => e.fulfilled)
    }

    /**
     * Reset all expectations
     */
    reset() {
        this.expectations.forEach((e) => {
            e.fulfilled = false
        })
        return this
    }
}

/**
 * Create an action stream filter
 */
export const createActionFilter = <T extends UnknownAction>(
    stream: Stream.Stream<UnknownAction>,
    predicate: (action: UnknownAction) => action is T
): Stream.Stream<T> => {
    return pipe(
        stream,
        Stream.filter(predicate)
    ) as Stream.Stream<T>
}

/**
 * Wait for multiple actions in parallel
 */
export const waitForAll = (
    stream: Stream.Stream<UnknownAction>,
    predicates: Array<(action: UnknownAction) => boolean>,
    timeout: number = 5000
) =>
    Effect.gen(function* () {
        const expectations = predicates.map((predicate, i) => ({
            predicate,
            fulfilled: false,
            index: i,
        }))

        const result = yield* pipe(
            stream,
            Stream.takeWhile(() => !expectations.every((e) => e.fulfilled)),
            Stream.tap((action) =>
                Effect.sync(() => {
                    expectations.forEach((exp) => {
                        if (!exp.fulfilled && exp.predicate(action)) {
                            exp.fulfilled = true
                        }
                    })
                })
            ),
            Stream.runDrain,
            Effect.timeout(Duration.millis(timeout)),
            Effect.map(() => expectations.every((e) => e.fulfilled)),
            Effect.catchTag('TimeoutException', () => Effect.succeed(false))
        )

        if (!result) {
            const unfulfilled = expectations
                .filter((e) => !e.fulfilled)
                .map((e) => e.index)
            yield* Effect.fail(
                new Error(`Timeout: Expectations ${unfulfilled.join(', ')} not fulfilled`)
            )
        }

        return true
    })