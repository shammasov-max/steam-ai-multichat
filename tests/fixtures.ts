import { readFile } from 'fs/promises'
import { join } from 'path'
import { loadTestAccounts, parseTestAccounts, type TestAccount, type ParsedAccount } from './utils/steam-helpers'
import { generateBotId, generateTaskId, generateChatId, mockSteamID64 } from './utils/test-helpers'

/**
 * Test fixture management for the Steam multichat automation system
 */

export interface TestFixtures {
    accounts: TestAccount[]
    parsedAccounts: ParsedAccount[]
    botAccount: TestAccount
    userAccount: TestAccount
}

/**
 * Load all test fixtures needed for testing
 */
export async function loadFixtures(): Promise<TestFixtures> {
    const accounts = await loadTestAccounts()
    const parsedAccounts = parseTestAccounts()
    
    if (accounts.length < 2) {
        throw new Error(`Need at least 2 test accounts for bot-user interaction tests, found ${accounts.length}`)
    }
    
    return {
        accounts,
        parsedAccounts,
        botAccount: accounts[0],
        userAccount: accounts[1]
    }
}

/**
 * Get test account pair for bot-user interaction
 */
export async function getTestAccountPair(): Promise<[TestAccount, TestAccount]> {
    const accounts = await loadTestAccounts()
    
    if (accounts.length < 2) {
        throw new Error(`Need at least 2 test accounts, found ${accounts.length}`)
    }
    
    return [accounts[0], accounts[1]]
}

/**
 * Entity factory functions for consistent test data
 */
export class TestEntityFactory {
    /**
     * Create test bot entity
     */
    static createBot(overrides: Partial<any> = {}): any {
        return {
            id: generateBotId(),
            accountName: `test_bot_${Date.now()}`,
            label: 'Test Bot',
            status: 'disconnected',
            isActive: true,
            proxyUrl: null,
            maFileData: null,
            steamId: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ...overrides
        }
    }

    /**
     * Create test task entity
     */
    static createTask(overrides: Partial<any> = {}): any {
        return {
            id: generateTaskId(),
            targetPlayerId: mockSteamID64(),
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
     * Create test chat entity
     */
    static createChat(overrides: Partial<any> = {}): any {
        return {
            id: generateChatId(),
            playerId: mockSteamID64(),
            botId: generateBotId(),
            agentEnabled: true,
            messages: [],
            status: 'active',
            lastActivity: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ...overrides
        }
    }

    /**
     * Create test message entity
     */
    static createMessage(overrides: Partial<any> = {}): any {
        return {
            id: `msg_${Date.now()}`,
            chatId: generateChatId(),
            senderId: mockSteamID64(),
            content: 'Test message content',
            type: 'text',
            timestamp: Date.now(),
            ...overrides
        }
    }

    /**
     * Create test proxy configuration
     */
    static createProxy(overrides: Partial<any> = {}): any {
        return {
            id: `proxy_${Date.now()}`,
            host: '127.0.0.1',
            port: 8080,
            username: 'testuser',
            password: 'testpass',
            protocol: 'http',
            isActive: true,
            ...overrides
        }
    }

    /**
     * Create test system configuration
     */
    static createSystemConfig(overrides: Partial<any> = {}): any {
        return {
            botAssignmentIndex: 0,
            inviteRateLimit: 60000, // 1 minute
            messageRateLimit: 1000, // 1 second
            agentEnabledDefault: true,
            maxConcurrentTasks: 10,
            maxBotsPerProxy: 1,
            ...overrides
        }
    }
}

/**
 * Event factory for testing Redux actions/events
 */
export class TestEventFactory {
    /**
     * Create bot status changed event
     */
    static createBotStatusEvent(botId: string, status: string, meta: any = {}): any {
        return {
            type: 'bots/statusChanged',
            payload: { botId, status },
            meta: {
                timestamp: Date.now(),
                source: 'test',
                ...meta
            }
        }
    }

    /**
     * Create task assigned event
     */
    static createTaskAssignedEvent(taskId: string, botId: string, meta: any = {}): any {
        return {
            type: 'tasks/assigned',
            payload: { taskId, botId },
            meta: {
                timestamp: Date.now(),
                source: 'test',
                ...meta
            }
        }
    }

    /**
     * Create chat message event
     */
    static createChatMessageEvent(chatId: string, senderId: string, content: string, meta: any = {}): any {
        return {
            type: 'chats/messageReceived',
            payload: { chatId, senderId, content },
            meta: {
                timestamp: Date.now(),
                source: 'test',
                ...meta
            }
        }
    }

    /**
     * Create friend request event
     */
    static createFriendRequestEvent(botId: string, playerId: string, meta: any = {}): any {
        return {
            type: 'bots/friendRequestReceived',
            payload: { botId, playerId },
            meta: {
                timestamp: Date.now(),
                source: 'steam',
                ...meta
            }
        }
    }
}

/**
 * Database state fixtures for testing
 */
export class TestDatabaseFixtures {
    /**
     * Create initial database state with test data
     */
    static createInitialState(): any {
        const bot1 = TestEntityFactory.createBot({
            id: 'bot_test1',
            accountName: 'testbot1',
            status: 'connected'
        })
        
        const bot2 = TestEntityFactory.createBot({
            id: 'bot_test2',
            accountName: 'testbot2',
            status: 'disconnected'
        })

        const task1 = TestEntityFactory.createTask({
            id: 'task_test1',
            assignedBotId: 'bot_test1',
            status: 'in_progress'
        })

        const chat1 = TestEntityFactory.createChat({
            id: 'chat_test1',
            botId: 'bot_test1',
            playerId: '76561198000000001'
        })

        return {
            bots: {
                entities: {
                    'bot_test1': bot1,
                    'bot_test2': bot2
                },
                ids: ['bot_test1', 'bot_test2']
            },
            tasks: {
                entities: {
                    'task_test1': task1
                },
                ids: ['task_test1']
            },
            chats: {
                entities: {
                    'chat_test1': chat1
                },
                ids: ['chat_test1']
            },
            system: TestEntityFactory.createSystemConfig()
        }
    }

    /**
     * Create empty database state
     */
    static createEmptyState(): any {
        return {
            bots: { entities: {}, ids: [] },
            tasks: { entities: {}, ids: [] },
            chats: { entities: {}, ids: [] },
            system: TestEntityFactory.createSystemConfig()
        }
    }
}

/**
 * API response fixtures
 */
export class TestAPIFixtures {
    /**
     * Create health check response
     */
    static createHealthResponse(status: 'ok' | 'error' = 'ok'): any {
        return {
            status,
            timestamp: new Date().toISOString(),
            environment: 'test',
            database: status,
            responseTime: Math.floor(Math.random() * 100) + 10
        }
    }

    /**
     * Create error response
     */
    static createErrorResponse(message: string, status: number = 500): any {
        return {
            error: message,
            status,
            timestamp: new Date().toISOString()
        }
    }

    /**
     * Create success response
     */
    static createSuccessResponse(data: any = {}): any {
        return {
            success: true,
            data,
            timestamp: new Date().toISOString()
        }
    }
}

/**
 * Steam API mock responses
 */
export class TestSteamFixtures {
    /**
     * Create mock player summary
     */
    static createPlayerSummary(steamId: string): any {
        return {
            steamid: steamId,
            communityvisibilitystate: 3,
            profilestate: 1,
            personaname: `TestPlayer_${steamId.slice(-4)}`,
            profileurl: `https://steamcommunity.com/id/testplayer${steamId.slice(-4)}/`,
            avatar: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb.jpg',
            personastate: 1,
            timecreated: 1234567890
        }
    }

    /**
     * Create mock friends list
     */
    static createFriendsList(friendIds: string[] = []): any {
        return {
            friendslist: {
                friends: friendIds.map(steamId => ({
                    steamid: steamId,
                    relationship: 'friend',
                    friend_since: 1234567890
                }))
            }
        }
    }

    /**
     * Create mock inventory
     */
    static createInventory(itemCount: number = 5): any {
        const assets = []
        const descriptions = []
        
        for (let i = 0; i < itemCount; i++) {
            const classId = `class_${i}`
            assets.push({
                appid: 730,
                contextid: '2',
                assetid: `asset_${i}`,
                classid: classId,
                instanceid: '0',
                amount: '1'
            })
            
            descriptions.push({
                appid: 730,
                classid: classId,
                instanceid: '0',
                name: `Test Item ${i}`,
                type: 'Test Type',
                market_name: `Test Market Item ${i}`,
                tradable: 1,
                commodity: 0
            })
        }
        
        return { assets, descriptions }
    }
}

/**
 * Environment configuration for different test scenarios
 */
export class TestEnvironments {
    static development(): any {
        return {
            NODE_ENV: 'test',
            API_URL: 'http://localhost:3000',
            BASE_URL: 'http://localhost:3000',
            DATABASE_URL: 'postgresql://test:test@localhost:54320/steambot_test',
            LOG_LEVEL: 'debug',
            STEAM_API_KEY: 'test_api_key',
            DISABLE_RATE_LIMITING: 'true'
        }
    }

    static production(): any {
        return {
            NODE_ENV: 'production',
            API_URL: 'https://api.example.com',
            BASE_URL: 'https://app.example.com',
            DATABASE_URL: 'postgresql://prod:prod@db.example.com:5432/steambot_prod',
            LOG_LEVEL: 'info',
            STEAM_API_KEY: 'prod_api_key',
            DISABLE_RATE_LIMITING: 'false'
        }
    }

    static ci(): any {
        return {
            NODE_ENV: 'test',
            CI: 'true',
            API_URL: 'http://localhost:3000',
            BASE_URL: 'http://localhost:3000',
            DATABASE_URL: 'postgresql://test:test@localhost:5432/steambot_ci',
            LOG_LEVEL: 'error',
            STEAM_API_KEY: 'ci_api_key',
            DISABLE_RATE_LIMITING: 'true'
        }
    }
}

/**
 * Export commonly used fixtures for easy access
 */
export const COMMON_FIXTURES = {
    // Test Steam IDs
    BOT_STEAM_ID: '76561198000000001',
    USER_STEAM_ID: '76561198000000002',
    ADMIN_STEAM_ID: '76561198000000003',
    
    // Test entity IDs
    BOT_ID: 'bot_test123',
    TASK_ID: 'task_test123',
    CHAT_ID: 'chat_test123',
    
    // Common test messages
    TEST_MESSAGES: [
        'Hello, this is a test message',
        'How are you doing today?',
        'I would like to trade some items',
        'What items do you have available?',
        'Thank you for your help!'
    ],
    
    // Common Steam items for testing
    TEST_ITEMS: [
        { id: 'item_ak47_redline', name: 'AK-47 | Redline' },
        { id: 'item_awp_dragon_lore', name: 'AWP | Dragon Lore' },
        { id: 'item_knife_karambit', name: 'Karambit | Fade' }
    ]
}