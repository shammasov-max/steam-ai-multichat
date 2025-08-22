import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { prisma } from '../lib/db/client'
import { runAgentForChat } from '../lib/agent/runner'

// Mock Steam session manager for AI tests
const mockSteamSessionManager = {
    sessions: new Map(),
  
    getSession: (botId: string) => {
        return mockSteamSessionManager.sessions.get(botId)
    },
  
    sendMessage: async (botId: string, steamId: string, message: string) => {
        console.log(`Mock sending: ${message} from bot ${botId} to ${steamId}`)
        return true
    },
  
    createMockSession: (botId: string) => {
        mockSteamSessionManager.sessions.set(botId, {
            botId,
            status: 'connected',
            sendMessage: async (steamId: string, msg: string) => {
                console.log(`Session ${botId} sending to ${steamId}: ${msg}`)
                return true
            }
        })
    }
}

// Helper to parse test accounts
function getTestAccount() {
    const fixturesPath = path.join(process.cwd(), 'fixtures', 'all.txt')
    const content = fs.readFileSync(fixturesPath, 'utf-8')
    const line = content.split('\n')[0].trim()
  
    const match = line.match(/^(.+?):(.+?)\s+-\s+(.+?):(\d+):(.+?):(.+?)$/)
    if (match) {
        const [, username] = match
        const maFilePath = path.join(process.cwd(), 'fixtures', 'mafile', `${username}.maFile`)
        if (fs.existsSync(maFilePath)) {
            return {
                username,
                maFile: JSON.parse(fs.readFileSync(maFilePath, 'utf-8'))
            }
        }
    }
    return null
}

test.describe('AI Agent Tests', () => {
    test.beforeEach(async () => {
    // Clean database
        await prisma.message.deleteMany()
        await prisma.chat.deleteMany()
        await prisma.task.deleteMany()
        await prisma.bot.deleteMany()
    })

    test('agent should send scripted messages when enabled', async () => {
    // Setup test data
        const testAccount = getTestAccount()
        if (!testAccount) {
            test.skip()
            return
        }

        // Create bot in database
        const bot = await prisma.bot.create({
            data: {
                steamId64: '76561198000000001',
                label: 'Test Bot',
                proxyUrl: 'http://proxy.test',
                status: 'connected',
                mafileJson: JSON.stringify(testAccount.maFile),
                lastSeen: new Date()
            }
        })

        // Create task
        const task = await prisma.task.create({
            data: {
                playerSteamId64: '76561198000000002',
                item: 'AK-47 Redline',
                priceMin: 50.0,
                priceMax: 100.0,
                status: 'accepted',
                assignedBotId: bot.id
            }
        })

        // Create task target
        await prisma.taskTarget.create({
            data: {
                taskId: task.id,
                targetType: 'buy_item',
                targetPayload: JSON.stringify({
                    item: 'AK-47 Redline',
                    priceMin: 50.0,
                    priceMax: 100.0
                }),
                successCriteria: 'Item purchased within price range'
            }
        })

        // Create chat with agent enabled
        const chat = await prisma.chat.create({
            data: {
                botId: bot.id,
                playerSteamId64: task.playerSteamId64,
                agentEnabled: true
            }
        })

        // Mock the steam session
        mockSteamSessionManager.createMockSession(bot.id)

        // Run agent
        await runAgentForChat(chat.id)

        // Verify messages were created
        const messages = await prisma.message.findMany({
            where: { chatId: chat.id },
            orderBy: { ts: 'asc' }
        })

        expect(messages.length).toBeGreaterThanOrEqual(3)
        expect(messages.length).toBeLessThanOrEqual(5)

        // Verify message content
        const firstMessage = messages[0]
        expect(firstMessage.from).toBe('bot')
        expect(firstMessage.text).toContain('I\'m here to help')

        // Check for item mention
        const itemMessages = messages.filter(m => m.text.includes('AK-47 Redline'))
        expect(itemMessages.length).toBeGreaterThan(0)

        // Check for price mention
        const priceMessages = messages.filter(m => 
            m.text.includes('50') || m.text.includes('100')
        )
        expect(priceMessages.length).toBeGreaterThan(0)

        // Verify task was marked as resolved
        const updatedTask = await prisma.task.findUnique({
            where: { id: task.id }
        })
        expect(updatedTask?.status).toBe('resolved')
    })

    test('agent should stop when disabled mid-conversation', async () => {
        const testAccount = getTestAccount()
        if (!testAccount) {
            test.skip()
            return
        }

        // Create bot
        const bot = await prisma.bot.create({
            data: {
                steamId64: '76561198000000003',
                label: 'Test Bot 2',
                proxyUrl: 'http://proxy.test',
                status: 'connected',
                mafileJson: JSON.stringify(testAccount.maFile),
                lastSeen: new Date()
            }
        })

        // Create task
        const task = await prisma.task.create({
            data: {
                playerSteamId64: '76561198000000004',
                item: 'AWP Dragon Lore',
                priceMin: 1000.0,
                priceMax: 2000.0,
                status: 'accepted',
                assignedBotId: bot.id
            }
        })

        // Create chat
        const chat = await prisma.chat.create({
            data: {
                botId: bot.id,
                playerSteamId64: task.playerSteamId64,
                agentEnabled: true
            }
        })

        mockSteamSessionManager.createMockSession(bot.id)

        // Start agent in background
        const agentPromise = runAgentForChat(chat.id)

        // Wait for first message
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Disable agent
        await prisma.chat.update({
            where: { id: chat.id },
            data: { agentEnabled: false }
        })

        // Wait for agent to complete
        await agentPromise

        // Check messages - should be less than full script
        const messages = await prisma.message.findMany({
            where: { chatId: chat.id }
        })

        expect(messages.length).toBeLessThan(5)
        console.log(`Agent sent ${messages.length} messages before being disabled`)
    })

    test('agent should handle multiple concurrent chats', async () => {
        const testAccount = getTestAccount()
        if (!testAccount) {
            test.skip()
            return
        }

        const chatIds: string[] = []
    
        // Create 3 bots with tasks and chats
        for (let i = 0; i < 3; i++) {
            const bot = await prisma.bot.create({
                data: {
                    steamId64: `7656119800000000${i + 5}`,
                    label: `Concurrent Bot ${i}`,
                    proxyUrl: 'http://proxy.test',
                    status: 'connected',
                    mafileJson: JSON.stringify(testAccount.maFile),
                    lastSeen: new Date()
                }
            })

            const task = await prisma.task.create({
                data: {
                    playerSteamId64: `7656119800000001${i}`,
                    item: `Item ${i}`,
                    priceMin: 10.0 * (i + 1),
                    priceMax: 20.0 * (i + 1),
                    status: 'accepted',
                    assignedBotId: bot.id
                }
            })

            const chat = await prisma.chat.create({
                data: {
                    botId: bot.id,
                    playerSteamId64: task.playerSteamId64,
                    agentEnabled: true
                }
            })

            chatIds.push(chat.id)
            mockSteamSessionManager.createMockSession(bot.id)
        }

        // Run all agents concurrently
        await Promise.all(chatIds.map(id => runAgentForChat(id)))

        // Verify all chats received messages
        for (const chatId of chatIds) {
            const messages = await prisma.message.findMany({
                where: { chatId }
            })
      
            expect(messages.length).toBeGreaterThanOrEqual(3)
            expect(messages.length).toBeLessThanOrEqual(5)
        }

        // Verify all tasks were resolved
        const tasks = await prisma.task.findMany({
            where: { status: 'resolved' }
        })
        expect(tasks.length).toBe(3)
    })

    test('agent should personalize messages based on task details', async () => {
        const testAccount = getTestAccount()
        if (!testAccount) {
            test.skip()
            return
        }

        const bot = await prisma.bot.create({
            data: {
                steamId64: '76561198000000020',
                label: 'Personalization Bot',
                proxyUrl: 'http://proxy.test',
                status: 'connected',
                mafileJson: JSON.stringify(testAccount.maFile),
                lastSeen: new Date()
            }
        })

        // Create task with specific item
        const specificItem = 'Karambit Fade'
        const task = await prisma.task.create({
            data: {
                playerSteamId64: '76561198000000021',
                item: specificItem,
                priceMin: 500.0,
                priceMax: 750.0,
                status: 'accepted',
                assignedBotId: bot.id
            }
        })

        const chat = await prisma.chat.create({
            data: {
                botId: bot.id,
                playerSteamId64: task.playerSteamId64,
                agentEnabled: true
            }
        })

        mockSteamSessionManager.createMockSession(bot.id)
        await runAgentForChat(chat.id)

        const messages = await prisma.message.findMany({
            where: { chatId: chat.id }
        })

        // Verify item name appears in messages
        const itemMentions = messages.filter(m => m.text.includes(specificItem))
        expect(itemMentions.length).toBeGreaterThan(0)

        // Verify price range appears
        const priceMentions = messages.filter(m => 
            m.text.includes('500') || m.text.includes('750')
        )
        expect(priceMentions.length).toBeGreaterThan(0)
    })

    test('agent should respect message delay timing', async () => {
        const testAccount = getTestAccount()
        if (!testAccount) {
            test.skip()
            return
        }

        const bot = await prisma.bot.create({
            data: {
                steamId64: '76561198000000030',
                label: 'Timing Bot',
                proxyUrl: 'http://proxy.test',
                status: 'connected',
                mafileJson: JSON.stringify(testAccount.maFile),
                lastSeen: new Date()
            }
        })

        const task = await prisma.task.create({
            data: {
                playerSteamId64: '76561198000000031',
                item: 'Test Item',
                priceMin: 10.0,
                priceMax: 20.0,
                status: 'accepted',
                assignedBotId: bot.id
            }
        })

        const chat = await prisma.chat.create({
            data: {
                botId: bot.id,
                playerSteamId64: task.playerSteamId64,
                agentEnabled: true
            }
        })

        mockSteamSessionManager.createMockSession(bot.id)
    
        const startTime = Date.now()
        await runAgentForChat(chat.id)
        const endTime = Date.now()

        const messages = await prisma.message.findMany({
            where: { chatId: chat.id }
        })

        // With 4 second delays between messages, 3 messages should take ~8 seconds
        // (no delay before first message, 4s delay before 2nd and 3rd)
        const expectedMinTime = (messages.length - 1) * 4000
        const actualTime = endTime - startTime
    
        expect(actualTime).toBeGreaterThanOrEqual(expectedMinTime - 500) // Allow 500ms tolerance
        console.log(`Agent sent ${messages.length} messages in ${actualTime}ms (expected min: ${expectedMinTime}ms)`)
    })

    test('agent should handle missing task gracefully', async () => {
        const testAccount = getTestAccount()
        if (!testAccount) {
            test.skip()
            return
        }

        const bot = await prisma.bot.create({
            data: {
                steamId64: '76561198000000040',
                label: 'No Task Bot',
                proxyUrl: 'http://proxy.test',
                status: 'connected',
                mafileJson: JSON.stringify(testAccount.maFile),
                lastSeen: new Date()
            }
        })

        // Create chat without associated task
        const chat = await prisma.chat.create({
            data: {
                botId: bot.id,
                playerSteamId64: '76561198000000041',
                agentEnabled: true
            }
        })

        mockSteamSessionManager.createMockSession(bot.id)
    
        // Should complete without error
        await runAgentForChat(chat.id)

        // No messages should be sent
        const messages = await prisma.message.findMany({
            where: { chatId: chat.id }
        })
        expect(messages.length).toBe(0)
    })

    test('agent should handle session disconnection gracefully', async () => {
        const testAccount = getTestAccount()
        if (!testAccount) {
            test.skip()
            return
        }

        const bot = await prisma.bot.create({
            data: {
                steamId64: '76561198000000050',
                label: 'Disconnect Bot',
                proxyUrl: 'http://proxy.test',
                status: 'connected',
                mafileJson: JSON.stringify(testAccount.maFile),
                lastSeen: new Date()
            }
        })

        const task = await prisma.task.create({
            data: {
                playerSteamId64: '76561198000000051',
                item: 'Test Item',
                priceMin: 10.0,
                priceMax: 20.0,
                status: 'accepted',
                assignedBotId: bot.id
            }
        })

        const chat = await prisma.chat.create({
            data: {
                botId: bot.id,
                playerSteamId64: task.playerSteamId64,
                agentEnabled: true
            }
        })

        // Don't create mock session - simulate disconnected bot
    
        // Should complete without error
        await runAgentForChat(chat.id)

        // No messages should be sent
        const messages = await prisma.message.findMany({
            where: { chatId: chat.id }
        })
        expect(messages.length).toBe(0)

        // Task should remain in accepted state (not resolved)
        const updatedTask = await prisma.task.findUnique({
            where: { id: task.id }
        })
        expect(updatedTask?.status).toBe('accepted')
    })
})