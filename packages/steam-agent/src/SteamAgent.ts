import { EventEmitter } from 'events'
import SteamUser from 'steam-user'
import SteamCommunity from 'steamcommunity'
import SteamTotp from 'steam-totp'
import { SteamAgentConfig, Friend, ChatMessage, ChatHistory, SteamAgentEvents } from './types.js'

export class SteamAgent extends EventEmitter {
    private client: SteamUser
    private community: SteamCommunity
    private config: SteamAgentConfig
    private chatHistories: Map<string, ChatMessage[]> = new Map()
    private isLoggedIn: boolean = false

    constructor(config: SteamAgentConfig) {
        super()
        this.config = config
        this.client = new SteamUser()
        this.community = new SteamCommunity()

        this.setupEventHandlers()
    }

    private setupEventHandlers(): void {
        this.client.on('loggedOn', () => {
            this.isLoggedIn = true
            this.emit('loggedOn')
        })

        this.client.on('disconnected', (eresult: number, msg?: string) => {
            this.isLoggedIn = false
            this.emit('disconnected', eresult, msg || '')
        })

        this.client.on('error', (err: Error) => {
            this.emit('error', err)
        })

        this.client.on('friendMessage' as any, (steamID: any, message: string) => {
            const steamIDStr = steamID.toString()
            this.addMessageToHistory(steamIDStr, message, 'incoming')
            this.emit('friendMessage', steamIDStr, message)
        })

        this.client.on('friendTyping' as any, (steamID: any) => {
            this.emit('friendTyping', steamID.toString())
        })

        this.client.on('friendRelationship', (steamID: any, relationship: number) => {
            this.emit('friendRelationship', steamID.toString(), relationship)
        })

        this.client.on('friendsList', () => {
            this.emit('friendsList')
        })

        this.client.on('user', (steamID: any, user: any) => {
            this.emit('user', steamID.toString(), user)
        })
    }

    async login(): Promise<void> {
        try {
            const maFileData = JSON.parse(this.config.maFile)
            const twoFactorCode = SteamTotp.generateAuthCode(maFileData.shared_secret)

            const loginOptions: any = {
                accountName: this.config.userName,
                password: this.config.password,
                twoFactorCode: twoFactorCode,
            }

            if (this.config.proxy) {
                loginOptions.httpProxy = this.config.proxy
            }

            return new Promise((resolve, reject) => {
                this.client.logOn(loginOptions)

                this.client.once('loggedOn', () => resolve())
                this.client.once('error', (err: Error) => reject(err))
            })
        } catch (error) {
            throw new Error(`Login failed: ${error}`)
        }
    }

    logout(): void {
        this.client.logOff()
    }

    async addFriend(steamID: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.addFriend(steamID, (err: Error | null, personaName: string) => {
                if (err) reject(err)
                else resolve()
            })
        })
    }

    async removeFriend(steamID: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.removeFriend(steamID)
            resolve()
        })
    }

    getFriends(): Friend[] {
        const friends: Friend[] = []

        for (const [steamID, friend] of Object.entries(this.client.myFriends || {})) {
            const user = this.client.users[steamID]
            friends.push({
                steamID,
                personaName: user?.player_name || 'Unknown',
                avatarHash: user?.avatar_hash || '',
                relationship: friend as number,
                personaState: user?.persona_state || 0,
            })
        }

        return friends
    }

    async sendMessage(steamID: string, message: string): Promise<void> {
        return new Promise((resolve, reject) => {
            ;(this.client as any).chatMessage(steamID, message)
            this.addMessageToHistory(steamID, message, 'outgoing')
            resolve()
        })
    }

    private addMessageToHistory(
        steamID: string,
        message: string,
        direction: 'incoming' | 'outgoing'
    ): void {
        if (!this.chatHistories.has(steamID)) {
            this.chatHistories.set(steamID, [])
        }

        const history = this.chatHistories.get(steamID)!
        history.push({
            steamID,
            message,
            timestamp: Date.now(),
            direction,
        })
    }

    getChatHistory(steamID: string): ChatHistory {
        return {
            steamID,
            messages: this.chatHistories.get(steamID) || [],
        }
    }

    getAllChatHistories(): ChatHistory[] {
        return Array.from(this.chatHistories.entries()).map(([steamID, messages]) => ({
            steamID,
            messages,
        }))
    }

    clearChatHistory(steamID: string): void {
        this.chatHistories.delete(steamID)
    }

    getPersonaState(): number {
        return (this.client as any).personaState || 0
    }

    setPersonaState(state: number): void {
        this.client.setPersona(state)
    }

    getIsLoggedIn(): boolean {
        return this.isLoggedIn
    }

    getSteamID(): string | null {
        return this.client.steamID?.toString() || null
    }
}

export function createSteamAgent(config: SteamAgentConfig): SteamAgent {
    return new SteamAgent(config)
}
