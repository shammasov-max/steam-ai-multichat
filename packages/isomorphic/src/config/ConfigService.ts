import { Effect, Context, Layer, Schema } from 'effect'
import {
    AppConfig,
    AppConfigSchema,
    DatabaseConfig,
    OpenAIConfig,
    ScoringConfig,
    ContextConfig,
    ServerConfig,
    RateLimitConfig,
    Environment,
} from './ConfigSchema'

// Config Service Context Tags
export class ConfigService extends Context.Tag('ConfigService')<
    ConfigService,
    {
        readonly getFullConfig: () => Effect.Effect<AppConfig, ConfigError, never>
        readonly getDatabase: () => Effect.Effect<DatabaseConfig, ConfigError, never>
        readonly getOpenAI: () => Effect.Effect<OpenAIConfig, ConfigError, never>
        readonly getScoring: () => Effect.Effect<ScoringConfig, ConfigError, never>
        readonly getContext: () => Effect.Effect<ContextConfig, ConfigError, never>
        readonly getServer: () => Effect.Effect<ServerConfig, ConfigError, never>
        readonly getRateLimit: () => Effect.Effect<RateLimitConfig, ConfigError, never>
        readonly getEnvironment: () => Effect.Effect<Environment, ConfigError, never>
    }
>() {}

// Config Error type
export class ConfigError extends Schema.TaggedError<ConfigError>()('ConfigError', {
    section: Schema.String,
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
}) {}

// Config Provider interface for different sources
export interface ConfigProvider {
    load(): Effect.Effect<unknown, ConfigError, never>
}

// Environment Variable Config Provider
export class EnvConfigProvider implements ConfigProvider {
    load(): Effect.Effect<unknown, ConfigError, never> {
        return Effect.try({
            try: () => ({
                environment: process.env.NODE_ENV || 'development',
                database: {
                    connectionString:
                        process.env.DATABASE_URL ||
                        process.env.MONGODB_URL ||
                        'mongodb://localhost:27017/effect_redux_db',
                    poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
                    cache: {
                        capacity: parseInt(process.env.DB_CACHE_CAPACITY || '1000', 10),
                        ttlMinutes: parseInt(process.env.DB_CACHE_TTL_MINUTES || '5', 10),
                    },
                },
                openai: {
                    apiKey: process.env.OPENAI_API_KEY || '',
                    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
                    maxTokensPerRequest: parseInt(process.env.OPENAI_MAX_TOKENS || '8000', 10),
                    timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000', 10),
                },
                server: {
                    port: parseInt(process.env.PORT || '3000', 10),
                    host: process.env.HOST || '0.0.0.0',
                    cors: {
                        enabled: process.env.CORS_ENABLED !== 'false',
                        origins: process.env.CORS_ORIGINS?.split(',') || ['*'],
                    },
                },
                rateLimit: {
                    friendInvites: {
                        perMinute: parseInt(
                            process.env.RATE_LIMIT_FRIEND_INVITES_PER_MINUTE || '1',
                            10
                        ),
                        perAccount: parseInt(
                            process.env.RATE_LIMIT_FRIEND_INVITES_PER_ACCOUNT || '60',
                            10
                        ),
                    },
                    apiRequests: {
                        perMinute: parseInt(process.env.RATE_LIMIT_API_PER_MINUTE || '100', 10),
                        perIP: parseInt(process.env.RATE_LIMIT_API_PER_IP || '1000', 10),
                    },
                },
            }),
            catch: error =>
                new ConfigError({
                    section: 'environment',
                    message: 'Failed to load environment variables',
                    cause: error,
                }),
        })
    }
}

// Test Config Provider (for testing)
export class TestConfigProvider implements ConfigProvider {
    constructor(private config: Partial<AppConfig> = {}) {}

    load(): Effect.Effect<unknown, ConfigError, never> {
        return Effect.succeed({
            environment: 'test',
            database: {
                connectionString: 'mongodb://localhost:27017/test_db',
                poolSize: 5,
                cache: {
                    capacity: 100,
                    ttlMinutes: 1,
                },
            },
            openai: {
                apiKey: 'test-key',
                model: 'gpt-3.5-turbo' as const,
                maxTokensPerRequest: 1000,
                timeout: 5000,
            },
            server: {
                port: 0, // Random port for testing
                host: '127.0.0.1',
                cors: {
                    enabled: true,
                    origins: ['http://localhost:3000'],
                },
            },
            rateLimit: {
                friendInvites: {
                    perMinute: 10,
                    perAccount: 100,
                },
                apiRequests: {
                    perMinute: 1000,
                    perIP: 10000,
                },
            },
            scoring: {
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
            },
            context: {
                compressionAfterMessages: 10,
                maxMessagesInContext: 20,
                keepLastMessagesVerbatim: 5,
            },
            ...this.config,
        })
    }
}

// Config Service Implementation
export const makeConfigService = (provider: ConfigProvider) =>
    Effect.gen(function* () {
        // Load raw config from provider
        const rawConfig = yield* provider.load()

        // Parse and validate with schema
        const config = yield* Schema.decodeUnknown(AppConfigSchema)(rawConfig).pipe(
            Effect.mapError(
                error =>
                    new ConfigError({
                        section: 'validation',
                        message: 'Failed to validate configuration schema',
                        cause: error,
                    })
            )
        )

        return {
            getFullConfig: () => Effect.succeed(config),
            getDatabase: () => Effect.succeed(config.database),
            getOpenAI: () => Effect.succeed(config.openai),
            getScoring: () => Effect.succeed(config.scoring),
            getContext: () => Effect.succeed(config.context),
            getServer: () => Effect.succeed(config.server),
            getRateLimit: () => Effect.succeed(config.rateLimit),
            getEnvironment: () => Effect.succeed(config.environment),
        }
    })

// Helper functions for easy access
export const getConfig = ConfigService.pipe(Effect.flatMap(_ => _.getFullConfig()))

export const getDatabaseConfig = ConfigService.pipe(Effect.flatMap(_ => _.getDatabase()))

export const getOpenAIConfig = ConfigService.pipe(Effect.flatMap(_ => _.getOpenAI()))

export const getScoringConfig = ConfigService.pipe(Effect.flatMap(_ => _.getScoring()))

export const getContextConfig = ConfigService.pipe(Effect.flatMap(_ => _.getContext()))

export const getServerConfig = ConfigService.pipe(Effect.flatMap(_ => _.getServer()))

export const getRateLimitConfig = ConfigService.pipe(Effect.flatMap(_ => _.getRateLimit()))

export const getEnvironment = ConfigService.pipe(Effect.flatMap(_ => _.getEnvironment()))
