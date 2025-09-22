import { expect, APIRequestContext } from '@playwright/test'

// Base URL for API tests
export const API_BASE_URL = process.env.BASE_URL

/**
 * Helper function to make API requests with proper error handling
 */
export async function apiRequest(
    request: APIRequestContext,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    options?: {
        data?: any
        headers?: Record<string, string>
        params?: Record<string, string>
    }
) {
    const url = new URL(`${API_BASE_URL}${endpoint}`)
    
    // Add query params if provided
    if (options?.params) {
        Object.entries(options.params).forEach(([key, value]) => {
            url.searchParams.append(key, value)
        })
    }

    const requestOptions: any = {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    }

    if (options?.data && method !== 'GET') {
        requestOptions.data = options.data
    }

    const response = await request[method.toLowerCase() as Lowercase<typeof method>](
        url.toString(),
        requestOptions
    )

    const responseData = await response.text()
    let parsedData: any

    try {
        parsedData = JSON.parse(responseData)
    } catch {
        parsedData = responseData
    }

    return {
        status: response.status(),
        data: parsedData,
        headers: response.headers(),
        ok: response.ok(),
        response
    }
}

/**
 * Validate health endpoint response structure
 */
export function validateHealthResponse(data: any): void {
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('environment')
    expect(data).toHaveProperty('database')
    expect(typeof data.status).toBe('string')
    expect(typeof data.timestamp).toBe('string')
    expect(typeof data.environment).toBe('string')
    expect(typeof data.database).toBe('string')
}

/**
 * Validate error response structure
 */
export function validateErrorResponse(data: any, expectedStatus?: number): void {
    if (expectedStatus === 500) {
        expect(data).toHaveProperty('error')
        expect(typeof data.error).toBe('string')
    } else {
        expect(data).toBeDefined()
    }
}

/**
 * Validate event structure (for SSE/Redux events)
 */
export function validateEventStructure(event: any): void {
    expect(event).toHaveProperty('type')
    expect(event).toHaveProperty('payload')
    expect(event).toHaveProperty('meta')
    expect(typeof event.type).toBe('string')
    expect(typeof event.meta).toBe('object')
}

/**
 * Mock data factory for bot entities
 */
export function createMockBot(overrides: Partial<any> = {}) {
    return {
        id: `bot_${Date.now()}`,
        accountName: 'test_account',
        label: 'Test Bot',
        status: 'disconnected',
        isActive: true,
        proxyUrl: null,
        maFileData: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...overrides
    }
}

/**
 * Mock data factory for task entities
 */
export function createMockTask(overrides: Partial<any> = {}) {
    return {
        id: `task_${Date.now()}`,
        targetPlayerId: '76561198000000001',
        itemIds: [],
        minPrice: 1.0,
        maxPrice: 100.0,
        status: 'pending',
        assignedBotId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...overrides
    }
}

/**
 * Mock data factory for chat entities
 */
export function createMockChat(overrides: Partial<any> = {}) {
    return {
        id: `chat_${Date.now()}`,
        playerId: '76561198000000001',
        botId: 'bot_123',
        agentEnabled: true,
        messages: [],
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...overrides
    }
}

/**
 * Wait for condition with timeout
 */
export async function waitForCondition(
    conditionFn: () => Promise<boolean>,
    timeout: number = 10000,
    interval: number = 100
): Promise<void> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
        if (await conditionFn()) {
            return
        }
        await new Promise(resolve => setTimeout(resolve, interval))
    }
    
    throw new Error(`Timeout waiting for condition after ${timeout}ms`)
}

/**
 * Database cleanup helper
 */
export async function cleanupTestData(request: APIRequestContext): Promise<void> {
    // Note: This should call cleanup endpoints when they're implemented
    console.log('Cleaning up test data...')
    
    try {
        // Example cleanup calls - adjust based on actual API
        await apiRequest(request, 'DELETE', '/api/test/cleanup', {
            headers: { 'X-Test-Mode': 'true' }
        })
    } catch (error) {
        console.warn('Cleanup failed:', error)
    }
}

/**
 * Validate TypeID format for entities
 */
export function validateTypeID(id: string, prefix: string): void {
    expect(id).toMatch(new RegExp(`^${prefix}_[a-z0-9]+$`))
}

/**
 * Create SSE event listener for tests
 */
export function createEventListener(url: string): EventTarget {
    // This would typically create an EventSource for SSE testing
    // For now, return a mock EventTarget
    return new EventTarget()
}

/**
 * Validate Redux store state shape
 */
export function validateStoreState(state: any): void {
    expect(state).toHaveProperty('bots')
    expect(state).toHaveProperty('tasks')
    expect(state).toHaveProperty('chats')
    expect(state).toHaveProperty('system')
    
    // Validate entity slice structure
    expect(state.bots).toHaveProperty('entities')
    expect(state.bots).toHaveProperty('ids')
    expect(state.tasks).toHaveProperty('entities')
    expect(state.tasks).toHaveProperty('ids')
    expect(state.chats).toHaveProperty('entities')
    expect(state.chats).toHaveProperty('ids')
}