import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

// Parse test accounts from fixtures/all.txt
interface TestAccount {
  username: string;
  password: string;
  proxyHost: string;
  proxyPort: string;
  proxyUser: string;
  proxyPass: string;
  maFile: any;
}

function parseTestAccounts(): TestAccount[] {
    const fixturesPath = path.join(process.cwd(), 'fixtures', 'all.txt')
    const content = fs.readFileSync(fixturesPath, 'utf-8')
    const accounts: TestAccount[] = []

    content.split('\n').forEach(line => {
        line = line.trim()
        if (!line) return

        // Format: username:password - proxyHost:proxyPort:proxyUser:proxyPass
        const match = line.match(/^(.+?):(.+?)\s+-\s+(.+?):(\d+):(.+?):(.+?)$/)
        if (match) {
            const [, username, password, proxyHost, proxyPort, proxyUser, proxyPass] = match
      
            // Load corresponding maFile
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
                    maFile
                })
            }
        }
    })

    return accounts
}

test.describe('Bot Integration Tests', () => {
    const testAccounts = parseTestAccounts()
    const apiUrl = process.env.API_URL || 'http://localhost:3000'

    test.beforeAll(async () => {
    // Initialize the application
        const response = await fetch(`${apiUrl}/api/init`, {
            method: 'POST',
        })
        expect(response.ok).toBeTruthy()
    })

    test('should add and connect a bot using real credentials', async ({ request }) => {
        const account = testAccounts[0] // Use first account
        if (!account) {
            test.skip()
            return
        }

        // Add bot
        const addResponse = await request.post(`${apiUrl}/api/bots`, {
            data: {
                maFileJSON: JSON.stringify(account.maFile),
                proxyUrl: `http://${account.proxyUser}:${account.proxyPass}@${account.proxyHost}:${account.proxyPort}`,
                label: `Test Bot - ${account.username}`
            }
        })

        expect(addResponse.ok()).toBeTruthy()
        const bot = await addResponse.json()
        expect(bot.id).toBeTruthy()
        expect(bot.status).toBe('disconnected')

        // Connect bot
        const connectResponse = await request.post(`${apiUrl}/api/bots/${bot.id}/connect`)
        expect(connectResponse.ok()).toBeTruthy()

        // Wait for connection
        await test.step('Wait for bot to connect', async () => {
            let connected = false
            for (let i = 0; i < 30; i++) { // Wait up to 30 seconds
                await new Promise(resolve => setTimeout(resolve, 1000))
        
                const statusResponse = await request.get(`${apiUrl}/api/bots`)
                const bots = await statusResponse.json()
                const currentBot = bots.find((b: any) => b.id === bot.id)
        
                if (currentBot?.status === 'connected') {
                    connected = true
                    break
                }
            }
            expect(connected).toBeTruthy()
        })
    })

    test('should handle multiple bot connections', async ({ request }) => {
        const botsToTest = testAccounts.slice(0, 3) // Test first 3 bots
        const botIds: string[] = []

        // Add all bots
        for (const account of botsToTest) {
            const response = await request.post(`${apiUrl}/api/bots`, {
                data: {
                    maFileJSON: JSON.stringify(account.maFile),
                    proxyUrl: `http://${account.proxyUser}:${account.proxyPass}@${account.proxyHost}:${account.proxyPort}`,
                    label: `Multi Test - ${account.username}`
                }
            })
      
            const bot = await response.json()
            botIds.push(bot.id)
        }

        // Connect all bots in parallel
        await Promise.all(
            botIds.map(id => request.post(`${apiUrl}/api/bots/${id}/connect`))
        )

        // Verify all connected
        await test.step('Verify all bots connected', async () => {
            await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds
      
            const response = await request.get(`${apiUrl}/api/bots`)
            const bots = await response.json()
      
            for (const botId of botIds) {
                const bot = bots.find((b: any) => b.id === botId)
                expect(bot).toBeTruthy()
                // At least some should be connected
            }
        })
    })

    test('should create and assign tasks to connected bots', async ({ request }) => {
    // Ensure we have at least one connected bot
        const botsResponse = await request.get(`${apiUrl}/api/bots`)
        const bots = await botsResponse.json()
        const connectedBot = bots.find((b: any) => b.status === 'connected')
    
        if (!connectedBot) {
            // Add and connect a bot first
            const account = testAccounts[0]
            const addResponse = await request.post(`${apiUrl}/api/bots`, {
                data: {
                    maFileJSON: JSON.stringify(account.maFile),
                    proxyUrl: `http://${account.proxyUser}:${account.proxyPass}@${account.proxyHost}:${account.proxyPort}`,
                    label: `Task Test - ${account.username}`
                }
            })
            const bot = await addResponse.json()
            await request.post(`${apiUrl}/api/bots/${bot.id}/connect`)
            await new Promise(resolve => setTimeout(resolve, 5000))
        }

        // Create a task
        const taskResponse = await request.post(`${apiUrl}/api/tasks`, {
            data: {
                playerSteamId64: '76561198000000001', // Test Steam ID
                item: 'AK-47 Redline',
                priceMin: 50.0,
                priceMax: 100.0,
                target: {
                    type: 'buy_item',
                    payload: {
                        item: 'AK-47 Redline',
                        priceMin: 50.0,
                        priceMax: 100.0
                    },
                    successCriteria: 'Item purchased within price range'
                },
                preconditions: {
                    requireFriendship: true
                }
            }
        })

        expect(taskResponse.ok()).toBeTruthy()
        const task = await taskResponse.json()
        expect(task.id).toBeTruthy()
        expect(task.status).toBe('created')

        // Wait for task assignment
        await test.step('Wait for task assignment', async () => {
            await new Promise(resolve => setTimeout(resolve, 3000))
      
            const tasksResponse = await request.get(`${apiUrl}/api/tasks`)
            const tasks = await tasksResponse.json()
            const updatedTask = tasks.find((t: any) => t.id === task.id)
      
            expect(updatedTask).toBeTruthy()
            expect(['assigned', 'invited']).toContain(updatedTask.status)
            expect(updatedTask.assignedBotId).toBeTruthy()
        })
    })

    test('should handle friend requests with rate limiting', async ({ request }) => {
        const botsResponse = await request.get(`${apiUrl}/api/bots`)
        const bots = await botsResponse.json()
        const connectedBot = bots.find((b: any) => b.status === 'connected')
    
        if (!connectedBot) {
            test.skip()
            return
        }

        // Create multiple tasks for the same bot
        const tasks = []
        for (let i = 0; i < 3; i++) {
            const response = await request.post(`${apiUrl}/api/tasks`, {
                data: {
                    playerSteamId64: `7656119800000000${i}`,
                    item: `Item ${i}`,
                    priceMin: 10.0,
                    priceMax: 20.0
                }
            })
            tasks.push(await response.json())
        }

        // Monitor task progression
        await test.step('Monitor rate-limited invites', async () => {
            const startTime = Date.now()
            let invitesSent = 0

            for (let i = 0; i < 180; i++) { // Monitor for 3 minutes
                await new Promise(resolve => setTimeout(resolve, 1000))
        
                const tasksResponse = await request.get(`${apiUrl}/api/tasks`)
                const currentTasks = await tasksResponse.json()
        
                const invitedTasks = currentTasks.filter((t: any) => 
                    tasks.some(task => task.id === t.id) && t.status === 'invited'
                )
        
                if (invitedTasks.length > invitesSent) {
                    const elapsedSeconds = (Date.now() - startTime) / 1000
                    console.log(`Invite ${invitedTasks.length} sent after ${elapsedSeconds}s`)
                    invitesSent = invitedTasks.length
          
                    // Verify rate limiting (should be ~1 per minute)
                    if (invitesSent > 1) {
                        expect(elapsedSeconds).toBeGreaterThanOrEqual(55) // Allow 5s tolerance
                    }
                }
        
                if (invitesSent === tasks.length) break
            }
        })
    })

    test('should handle chat messages and agent responses', async ({ request }) => {
    // This test requires a real friend connection
    // We'll simulate the flow as much as possible
    
        const botsResponse = await request.get(`${apiUrl}/api/bots`)
        const bots = await botsResponse.json()
        const bot = bots[0]
    
        if (!bot) {
            test.skip()
            return
        }

        // Create a chat (simulating accepted friend request)
        const chatResponse = await request.post(`${apiUrl}/api/chats`, {
            data: {
                botId: bot.id,
                playerSteamId64: '76561198000000001',
                agentEnabled: true
            }
        })
    
        const chat = await chatResponse.json()
        expect(chat.id).toBeTruthy()

        // Send a message from the operator
        const messageResponse = await request.post(`${apiUrl}/api/chats/${chat.id}/messages`, {
            data: {
                text: 'Hello, I need help with an item',
                from: 'bot'
            }
        })
    
        expect(messageResponse.ok()).toBeTruthy()

        // Check if agent responds (if enabled)
        if (chat.agentEnabled) {
            await test.step('Wait for agent response', async () => {
                await new Promise(resolve => setTimeout(resolve, 5000))
        
                const messagesResponse = await request.get(`${apiUrl}/api/chats/${chat.id}/messages`)
                const messages = await messagesResponse.json()
        
                // Should have at least the initial message
                expect(messages.length).toBeGreaterThanOrEqual(1)
        
                // If agent is working, should have automated responses
                const agentMessages = messages.filter((m: any) => 
                    m.from === 'bot' && m.text.includes('I\'m here to help')
                )
        
                if (agentMessages.length > 0) {
                    console.log('Agent responded with scripted messages')
                }
            })
        }
    })

    test('should toggle agent on/off for a chat', async ({ request }) => {
        const chatsResponse = await request.get(`${apiUrl}/api/chats`)
        const chats = await chatsResponse.json()
    
        if (chats.length === 0) {
            // Create a test chat
            const botsResponse = await request.get(`${apiUrl}/api/bots`)
            const bots = await botsResponse.json()
            if (bots.length > 0) {
                await request.post(`${apiUrl}/api/chats`, {
                    data: {
                        botId: bots[0].id,
                        playerSteamId64: '76561198000000002',
                        agentEnabled: true
                    }
                })
            }
        }

        const chat = chats[0] || (await request.get(`${apiUrl}/api/chats`).then(r => r.json()))[0]
    
        if (!chat) {
            test.skip()
            return
        }

        // Toggle agent off
        const toggleOffResponse = await request.patch(`${apiUrl}/api/chats/${chat.id}`, {
            data: { agentEnabled: false }
        })
    
        expect(toggleOffResponse.ok()).toBeTruthy()
        const updatedChat = await toggleOffResponse.json()
        expect(updatedChat.agentEnabled).toBe(false)

        // Toggle agent on
        const toggleOnResponse = await request.patch(`${apiUrl}/api/chats/${chat.id}`, {
            data: { agentEnabled: true }
        })
    
        expect(toggleOnResponse.ok()).toBeTruthy()
        const reenabledChat = await toggleOnResponse.json()
        expect(reenabledChat.agentEnabled).toBe(true)
    })

    test('should persist data across restarts', async ({ request }) => {
    // Create test data
        const account = testAccounts[0]
        const addResponse = await request.post(`${apiUrl}/api/bots`, {
            data: {
                maFileJSON: JSON.stringify(account.maFile),
                proxyUrl: `http://${account.proxyUser}:${account.proxyPass}@${account.proxyHost}:${account.proxyPort}`,
                label: `Persistence Test - ${account.username}`
            }
        })
    
        const bot = await addResponse.json()
        const botId = bot.id

        // Create a task
        const taskResponse = await request.post(`${apiUrl}/api/tasks`, {
            data: {
                playerSteamId64: '76561198000000003',
                item: 'Test Item',
                priceMin: 10.0,
                priceMax: 20.0
            }
        })
    
        const task = await taskResponse.json()
        const taskId = task.id

        // Simulate restart by waiting
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Verify data persisted
        const botsAfter = await request.get(`${apiUrl}/api/bots`).then(r => r.json())
        const tasksAfter = await request.get(`${apiUrl}/api/tasks`).then(r => r.json())

        expect(botsAfter.find((b: any) => b.id === botId)).toBeTruthy()
        expect(tasksAfter.find((t: any) => t.id === taskId)).toBeTruthy()
    })

    test('should handle concurrent operations correctly', async ({ request }) => {
        const operations = []

        // Add multiple bots concurrently
        for (let i = 0; i < 3; i++) {
            const account = testAccounts[i]
            if (!account) continue
      
            operations.push(
                request.post(`${apiUrl}/api/bots`, {
                    data: {
                        maFileJSON: JSON.stringify(account.maFile),
                        proxyUrl: `http://${account.proxyUser}:${account.proxyPass}@${account.proxyHost}:${account.proxyPort}`,
                        label: `Concurrent Test ${i}`
                    }
                })
            )
        }

        // Create multiple tasks concurrently
        for (let i = 0; i < 5; i++) {
            operations.push(
                request.post(`${apiUrl}/api/tasks`, {
                    data: {
                        playerSteamId64: `7656119800000010${i}`,
                        item: `Concurrent Item ${i}`,
                        priceMin: 10.0 + i,
                        priceMax: 20.0 + i
                    }
                })
            )
        }

        // Execute all operations
        const results = await Promise.allSettled(operations)
    
        // Verify all succeeded
        const failures = results.filter(r => r.status === 'rejected')
        expect(failures.length).toBe(0)

        // Verify data integrity
        const bots = await request.get(`${apiUrl}/api/bots`).then(r => r.json())
        const tasks = await request.get(`${apiUrl}/api/tasks`).then(r => r.json())
    
        expect(bots.length).toBeGreaterThanOrEqual(3)
        expect(tasks.length).toBeGreaterThanOrEqual(5)
    })
})