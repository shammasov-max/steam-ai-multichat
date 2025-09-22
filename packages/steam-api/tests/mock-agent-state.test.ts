import { describe, test, expect } from 'vitest'

// Mock SteamAgent for fast unit testing without real Steam connections
class MockSteamAgent {
    private chatHistories: Map<string, any[]> = new Map()
    private friends: any[] = []
    private steamID: string | null = null
    private isLoggedIn: boolean = false

    constructor(private config: any) {}

    async login(): Promise<void> {
        this.steamID = 'mock_steam_id_' + Date.now()
        this.isLoggedIn = true
    }

    logout(): void {
        this.isLoggedIn = false
        this.steamID = null
    }

    getSteamID(): string | null {
        return this.steamID
    }

    getIsLoggedIn(): boolean {
        return this.isLoggedIn
    }

    addFriend(steamID: string): void {
        if (!this.friends.find(f => f.steamID === steamID)) {
            this.friends.push({
                steamID,
                personaName: `User ${steamID.slice(-4)}`,
                relationship: 3,
            })
        }
    }

    removeFriend(steamID: string): void {
        this.friends = this.friends.filter(f => f.steamID !== steamID)
    }

    getFriends(): any[] {
        return [...this.friends]
    }

    sendMessage(steamID: string, message: string): void {
        if (!this.chatHistories.has(steamID)) {
            this.chatHistories.set(steamID, [])
        }
        this.chatHistories.get(steamID)!.push({
            steamID,
            message,
            timestamp: Date.now(),
            direction: 'outgoing',
        })
    }

    getChatHistory(steamID: string): any {
        return {
            steamID,
            messages: this.chatHistories.get(steamID) || [],
        }
    }

    getAllChatHistories(): any[] {
        return Array.from(this.chatHistories.entries()).map(([steamID, messages]) => ({
            steamID,
            messages,
        }))
    }
}

describe('Mock Steam Agent Unit Tests', () => {
    test('login and state management', async () => {
        const agent = new MockSteamAgent({
            maFile: '{"shared_secret":"mock_secret"}',
            password: 'mock_password',
            userName: 'mock_user',
        })

        expect(agent.getIsLoggedIn()).toBe(false)
        expect(agent.getSteamID()).toBeNull()

        await agent.login()

        expect(agent.getIsLoggedIn()).toBe(true)
        expect(agent.getSteamID()).toBeTruthy()

        agent.logout()
        expect(agent.getIsLoggedIn()).toBe(false)
        expect(agent.getSteamID()).toBeNull()
    })

    test('friend management', async () => {
        const agent = new MockSteamAgent({})
        await agent.login()

        expect(agent.getFriends()).toHaveLength(0)

        agent.addFriend('friend_1')
        agent.addFriend('friend_2')
        agent.addFriend('friend_1') // Duplicate, should not add

        const friends = agent.getFriends()
        expect(friends).toHaveLength(2)
        expect(friends.find(f => f.steamID === 'friend_1')).toBeTruthy()

        agent.removeFriend('friend_1')
        expect(agent.getFriends()).toHaveLength(1)
    })

    test('message and chat history', async () => {
        const agentA = new MockSteamAgent({})
        const agentB = new MockSteamAgent({})

        await agentA.login()
        await agentB.login()

        const userBSteamID = agentB.getSteamID()!

        // Send messages
        agentA.sendMessage(userBSteamID, 'Hello')
        agentA.sendMessage(userBSteamID, 'How are you?')

        const chatHistory = agentA.getChatHistory(userBSteamID)
        expect(chatHistory.messages).toHaveLength(2)
        expect(chatHistory.messages[0].message).toBe('Hello')
        expect(chatHistory.messages[1].message).toBe('How are you?')

        const allHistories = agentA.getAllChatHistories()
        expect(allHistories).toHaveLength(1)
        expect(allHistories[0].steamID).toBe(userBSteamID)
    })
})
