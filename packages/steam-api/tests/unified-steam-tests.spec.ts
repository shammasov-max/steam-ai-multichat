import { test, expect } from '@playwright/test'
import { createSteamAgent } from '../src/index.js'
import { TestAccount } from '../../../tests/fixtures.js'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Load test accounts from fixtures
async function loadTestAccounts(): Promise<TestAccount[]> {
  const fixturesPath = join(process.cwd(), '..', '..', 'fixtures', 'all.txt')
  const content = await readFile(fixturesPath, 'utf-8')
  
  const accounts: TestAccount[] = []
  
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    
    const parts = trimmed.split(' - ')
    if (parts.length !== 2) continue
    
    const [loginPassword, proxyInfo] = parts
    const [login, password] = loginPassword.split(':')
    
    if (!login || !password || !proxyInfo) continue
    
    const maFilePath = join(process.cwd(), '..', '..', 'fixtures', 'mafile', `${login}.maFile`)
    const maFileContent = await readFile(maFilePath, 'utf-8')
    
    accounts.push({
      login,
      password,
      proxy: `http://${proxyInfo}`,
      maFile: maFileContent
    })
  }
  
  return accounts
}

// Helper to wait for event with timeout
function waitForEvent<T>(emitter: any, eventName: string, timeout = 30000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventName}`))
    }, timeout)

    emitter.once(eventName, (...args: any[]) => {
      clearTimeout(timer)
      resolve(args.length === 1 ? args[0] : args as T)
    })
  })
}

// Configure test timeout - 30 seconds per CLAUDE.md
test.setTimeout(30000)

test.describe('Steam API Integration Tests', () => {
  let agent: any
  let account: TestAccount
  
  test.beforeAll(async () => {
    // Load test accounts and use the first one
    const accounts = await loadTestAccounts()
    if (accounts.length < 1) {
      throw new Error('Need at least 1 test account')
    }
    account = accounts[0]
    console.log(`Using test account: ${account.login}`)
  })
  
  test.afterAll(async () => {
    if (agent) {
      try {
        agent.logout()
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (e) {
        console.warn('Cleanup warning:', e)
      }
    }
  })
  
  test('login and basic operations', async () => {
    // Create and login agent
    agent = createSteamAgent({
      maFile: account.maFile,
      password: account.password,
      userName: account.login,
      proxy: account.proxy
    })
    
    const loginPromise = waitForEvent(agent, 'loggedOn')
    await agent.login()
    await loginPromise
    
    // Verify login
    expect(agent.getIsLoggedIn()).toBe(true)
    const steamID = agent.getSteamID()
    expect(steamID).toBeTruthy()
    console.log(`✅ Logged in with SteamID: ${steamID}`)
    
    // Check friends list
    const friends = agent.getFriends()
    console.log(`✅ Retrieved ${friends.length} friends`)
    
    // Get chat histories
    const chatHistories = agent.getAllChatHistories()
    console.log(`✅ Retrieved ${chatHistories.length} chat histories`)
  })
  
  test('send message to self (echo test)', async () => {
    if (!agent || !agent.getIsLoggedIn()) {
      test.skip()
      return
    }
    
    const steamID = agent.getSteamID()
    const testMessage = `Self test - ${new Date().toISOString()}`
    
    // Send message to self
    await agent.sendMessage(steamID, testMessage)
    console.log(`✅ Sent message to self: "${testMessage}"`)
    
    // Wait a moment for message to register
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check chat history
    const chatHistory = agent.getChatHistory(steamID)
    expect(chatHistory.messages.length).toBeGreaterThan(0)
    
    const lastMessage = chatHistory.messages[chatHistory.messages.length - 1]
    expect(lastMessage.message).toBe(testMessage)
    console.log('✅ Message verified in chat history')
  })
})