import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

// Parse test accounts
interface TestAccount {
  username: string;
  password: string;
  proxyUrl: string;
  maFile: any;
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
                accounts.push({
                    username,
                    password,
                    proxyUrl: `http://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}`,
                    maFile: JSON.parse(fs.readFileSync(maFilePath, 'utf-8'))
                })
            }
        }
    })

    return accounts
}

test.describe('End-to-End User Flows', () => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
    const testAccounts = getTestAccounts()

    test.beforeEach(async ({ page }) => {
        await page.goto(baseUrl)
    })

    test('complete workflow: add bot → create task → handle chat', async ({ page }) => {
        const account = testAccounts[0]
        if (!account) {
            test.skip()
            return
        }

        // Step 1: Navigate to bots page
        await page.goto(`${baseUrl}/bots`)
        await expect(page.locator('h1')).toContainText('Bots')

        // Step 2: Add a new bot
        await test.step('Add new bot', async () => {
            await page.getByRole('button', { name: /add bot/i }).click()
      
            // Fill in bot details
            await page.getByLabel(/ma file json/i).fill(JSON.stringify(account.maFile))
            await page.getByLabel(/proxy url/i).fill(account.proxyUrl)
            await page.getByLabel(/label/i).fill(`E2E Test Bot - ${account.username}`)
      
            await page.getByRole('button', { name: /save|add|submit/i }).click()
      
            // Verify bot added
            await expect(page.locator('text=' + account.username)).toBeVisible()
        })

        // Step 3: Connect the bot
        await test.step('Connect bot', async () => {
            await page.getByRole('button', { name: /connect/i }).first().click()
      
            // Wait for connection (with timeout)
            await page.waitForSelector('text=connected', { timeout: 30000 })
        })

        // Step 4: Navigate to tasks and create a task
        await test.step('Create task', async () => {
            await page.goto(`${baseUrl}/tasks`)
            await expect(page.locator('h1')).toContainText('Tasks')
      
            await page.getByRole('button', { name: /create task/i }).click()
      
            // Fill task form
            await page.getByLabel(/player steam id/i).fill('76561198000000001')
            await page.getByLabel(/item/i).fill('AK-47 Redline')
            await page.getByLabel(/min.*price/i).fill('50')
            await page.getByLabel(/max.*price/i).fill('100')
      
            await page.getByRole('button', { name: /create|save|submit/i }).click()
      
            // Verify task created
            await expect(page.locator('text=AK-47 Redline')).toBeVisible()
        })

        // Step 5: Monitor task assignment
        await test.step('Monitor task assignment', async () => {
            // Refresh to see updated status
            for (let i = 0; i < 10; i++) {
                await page.reload()
                const status = await page.locator('[data-testid="task-status"]').first().textContent()
        
                if (status && ['assigned', 'invited'].includes(status)) {
                    console.log(`Task status: ${status}`)
                    break
                }
        
                await page.waitForTimeout(2000)
            }
      
            // Verify task was assigned
            const finalStatus = await page.locator('[data-testid="task-status"]').first().textContent()
            expect(['assigned', 'invited', 'accepted']).toContain(finalStatus)
        })

        // Step 6: Navigate to chats
        await test.step('Check chats', async () => {
            await page.goto(`${baseUrl}/chats`)
            await expect(page.locator('h1')).toContainText('Chats')
      
            // If chat exists, open it
            const chatLinks = page.locator('a[href*="/chats/"]')
            const chatCount = await chatLinks.count()
      
            if (chatCount > 0) {
                await chatLinks.first().click()
        
                // Verify chat page loaded
                await expect(page.locator('h1')).toContainText(/chat|conversation/i)
        
                // Check for agent toggle
                const agentToggle = page.locator('[data-testid="agent-toggle"]')
                if (await agentToggle.isVisible()) {
                    const isEnabled = await agentToggle.isChecked()
                    console.log(`Agent is ${isEnabled ? 'enabled' : 'disabled'}`)
                }
        
                // Send a manual message
                const messageInput = page.locator('input[placeholder*="message"]')
                if (await messageInput.isVisible()) {
                    await messageInput.fill('Test message from E2E')
                    await page.keyboard.press('Enter')
          
                    // Verify message sent
                    await expect(page.locator('text=Test message from E2E')).toBeVisible()
                }
            }
        })
    })

    test('bot management workflow', async ({ page }) => {
        const account = testAccounts[1]
        if (!account) {
            test.skip()
            return
        }

        await page.goto(`${baseUrl}/bots`)

        // Add bot
        await page.getByRole('button', { name: /add bot/i }).click()
        await page.getByLabel(/ma file json/i).fill(JSON.stringify(account.maFile))
        await page.getByLabel(/proxy url/i).fill(account.proxyUrl)
        await page.getByLabel(/label/i).fill('Management Test Bot')
        await page.getByRole('button', { name: /save|add|submit/i }).click()

        // Connect bot
        await page.getByRole('button', { name: /connect/i }).first().click()
        await page.waitForTimeout(5000)

        // Disconnect bot
        await page.getByRole('button', { name: /disconnect/i }).first().click()
        await expect(page.locator('text=disconnected')).toBeVisible({ timeout: 10000 })

        // Remove bot
        await page.getByRole('button', { name: /remove|delete/i }).first().click()
    
        // Confirm removal if dialog appears
        const confirmButton = page.getByRole('button', { name: /confirm|yes/i })
        if (await confirmButton.isVisible({ timeout: 1000 })) {
            await confirmButton.click()
        }

        // Verify bot removed
        await expect(page.locator('text=Management Test Bot')).not.toBeVisible()
    })

    test('task lifecycle workflow', async ({ page }) => {
        await page.goto(`${baseUrl}/tasks`)

        // Create multiple tasks
        for (let i = 0; i < 3; i++) {
            await page.getByRole('button', { name: /create task/i }).click()
            await page.getByLabel(/player steam id/i).fill(`7656119800000000${i}`)
            await page.getByLabel(/item/i).fill(`Test Item ${i}`)
            await page.getByLabel(/min.*price/i).fill(String(10 + i * 10))
            await page.getByLabel(/max.*price/i).fill(String(20 + i * 10))
            await page.getByRole('button', { name: /create|save|submit/i }).click()
        }

        // Filter tasks by status
        const statusFilter = page.locator('select[name="status"]')
        if (await statusFilter.isVisible()) {
            await statusFilter.selectOption('created')
            await page.waitForTimeout(1000)
      
            // Verify filtered results
            const tasks = page.locator('[data-testid="task-row"]')
            const count = await tasks.count()
            console.log(`Found ${count} created tasks`)
        }

        // Dispose a task
        const disposeButtons = page.locator('button:has-text("Dispose")')
        if (await disposeButtons.first().isVisible()) {
            await disposeButtons.first().click()
      
            // Confirm if needed
            const confirmBtn = page.getByRole('button', { name: /confirm|yes/i })
            if (await confirmBtn.isVisible({ timeout: 1000 })) {
                await confirmBtn.click()
            }
      
            // Verify task disposed
            await expect(page.locator('text=disposed').first()).toBeVisible({ timeout: 5000 })
        }
    })

    test('chat interaction with agent toggle', async ({ page }) => {
    // First ensure we have a bot and task set up
        const account = testAccounts[2]
        if (!account) {
            test.skip()
            return
        }

        // Setup bot
        await page.goto(`${baseUrl}/bots`)
        await page.getByRole('button', { name: /add bot/i }).click()
        await page.getByLabel(/ma file json/i).fill(JSON.stringify(account.maFile))
        await page.getByLabel(/proxy url/i).fill(account.proxyUrl)
        await page.getByLabel(/label/i).fill('Chat Test Bot')
        await page.getByRole('button', { name: /save|add|submit/i }).click()

        // Create a task
        await page.goto(`${baseUrl}/tasks`)
        await page.getByRole('button', { name: /create task/i }).click()
        await page.getByLabel(/player steam id/i).fill('76561198000000100')
        await page.getByLabel(/item/i).fill('Chat Test Item')
        await page.getByLabel(/min.*price/i).fill('25')
        await page.getByLabel(/max.*price/i).fill('50')
        await page.getByRole('button', { name: /create|save|submit/i }).click()

        // Navigate to chats
        await page.goto(`${baseUrl}/chats`)
    
        // If no chats, create one (this would normally happen via friend acceptance)
        const chatLinks = page.locator('a[href*="/chats/"]')
        if (await chatLinks.count() === 0) {
            console.log('No chats available for testing')
            return
        }

        // Open first chat
        await chatLinks.first().click()

        // Test agent toggle
        const agentToggle = page.locator('[data-testid="agent-toggle"]')
        if (await agentToggle.isVisible()) {
            const initialState = await agentToggle.isChecked()
      
            // Toggle agent
            await agentToggle.click()
            await page.waitForTimeout(1000)
      
            const newState = await agentToggle.isChecked()
            expect(newState).toBe(!initialState)
      
            // Toggle back
            await agentToggle.click()
            await page.waitForTimeout(1000)
      
            const finalState = await agentToggle.isChecked()
            expect(finalState).toBe(initialState)
        }

        // Send messages
        const messageInput = page.locator('input[placeholder*="message"]')
        if (await messageInput.isVisible()) {
            const testMessages = [
                'Hello from E2E test',
                'This is a test message',
                'Testing chat functionality'
            ]

            for (const msg of testMessages) {
                await messageInput.fill(msg)
                await page.keyboard.press('Enter')
                await page.waitForTimeout(500)
            }

            // Verify messages appear
            for (const msg of testMessages) {
                await expect(page.locator(`text="${msg}"`)).toBeVisible()
            }
        }
    })

    test('settings page navigation', async ({ page }) => {
        await page.goto(`${baseUrl}/settings`)
        await expect(page.locator('h1')).toContainText('Settings')

        // Check for rate limit information
        await expect(page.locator('text=/1.*min.*bot/i')).toBeVisible()

        // Check for proxy information
        const proxyInfo = page.locator('[data-testid="proxy-info"]')
        if (await proxyInfo.isVisible()) {
            const text = await proxyInfo.textContent()
            console.log('Proxy info:', text)
        }
    })

    test('responsive design check', async ({ page }) => {
        const viewports = [
            { width: 1920, height: 1080, name: 'Desktop' },
            { width: 768, height: 1024, name: 'Tablet' },
            { width: 375, height: 667, name: 'Mobile' }
        ]

        for (const viewport of viewports) {
            await page.setViewportSize({ width: viewport.width, height: viewport.height })
      
            await page.goto(`${baseUrl}/bots`)
            await expect(page.locator('h1')).toBeVisible()
      
            await page.goto(`${baseUrl}/tasks`)
            await expect(page.locator('h1')).toBeVisible()
      
            await page.goto(`${baseUrl}/chats`)
            await expect(page.locator('h1')).toBeVisible()
      
            console.log(`✓ ${viewport.name} view works`)
        }
    })

    test('data persistence across navigation', async ({ page }) => {
        const account = testAccounts[3]
        if (!account) {
            test.skip()
            return
        }

        // Add a bot
        await page.goto(`${baseUrl}/bots`)
        await page.getByRole('button', { name: /add bot/i }).click()
        await page.getByLabel(/ma file json/i).fill(JSON.stringify(account.maFile))
        await page.getByLabel(/proxy url/i).fill(account.proxyUrl)
        const botLabel = `Persistence Test - ${Date.now()}`
        await page.getByLabel(/label/i).fill(botLabel)
        await page.getByRole('button', { name: /save|add|submit/i }).click()

        // Navigate away and back
        await page.goto(`${baseUrl}/tasks`)
        await page.goto(`${baseUrl}/settings`)
        await page.goto(`${baseUrl}/bots`)

        // Verify bot still exists
        await expect(page.locator(`text="${botLabel}"`)).toBeVisible()

        // Refresh page
        await page.reload()

        // Verify bot persisted after refresh
        await expect(page.locator(`text="${botLabel}"`)).toBeVisible()
    })
})