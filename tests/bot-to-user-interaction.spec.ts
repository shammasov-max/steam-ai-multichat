import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { createSteamAgent } from '../src/steam-agent/SteamAgent'

// Parse test accounts from fixtures
interface TestAccount {
  username: string;
  password: string;
  proxyHost: string;
  proxyPort: string;
  proxyUser: string;
  proxyPass: string;
  maFile: any;
  proxyUrl: string;
}

function getTestAccounts(): TestAccount[] {
    const fixturesPath = path.join(process.cwd(), 'fixtures', 'all.txt')
    const content = fs.readFileSync(fixturesPath, 'utf-8')
    const accounts: TestAccount[] = []

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

test.describe('Bot-to-User Real Interaction Tests', () => {
    const testAccounts = getTestAccounts()
    const apiUrl = process.env.API_URL || 'http://localhost:3000'

    test('full bot-user conversation with AI agent responses', async ({ request }) => {
    // Use first account as the BOT (server-side)
    // Use second account as the USER (simulating real player)
        const botAccount = testAccounts[0]
        const userAccount = testAccounts[1]
    
        if (!botAccount || !userAccount) {
            test.skip()
            return
        }

        console.log(`Bot account: ${botAccount.username}`)
        console.log(`User account: ${userAccount.username}`)

        // Step 1: Set up the bot in the application
        const botResponse = await request.post(`${apiUrl}/api/bots`, {
            data: {
                maFileJSON: JSON.stringify(botAccount.maFile),
                proxyUrl: botAccount.proxyUrl,
                label: `AI Bot - ${botAccount.username}`
            }
        })
    
        const bot = await botResponse.json()
        expect(bot.id).toBeTruthy()

        // Connect the bot
        await request.post(`${apiUrl}/api/bots/${bot.id}/connect`)
    
        // Wait for bot to connect
        await new Promise(resolve => setTimeout(resolve, 10000))

        // Step 2: Create Steam agent for the USER (simulating real player)
        const userAgent = createSteamAgent({
            maFile: userAccount.maFile,
            password: userAccount.password,
            userName: userAccount.username,
            proxy: userAccount.proxyUrl
        })

        let userSteamID: string
        let botSteamID: string

        try {
            // Login user
            console.log('User logging in...')
            await userAgent.login()
            await new Promise(resolve => setTimeout(resolve, 5000))
      
            userSteamID = userAgent.getSteamID()!
            expect(userSteamID).toBeTruthy()
            console.log(`User logged in with SteamID: ${userSteamID}`)

            // Get bot's Steam ID from the application
            const botsResponse = await request.get(`${apiUrl}/api/bots`)
            const bots = await botsResponse.json()
            const connectedBot = bots.find((b: any) => b.id === bot.id)
            botSteamID = connectedBot.steamId64
      
            console.log(`Bot SteamID: ${botSteamID}`)

            // Step 3: Create a task for the user
            const taskResponse = await request.post(`${apiUrl}/api/tasks`, {
                data: {
                    playerSteamId64: userSteamID,
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

            const task = await taskResponse.json()
            expect(task.id).toBeTruthy()
            console.log(`Task created: ${task.id}`)

            // Step 4: Wait for bot to send friend request to user
            console.log('Waiting for bot to send friend request...')
      
            let friendRequestReceived = false
            userAgent.on('friendRelationship', (steamID: string, relationship: number) => {
                console.log(`User received relationship change from ${steamID}: ${relationship}`)
                if (steamID === botSteamID && relationship === 2) { // 2 = incoming request
                    friendRequestReceived = true
                }
            })

            // Wait up to 2 minutes for friend request (respecting rate limit)
            for (let i = 0; i < 120; i++) {
                await new Promise(resolve => setTimeout(resolve, 1000))
                if (friendRequestReceived) break
            }

            expect(friendRequestReceived).toBeTruthy()
            console.log('Friend request received by user')

            // Step 5: User accepts friend request
            console.log('User accepting friend request...')
            await userAgent.addFriend(botSteamID)
            await new Promise(resolve => setTimeout(resolve, 3000))

            // Step 6: User sends initial message to trigger agent
            const userMessages = [
                'Hi, I\'m interested in buying an item',
                'Can you help me with the AK-47?',
                'What\'s the best price you can offer?'
            ]

            for (const msg of userMessages) {
                console.log(`User sending: "${msg}"`)
                await userAgent.sendMessage(botSteamID, msg)
                await new Promise(resolve => setTimeout(resolve, 2000))
            }

            // Step 7: Listen for AI agent responses
            const receivedMessages: string[] = []
            userAgent.on('friendMessage', (steamID: string, message: string) => {
                if (steamID === botSteamID) {
                    console.log(`Bot agent responded: "${message}"`)
                    receivedMessages.push(message)
                }
            })

            // Wait for agent to respond (agent sends 3-5 messages with 4s delays)
            console.log('Waiting for AI agent responses...')
            await new Promise(resolve => setTimeout(resolve, 25000)) // Wait up to 25 seconds

            // Verify agent sent messages
            expect(receivedMessages.length).toBeGreaterThanOrEqual(3)
            expect(receivedMessages.length).toBeLessThanOrEqual(5)

            // Check message content
            const hasGreeting = receivedMessages.some(msg => 
                msg.toLowerCase().includes('help') || msg.toLowerCase().includes('hi')
            )
            const mentionsItem = receivedMessages.some(msg => 
                msg.includes('AK-47') || msg.includes('Redline')
            )
            const mentionsPrice = receivedMessages.some(msg => 
                msg.includes('50') || msg.includes('100') || msg.includes('price')
            )

            expect(hasGreeting).toBeTruthy()
            expect(mentionsItem).toBeTruthy()
            expect(mentionsPrice).toBeTruthy()

            console.log(`AI agent sent ${receivedMessages.length} messages`)
            console.log('Messages:', receivedMessages)

            // Step 8: Verify task status updated
            const tasksResponse = await request.get(`${apiUrl}/api/tasks`)
            const tasks = await tasksResponse.json()
            const updatedTask = tasks.find((t: any) => t.id === task.id)
      
            expect(['accepted', 'resolved']).toContain(updatedTask.status)
            console.log(`Task status: ${updatedTask.status}`)

            // Step 9: User sends more messages to continue conversation
            console.log('User continuing conversation...')
            await userAgent.sendMessage(botSteamID, 'Thanks for the information!')
            await userAgent.sendMessage(botSteamID, 'I\'ll take it at 75')
      
            await new Promise(resolve => setTimeout(resolve, 5000))

            // Check if more responses come
            console.log(`Total messages received from bot: ${receivedMessages.length}`)

        } finally {
            // Cleanup
            console.log('Cleaning up...')
            try {
                userAgent.logout()
            } catch (e) {
                console.warn('User logout error:', e)
            }
        }
    })

    test('multiple users interacting with same bot', async ({ request }) => {
    // Use one account as bot, multiple as users
        const botAccount = testAccounts[0]
        const userAccounts = testAccounts.slice(1, 4) // Use 3 user accounts
    
        if (!botAccount || userAccounts.length < 3) {
            test.skip()
            return
        }

        // Set up bot
        const botResponse = await request.post(`${apiUrl}/api/bots`, {
            data: {
                maFileJSON: JSON.stringify(botAccount.maFile),
                proxyUrl: botAccount.proxyUrl,
                label: `Multi-User Bot - ${botAccount.username}`
            }
        })
    
        const bot = await botResponse.json()
        await request.post(`${apiUrl}/api/bots/${bot.id}/connect`)
        await new Promise(resolve => setTimeout(resolve, 10000))

        // Get bot Steam ID
        const botsResponse = await request.get(`${apiUrl}/api/bots`)
        const bots = await botsResponse.json()
        const connectedBot = bots.find((b: any) => b.id === bot.id)
        const botSteamID = connectedBot.steamId64

        // Create user agents
        const userAgents = await Promise.all(userAccounts.map(async (account, index) => {
            const agent = createSteamAgent({
                maFile: account.maFile,
                password: account.password,
                userName: account.username,
                proxy: account.proxyUrl
            })
      
            await agent.login()
            await new Promise(resolve => setTimeout(resolve, 3000))
      
            const steamID = agent.getSteamID()!
            console.log(`User ${index + 1} (${account.username}) logged in: ${steamID}`)
      
            return { agent, steamID, account, index }
        }))

        try {
            // Create tasks for all users
            const tasks = await Promise.all(userAgents.map(async (user, idx) => {
                const response = await request.post(`${apiUrl}/api/tasks`, {
                    data: {
                        playerSteamId64: user.steamID,
                        item: `Item ${idx + 1}`,
                        priceMin: 10.0 * (idx + 1),
                        priceMax: 20.0 * (idx + 1)
                    }
                })
                return response.json()
            }))

            console.log(`Created ${tasks.length} tasks for different users`)

            // Set up message listeners for all users
            const messagesByUser = new Map<string, string[]>()
            userAgents.forEach(user => {
                messagesByUser.set(user.steamID, [])
        
                user.agent.on('friendMessage', (steamID: string, message: string) => {
                    if (steamID === botSteamID) {
                        const messages = messagesByUser.get(user.steamID)!
                        messages.push(message)
                        console.log(`User ${user.index + 1} received: "${message}"`)
                    }
                })

                user.agent.on('friendRelationship', (steamID: string, relationship: number) => {
                    if (steamID === botSteamID && relationship === 2) {
                        console.log(`User ${user.index + 1} received friend request`)
                        // Auto-accept
                        user.agent.addFriend(botSteamID).catch(console.error)
                    }
                })
            })

            // Wait for friend requests (rate limited to 1/min)
            console.log('Waiting for friend requests (rate limited)...')
            await new Promise(resolve => setTimeout(resolve, 180000)) // 3 minutes for 3 users

            // Each user sends messages
            for (const user of userAgents) {
                await user.agent.sendMessage(botSteamID, `Hi from user ${user.index + 1}`)
                await user.agent.sendMessage(botSteamID, `I need help with ${tasks[user.index].item}`)
                await new Promise(resolve => setTimeout(resolve, 1000))
            }

            // Wait for agent responses
            console.log('Waiting for AI agent to respond to all users...')
            await new Promise(resolve => setTimeout(resolve, 30000))

            // Verify each user got responses
            for (const user of userAgents) {
                const messages = messagesByUser.get(user.steamID)!
                console.log(`User ${user.index + 1} received ${messages.length} messages`)
        
                // Each user should get agent responses if chat was established
                if (messages.length > 0) {
                    expect(messages.length).toBeGreaterThanOrEqual(3)
          
                    // Check personalization - should mention user's specific item
                    const mentionsItem = messages.some(msg => 
                        msg.includes(tasks[user.index].item)
                    )
                    expect(mentionsItem).toBeTruthy()
                }
            }

        } finally {
            // Cleanup all user agents
            for (const user of userAgents) {
                try {
                    user.agent.logout()
                } catch (e) {
                    console.warn(`User ${user.index + 1} logout error:`, e)
                }
            }
        }
    })

    test('user disables agent mid-conversation', async ({ request }) => {
        const botAccount = testAccounts[4]
        const userAccount = testAccounts[5]
    
        if (!botAccount || !userAccount) {
            test.skip()
            return
        }

        // Set up bot
        const botResponse = await request.post(`${apiUrl}/api/bots`, {
            data: {
                maFileJSON: JSON.stringify(botAccount.maFile),
                proxyUrl: botAccount.proxyUrl,
                label: `Toggle Test Bot - ${botAccount.username}`
            }
        })
    
        const bot = await botResponse.json()
        await request.post(`${apiUrl}/api/bots/${bot.id}/connect`)
        await new Promise(resolve => setTimeout(resolve, 10000))

        // Get bot Steam ID
        const botsResponse = await request.get(`${apiUrl}/api/bots`)
        const bots = await botsResponse.json()
        const connectedBot = bots.find((b: any) => b.id === bot.id)
        const botSteamID = connectedBot.steamId64

        // Create user agent
        const userAgent = createSteamAgent({
            maFile: userAccount.maFile,
            password: userAccount.password,
            userName: userAccount.username,
            proxy: userAccount.proxyUrl
        })

        try {
            await userAgent.login()
            const userSteamID = userAgent.getSteamID()!
            console.log(`User logged in: ${userSteamID}`)

            // Create task
            await request.post(`${apiUrl}/api/tasks`, {
                data: {
                    playerSteamId64: userSteamID,
                    item: 'Test Item',
                    priceMin: 50.0,
                    priceMax: 100.0
                }
            })
            // Set up message tracking
            const receivedMessages: { text: string; timestamp: number }[] = []
            userAgent.on('friendMessage', (steamID: string, message: string) => {
                if (steamID === botSteamID) {
                    receivedMessages.push({ 
                        text: message, 
                        timestamp: Date.now() 
                    })
                    console.log(`Received: "${message}"`)
                }
            })

            // Accept friend request when received
            userAgent.on('friendRelationship', (steamID: string, relationship: number) => {
                if (steamID === botSteamID && relationship === 2) {
                    userAgent.addFriend(botSteamID)
                }
            })

            // Wait for friend request and acceptance
            await new Promise(resolve => setTimeout(resolve, 65000))

            // Send initial message to trigger agent
            await userAgent.sendMessage(botSteamID, 'Hello, I need help')
      
            // Wait for first agent messages
            await new Promise(resolve => setTimeout(resolve, 10000))
      
            const messagesBeforeDisable = receivedMessages.length
            console.log(`Messages before disable: ${messagesBeforeDisable}`)

            // Find and disable agent for this chat
            const chatsResponse = await request.get(`${apiUrl}/api/chats`)
            const chats = await chatsResponse.json()
            const chat = chats.find((c: any) => 
                c.botId === bot.id && c.playerSteamId64 === userSteamID
            )

            if (chat) {
                // Disable agent
                await request.patch(`${apiUrl}/api/chats/${chat.id}`, {
                    data: { agentEnabled: false }
                })
                console.log('Agent disabled')

                // Send more messages
                await userAgent.sendMessage(botSteamID, 'Are you still there?')
                await userAgent.sendMessage(botSteamID, 'I have more questions')
        
                // Wait to see if agent responds (it shouldn't)
                await new Promise(resolve => setTimeout(resolve, 10000))
        
                const messagesAfterDisable = receivedMessages.length
                console.log(`Messages after disable: ${messagesAfterDisable}`)
        
                // Should not receive more automated messages
                expect(messagesAfterDisable).toBe(messagesBeforeDisable)

                // Re-enable agent
                await request.patch(`${apiUrl}/api/chats/${chat.id}`, {
                    data: { agentEnabled: true }
                })
                console.log('Agent re-enabled')

                // Send message to trigger agent again
                await userAgent.sendMessage(botSteamID, 'Please help me again')
        
                // Should receive new agent messages
                await new Promise(resolve => setTimeout(resolve, 15000))
        
                const finalMessageCount = receivedMessages.length
                console.log(`Final message count: ${finalMessageCount}`)
        
                expect(finalMessageCount).toBeGreaterThan(messagesAfterDisable)
            }

        } finally {
            userAgent.logout()
        }
    })

    test('bot handles user spam gracefully', async ({ request }) => {
        const botAccount = testAccounts[6]
        const userAccount = testAccounts[7]
    
        if (!botAccount || !userAccount) {
            test.skip()
            return
        }

        // Set up bot
        const botResponse = await request.post(`${apiUrl}/api/bots`, {
            data: {
                maFileJSON: JSON.stringify(botAccount.maFile),
                proxyUrl: botAccount.proxyUrl,
                label: `Spam Test Bot - ${botAccount.username}`
            }
        })
    
        const bot = await botResponse.json()
        await request.post(`${apiUrl}/api/bots/${bot.id}/connect`)
        await new Promise(resolve => setTimeout(resolve, 10000))

        // Get bot Steam ID
        const botsResponse = await request.get(`${apiUrl}/api/bots`)
        const bots = await botsResponse.json()
        const connectedBot = bots.find((b: any) => b.id === bot.id)
        const botSteamID = connectedBot.steamId64

        // Create user agent
        const userAgent = createSteamAgent({
            maFile: userAccount.maFile,
            password: userAccount.password,
            userName: userAccount.username,
            proxy: userAccount.proxyUrl
        })

        try {
            await userAgent.login()
            const userSteamID = userAgent.getSteamID()!

            // Create task
            await request.post(`${apiUrl}/api/tasks`, {
                data: {
                    playerSteamId64: userSteamID,
                    item: 'Spam Test Item',
                    priceMin: 10.0,
                    priceMax: 20.0
                }
            })

            // Accept friend request
            userAgent.on('friendRelationship', (steamID: string, relationship: number) => {
                if (steamID === botSteamID && relationship === 2) {
                    userAgent.addFriend(botSteamID)
                }
            })

            // Wait for friendship
            await new Promise(resolve => setTimeout(resolve, 65000))

            // Track responses
            let responseCount = 0
            userAgent.on('friendMessage', (steamID: string) => {
                if (steamID === botSteamID) {
                    responseCount++
                }
            })

            // Send spam messages
            console.log('Sending spam messages...')
            for (let i = 0; i < 20; i++) {
                await userAgent.sendMessage(botSteamID, `Spam message ${i + 1}`)
                await new Promise(resolve => setTimeout(resolve, 100)) // Rapid fire
            }

            // Wait for responses
            await new Promise(resolve => setTimeout(resolve, 30000))

            console.log(`Bot sent ${responseCount} responses to 20 spam messages`)
      
            // Agent should still respond with its script (3-5 messages)
            // but not be overwhelmed by spam
            expect(responseCount).toBeGreaterThanOrEqual(3)
            expect(responseCount).toBeLessThanOrEqual(10) // Reasonable upper limit

            // Verify chat history is recorded
            const chatsResponse = await request.get(`${apiUrl}/api/chats`)
            const chats = await chatsResponse.json()
            const chat = chats.find((c: any) => 
                c.botId === bot.id && c.playerSteamId64 === userSteamID
            )

            if (chat) {
                const messagesResponse = await request.get(`${apiUrl}/api/chats/${chat.id}/messages`)
                const messages = await messagesResponse.json()
        
                // All user messages should be recorded
                const userMessages = messages.filter((m: any) => m.from === 'player')
                expect(userMessages.length).toBeGreaterThanOrEqual(20)
        
                console.log(`Recorded ${userMessages.length} user messages in database`)
            }

        } finally {
            userAgent.logout()
        }
    })
})