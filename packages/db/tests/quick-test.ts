// Quick test to verify database functionality using Vitest
import { test, describe, beforeAll, afterAll, beforeEach, expect } from 'vitest'
import { createDb } from '../src/index'
import { createAccountId, createDialogId } from '@packages/isomorphic'

// Test configuration
const TEST_CONNECTION_STRING = 'mongodb://localhost:27017/test_db_quick'

describe('DB Package Quick Tests', () => {
    let db: ReturnType<typeof createDb>

    beforeAll(async () => {
        db = createDb(TEST_CONNECTION_STRING)
        await db.init()
    })

    afterAll(async () => {
        await db.clearAll()
        await db.close()
    })

    beforeEach(async () => {
        // Clear data before each test to ensure isolation
        await db.clearAll()
    })

    test('should create database instance', () => {
        expect(db).toBeTruthy()
    })

    test('should have all repositories', () => {
        expect(db.repos.account).toBeTruthy()
        expect(db.repos.dialog).toBeTruthy()
        expect(db.repos.system).toBeTruthy()
    })

    test('should save and retrieve account', async () => {
        const testAccount = {
            accountId: createAccountId('76561198000000001'),
            steamId64: '12345678901234567',
            proxyUrl: 'http://proxy.example.com',
            status: 'disconnected' as const
        }
        
        await db.repos.account.save(testAccount)
        const retrieved = await db.repos.account.findById(testAccount.accountId)
        
        expect(retrieved).toBeTruthy()
        expect(retrieved?.steamId64).toBe(testAccount.steamId64)
    })

    test('should save and retrieve dialog', async () => {
        const testDialog = {
            dialogId: createDialogId('account_123', '98765432109876543'),
            accountId: createAccountId('76561198000000001'),
            playerSteamId64: '98765432109876543',
            status: 'active' as const,
            language: 'en' as const,
            goal: 'Test conversation',
            init: 'Initial prompt',
            messages: [],
            continuationScore: 1.0,
            trend: 'stable' as const,
            issuesDetected: [],
            goalProgress: 0,
            tokensUsed: 0,
            totalMessages: 0
        }
        
        await db.repos.dialog.save(testDialog)
        const dialogRetrieved = await db.repos.dialog.findById(testDialog.dialogId)
        
        expect(dialogRetrieved).toBeTruthy()
        expect(dialogRetrieved?.playerSteamId64).toBe(testDialog.playerSteamId64)
    })

    test('should handle event store operations', async () => {
        const testEvent = {
            id: 'evt1',
            type: 'accounts/connected',
            payload: { accountId: createAccountId('76561198000000001') },
            meta: {
                schemaVersion: '1.0',
                id: 'test',
                ts: Date.now(),
                aggregate: 'account',
                kind: 'event' as const
            },
            timestamp: Date.now()
        }
        
        await db.eventStore.append(testEvent)
        const events = await db.eventStore.getEvents()
        
        expect(events.length).toBeGreaterThan(0)
        expect(events[0].type).toBe('accounts/connected')
    })

    test('should clear all data', async () => {
        // Add some test data first
        const testAccount = {
            accountId: createAccountId('76561198000000001'),
            steamId64: '12345678901234567',
            proxyUrl: 'http://proxy.example.com',
            status: 'disconnected' as const
        }
        
        await db.repos.account.save(testAccount)
        
        // Clear all data
        await db.clearAll()
        const afterClear = await db.repos.account.findAll()
        
        expect(afterClear).toHaveLength(0)
    })
})