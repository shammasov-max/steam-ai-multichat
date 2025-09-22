import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import * as S from 'effect/Schema'
import type { RootState } from './index'
import { type InferSchema } from '../utils/schema-helpers'

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

// Type inference instead of explicit export (saves 1 line)
type SystemState = InferSchema<typeof SystemStateSchema>

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
        apiKey: undefined,
        model: 'gpt-4o-mini',
        maxTokensPerRequest: 2000,
        timeout: 30000,
    },
    server: {
        port: 8001,
        host: 'localhost',
        cors: {
            enabled: true,
            origins: ['http://localhost:3000'],
        },
    },
    rateLimits: {
        friendInvites: {
            perMinute: 1,
            perAccount: 1,
        },
        api: {
            perMinute: 60,
            perIP: 60,
        },
    },
    steam: {
        maxConcurrentAccounts: 10,
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
// Redux Slice - Simplified deep merge
// ============================================================================

/**
 * Deep merge helper for nested objects
 */
const deepMerge = <T extends Record<string, any>>(
    current: T,
    updates: Partial<T>
): T => {
    const merged = { ...current }

    for (const key in updates) {
        if (updates[key] !== undefined) {
            if (typeof updates[key] === 'object' &&
                !Array.isArray(updates[key]) &&
                updates[key] !== null &&
                typeof current[key] === 'object' &&
                !Array.isArray(current[key]) &&
                current[key] !== null) {
                merged[key] = deepMerge(current[key], updates[key])
            } else {
                merged[key] = updates[key] as T[Extract<keyof T, string>]
            }
        }
    }

    return merged
}

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
            // Use deep merge helper instead of manual merging (saves ~20 lines)
            const merged = deepMerge(state, action.payload)

            // Validate the merged state
            try {
                return S.decodeUnknownSync(SystemStateSchema)(merged)
            } catch (error) {
                console.error('System state validation failed:', error)
                return state // Return current state if validation fails
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
    // Use deep merge helper here too
    const config = dbConfig ? deepMerge(defaults, dbConfig) : defaults

    // Validate final configuration
    return S.decodeUnknownSync(SystemStateSchema)(config)
}