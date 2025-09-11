import { Layer, Effect } from 'effect'
import { 
    ConfigService, 
    ConfigError,
    makeConfigService, 
    EnvConfigProvider, 
    TestConfigProvider 
} from './ConfigService'
import { 
    defaultScoringConfig, 
    defaultContextConfig,
    AppConfig
} from './ConfigSchema'

// Production Config Layer (loads from environment variables)
export const ConfigLive = Layer.effect(
    ConfigService,
    Effect.gen(function* () {
        const provider = new EnvConfigProvider()
        return yield* makeConfigService(provider)
    })
)

// Development Config Layer (with development-friendly defaults)
export const ConfigDevelopmentLive = Layer.effect(
    ConfigService,
    Effect.gen(function* () {
        const provider = new EnvConfigProvider()
        const baseConfig = yield* makeConfigService(provider)
        const config = yield* baseConfig.getFullConfig()
        
        // Override with development-friendly defaults
        const devConfig: AppConfig = {
            ...config,
            environment: 'development',
            database: {
                ...config.database,
                connectionString: process.env.DATABASE_URL || 'mongodb://localhost:27017/effect_redux_dev'
            },
            openai: {
                ...config.openai,
                // Use a lower token limit in development to save costs
                maxTokensPerRequest: 4000
            },
            server: {
                ...config.server,
                port: 3000,
                cors: {
                    enabled: true,
                    origins: ['http://localhost:3000', 'http://localhost:5173']
                }
            }
        }

        return {
            getFullConfig: () => Effect.succeed(devConfig),
            getDatabase: () => Effect.succeed(devConfig.database),
            getOpenAI: () => Effect.succeed(devConfig.openai),
            getScoring: () => Effect.succeed(devConfig.scoring),
            getContext: () => Effect.succeed(devConfig.context),
            getServer: () => Effect.succeed(devConfig.server),
            getRateLimit: () => Effect.succeed(devConfig.rateLimit),
            getEnvironment: () => Effect.succeed(devConfig.environment)
        }
    })
)

// Test Config Layer (for testing with sensible defaults)
export const ConfigTestLive = Layer.effect(
    ConfigService,
    Effect.gen(function* () {
        const testConfig: Partial<AppConfig> = {
            environment: 'test',
            database: {
                connectionString: 'mongodb://localhost:27017/test_db',
                poolSize: 2,
                cache: {
                    capacity: 50,
                    ttlMinutes: 1
                }
            },
            openai: {
                apiKey: 'test-api-key',
                model: 'gpt-3.5-turbo',
                maxTokensPerRequest: 1000,
                timeout: 5000
            },
            scoring: defaultScoringConfig,
            context: defaultContextConfig,
            server: {
                port: 0, // Let OS assign random port
                host: '127.0.0.1',
                cors: {
                    enabled: true,
                    origins: ['*']
                }
            },
            rateLimit: {
                friendInvites: {
                    perMinute: 100, // Higher limits for testing
                    perAccount: 1000
                },
                apiRequests: {
                    perMinute: 10000,
                    perIP: 100000
                }
            }
        }
        
        const provider = new TestConfigProvider(testConfig)
        return yield* makeConfigService(provider)
    })
)

// Config Layer with custom overrides
export const createCustomConfigLive = (overrides: Partial<AppConfig>) =>
    Layer.effect(
        ConfigService,
        Effect.gen(function* () {
            const provider = new TestConfigProvider(overrides)
            return yield* makeConfigService(provider)
        })
    )

// Config Layer that merges environment with custom scoring/context configs
export const ConfigWithDefaultsLive = Layer.effect(
    ConfigService,
    Effect.gen(function* () {
        const provider = new EnvConfigProvider()
        const baseConfig = yield* makeConfigService(provider)
        const config = yield* baseConfig.getFullConfig()
        
        // Merge with our predefined defaults for scoring and context
        const configWithDefaults: AppConfig = {
            ...config,
            scoring: { 
                ...defaultScoringConfig,
                ...config.scoring 
            },
            context: { 
                ...defaultContextConfig,
                ...config.context 
            }
        }

        return {
            getFullConfig: () => Effect.succeed(configWithDefaults),
            getDatabase: () => Effect.succeed(configWithDefaults.database),
            getOpenAI: () => Effect.succeed(configWithDefaults.openai),
            getScoring: () => Effect.succeed(configWithDefaults.scoring),
            getContext: () => Effect.succeed(configWithDefaults.context),
            getServer: () => Effect.succeed(configWithDefaults.server),
            getRateLimit: () => Effect.succeed(configWithDefaults.rateLimit),
            getEnvironment: () => Effect.succeed(configWithDefaults.environment)
        }
    })
)

// Helper to create config layer based on environment
export const createConfigForEnvironment = (env?: string) => {
    const environment = env || process.env.NODE_ENV || 'development'
    
    switch (environment) {
        case 'test':
            return ConfigTestLive
        case 'development':
            return ConfigDevelopmentLive
        case 'production':
        case 'staging':
            return ConfigWithDefaultsLive
        default:
            return ConfigLive
    }
}

// Validation helpers
export const validateConfig = Effect.gen(function* () {
    const config = yield* ConfigService
    const fullConfig = yield* config.getFullConfig()
    
    // Validate required fields
    if (!fullConfig.openai.apiKey && fullConfig.environment !== 'test') {
        return yield* Effect.fail(new ConfigError({
            section: 'openai',
            message: 'OpenAI API key is required in non-test environments'
        }))
    }
    
    // Validate database connection string format
    if (!fullConfig.database.connectionString.startsWith('mongodb://')) {
        return yield* Effect.fail(new ConfigError({
            section: 'database',
            message: 'Database connection string must be a valid MongoDB URL'
        }))
    }
    
    // Validate scoring weights sum to reasonable total
    const weights = fullConfig.scoring.weights
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0)
    if (Math.abs(totalWeight - 1.0) > 0.1) {
        return yield* Effect.fail(new ConfigError({
            section: 'scoring',
            message: `Scoring weights should sum to approximately 1.0, got ${totalWeight}`
        }))
    }
    
    return fullConfig
})

export { ConfigError }