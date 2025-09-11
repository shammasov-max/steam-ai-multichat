import { test, expect, describe } from 'vitest'
import { Effect } from 'effect'
import { 
    ConfigTestLive, 
    getDatabaseConfig, 
    getOpenAIConfig, 
    getScoringConfig,
    createCustomConfigLive,
    validateConfig,
    AppConfig
} from '../src/config/index'

describe('Config System', () => {
    test('should load test configuration', async () => {
        const program = Effect.gen(function* () {
            const dbConfig = yield* getDatabaseConfig
            const openaiConfig = yield* getOpenAIConfig
            const scoringConfig = yield* getScoringConfig
            
            return { dbConfig, openaiConfig, scoringConfig }
        })

        
        try {
            const result = await Effect.runPromise(program.pipe(Effect.provide(ConfigTestLive)))
            
            expect(result.dbConfig.connectionString).toEqual('mongodb://localhost:27017/test_db')
            expect(result.dbConfig.poolSize).toEqual(2) // From ConfigTestLive in ConfigLive.ts
            expect(result.openaiConfig.model).toEqual('gpt-3.5-turbo')
            expect(result.scoringConfig.thresholds.highSuccess).toEqual(0.7)
        } catch (error) {
            console.error('Config validation error:', error)
            throw error
        }
    })
    
    test('should support custom configuration overrides', async () => {
        const customConfig: Partial<AppConfig> = {
            database: {
                connectionString: 'mongodb://custom:27017/custom_db',
                poolSize: 20,
                cache: {
                    capacity: 500,
                    ttlMinutes: 10
                }
            }
        }
        
        const program = Effect.gen(function* () {
            const dbConfig = yield* getDatabaseConfig
            return dbConfig
        })
        
        const result = await Effect.runPromise(
            program.pipe(Effect.provide(createCustomConfigLive(customConfig)))
        )
        
        expect(result.connectionString).toEqual('mongodb://custom:27017/custom_db')
        expect(result.poolSize).toEqual(20)
        expect(result.cache.capacity).toEqual(500)
    })
    
    test('should validate configuration', async () => {
        const validConfig: Partial<AppConfig> = {
            openai: {
                apiKey: 'valid-key',
                model: 'gpt-4',
                maxTokensPerRequest: 4000,
                timeout: 30000
            },
            database: {
                connectionString: 'mongodb://localhost:27017/valid_db',
                poolSize: 10,
                cache: {
                    capacity: 1000,
                    ttlMinutes: 5
                }
            }
        }
        
        const program = validateConfig
        
        const result = await Effect.runPromise(
            program.pipe(Effect.provide(createCustomConfigLive(validConfig)))
        )
        
        expect(result.openai.apiKey).toEqual('valid-key')
        expect(result.database.connectionString).toBe('mongodb://localhost:27017/valid_db')
    })
    
    test('should fail validation for invalid configuration', async () => {
        const invalidConfig: Partial<AppConfig> = {
            database: {
                connectionString: 'invalid-connection-string', // Not a valid MongoDB URL
                poolSize: 10,
                cache: {
                    capacity: 1000,
                    ttlMinutes: 5
                }
            }
        }
        
        const program = validateConfig
        
        await expect(
            Effect.runPromise(
                program.pipe(Effect.provide(createCustomConfigLive(invalidConfig)))
            )
        ).rejects.toThrow()
    })
})
