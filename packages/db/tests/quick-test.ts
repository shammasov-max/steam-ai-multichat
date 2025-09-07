// Quick test to verify database functionality
import { createDb } from '../src/index'
import { createAccountId, createDialogId } from '@packages/isomorphic'

async function runTests() {
    console.log('🚀 Starting DB package tests...\n')
    
    const connectionString = 'mongodb://localhost:27017/test_db'
    
    try {
        // Test 1: Create database instance
        console.log('Test 1: Creating database instance...')
        const db = createDb(connectionString)
        console.log('✅ Database instance created\n')
        
        // Test 2: Initialize connection
        console.log('Test 2: Initializing connection...')
        await db.init()
        console.log('✅ Database initialized\n')
        
        // Test 3: Check repositories exist
        console.log('Test 3: Checking repositories...')
        if (!db.repos.account) throw new Error('Account repository not found')
        if (!db.repos.dialog) throw new Error('Dialog repository not found')
        if (!db.repos.system) throw new Error('System repository not found')
        console.log('✅ All repositories created\n')
        
        // Test 4: Save and retrieve account
        console.log('Test 4: Testing account repository...')
        const testAccount = {
            accountId: createAccountId(),
            steamId64: '12345678901234567',
            proxyUrl: 'http://proxy.example.com',
            status: 'disconnected' as const
        }
        
        await db.repos.account.save(testAccount)
        const retrieved = await db.repos.account.findById(testAccount.accountId)
        
        if (!retrieved) throw new Error('Account not retrieved')
        if (retrieved.steamId64 !== testAccount.steamId64) throw new Error('Account data mismatch')
        console.log('✅ Account save/retrieve working\n')
        
        // Test 5: Save and retrieve dialog
        console.log('Test 5: Testing dialog repository...')
        const testDialog = {
            dialogId: createDialogId(),
            accountId: createAccountId(),
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
        
        if (!dialogRetrieved) throw new Error('Dialog not retrieved')
        if (dialogRetrieved.playerSteamId64 !== testDialog.playerSteamId64) throw new Error('Dialog data mismatch')
        console.log('✅ Dialog save/retrieve working\n')
        
        // Test 6: Test event store
        console.log('Test 6: Testing event store...')
        const testEvent = {
            id: 'evt1',
            type: 'accounts/connected',
            payload: { accountId: createAccountId() },
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
        
        if (events.length === 0) throw new Error('No events retrieved')
        console.log(`✅ Event store working (${events.length} events)\n`)
        
        // Test 7: Clear all data
        console.log('Test 7: Testing clear all...')
        await db.clearAll()
        const afterClear = await db.repos.account.findAll()
        if (afterClear.length > 0) throw new Error('Data not cleared')
        console.log('✅ Clear all working\n')
        
        // Cleanup
        console.log('Closing database connection...')
        await db.close()
        console.log('✅ Database closed\n')
        
        console.log('✨ All tests passed!')
        process.exit(0)
        
    } catch (error) {
        console.error('❌ Test failed:', error)
        process.exit(1)
    }
}

// Run tests
runTests().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})