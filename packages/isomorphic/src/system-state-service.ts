import { Effect, Layer, Context } from 'effect'
import type { Store } from '@reduxjs/toolkit'
import type { SystemState } from './slices/systemSlice'
import { systemPatched } from './slices/systemSlice'

/**
 * Redux store service
 */
export class ReduxStore extends Context.Tag('ReduxStore')<
    ReduxStore,
    Store<{ system: SystemState }>
>() {}

/**
 * System state service that wraps Redux store access
 */
export class SystemStateService extends Context.Tag('SystemStateService')<
    SystemStateService,
    {
        /**
         * Get current system state
         */
        get: () => SystemState

        /**
         * Update system state with partial patch
         */
        update: (patch: Partial<SystemState>) => Effect.Effect<void>

        /**
         * Subscribe to system state changes
         * Returns an unsubscribe function
         */
        subscribe: (callback: (state: SystemState) => void) => Effect.Effect<() => void>

        /**
         * Get specific state sections
         */
        getDatabase: () => SystemState['database']
        getOpenAI: () => SystemState['openai']
        getServer: () => SystemState['server']
        getRateLimits: () => SystemState['rateLimits']
        getSteam: () => SystemState['steam']
        getFeatures: () => SystemState['features']
    }
>() {}

/**
 * Layer that provides SystemStateService
 */
export const SystemStateServiceLive = Layer.effect(
    SystemStateService,
    Effect.gen(function* () {
        const store = yield* ReduxStore

        return {
            get: () => store.getState().system,

            update: (patch: Partial<SystemState>) =>
                Effect.sync(() => {
                    store.dispatch(systemPatched(patch))
                }),

            subscribe: (callback: (state: SystemState) => void) =>
                Effect.sync(() => {
                    // Call callback immediately with current state
                    callback(store.getState().system)
                    // Then subscribe to changes
                    return store.subscribe(() => callback(store.getState().system))
                }),

            // Convenience getters for specific sections
            getDatabase: () => store.getState().system.database,
            getOpenAI: () => store.getState().system.openai,
            getServer: () => store.getState().system.server,
            getRateLimits: () => store.getState().system.rateLimits,
            getSteam: () => store.getState().system.steam,
            getFeatures: () => store.getState().system.features,
        }
    })
)

/**
 * Helper to initialize Redux store with system state from database
 */
export const initializeSystemState = (
    store: Store,
    systemState: SystemState
): Effect.Effect<void> =>
    Effect.sync(() => {
        // Use transient action to set initial state without triggering side effects
        store.dispatch({
            type: '@@transient/SET',
            payload: { system: systemState },
        })
    })