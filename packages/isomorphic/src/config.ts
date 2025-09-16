import { Config, Layer, Effect } from 'effect'
import * as Context from 'effect/Context'

/**
 * Minimal environment configuration - only static values that never change at runtime
 */
export const EnvConfig = Config.all({
    mongodbUrl: Config.string('MONGODB_URL'),
    nodeEnv: Config.literal('development', 'production', 'test')('NODE_ENV').pipe(
        Config.withDefault('development' as const)
    ),
})

export type EnvConfig = Config.Config.Success<typeof EnvConfig>

/**
 * Environment configuration service
 */
export class Env extends Context.Tag('Env')<Env, EnvConfig>() {}

/**
 * Layer that provides environment configuration
 */
export const EnvLive = Layer.effect(
    Env,
    Effect.gen(function* () {
        const config = yield* Config.config(EnvConfig)
        return config
    })
)

/**
 * Test environment layer with mock values
 */
export const EnvTest = Layer.succeed(Env, {
    mongodbUrl: 'mongodb://localhost:27017/test',
    nodeEnv: 'test' as const,
})