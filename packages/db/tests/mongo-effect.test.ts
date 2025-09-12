import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Effect, pipe, Option, Duration } from 'effect'
import { createDb, MongoDB, runWithMongoDB } from '../src'
import { typeid } from 'typeid-js'
import { MongoClient } from 'mongodb'

describe('MongoDB Effect Implementation', () => {
    // Use local MongoDB from docker-compose
    const connectionString = 'mongodb://localhost:27017/test_effect_db'
    let client: MongoClient
    
    beforeAll(async () => {
        // Ensure docker MongoDB is accessible
        client = new MongoClient(connectionString)
        await client.connect()
        // Clean test database
        const db = client.db('test_effect_db')
        await db.dropDatabase()
    })
    
    afterAll(async () => {
        if (client) {
            await client.close()
        }
    })
    
    it('should connect and initialize with Effect', async () => {
        const { slices, layer } = createDb(connectionString)
        
        // Create a config object for testing
        const config = {
            connectionString,
            poolSize: 10,
            cache: {
                capacity: 100,
                ttlMinutes: 5
            }
        }
        
        const program = Effect.gen(function* () {
            const db = yield* MongoDB
            
            // Test that repos are available
            expect(db.repos).toBeDefined()
            expect(db.repos.account).toBeDefined()
            expect(db.repos.dialog).toBeDefined()
            expect(db.repos.system).toBeDefined()
            
            // Test eventStore is available
            expect(db.eventStore).toBeDefined()
            
            return 'success'
        })
        
        const result = await Effect.runPromise(
            runWithMongoDB(config, slices as any, program)
        )
        
        expect(result).toBe('success')
    })
    
    it('should perform CRUD operations with repositories', async () => {
        const { slices } = createDb(connectionString)
        
        // Create a config object for testing
        const config = {
            connectionString,
            poolSize: 10,
            cache: {
                capacity: 100,
                ttlMinutes: 5
            }
        }
        
        const program = runWithMongoDB(
            config,
            slices as any,
            Effect.gen(function* () {
                const db = yield* MongoDB
                
                // Create an account
                const accountId = typeid('account').toString()
                const account = {
                    accountId,
                    steamId64: '76561198000000000',
                    name: 'Test Account',
                    status: 'offline' as const,
                    proxyUrl: 'http://proxy.test',
                    maFile: null,
                    session: null,
                    connected: false,
                    isConnecting: false,
                    lastConnectedAt: null,
                    connectionHistory: [],
                    error: null
                }
                
                // Save account
                yield* db.repos.account.save(account)
                
                // Find by ID
                const found = yield* db.repos.account.findById(accountId)
                expect(Option.isSome(found)).toBe(true)
                if (Option.isSome(found)) {
                    expect((found.value as any).accountId).toBe(accountId)
                    expect((found.value as any).name).toBe('Test Account')
                }
                
                // Find all
                const all = yield* db.repos.account.findAll()
                expect(all.length).toBeGreaterThan(0)
                
                // Delete
                yield* db.repos.account.delete(accountId)
                const deleted = yield* db.repos.account.findById(accountId)
                expect(Option.isNone(deleted)).toBe(true)
                
                return 'crud-success'
            })
        )
        
        const result = await Effect.runPromise(program)
        expect(result).toBe('crud-success')
    })
    
    it('should handle batch operations', async () => {
        const { slices } = createDb(connectionString)
        
        // Create a config object for testing
        const config = {
            connectionString,
            poolSize: 10,
            cache: {
                capacity: 100,
                ttlMinutes: 5
            }
        }
        
        const program = runWithMongoDB(
            config,
            slices as any,
            Effect.gen(function* () {
                const db = yield* MongoDB
                
                // Create multiple accounts
                const accountIds = Array.from({ length: 5 }, (_, i) => 
                    typeid('account').toString()
                )
                
                const accounts = accountIds.map((id, i) => ({
                    accountId: id,
                    steamId64: `7656119800000000${i}`,
                    name: `Account ${i}`,
                    status: 'offline' as const,
                    proxyUrl: `http://proxy${i}.test`,
                    maFile: null,
                    session: null,
                    connected: false,
                    isConnecting: false,
                    lastConnectedAt: null,
                    connectionHistory: [],
                    error: null
                }))
                
                // Save all accounts
                yield* Effect.forEach(accounts, acc => db.repos.account.save(acc))
                
                // Batch find
                const found = yield* db.repos.account.findBatch(accountIds.slice(0, 3))
                expect(found.length).toBe(3)
                
                return 'batch-success'
            })
        )
        
        const result = await Effect.runPromise(program)
        expect(result).toBe('batch-success')
    })
    
    it('should handle event store operations', async () => {
        const { slices } = createDb(connectionString)
        
        // Create a config object for testing
        const config = {
            connectionString,
            poolSize: 10,
            cache: {
                capacity: 100,
                ttlMinutes: 5
            }
        }
        
        const program = runWithMongoDB(
            config,
            slices as any,
            Effect.gen(function* () {
                const db = yield* MongoDB
                
                const event = {
                    id: typeid('event').toString(),
                    type: 'account/connected',
                    payload: { accountId: 'account_123' },
                    meta: {
                        schemaVersion: '1.0.0',
                        id: 'account_123',
                        ts: Date.now(),
                        aggregate: 'account',
                        kind: 'event'
                    },
                    timestamp: Date.now()
                }
                
                // Append event
                yield* db.eventStore.append(event)
                
                // Get events
                const events = yield* db.eventStore.getEvents({ aggregate: 'account' })
                expect(events.length).toBeGreaterThan(0)
                
                // Clear events
                yield* db.eventStore.clearEvents()
                const cleared = yield* db.eventStore.getEvents()
                expect(cleared.length).toBe(0)
                
                return 'events-success'
            })
        )
        
        const result = await Effect.runPromise(program)
        expect(result).toBe('events-success')
    })
    
    it('should handle errors gracefully', async () => {
        const { slices } = createDb('mongodb://localhost:27099/test') // Non-existent port
        
        // Create a config object for testing with bad connection string
        const config = {
            connectionString: 'mongodb://localhost:27099/test',
            poolSize: 10,
            cache: {
                capacity: 100,
                ttlMinutes: 5
            }
        }
        
        const program = runWithMongoDB(
            config,
            slices as any,
            Effect.gen(function* () {
                const db = yield* MongoDB
                yield* db.repos.account.findAll()
                return 'should-not-reach'
            }),
            { capacity: 100, ttl: Duration.seconds(1) }
        )
        
        const result = await Effect.runPromise(
            program.pipe(
                Effect.timeout(Duration.seconds(2)), // Timeout first
                Effect.catchAll((error: any) => 
                    Effect.succeed(error._tag === 'TimeoutException' 
                        ? 'error: connection timeout' 
                        : `error: ${error.operation || error._tag}`)
                )
            )
        )
        
        expect(result).toContain('error:')
    }, 10000) // 10 second test timeout
})