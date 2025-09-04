import { test, expect } from '@playwright/test'
import { apiRequest, validateHealthResponse, validateErrorResponse } from './utils/api-helpers'
import { loadFixtures } from './fixtures'

/**
 * API Routes Test Suite
 * 
 * Tests all API endpoints for the Steam multichat automation system.
 * Covers functionality, error handling, and performance requirements.
 */

test.describe('API Routes', () => {
    test.beforeAll(async () => {
        // Ensure test environment is ready
        console.log('Setting up API tests...')
    })

    test.afterAll(async () => {
        // Cleanup after all tests
        console.log('Cleaning up API tests...')
    })

    test.describe('Health Endpoint', () => {
        test('should return health status', async ({ request }) => {
            const response = await apiRequest(request, 'GET', '/api/health')
            
            expect(response.ok).toBeTruthy()
            expect(response.status).toBe(200)
            validateHealthResponse(response.data)
            
            // Verify response time is reasonable
            expect(response.data.responseTime).toBeLessThan(1000)
        })

        test('should handle unsupported methods', async ({ request }) => {
            const response = await apiRequest(request, 'POST', '/api/health')
            
            expect(response.status).toBe(405)
            validateErrorResponse(response.data, 405)
        })
    })

    test.describe('Bot Management', () => {
        test('should list all bots', async ({ request }) => {
            const response = await apiRequest(request, 'GET', '/api/bots')
            
            expect(response.ok).toBeTruthy()
            expect(response.status).toBe(200)
            expect(Array.isArray(response.data)).toBeTruthy()
        })

        test('should create new bot with valid maFile', async ({ request }) => {
            const fixtures = await loadFixtures()
            
            if (fixtures.accounts.length === 0) {
                test.skip('No test accounts available')
            }

            const testAccount = fixtures.accounts[0]
            const botData = {
                maFileJSON: testAccount.maFile,
                proxyUrl: testAccount.proxy,
                label: 'Test Bot'
            }

            const response = await apiRequest(request, 'POST', '/api/bots', {
                data: botData
            })

            expect(response.ok).toBeTruthy()
            expect(response.status).toBe(201)
            expect(response.data).toHaveProperty('id')
            expect(response.data.id).toMatch(/^bot_/)
        })

        test('should reject invalid maFile data', async ({ request }) => {
            const invalidBotData = {
                maFileJSON: '{"invalid": "data"}',
                proxyUrl: 'http://invalid:proxy',
                label: 'Invalid Bot'
            }

            const response = await apiRequest(request, 'POST', '/api/bots', {
                data: invalidBotData
            })

            expect(response.status).toBe(400)
            validateErrorResponse(response.data, 400)
        })

        test('should connect bot', async ({ request }) => {
            // First create a bot
            const fixtures = await loadFixtures()
            
            if (fixtures.accounts.length === 0) {
                test.skip('No test accounts available')
            }

            const testAccount = fixtures.accounts[0]
            const createResponse = await apiRequest(request, 'POST', '/api/bots', {
                data: {
                    maFileJSON: testAccount.maFile,
                    proxyUrl: testAccount.proxy,
                    label: 'Connect Test Bot'
                }
            })

            expect(createResponse.ok).toBeTruthy()
            const bot = createResponse.data

            // Now try to connect it
            const connectResponse = await apiRequest(request, 'POST', '/api/bots/connect', {
                data: { botId: bot.id }
            })

            expect(connectResponse.ok).toBeTruthy()
            expect(connectResponse.status).toBe(200)
        })
    })

    test.describe('Task Management', () => {
        test('should list all tasks', async ({ request }) => {
            const response = await apiRequest(request, 'GET', '/api/tasks')
            
            expect(response.ok).toBeTruthy()
            expect(response.status).toBe(200)
            expect(Array.isArray(response.data)).toBeTruthy()
        })

        test('should create new task', async ({ request }) => {
            const taskData = {
                targetPlayerId: '76561198000000001',
                itemIds: ['item_ak47_redline'],
                minPrice: 10.0,
                maxPrice: 50.0
            }

            const response = await apiRequest(request, 'POST', '/api/tasks', {
                data: taskData
            })

            expect(response.ok).toBeTruthy()
            expect(response.status).toBe(201)
            expect(response.data).toHaveProperty('id')
            expect(response.data.id).toMatch(/^task_/)
        })

        test('should filter tasks by status', async ({ request }) => {
            const response = await apiRequest(request, 'GET', '/api/tasks', {
                params: { status: 'pending' }
            })

            expect(response.ok).toBeTruthy()
            expect(response.status).toBe(200)
            expect(Array.isArray(response.data)).toBeTruthy()
            
            // All returned tasks should have pending status
            response.data.forEach((task: any) => {
                expect(task.status).toBe('pending')
            })
        })
    })

    test.describe('Chat Management', () => {
        test('should list all chats', async ({ request }) => {
            const response = await apiRequest(request, 'GET', '/api/chats')
            
            expect(response.ok).toBeTruthy()
            expect(response.status).toBe(200)
            expect(Array.isArray(response.data)).toBeTruthy()
        })

        test('should get chat by ID', async ({ request }) => {
            // First create a chat or use existing one
            const listResponse = await apiRequest(request, 'GET', '/api/chats')
            
            if (listResponse.data.length === 0) {
                test.skip('No chats available for testing')
            }

            const chatId = listResponse.data[0].id
            const response = await apiRequest(request, 'GET', `/api/chats/${chatId}`)

            expect(response.ok).toBeTruthy()
            expect(response.status).toBe(200)
            expect(response.data).toHaveProperty('id', chatId)
        })

        test('should return 404 for non-existent chat', async ({ request }) => {
            const response = await apiRequest(request, 'GET', '/api/chats/chat_nonexistent')
            
            expect(response.status).toBe(404)
            validateErrorResponse(response.data, 404)
        })
    })

    test.describe('System Configuration', () => {
        test('should get system config', async ({ request }) => {
            const response = await apiRequest(request, 'GET', '/api/system/config')
            
            expect(response.ok).toBeTruthy()
            expect(response.status).toBe(200)
            expect(response.data).toHaveProperty('inviteRateLimit')
            expect(response.data).toHaveProperty('agentEnabledDefault')
        })

        test('should update system config', async ({ request }) => {
            const configUpdate = {
                inviteRateLimit: 90000, // 1.5 minutes
                agentEnabledDefault: false
            }

            const response = await apiRequest(request, 'PATCH', '/api/system/config', {
                data: configUpdate
            })

            expect(response.ok).toBeTruthy()
            expect(response.status).toBe(200)
            expect(response.data.inviteRateLimit).toBe(90000)
            expect(response.data.agentEnabledDefault).toBe(false)
        })
    })

    test.describe('Error Handling', () => {
        test('should handle malformed JSON', async ({ request }) => {
            const response = await request.post('/api/bots', {
                data: 'malformed json{',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            expect(response.status()).toBe(400)
            const data = await response.json()
            validateErrorResponse(data, 400)
        })

        test('should handle missing required fields', async ({ request }) => {
            const response = await apiRequest(request, 'POST', '/api/bots', {
                data: { label: 'Incomplete Bot' } // Missing required fields
            })

            expect(response.status).toBe(400)
            validateErrorResponse(response.data, 400)
        })

        test('should handle unauthorized access', async ({ request }) => {
            // Test protected endpoint without proper authorization
            const response = await apiRequest(request, 'DELETE', '/api/system/reset')

            expect(response.status).toBe(401)
            validateErrorResponse(response.data, 401)
        })
    })

    test.describe('Performance', () => {
        test('should respond within acceptable time limits', async ({ request }) => {
            const startTime = Date.now()
            const response = await apiRequest(request, 'GET', '/api/health')
            const endTime = Date.now()
            
            const responseTime = endTime - startTime
            expect(responseTime).toBeLessThan(2000) // 2 seconds max
            expect(response.ok).toBeTruthy()
        })

        test('should handle concurrent requests', async ({ request }) => {
            const requests = Array(5).fill(0).map(() => 
                apiRequest(request, 'GET', '/api/bots')
            )

            const responses = await Promise.all(requests)
            
            responses.forEach(response => {
                expect(response.ok).toBeTruthy()
                expect(response.status).toBe(200)
            })
        })
    })
})