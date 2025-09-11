// Schema exports
export {
    DatabaseConfigSchema,
    OpenAIConfigSchema,
    ScoringConfigSchema,
    ContextConfigSchema,
    ServerConfigSchema,
    RateLimitConfigSchema,
    EnvironmentSchema,
    AppConfigSchema,
    defaultScoringConfig,
    defaultContextConfig
} from './ConfigSchema'

export type {
    DatabaseConfig,
    OpenAIConfig,
    ScoringConfig,
    ContextConfig,
    ServerConfig,
    RateLimitConfig,
    Environment,
    AppConfig
} from './ConfigSchema'

// Service exports
export {
    ConfigService,
    ConfigError,
    makeConfigService,
    EnvConfigProvider,
    TestConfigProvider,
    getConfig,
    getDatabaseConfig,
    getOpenAIConfig,
    getScoringConfig,
    getContextConfig,
    getServerConfig,
    getRateLimitConfig,
    getEnvironment
} from './ConfigService'

export type {
    ConfigProvider
} from './ConfigService'

// Layer exports
export {
    ConfigLive,
    ConfigDevelopmentLive,
    ConfigTestLive,
    ConfigWithDefaultsLive,
    createCustomConfigLive,
    createConfigForEnvironment,
    validateConfig
} from './ConfigLive'

// Re-export for convenience
export { ConfigError as ConfigurationError } from './ConfigLive'