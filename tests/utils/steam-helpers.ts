import * as fs from 'fs'
import * as path from 'path'
import { randomString, randomNumber, mockSteamID64 } from './test-helpers'

/**
 * Steam-specific testing utilities
 */

export interface TestAccount {
    login: string
    password: string
    proxy: string
    maFile: string
    steamId?: string
}

export interface ParsedAccount {
    username: string
    password: string
    proxyHost: string
    proxyPort: string
    proxyUser: string
    proxyPass: string
    maFile: any
    proxyUrl: string
    steamId?: string
}

/**
 * Load test accounts from fixtures
 */
export async function loadTestAccounts(): Promise<TestAccount[]> {
    const fixturesPath = path.join(process.cwd(), 'fixtures', 'all.txt')
    
    if (!fs.existsSync(fixturesPath)) {
        console.warn('Test fixtures not found at:', fixturesPath)
        return []
    }
    
    const content = fs.readFileSync(fixturesPath, 'utf-8')
    const accounts: TestAccount[] = []
    
    for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        
        const parts = trimmed.split(' - ')
        if (parts.length !== 2) continue
        
        const [loginPassword, proxyInfo] = parts
        const [login, password] = loginPassword.split(':')
        
        if (!login || !password || !proxyInfo) continue
        
        const maFilePath = path.join(process.cwd(), 'fixtures', 'mafile', `${login}.maFile`)
        
        if (fs.existsSync(maFilePath)) {
            const maFileContent = fs.readFileSync(maFilePath, 'utf-8')
            
            accounts.push({
                login,
                password,
                proxy: `http://${proxyInfo}`,
                maFile: maFileContent
            })
        }
    }
    
    return accounts
}

/**
 * Parse test accounts from legacy format
 */
export function parseTestAccounts(): ParsedAccount[] {
    const fixturesPath = path.join(process.cwd(), 'fixtures', 'all.txt')
    
    if (!fs.existsSync(fixturesPath)) {
        console.warn('Test fixtures not found at:', fixturesPath)
        return []
    }
    
    const content = fs.readFileSync(fixturesPath, 'utf-8')
    const accounts: ParsedAccount[] = []

    content.split('\n').forEach(line => {
        line = line.trim()
        if (!line || line.startsWith('#')) return

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
                    maFile,
                    proxyUrl: `http://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}`,
                    steamId: maFile.Session?.SteamID || mockSteamID64()
                })
            }
        }
    })

    return accounts
}

/**
 * Get a pair of test accounts for bot-user interaction
 */
export async function getTestAccountPair(): Promise<[TestAccount, TestAccount]> {
    const accounts = await loadTestAccounts()
    
    if (accounts.length < 2) {
        throw new Error(`Need at least 2 test accounts, found ${accounts.length}`)
    }
    
    return [accounts[0], accounts[1]]
}

/**
 * Create mock Steam maFile for testing
 */
export function createMockMaFile(overrides: Partial<any> = {}): any {
    return {
        shared_secret: randomString(28),
        serial_number: randomString(10),
        revocation_code: randomString(5).toUpperCase(),
        uri: `steam://settingup/${randomString(20)}`,
        server_time: Math.floor(Date.now() / 1000),
        account_name: overrides.account_name || `test_${randomString(8)}`,
        token_gid: randomString(20),
        identity_secret: randomString(28),
        secret_1: randomString(28),
        status: 1,
        device_id: `android:${randomString(16, '0123456789abcdef-')}`,
        fully_enrolled: true,
        Session: {
            SessionID: randomString(24),
            SteamLogin: randomString(20),
            SteamLoginSecure: randomString(20),
            WebCookie: randomString(32),
            OAuthToken: randomString(32),
            SteamID: overrides.steamId || mockSteamID64(),
            ...overrides.Session
        },
        ...overrides
    }
}

/**
 * Validate maFile structure
 */
export function validateMaFileStructure(maFile: any): boolean {
    const requiredFields = [
        'shared_secret',
        'identity_secret',
        'account_name',
        'Session'
    ]
    
    for (const field of requiredFields) {
        if (!(field in maFile)) {
            return false
        }
    }
    
    // Validate Session structure
    if (typeof maFile.Session !== 'object') {
        return false
    }
    
    const requiredSessionFields = ['SessionID', 'SteamLogin', 'SteamID']
    for (const field of requiredSessionFields) {
        if (!(field in maFile.Session)) {
            return false
        }
    }
    
    return true
}

/**
 * Generate Steam Guard code (mock implementation)
 */
export function generateSteamGuardCode(sharedSecret: string, timeOffset: number = 0): string {
    // Mock implementation - in real tests you'd use the actual Steam Guard algorithm
    const time = Math.floor((Date.now() + timeOffset) / 30000)
    return time.toString().slice(-5).padStart(5, '0')
}

/**
 * Steam rate limiting helpers
 */
export class SteamRateLimiter {
    private lastInvite: number = 0
    private lastMessage: number = 0
    private readonly inviteDelay = 60000 // 1 minute
    private readonly messageDelay = 1000 // 1 second

    async waitForInvite(): Promise<void> {
        const now = Date.now()
        const elapsed = now - this.lastInvite
        const remaining = this.inviteDelay - elapsed
        
        if (remaining > 0) {
            console.log(`Waiting ${remaining}ms for invite rate limit...`)
            await new Promise(resolve => setTimeout(resolve, remaining))
        }
        
        this.lastInvite = Date.now()
    }

    async waitForMessage(): Promise<void> {
        const now = Date.now()
        const elapsed = now - this.lastMessage
        const remaining = this.messageDelay - elapsed
        
        if (remaining > 0) {
            await new Promise(resolve => setTimeout(resolve, remaining))
        }
        
        this.lastMessage = Date.now()
    }

    reset(): void {
        this.lastInvite = 0
        this.lastMessage = 0
    }
}

/**
 * Mock Steam API responses
 */
export const MOCK_STEAM_RESPONSES = {
    playerSummary: (steamId: string) => ({
        response: {
            players: [{
                steamid: steamId,
                communityvisibilitystate: 3,
                profilestate: 1,
                personaname: `TestPlayer_${steamId.slice(-4)}`,
                commentpermission: 1,
                profileurl: `https://steamcommunity.com/id/testplayer${steamId.slice(-4)}/`,
                avatar: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb.jpg',
                avatarmedium: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg',
                avatarfull: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
                personastate: 1,
                realname: 'Test Player',
                primaryclanid: '103582791429521408',
                timecreated: 1234567890,
                personastateflags: 0
            }]
        }
    }),

    friendsList: (steamId: string) => ({
        friendslist: {
            friends: [
                {
                    steamid: mockSteamID64(),
                    relationship: 'friend',
                    friend_since: 1234567890
                }
            ]
        }
    }),

    inventory: (steamId: string, appId: number = 730) => ({
        assets: [
            {
                appid: appId,
                contextid: '2',
                assetid: randomString(10),
                classid: randomString(10),
                instanceid: '0',
                amount: '1'
            }
        ],
        descriptions: [
            {
                appid: appId,
                classid: randomString(10),
                instanceid: '0',
                currency: 0,
                background_color: '',
                icon_url: 'test-icon-url',
                tradable: 1,
                name: 'Test Item',
                type: 'Test Type',
                market_name: 'Test Market Name',
                market_tradable_restriction: 0,
                commodity: 0
            }
        ]
    })
}

/**
 * Proxy testing utilities
 */
export async function testProxyConnection(proxyUrl: string): Promise<boolean> {
    try {
        // Mock proxy test - in real implementation you'd make an HTTP request through the proxy
        const url = new URL(proxyUrl)
        console.log(`Testing proxy connection to ${url.hostname}:${url.port}`)
        
        // Simulate proxy test
        await new Promise(resolve => setTimeout(resolve, 100))
        return true
    } catch (error) {
        console.error('Proxy connection failed:', error)
        return false
    }
}

/**
 * Steam ID conversion utilities
 */
export function steamID64ToSteamID32(steamId64: string): number {
    const steamId64BigInt = BigInt(steamId64)
    const steamId32 = Number(steamId64BigInt - 76561197960265728n)
    return steamId32
}

export function steamID32ToSteamID64(steamId32: number): string {
    const steamId64 = BigInt(steamId32) + 76561197960265728n
    return steamId64.toString()
}

/**
 * Test data cleanup for Steam resources
 */
export async function cleanupSteamTestData(accounts: TestAccount[]): Promise<void> {
    console.log('Cleaning up Steam test data...')
    
    for (const account of accounts) {
        try {
            // In a real implementation, you might:
            // - Disconnect Steam clients
            // - Clear friend requests
            // - Reset account state
            console.log(`Cleaning up account: ${account.login}`)
        } catch (error) {
            console.error(`Failed to cleanup account ${account.login}:`, error)
        }
    }
}