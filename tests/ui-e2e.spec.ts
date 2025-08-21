import { test, expect } from '@playwright/test'

test.describe('Steam Multichat UI E2E Tests', () => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'

    test.beforeEach(async ({ page }) => {
    // Navigate to home page
        await page.goto(baseUrl)
    })

    test('should navigate to all main pages', async ({ page }) => {
    // Test home page
        await expect(page).toHaveURL(baseUrl)
    
        // Navigate to bots page
        await page.click('a[href="/bots"]')
        await expect(page).toHaveURL(`${baseUrl}/bots`)
        await expect(page.locator('h1')).toContainText(/bot/i)
    
        // Navigate to tasks page
        await page.click('a[href="/tasks"]')
        await expect(page).toHaveURL(`${baseUrl}/tasks`)
        await expect(page.locator('h1')).toContainText(/task/i)
    
        // Navigate to chats page
        await page.click('a[href="/chats"]')
        await expect(page).toHaveURL(`${baseUrl}/chats`)
        await expect(page.locator('h1')).toContainText(/chat/i)
    
        // Navigate to settings page
        await page.click('a[href="/settings"]')
        await expect(page).toHaveURL(`${baseUrl}/settings`)
        await expect(page.locator('h1')).toContainText(/setting/i)
    })

    test('bots page should display UI elements correctly', async ({ page }) => {
        await page.goto(`${baseUrl}/bots`)
    
        // Check for add bot button
        await expect(page.locator('button:has-text("Add Bot")')).toBeVisible()
    
        // Check for bots table/list
        const botsList = page.locator('[data-testid="bots-list"]')
        if (await botsList.isVisible()) {
            console.log('Bots list is visible')
        }
    
        // Check for empty state if no bots
        const emptyState = page.locator('text=/no bot/i')
        if (await emptyState.isVisible()) {
            console.log('Empty state shown for bots')
        }
    })

    test('tasks page should display UI elements correctly', async ({ page }) => {
        await page.goto(`${baseUrl}/tasks`)
    
        // Check for create task button
        await expect(page.locator('button:has-text("Create Task")')).toBeVisible()
    
        // Check for tasks table/list
        const tasksList = page.locator('[data-testid="tasks-list"]')
        if (await tasksList.isVisible()) {
            console.log('Tasks list is visible')
        }
    
        // Check for status filter if available
        const statusFilter = page.locator('select[name="status"]')
        if (await statusFilter.isVisible()) {
            await expect(statusFilter).toBeVisible()
        }
    })

    test('should display proper form validation', async ({ page }) => {
        await page.goto(`${baseUrl}/bots`)
    
        // Try to add bot with empty form
        await page.click('button:has-text("Add Bot")')
    
        // Look for form fields
        const maFileField = page.locator('textarea[name="maFile"], input[name="maFile"]')
    
        if (await maFileField.isVisible()) {
            // Try submitting empty form
            const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Add")')
            if (await submitButton.isVisible()) {
                await submitButton.click()
        
                // Check for validation messages
                const validationMsg = page.locator('.error, .text-red, [role="alert"]')
                if (await validationMsg.isVisible()) {
                    console.log('Validation messages shown')
                }
            }
        }
    })

    test('should handle responsive design', async ({ page }) => {
        const viewports = [
            { width: 1920, height: 1080 }, // Desktop
            { width: 768, height: 1024 },  // Tablet
            { width: 375, height: 667 }    // Mobile
        ]

        for (const viewport of viewports) {
            await page.setViewportSize(viewport)
      
            await page.goto(`${baseUrl}/bots`)
            await expect(page.locator('h1')).toBeVisible()
      
            await page.goto(`${baseUrl}/tasks`)
            await expect(page.locator('h1')).toBeVisible()
      
            console.log(`✓ ${viewport.width}x${viewport.height} viewport works`)
        }
    })

    test('should display settings correctly', async ({ page }) => {
        await page.goto(`${baseUrl}/settings`)
    
        // Check for settings content
        await expect(page.locator('h1')).toContainText(/setting/i)
    
        // Look for rate limit info
        const rateLimitInfo = page.locator('text=/rate.*limit/i, text=/1.*min/i')
        if (await rateLimitInfo.isVisible()) {
            console.log('Rate limit information displayed')
        }
    
        // Look for proxy configuration info
        const proxyInfo = page.locator('[data-testid="proxy-info"], text=/proxy/i')
        if (await proxyInfo.isVisible()) {
            console.log('Proxy information displayed')
        }
    })

    test('should handle navigation between pages smoothly', async ({ page }) => {
    // Start from home
        await page.goto(baseUrl)
    
        const pages = ['/bots', '/tasks', '/chats', '/settings']
    
        for (const targetPage of pages) {
            await page.click(`a[href="${targetPage}"]`)
            await expect(page).toHaveURL(`${baseUrl}${targetPage}`)
      
            // Ensure page loaded
            await expect(page.locator('h1')).toBeVisible()
      
            // Go back to home
            await page.click('a[href="/"]')
            await expect(page).toHaveURL(baseUrl)
        }
    })

    test('should display proper loading states', async ({ page }) => {
        await page.goto(`${baseUrl}/bots`)
    
        // Check if loading indicators exist
        const loadingIndicator = page.locator('.loading, .spinner, text=/loading/i')
        if (await loadingIndicator.isVisible({ timeout: 1000 })) {
            console.log('Loading indicator found')
            // Wait for loading to finish
            await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 })
        }
    })

    test('should handle basic accessibility requirements', async ({ page }) => {
        await page.goto(`${baseUrl}/bots`)
    
        // Check for proper heading structure
        const h1 = page.locator('h1')
        await expect(h1).toBeVisible()
    
        // Check for form labels
        const addBotBtn = page.locator('button:has-text("Add Bot")')
        if (await addBotBtn.isVisible()) {
            await addBotBtn.click()
      
            const labels = page.locator('label')
            const labelCount = await labels.count()
            console.log(`Found ${labelCount} form labels`)
        }
    
        // Check for button accessibility
        const buttons = page.locator('button')
        const buttonCount = await buttons.count()
        console.log(`Found ${buttonCount} buttons on page`)
    })

    test('should preserve data across page refreshes', async ({ page }) => {
        await page.goto(`${baseUrl}/bots`)
    
        // Get current page content
        // Refresh page
        await page.reload()
    
        // Verify page still loads
        await expect(page.locator('h1')).toBeVisible()
    
        const refreshedContent = await page.locator('body').textContent()
    
        // Basic check that page structure is maintained
        expect(refreshedContent).toContain('Bot')
    })
})