import * as S from 'effect/Schema'
import { Duration } from 'effect'

// Database Configuration
export const DatabaseConfigSchema = S.Struct({
    connectionString: S.String.annotations({
        title: 'Database Connection String',
        description: 'MongoDB connection string with database name',
    }),
    poolSize: S.Number.pipe(
        S.int(),
        S.positive(),
        S.annotations({
            title: 'Connection Pool Size',
            description: 'Maximum number of connections in the pool',
            default: 10,
        })
    ),
    cache: S.Struct({
        capacity: S.Number.pipe(
            S.int(),
            S.positive(),
            S.annotations({
                title: 'Cache Capacity',
                description: 'Maximum number of cached items',
                default: 1000,
            })
        ),
        ttlMinutes: S.Number.pipe(
            S.positive(),
            S.annotations({
                title: 'Cache TTL (minutes)',
                description: 'Time to live for cached items in minutes',
                default: 5,
            })
        ),
    }).annotations({
        title: 'Database Cache Configuration',
    }),
}).annotations({
    title: 'Database Configuration',
})

// OpenAI Configuration
export const OpenAIConfigSchema = S.Struct({
    apiKey: S.String.pipe(
        S.minLength(1),
        S.annotations({
            title: 'OpenAI API Key',
            description: 'OpenAI API key for GPT models',
        })
    ),
    model: S.Literal('gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo').pipe(
        S.annotations({
            title: 'OpenAI Model',
            description: 'OpenAI model to use for completions',
            default: 'gpt-4-turbo-preview',
        })
    ),
    maxTokensPerRequest: S.Number.pipe(
        S.int(),
        S.positive(),
        S.annotations({
            title: 'Max Tokens Per Request',
            description: 'Maximum tokens to use per OpenAI request',
            default: 8000,
        })
    ),
    timeout: S.Number.pipe(
        S.int(),
        S.positive(),
        S.annotations({
            title: 'Request Timeout (ms)',
            description: 'Timeout for OpenAI API requests in milliseconds',
            default: 30000,
        })
    ),
}).annotations({
    title: 'OpenAI Configuration',
})

// Dialog Scoring Configuration
export const ScoringConfigSchema = S.Struct({
    thresholds: S.Struct({
        highSuccess: S.Number.pipe(S.between(0, 1)),
        moderateSuccess: S.Number.pipe(S.between(0, 1)),
        riskZone: S.Number.pipe(S.between(0, 1)),
        critical: S.Number.pipe(S.between(0, 1)),
    }),
    weights: S.Struct({
        userEngagement: S.Number.pipe(S.between(0, 1)),
        topicRelevance: S.Number.pipe(S.between(0, 1)),
        emotionalTone: S.Number.pipe(S.between(0, 1)),
        responseQuality: S.Number.pipe(S.between(0, 1)),
        goalProximity: S.Number.pipe(S.between(0, 1)),
    }),
    rejection: S.Struct({
        firstRejectionScore: S.Number.pipe(S.between(0, 1)),
        secondRejectionScore: S.Number.pipe(S.between(0, 1)),
        thirdRejectionScore: S.Number.pipe(S.between(0, 1)),
        aggressiveRejectionScore: S.Number.pipe(S.between(0, 1)),
    }),
    topicDrift: S.Struct({
        allowedOfftopicMessages: S.Number.pipe(S.int(), S.nonNegative()),
        scorePenaltyPerDrift: S.Number.pipe(S.between(0, 1)),
        directReturnAttemptAfter: S.Number.pipe(S.int(), S.positive()),
    }),
}).annotations({
    title: 'Dialog Scoring Configuration',
})

// Context Management Configuration
export const ContextConfigSchema = S.Struct({
    compressionAfterMessages: S.Number.pipe(
        S.int(),
        S.positive(),
        S.annotations({
            title: 'Compression Threshold',
            description: 'Number of messages after which to compress context',
            default: 10,
        })
    ),
    maxMessagesInContext: S.Number.pipe(
        S.int(),
        S.positive(),
        S.annotations({
            title: 'Max Messages in Context',
            description: 'Maximum number of messages to keep in context',
            default: 20,
        })
    ),
    keepLastMessagesVerbatim: S.Number.pipe(
        S.int(),
        S.nonNegative(),
        S.annotations({
            title: 'Keep Last Messages Verbatim',
            description: 'Number of most recent messages to keep uncompressed',
            default: 5,
        })
    ),
}).annotations({
    title: 'Context Management Configuration',
})

// Server Configuration
export const ServerConfigSchema = S.Struct({
    port: S.Number.pipe(
        S.int(),
        S.between(0, 65535), // Allow 0 for random port assignment
        S.annotations({
            title: 'Server Port',
            description: 'Port number for the HTTP server (0 = random port)',
            default: 3000,
        })
    ),
    host: S.String.annotations({
        title: 'Server Host',
        description: 'Host address to bind the server to',
        default: '0.0.0.0',
    }),
    cors: S.Struct({
        enabled: S.Boolean.annotations({ default: true }),
        origins: S.Array(S.String).annotations({ default: ['*'] }),
    }).annotations({
        title: 'CORS Configuration',
    }),
}).annotations({
    title: 'Server Configuration',
})

// Rate Limiting Configuration
export const RateLimitConfigSchema = S.Struct({
    friendInvites: S.Struct({
        perMinute: S.Number.pipe(S.int(), S.positive()),
        perAccount: S.Number.pipe(S.int(), S.positive()),
    }),
    apiRequests: S.Struct({
        perMinute: S.Number.pipe(S.int(), S.positive()),
        perIP: S.Number.pipe(S.int(), S.positive()),
    }),
}).annotations({
    title: 'Rate Limiting Configuration',
})

// Environment Configuration
export const EnvironmentSchema = S.Literal('development', 'test', 'staging', 'production').pipe(
    S.annotations({
        title: 'Environment',
        description: 'Current application environment',
        default: 'development',
    })
)

// Main Application Configuration
export const AppConfigSchema = S.Struct({
    environment: EnvironmentSchema,
    database: DatabaseConfigSchema,
    openai: OpenAIConfigSchema,
    scoring: ScoringConfigSchema,
    context: ContextConfigSchema,
    server: ServerConfigSchema,
    rateLimit: RateLimitConfigSchema,
}).annotations({
    title: 'Application Configuration',
})

// Type definitions
export type DatabaseConfig = S.Schema.Type<typeof DatabaseConfigSchema>
export type OpenAIConfig = S.Schema.Type<typeof OpenAIConfigSchema>
export type ScoringConfig = S.Schema.Type<typeof ScoringConfigSchema>
export type ContextConfig = S.Schema.Type<typeof ContextConfigSchema>
export type ServerConfig = S.Schema.Type<typeof ServerConfigSchema>
export type RateLimitConfig = S.Schema.Type<typeof RateLimitConfigSchema>
export type Environment = S.Schema.Type<typeof EnvironmentSchema>
export type AppConfig = S.Schema.Type<typeof AppConfigSchema>

// Default configurations
export const defaultScoringConfig: ScoringConfig = {
    thresholds: {
        highSuccess: 0.7,
        moderateSuccess: 0.5,
        riskZone: 0.3,
        critical: 0.2,
    },
    weights: {
        userEngagement: 0.3,
        topicRelevance: 0.25,
        emotionalTone: 0.2,
        responseQuality: 0.15,
        goalProximity: 0.1,
    },
    rejection: {
        firstRejectionScore: 0.4,
        secondRejectionScore: 0.2,
        thirdRejectionScore: 0.05,
        aggressiveRejectionScore: 0.1,
    },
    topicDrift: {
        allowedOfftopicMessages: 4,
        scorePenaltyPerDrift: 0.05,
        directReturnAttemptAfter: 5,
    },
}

export const defaultContextConfig: ContextConfig = {
    compressionAfterMessages: 10,
    maxMessagesInContext: 20,
    keepLastMessagesVerbatim: 5,
}
