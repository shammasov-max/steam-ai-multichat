import { createDb } from '../src/index.js'
import { createAccountId, createDialogId } from '../../isomorphic/src/index.js'
import type { Account, Dialog } from '../../isomorphic/src/index.js'
import { MongoClient } from 'mongodb'
import { test, describe, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'

// Test configuration
const TEST_CONNECTION_STRING = 'mongodb://localhost:27017/test_db'
const TEST_DB_NAME = 'test_db'

describe('MongoDB Database Package', () => {
    let db: ReturnType<typeof createDb>
    let mongoClient: MongoClient

    before(async () => {
        // Create database instance
        db = createDb(TEST_CONNECTION_STRING)
        
        // Initialize connection
        await db.init()

        // Create direct mongo client for verification
        mongoClient = new MongoClient(TEST_CONNECTION_STRING)
        await mongoClient.connect()
    })

    after(async () => {
        // Clean up
        await db.clearAll()
        await db.close()
        await mongoClient.close()
    })

    beforeEach(async () => {
        // Clear all data before each test
        await db.clearAll()
    })

    describe('Database Initialization', () => {
        test('should connect to MongoDB successfully', () => {
            assert.ok(db, 'Database should be defined')
            assert.ok(db.eventStore, 'Event store should be defined')
            assert.ok(db.repos, 'Repositories should be defined')
        })

        test('should create repositories for all slices', () => {
            assert.ok(db.repos.account, 'Account repository should be defined')
            assert.ok(db.repos.dialog, 'Dialog repository should be defined')
            assert.ok(db.repos.system, 'System repository should be defined')
        })

        test('should extract database name from connection string', async () => {
            const testDb = mongoClient.db(TEST_DB_NAME)
            const collections = await testDb.listCollections().toArray()
            
            // Should have created collections
            const collectionNames = collections.map(c => c.name)
            assert.ok(collectionNames.includes('events'), 'Events collection should exist')
        })
    })

    describe('Account Repository', () => {
        const testAccount: Account = {
            accountId: createAccountId(),
            steamId64: '12345678901234567',
            proxyUrl: 'http://proxy.example.com',
            status: 'disconnected',
            label: 'Test Account'
        }

        test('should save and retrieve an account', async () => {
            await db.repos.account.save(testAccount)
            
            const retrieved = await db.repos.account.findById(testAccount.accountId)
            assert.deepStrictEqual(retrieved, testAccount)
        })

        test('should find all accounts', async () => {
            const account1 = { ...testAccount, accountId: createAccountId() }
            const account2 = { ...testAccount, accountId: createAccountId(), steamId64: '98765432109876543' }
            
            await db.repos.account.save(account1)
            await db.repos.account.save(account2)
            
            const all = await db.repos.account.findAll()
            assert.strictEqual(all.length, 2, 'Should have 2 accounts')
            assert.ok(all.some(acc => acc.accountId === account1.accountId), 'Should contain account1')
            assert.ok(all.some(acc => acc.accountId === account2.accountId), 'Should contain account2')
        })

        test('should update an account', async () => {
            await db.repos.account.save(testAccount)
            
            const updated = { ...testAccount, status: 'connected' as const }
            await db.repos.account.save(updated)
            
            const retrieved = await db.repos.account.findById(testAccount.accountId)
            assert.strictEqual(retrieved?.status, 'connected')
        })

        test('should delete an account', async () => {
            await db.repos.account.save(testAccount)
            await db.repos.account.delete(testAccount.accountId)
            
            const retrieved = await db.repos.account.findById(testAccount.accountId)
            assert.strictEqual(retrieved, null)
        })
    })

    describe('Dialog Repository', () => {
        const testDialog: Dialog = {
            dialogId: createDialogId(),
            accountId: createAccountId(),
            playerSteamId64: '12345678901234567',
            status: 'active',
            language: 'en',
            goal: 'Test conversation',
            init: 'Initial prompt',
            messages: [],
            continuationScore: 1.0,
            trend: 'stable',
            issuesDetected: [],
            goalProgress: 0,
            tokensUsed: 0,
            totalMessages: 0
        }

        test('should save and retrieve a dialog', async () => {
            await db.repos.dialog.save(testDialog)
            
            const retrieved = await db.repos.dialog.findById(testDialog.dialogId)
            assert.deepStrictEqual(retrieved, testDialog)
        })

        test('should handle dialog with messages', async () => {
            const dialogWithMessages = {
                ...testDialog,
                messages: [
                    {
                        id: 'msg1',
                        from: 'player' as const,
                        text: 'Hello',
                        ts: Date.now()
                    },
                    {
                        id: 'msg2',
                        from: 'account' as const,
                        text: 'Hi there!',
                        ts: Date.now() + 1000
                    }
                ],
                totalMessages: 2
            }
            
            await db.repos.dialog.save(dialogWithMessages)
            
            const retrieved = await db.repos.dialog.findById(testDialog.dialogId)
            assert.strictEqual(retrieved?.messages.length, 2)
            assert.strictEqual(retrieved?.totalMessages, 2)
        })
    })

    describe('System Repository', () => {
        test('should retrieve singleton system entity', async () => {
            const system = await db.repos.system.findById('system')
            
            // System should exist as it's initialized with singleton
            assert.ok(system, 'System should be defined')
            assert.strictEqual(system?.systemId, 'system')
            assert.ok(system?.roundRobin, 'RoundRobin should be defined')
            assert.ok(system?.rateLimits, 'RateLimits should be defined')
        })

        test('should update system entity', async () => {
            const system = await db.repos.system.findById('system')
            
            if (system) {
                const updated = {
                    ...system,
                    roundRobin: {
                        pointer: 5,
                        eligibleAccountIds: [createAccountId(), createAccountId()]
                    }
                }
                
                await db.repos.system.save(updated)
                
                const retrieved = await db.repos.system.findById('system')
                assert.strictEqual(retrieved?.roundRobin.pointer, 5)
                assert.strictEqual(retrieved?.roundRobin.eligibleAccountIds.length, 2)
            }
        })
    })

    describe('Event Store', () => {
        test('should append and retrieve events', async () => {
            const event = {
                id: 'evt1',
                type: 'accounts/connected',
                payload: { accountId: createAccountId() },
                meta: {
                    schemaVersion: '1.0',
                    id: 'test',
                    ts: Date.now(),
                    aggregate: 'account',
                    kind: 'event'
                },
                timestamp: Date.now()
            }
            
            await db.eventStore.append(event)
            
            const events = await db.eventStore.getEvents()
            assert.strictEqual(events.length, 1)
            assert.strictEqual(events[0].type, 'accounts/connected')
            assert.strictEqual(events[0].meta.aggregate, 'account')
        })

        test('should append batch of events', async () => {
            const events = Array.from({ length: 5 }, (_, i) => ({
                id: `evt${i}`,
                type: 'dialogs/messageReceived',
                payload: { dialogId: createDialogId(), text: `Message ${i}` },
                meta: {
                    schemaVersion: '1.0',
                    id: `msg${i}`,
                    ts: Date.now() + i * 1000,
                    aggregate: 'dialog',
                    kind: 'event' as const
                },
                timestamp: Date.now() + i * 1000
            }))
            
            await db.eventStore.appendBatch(events)
            
            const retrieved = await db.eventStore.getEvents()
            assert.strictEqual(retrieved.length, 5)
        })

        test('should filter events by aggregate', async () => {
            const accountEvent = {
                id: 'evt1',
                type: 'accounts/connected',
                payload: {},
                meta: {
                    schemaVersion: '1.0',
                    id: 'acc1',
                    ts: Date.now(),
                    aggregate: 'account',
                    kind: 'event' as const
                },
                timestamp: Date.now()
            }
            
            const dialogEvent = {
                id: 'evt2',
                type: 'dialogs/created',
                payload: {},
                meta: {
                    schemaVersion: '1.0',
                    id: 'dlg1',
                    ts: Date.now(),
                    aggregate: 'dialog',
                    kind: 'event' as const
                },
                timestamp: Date.now()
            }
            
            await db.eventStore.appendBatch([accountEvent, dialogEvent])
            
            const accountEvents = await db.eventStore.getEventsByAggregate('account')
            assert.strictEqual(accountEvents.length, 1)
            assert.strictEqual(accountEvents[0].type, 'accounts/connected')
            
            const dialogEvents = await db.eventStore.getEventsByAggregate('dialog')
            assert.strictEqual(dialogEvents.length, 1)
            assert.strictEqual(dialogEvents[0].type, 'dialogs/created')
        })

        test('should get events since timestamp', async () => {
            const now = Date.now()
            const oldEvent = {
                id: 'old',
                type: 'test/old',
                payload: {},
                meta: {
                    schemaVersion: '1.0',
                    id: 'old',
                    ts: now - 10000,
                    aggregate: 'test',
                    kind: 'event' as const
                },
                timestamp: now - 10000
            }
            
            const newEvent = {
                id: 'new',
                type: 'test/new',
                payload: {},
                meta: {
                    schemaVersion: '1.0',
                    id: 'new',
                    ts: now,
                    aggregate: 'test',
                    kind: 'event' as const
                },
                timestamp: now
            }
            
            await db.eventStore.appendBatch([oldEvent, newEvent])
            
            const recentEvents = await db.eventStore.getEventsSince(now - 5000)
            assert.strictEqual(recentEvents.length, 1)
            assert.strictEqual(recentEvents[0].type, 'test/new')
        })
    })

    describe('Index Creation', () => {
        test('should create indexes from schema annotations', async () => {
            const testDb = mongoClient.db(TEST_DB_NAME)
            
            // Check account indexes
            const accountIndexes = await testDb.collection('accounts').indexes()
            const accountIndexNames = accountIndexes.map(idx => Object.keys(idx.key || {})[0])
            assert.ok(accountIndexNames.includes('accountId'), 'Should have accountId index')
            assert.ok(accountIndexNames.includes('steamId64'), 'Should have steamId64 index')
            assert.ok(accountIndexNames.includes('status'), 'Should have status index')
            
            // Check dialog indexes  
            const dialogIndexes = await testDb.collection('dialogs').indexes()
            const dialogIndexNames = dialogIndexes.map(idx => Object.keys(idx.key || {})[0])
            assert.ok(dialogIndexNames.includes('dialogId'), 'Should have dialogId index')
            assert.ok(dialogIndexNames.includes('accountId'), 'Should have accountId index')
            assert.ok(dialogIndexNames.includes('status'), 'Should have status index')
            
            // Check event indexes
            const eventIndexes = await testDb.collection('events').indexes()
            const eventIndexKeys = eventIndexes.map(idx => Object.keys(idx.key || {}).join(','))
            assert.ok(eventIndexKeys.includes('meta.aggregate,meta.ts'), 'Should have compound event index')
        })
    })

    describe('Clear All', () => {
        test('should clear all collections', async () => {
            // Add some data
            await db.repos.account.save({
                accountId: createAccountId(),
                steamId64: '12345678901234567',
                proxyUrl: 'http://proxy.example.com',
                status: 'connected'
            })
            
            await db.eventStore.append({
                id: 'evt1',
                type: 'test',
                payload: {},
                meta: {
                    schemaVersion: '1.0',
                    id: 'test',
                    ts: Date.now(),
                    aggregate: 'test',
                    kind: 'event'
                },
                timestamp: Date.now()
            })
            
            // Clear all
            await db.clearAll()
            
            // Verify everything is cleared
            const accounts = await db.repos.account.findAll()
            assert.strictEqual(accounts.length, 0)
            
            const events = await db.eventStore.getEvents()
            assert.strictEqual(events.length, 0)
        })
    })
})