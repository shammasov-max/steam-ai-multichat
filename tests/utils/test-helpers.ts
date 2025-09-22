import * as fs from 'fs'
import * as path from 'path'
import { Effect, Layer, Context } from 'effect'

/**
 * General test utilities for Effect-TS testing patterns
 */

/**
 * Create test layer for Effect-TS services
 */
export function createTestLayer(...layers: Layer.Layer<any, any, any>[]): Layer.Layer<any, never, any> {
    return Layer.mergeAll(...layers)
}

/**
 * Run Effect test with proper error handling
 */
export async function runEffectTest<A>(
    effect: Effect.Effect<A, any, any>,
    layer?: Layer.Layer<any, never, any>
): Promise<A> {
    if (layer) {
        return await Effect.runPromise(effect.pipe(Effect.provide(layer)))
    }
    return await Effect.runPromise(effect)
}

/**
 * Create mock context for testing
 */
export function createMockContext<T>(tag: Context.Tag<T, any>, implementation: T): Layer.Layer<T, never, never> {
    return Layer.succeed(tag, implementation)
}

/**
 * File system utilities for test fixtures
 */
export function ensureTestDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }
}

export function writeTestFile(filePath: string, content: string): void {
    const dir = path.dirname(filePath)
    ensureTestDirectory(dir)
    fs.writeFileSync(filePath, content, 'utf-8')
}

export function readTestFile(filePath: string): string {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Test file not found: ${filePath}`)
    }
    return fs.readFileSync(filePath, 'utf-8')
}

export function deleteTestFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
    }
}

/**
 * Time utilities for testing
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function mockTimestamp(timestamp?: number): number {
    return timestamp || Date.now()
}

/**
 * Random data generators for testing
 */
export function randomString(length: number = 8): string {
    return Math.random().toString(36).substring(2, 2 + length)
}

export function randomNumber(min: number = 0, max: number = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomBoolean(): boolean {
    return Math.random() > 0.5
}

export function randomArrayItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
}

/**
 * Steam ID utilities for testing
 */
export function mockSteamID64(): string {
    // Generate a valid-looking Steam ID64
    const baseId = 76561198000000000n
    const randomId = BigInt(randomNumber(1, 999999999))
    return (baseId + randomId).toString()
}

export function mockSteamID32(): number {
    return randomNumber(1, 999999999)
}

/**
 * Entity ID generators matching TypeID format
 */
export function generateBotId(): string {
    return `bot_${randomString(10)}`
}

export function generateTaskId(): string {
    return `task_${randomString(10)}`
}

export function generateChatId(): string {
    return `chat_${randomString(10)}`
}

/**
 * Mock Steam agent for testing
 */
export interface MockSteamAgent {
    steamId: string
    status: 'connected' | 'disconnected' | 'error'
    login(): Promise<void>
    logout(): Promise<void>
    sendMessage(target: string, message: string): Promise<boolean>
    addFriend(steamId: string): Promise<boolean>
    removeFriend(steamId: string): Promise<boolean>
    acceptFriendRequest(steamId: string): Promise<boolean>
    emit(event: string, ...args: any[]): void
}

export function createMockSteamAgent(config: {
    steamId?: string
    status?: MockSteamAgent['status']
} = {}): MockSteamAgent {
    const steamId = config.steamId || mockSteamID64()
    const status = config.status || 'disconnected'
    
    return {
        steamId,
        status,
        async login() {
            console.log(`Mock Steam agent ${steamId} logging in`)
            await sleep(100) // Simulate async operation
        },
        async logout() {
            console.log(`Mock Steam agent ${steamId} logging out`)
            await sleep(50)
        },
        async sendMessage(target: string, message: string) {
            console.log(`Mock Steam agent ${steamId} sending message to ${target}: ${message}`)
            await sleep(50)
            return true
        },
        async addFriend(targetSteamId: string) {
            console.log(`Mock Steam agent ${steamId} adding friend ${targetSteamId}`)
            await sleep(100)
            return true
        },
        async removeFriend(targetSteamId: string) {
            console.log(`Mock Steam agent ${steamId} removing friend ${targetSteamId}`)
            await sleep(50)
            return true
        },
        async acceptFriendRequest(targetSteamId: string) {
            console.log(`Mock Steam agent ${steamId} accepting friend request from ${targetSteamId}`)
            await sleep(50)
            return true
        },
        emit(event: string, ...args: any[]) {
            console.log(`Mock Steam agent ${steamId} emitting event: ${event}`, args)
        }
    }
}

/**
 * Mock Redux store for testing
 */
export function createMockStore(initialState: any = {}) {
    const defaultState = {
        bots: { entities: {}, ids: [] },
        tasks: { entities: {}, ids: [] },
        chats: { entities: {}, ids: [] },
        system: { 
            botAssignmentIndex: 0,
            inviteRateLimit: 60000,
            agentEnabledDefault: true
        },
        ...initialState
    }
    
    let state = defaultState
    const listeners: Array<() => void> = []
    
    return {
        getState: () => state,
        dispatch: (action: any) => {
            console.log('Mock store dispatch:', action)
            // Simple state update logic for testing
            if (action.type.includes('/')) {
                const [sliceName] = action.type.split('/')
                if (state[sliceName] && action.payload) {
                    state = {
                        ...state,
                        [sliceName]: {
                            ...state[sliceName],
                            ...action.payload
                        }
                    }
                }
            }
            listeners.forEach(listener => listener())
            return action
        },
        subscribe: (listener: () => void) => {
            listeners.push(listener)
            return () => {
                const index = listeners.indexOf(listener)
                if (index > -1) {
                    listeners.splice(index, 1)
                }
            }
        }
    }
}

/**
 * Test configuration utilities
 */
export function getTestConfig() {
    return {
        apiUrl: process.env.API_URL,
        baseUrl: process.env.BASE_URL,
        databaseUrl: process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
        isCI: process.env.CI === 'true',
        testTimeout: process.env.TEST_TIMEOUT ? parseInt(process.env.TEST_TIMEOUT) : undefined,
        debugMode: process.env.DEBUG === '*' || process.env.DEBUG?.includes('test')
    }
}

/**
 * Error handling utilities for tests
 */
export function expectError<T extends Error>(
    fn: () => Promise<any> | any,
    errorType?: new (...args: any[]) => T
): Promise<T> {
    return new Promise(async (resolve, reject) => {
        try {
            await fn()
            reject(new Error('Expected function to throw an error'))
        } catch (error) {
            if (errorType && !(error instanceof errorType)) {
                reject(new Error(`Expected error of type ${errorType.name}, got ${error.constructor.name}`))
                return
            }
            resolve(error as T)
        }
    })
}

/**
 * Performance testing utilities
 */
export async function measureExecutionTime<T>(
    fn: () => Promise<T> | T
): Promise<{ result: T; duration: number }> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    return { result, duration: end - start }
}

/**
 * Validation utilities
 */
export function validateSchema<T>(data: any, validator: (data: any) => data is T): T {
    if (!validator(data)) {
        throw new Error('Schema validation failed')
    }
    return data
}

/**
 * Test isolation utilities
 */
export function isolateTest(testFn: () => Promise<void> | void): () => Promise<void> {
    return async () => {
        // Setup test isolation
        const originalEnv = { ...process.env }
        
        try {
            await testFn()
        } finally {
            // Restore environment
            process.env = originalEnv
        }
    }
}