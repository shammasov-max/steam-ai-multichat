import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { prisma } from '../lib/db/client'

export async function setupTestEnvironment() {
    console.log('🔧 Setting up test environment...')

    // 1. Create test database
    const testDbPath = path.join(process.cwd(), 'prisma', 'test.db')
    const mainDbPath = path.join(process.cwd(), 'prisma', 'dev.db')

    // Backup existing test database if it exists
    if (fs.existsSync(testDbPath)) {
        const backupPath = `${testDbPath}.backup.${Date.now()}`
        fs.copyFileSync(testDbPath, backupPath)
        console.log(`📦 Backed up existing test database to ${backupPath}`)
    }

    // Copy main database schema to test database
    if (fs.existsSync(mainDbPath)) {
        fs.copyFileSync(mainDbPath, testDbPath)
        console.log('📋 Copied database schema from dev.db')
    } else {
    // Create fresh database with migrations
        process.env.DATABASE_URL = `file:${testDbPath}`
        execSync('npx prisma migrate deploy', { stdio: 'inherit' })
        console.log('🗃️ Created fresh test database with migrations')
    }

    // 2. Set up environment variables for tests
    process.env.NODE_ENV = 'test'
    process.env.DATABASE_URL = `file:${testDbPath}`
    process.env.API_URL = process.env.API_URL || 'http://localhost:3000'
    process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

    // 3. Clean database for fresh start
    await cleanDatabase()

    // 4. Seed test data
    await seedTestData()

    console.log('✅ Test environment setup complete')
}

export async function cleanDatabase() {
    console.log('🧹 Cleaning database...')

    try {
    // Delete in order to respect foreign key constraints
        await prisma.message.deleteMany()
        await prisma.chat.deleteMany()
        await prisma.friendRequest.deleteMany()
        await prisma.taskPrecondition.deleteMany()
        await prisma.taskTarget.deleteMany()
        await prisma.task.deleteMany()
        await prisma.bot.deleteMany()
        await prisma.setting.deleteMany()

        console.log('✅ Database cleaned')
    } catch (error) {
        console.error('❌ Error cleaning database:', error)
        throw error
    }
}

export async function seedTestData() {
    console.log('🌱 Seeding test data...')

    try {
    // Add default settings
        await prisma.setting.create({
            data: {
                key: 'invite_rate_limit',
                value: '60000' // 1 minute in milliseconds
            }
        })

        await prisma.setting.create({
            data: {
                key: 'max_bots',
                value: '10'
            }
        })

        await prisma.setting.create({
            data: {
                key: 'agent_enabled_default',
                value: 'true'
            }
        })

        console.log('✅ Test data seeded')
    } catch (error) {
        console.error('❌ Error seeding test data:', error)
        throw error
    }
}

export async function teardownTestEnvironment() {
    console.log('🧹 Cleaning up test environment...')

    try {
    // Close database connection
        await prisma.$disconnect()

        // Optionally remove test database
        if (process.env.CLEANUP_TEST_DB === 'true') {
            const testDbPath = path.join(process.cwd(), 'prisma', 'test.db')
            if (fs.existsSync(testDbPath)) {
                fs.unlinkSync(testDbPath)
                console.log('🗑️ Removed test database')
            }
        }

        console.log('✅ Test environment cleanup complete')
    } catch (error) {
        console.error('❌ Error during cleanup:', error)
    }
}

// Helper to create test fixtures
export function createTestFixtures() {
    const fixturesPath = path.join(process.cwd(), 'fixtures', 'all.txt')
    const content = fs.readFileSync(fixturesPath, 'utf-8')
    const accounts: any[] = []

    content.split('\n').forEach(line => {
        line = line.trim()
        if (!line) return

        const match = line.match(/^(.+?):(.+?)\s+-\s+(.+?):(\d+):(.+?):(.+?)$/)
        if (match) {
            const [, username, password, proxyHost, proxyPort, proxyUser, proxyPass] = match
            const maFilePath = path.join(process.cwd(), 'fixtures', 'mafile', `${username}.maFile`)
      
            if (fs.existsSync(maFilePath)) {
                const maFile = JSON.parse(fs.readFileSync(maFilePath, 'utf-8'))
                accounts.push({
                    username,
                    password,
                    proxyHost,
                    proxyPort,
                    proxyUser,
                    proxyPass,
                    maFile,
                    proxyUrl: `http://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}`
                })
            }
        }
    })

    return accounts
}

// Helper to wait for condition
export async function waitForCondition(
    condition: () => Promise<boolean>,
    timeout = 30000,
    interval = 1000
): Promise<boolean> {
    const startTime = Date.now()
  
    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return true
        }
        await new Promise(resolve => setTimeout(resolve, interval))
    }
  
    return false
}

// Helper to create mock Steam session
export function createMockSteamSession(botId: string) {
    return {
        botId,
        status: 'connected',
        steamId64: '76561198000000001',
        lastSeen: new Date(),
        messageQueue: [],
        friendRequestQueue: [],
        rateLimits: {
            lastInvite: 0,
            lastMessage: 0
        },
        sendMessage: async (targetId: string, message: string) => {
            console.log(`Mock: Bot ${botId} sending to ${targetId}: ${message}`)
            return true
        },
        sendFriendRequest: async (targetId: string) => {
            console.log(`Mock: Bot ${botId} sending friend request to ${targetId}`)
            return true
        },
        acceptFriendRequest: async (targetId: string) => {
            console.log(`Mock: Bot ${botId} accepting friend request from ${targetId}`)
            return true
        },
        removeFriend: async (targetId: string) => {
            console.log(`Mock: Bot ${botId} removing friend ${targetId}`)
            return true
        },
        emit: (event: string, ...args: any[]) => {
            console.log(`Mock: Bot ${botId} emitting event ${event}`, args)
        }
    }
}

// Run setup if called directly
if (require.main === module) {
    setupTestEnvironment()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error)
            process.exit(1)
        })
}