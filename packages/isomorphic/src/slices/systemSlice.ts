import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import * as S from 'effect/Schema'
import type { RootState } from './index'

// ============================================================================
// System State Schema
// ============================================================================

/**
 * System configuration ID for database storage
 */
export const SYSTEM_CONFIG_ID = 'system_config' as const

/**
 * Complete system configuration schema
 * All configuration is stored in database and can be changed at runtime
 * (except MONGODB_URL and NODE_ENV which are handled by Env service)
 */
export const SystemStateSchema = S.Struct({
    // Database configuration (connection URL comes from Env)
    database: S.Struct({
        poolSize: S.Number,
        cache: S.Struct({
            capacity: S.Number,
            ttlMinutes: S.Number,
        }),
    }),

    // OpenAI configuration
    openai: S.Struct({
        enabled: S.Boolean,
        apiKey: S.optional(S.String),
        model: S.String,
        maxTokensPerRequest: S.Number,
        timeout: S.Number,
    }),

    // Server configuration
    server: S.Struct({
        port: S.Number,
        host: S.String,
        cors: S.Struct({
            enabled: S.Boolean,
            origins: S.Array(S.String),
        }),
    }),

    // Rate limiting configuration
    rateLimits: S.Struct({
        friendInvites: S.Struct({
            perMinute: S.Number,
            perAccount: S.Number,
        }),
        api: S.Struct({
            perMinute: S.Number,
            perIP: S.Number,
        }),
    }),

    // Steam configuration
    steam: S.Struct({
        maxConcurrentAccounts: S.Number,
        connectionTimeout: S.Number,
        reconnectDelay: S.Number,
        maxReconnectAttempts: S.Number,
    }),

    // Feature flags
    features: S.Struct({
        aiAssessment: S.Boolean,
        autoReconnect: S.Boolean,
        debugLogging: S.Boolean,
        metricsCollection: S.Boolean,
    }),

    // Runtime state
    runtime: S.Struct({
        roundRobinIndex: S.Number,
        startedAt: S.Number,
        version: S.String,
    }),
})

// Types
export type SystemState = S.Schema.Type<typeof SystemStateSchema>

// ============================================================================
// Default Configuration (hardcoded constants)
// ============================================================================

export const DEFAULT_SYSTEM_CONFIG: SystemState = {
    database: {
        poolSize: 10,
        cache: {
            capacity: 1000,
            ttlMinutes: 5,
        },
    },
    openai: {
        enabled: false,
        model: 'gpt-4-turbo-preview',
        maxTokensPerRequest: 8000,
        timeout: 30000,
    },
    server: {
        port: 3000,
        host: '0.0.0.0',
        cors: {
            enabled: true,
            origins: ['*'],
        },
    },
    rateLimits: {
        friendInvites: {
            perMinute: 1,
            perAccount: 60,
        },
        api: {
            perMinute: 100,
            perIP: 1000,
        },
    },
    steam: {
        maxConcurrentAccounts: 100,
        connectionTimeout: 30000,
        reconnectDelay: 5000,
        maxReconnectAttempts: 3,
    },
    features: {
        aiAssessment: false,
        autoReconnect: true,
        debugLogging: false,
        metricsCollection: true,
    },
    runtime: {
        roundRobinIndex: 0,
        startedAt: Date.now(),
        version: '1.0.0',
    },
}


// ============================================================================
// Redux Slice
// ============================================================================

/**
 * System configuration slice with single 'patched' action
 * State is validated after merge to ensure consistency
 */
export const systemSlice = createSlice({
    name: 'system',
    initialState: {} as SystemState, // Will be initialized properly on startup
    reducers: {
        /**
         * Patches the system configuration
         * Validates the merged state before returning
         */
        patched: (state, action: PayloadAction<Partial<SystemState>>) => {
            // Merge payload into current state
            const merged = { ...state, ...action.payload }

            // Deep merge for nested objects
            if (action.payload.database) {
                merged.database = { ...state.database, ...action.payload.database }
            }
            if (action.payload.openai) {
                merged.openai = { ...state.openai, ...action.payload.openai }
            }
            if (action.payload.server) {
                merged.server = { ...state.server, ...action.payload.server }
            }
            if (action.payload.rateLimits) {
                merged.rateLimits = { ...state.rateLimits, ...action.payload.rateLimits }
            }
            if (action.payload.steam) {
                merged.steam = { ...state.steam, ...action.payload.steam }
            }
            if (action.payload.features) {
                merged.features = { ...state.features, ...action.payload.features }
            }
            if (action.payload.runtime) {
                merged.runtime = { ...state.runtime, ...action.payload.runtime }
            }

            // Validate the merged state
            try {
                const validated = S.decodeUnknownSync(SystemStateSchema)(merged)
                return validated
            } catch (error) {
                console.error('System state validation failed:', error)
                // Return current state if validation fails
                return state
            }
        },
    },
})

// Export actions and reducer
export const { patched: systemPatched } = systemSlice.actions
export const systemReducer = systemSlice.reducer

// ============================================================================
// Selectors
// ============================================================================

/**
 * Select the entire system configuration
 */
export const selectSystem = (state: RootState) => state.system

// ============================================================================
// Initialization Helper
// ============================================================================

/**
 * Initialize system configuration from multiple sources
 * Order: defaults -> database config
 */
export const initializeSystemConfig = (
    defaults: typeof DEFAULT_SYSTEM_CONFIG,
    dbConfig?: Partial<SystemState>
): SystemState => {
    // Start with defaults
    let config: SystemState = { ...defaults }

    // Merge database config if available
    if (dbConfig) {
        config = { ...config, ...dbConfig }
    }

    // Validate final configuration
    return S.decodeUnknownSync(SystemStateSchema)(config)
}