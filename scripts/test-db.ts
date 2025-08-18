#!/usr/bin/env tsx

import { Database, EventRecord, StateSnapshot } from '../packages/db/src/index.js'

const config = {
    host: 'localhost',
    port: 8123,
    username: 'steam_bot',
    password: 'steam_bot_password',
    database: 'steam_bot',
}

async function testDatabase(): Promise<void> {
    console.log('🔌 Connecting to ClickHouse...')
    const db = new Database(config)
    
    try {
        await db.init()
        console.log('✅ Database initialized')

        // Test event storage
        console.log('\n📝 Testing event storage...')
        const testEvent: EventRecord = {
            id: 'test_event_1',
            type: 'bot/authenticated',
            payload: { botId: 'bot_123', status: 'online' },
            meta: {
                schemaVersion: '1.0.0',
                id: 'test_event_1',
                ts: Date.now(),
                aggregate: 'bot',
                kind: 'event',
            },
            timestamp: Date.now(),
        }

        await db.events.append(testEvent)
        console.log('✅ Event stored')

        const events = await db.events.getEvents({ aggregate: 'bot' })
        console.log(`📊 Retrieved ${events.length} events`)

        // Test snapshot storage
        console.log('\n💾 Testing snapshot storage...')
        const testSnapshot: StateSnapshot = {
            id: 'app_state',
            state: {
                bots: { bot_123: { status: 'online', lastSeen: Date.now() } },
                tasks: {},
                chats: {},
            },
            timestamp: Date.now(),
            version: 1,
        }

        await db.snapshots.saveSnapshot(testSnapshot)
        console.log('✅ Snapshot stored')

        const snapshot = await db.snapshots.getLatestSnapshot('app_state')
        console.log(`📸 Retrieved snapshot with ${Object.keys(snapshot?.state || {}).length} keys`)

        console.log('\n🎉 All tests passed!')
    } catch (error) {
        console.error('❌ Test failed:', error)
        process.exit(1)
    } finally {
        await db.close()
        console.log('🔌 Database connection closed')
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    testDatabase().catch(console.error)
}