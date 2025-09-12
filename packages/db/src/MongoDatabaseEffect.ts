// This file is kept for backwards compatibility
// All functionality has been refactored into separate modules

import { Effect, Duration, Layer } from 'effect'
import { DatabaseConfig, ConfigService, ConfigError, LoggerLayer } from '@packages/isomorphic'
import { SliceConfig } from './types'
import { createCompleteMongoDB } from './database/MongoDBLayer'
import { MongoDB } from './database/MongoDB'

// Re-export from new modules for backwards compatibility
export { MongoError } from './errors/MongoError'
export { MongoConnection } from './connection/MongoConnection'
export { MongoConnectionLive } from './connection/MongoConnectionLive'
export { EventStore } from './event-store/EventStore'
export { EventStoreLive } from './event-store/EventStoreLive'
export { MongoDB } from './database/MongoDB'
export { createMongoDBLayer, createCompleteMongoDB } from './database/MongoDBLayer'
export type { Repository as Repo } from './repository/Repository'

// Legacy helper function for backwards compatibility
export const runWithMongoDB = <TSlices extends readonly SliceConfig[], R, E, A>(
    config: DatabaseConfig,
    slices: TSlices,
    program: Effect.Effect<A, E, MongoDB | R>,
    cacheOptions?: { capacity: number; ttl: Duration.Duration }
) => {
    // Create a simple ConfigService layer that provides the database config
    const configServiceLayer = Layer.succeed(ConfigService, {
        getDatabase: () => Effect.succeed(config),
        getFullConfig: () => Effect.fail(new ConfigError({ section: 'full', message: 'Not implemented in test' })),
        getOpenAI: () => Effect.fail(new ConfigError({ section: 'openai', message: 'Not implemented in test' })),
        getScoring: () => Effect.fail(new ConfigError({ section: 'scoring', message: 'Not implemented in test' })),
        getContext: () => Effect.fail(new ConfigError({ section: 'context', message: 'Not implemented in test' })),
        getServer: () => Effect.fail(new ConfigError({ section: 'server', message: 'Not implemented in test' })),
        getRateLimit: () => Effect.fail(new ConfigError({ section: 'ratelimit', message: 'Not implemented in test' })),
        getEnvironment: () => Effect.fail(new ConfigError({ section: 'environment', message: 'Not implemented in test' }))
    })
    
    return program.pipe(
        Effect.provide(createCompleteMongoDB(slices)),
        Effect.provide(configServiceLayer),
        Effect.provide(LoggerLayer('MongoDatabaseEffect'))
    )
}