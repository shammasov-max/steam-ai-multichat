import { EventEmitter } from 'events'
import SteamUser from 'steam-user'
import SteamTotp from 'steam-totp'
import { SteamAgentConfig, Friend } from './types.js'

export class SteamAgent extends EventEmitter {
    private client: SteamUser
    private config: SteamAgentConfig
    private isLoggedIn: boolean = false
    private chatHistories: Map<string, Array<{direction: string, message: string, timestamp: number, steamID: string}>> = new Map()

    constructor(config: SteamAgentConfig) {
        super()
        this.config = config
        this.client = new SteamUser()

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

        this.client.chat.on('friendMessage', (message) => {
            const steamIDStr = message.steamid_friend.toString()
            
            // Store incoming message in chat history
            if (!this.chatHistories.has(steamIDStr)) {
                this.chatHistories.set(steamIDStr, [])
            }
            this.chatHistories.get(steamIDStr)!.push({
                direction: 'incoming',
                message: message.message,
                timestamp: Date.now(),
                steamID: steamIDStr
            })
            
            this.emit('friendMessage', steamIDStr, message.message)
        })

        this.client.chat.on('friendTyping', (message) => {
            this.emit('friendTyping', message.steamid_friend.toString())
        })

        this.client.on('friendRelationship', (steamID: unknown, relationship: number) => {
            this.emit('friendRelationship', (steamID as any).toString(), relationship)
        })

        this.client.on('friendsList', () => {
            this.emit('friendsList')
        })

        this.client.on('user', (steamID: unknown, user: unknown) => {
            this.emit('user', (steamID as any).toString(), user)
        })
    }

    async login(): Promise<void> {
        try {
            const maFileData = JSON.parse(this.config.maFile)
            
            // Try to generate 2FA code upfront
            let twoFactorCode: string | undefined
            try {
                twoFactorCode = SteamTotp.generateAuthCode(maFileData.shared_secret)
            } catch (err) {
                console.warn('Could not generate 2FA code upfront, will handle via steamGuard event:', err)
            }
            
            const loginOptions: SteamUser.LogOnDetailsNamePass = {
                accountName: this.config.userName,
                password: this.config.password,
            }

            // Add 2FA code if we generated it successfully
            if (twoFactorCode) {
                loginOptions.twoFactorCode = twoFactorCode
            }

            // Note: Proxy configuration needs to be set via SteamUser options
            if (this.config.proxy) {
                // This should be configured in the SteamUser constructor instead
                console.warn('Proxy configuration should be set via SteamUser constructor options')
            }

            return new Promise((resolve, reject) => {
                let steamGuardAttempts = 0
                const maxAttempts = 3
                
                // Handle Steam Guard event - provide 2FA code when requested
                const steamGuardHandler = (_domain: string | null, callback: (code: string) => void, lastCodeWrong: boolean) => {
                    try {
                        steamGuardAttempts++
                        
                        if (lastCodeWrong && steamGuardAttempts >= maxAttempts) {
                            reject(new Error(`Steam Guard code was rejected after ${maxAttempts} attempts`))
                            return
                        }
                        
                        // Generate 2FA code with time offset for retries
                        let authCode: string
                        if (lastCodeWrong) {
                            console.warn(`Steam Guard code rejected, attempt ${steamGuardAttempts}/${maxAttempts}, trying with time offset...`)
                            // Try with different time offsets to handle clock drift
                            const offset = steamGuardAttempts === 2 ? 30 : -30 // Try +30s and -30s offsets
                            authCode = SteamTotp.generateAuthCode(maFileData.shared_secret, offset)
                        } else {
                            authCode = SteamTotp.generateAuthCode(maFileData.shared_secret)
                        }
                        
                        callback(authCode)
                    } catch (err) {
                        reject(new Error(`Failed to generate Steam Guard code: ${err}`))
                    }
                }

                // Set up event handlers
                this.client.on('steamGuard', steamGuardHandler)
                
                const successHandler = () => {
                    // Clean up handlers on success
                    this.client.off('steamGuard', steamGuardHandler)
                    this.client.off('error', errorHandler)
                    resolve()
                }

                const errorHandler = (err: Error) => {
                    // Clean up handlers on error
                    this.client.off('steamGuard', steamGuardHandler)
                    this.client.off('loggedOn', successHandler)
                    reject(err)
                }

                this.client.once('loggedOn', successHandler)
                this.client.once('error', errorHandler)

                // Initiate login
                this.client.logOn(loginOptions)
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
            this.client.addFriend(steamID, (err: Error | null) => {
                if (err) reject(err)
                else resolve()
            })
        })
    }

    async removeFriend(steamID: string): Promise<void> {
        return new Promise((resolve) => {
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
        return new Promise((resolve) => {
            // Store outgoing message in chat history
            if (!this.chatHistories.has(steamID)) {
                this.chatHistories.set(steamID, [])
            }
            this.chatHistories.get(steamID)!.push({
                direction: 'outgoing',
                message,
                timestamp: Date.now(),
                steamID: steamID
            })
            
            this.client.chat.sendFriendMessage(steamID, message)
            resolve()
        })
    }

    getPersonaState(): number {
        return (this.client as unknown as Record<string, unknown>).personaState as number || 0
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

    getAllChatHistories(): Array<{steamID: string, messages: Array<{direction: string, message: string, timestamp: number}>}> {
        const histories: Array<{steamID: string, messages: Array<{direction: string, message: string, timestamp: number}>}> = []
        
        for (const [steamID, messages] of this.chatHistories.entries()) {
            histories.push({
                steamID,
                messages: messages.map(msg => ({
                    direction: msg.direction,
                    message: msg.message,
                    timestamp: msg.timestamp
                }))
            })
        }
        
        return histories
    }

    getChatHistory(steamID: string): {steamID: string, messages: Array<{direction: string, message: string, timestamp: number, steamID: string}>} {
        const messages = this.chatHistories.get(steamID) || []
        return {
            steamID,
            messages: [...messages] // Return a copy
        }
    }
}

export function createSteamAgent(config: SteamAgentConfig): SteamAgent {
    return new SteamAgent(config)
}
