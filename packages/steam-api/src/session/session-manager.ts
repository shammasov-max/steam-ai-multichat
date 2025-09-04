import SteamUser from 'steam-user'
import SteamCommunity from 'steamcommunity'
import { EventEmitter } from 'events'
import { AccountConfig, SteamSession, SessionStatus } from '../types'
import { MaFileHandler } from '../auth/mafile-handler'

export class SessionManager extends EventEmitter {
    private sessions = new Map<string, SteamSession>()
    private reconnectTimers = new Map<string, NodeJS.Timeout>()
    private reconnectAttempts = new Map<string, number>()

    async createSession(accountId: string, config: AccountConfig): Promise<SteamSession> {
        // Clean up existing session if any
        await this.destroySession(accountId)

        const maFileHandler = new MaFileHandler(config.maFile)
        const client = new SteamUser()
        const community = new SteamCommunity()

        // Configure proxy if provided
        if (config.proxy) {
            client.setOption('httpProxy', config.proxy)
        }

        const session: SteamSession = {
            id: `session-${accountId}-${Date.now()}`,
            accountId,
            steamId: config.steamId,
            username: config.username,
            status: 'connecting',
            client,
            community,
            lastActivity: new Date()
        }

        this.sessions.set(accountId, session)
        this.setupEventHandlers(accountId, session, config)

        // Login with maFile
        return new Promise((resolve, reject) => {
            const loginTimeout = setTimeout(() => {
                session.status = 'error'
                session.error = 'Login timeout'
                reject(new Error('Login timeout after 30 seconds'))
            }, 30000)

            client.once('loggedOn', () => {
                clearTimeout(loginTimeout)
                session.status = 'online'
                this.emit('session:connected', { accountId, session })
                
                // Set up community session
                client.webLogOn()
            })

            client.once('webSession', (_sessionID: string, cookies: string[]) => {
                community.setCookies(cookies)
                session.community = community
                resolve(session)
            })

            client.once('error', (err: Error) => {
                clearTimeout(loginTimeout)
                session.status = 'error'
                session.error = err.message
                this.emit('session:error', { accountId, error: err })
                reject(err)
            })

            // Perform login
            client.logOn({
                accountName: maFileHandler.getAccountName(),
                twoFactorCode: maFileHandler.generateAuthCode(),
                machineName: `steam-api-${accountId}`
            })
        })
    }

    private setupEventHandlers(accountId: string, session: SteamSession, config: AccountConfig): void {
        const { client } = session

        client.on('disconnected', (eresult: number, msg?: string) => {
            session.status = 'offline'
            this.emit('session:disconnected', { accountId, eresult, msg })
            
            if (config.autoReconnect) {
                this.scheduleReconnect(accountId, config)
            }
        })

        client.chat.on('friendMessage', (message) => {
            session.lastActivity = new Date()
            this.emit('message:received', {
                accountId,
                steamId: message.steamid_friend.getSteamID64(),
                message: message.message,
                timestamp: new Date()
            })
        })

        client.on('friendRelationship', (steamID: unknown, relationship: number) => {
            if (relationship === SteamUser.EFriendRelationship.RequestRecipient) {
                this.emit('friend:request', {
                    accountId,
                    steamId: (steamID as any).getSteamID64(),
                    timestamp: new Date()
                })
            }
        })

        client.on('error', (err: Error) => {
            session.status = 'error'
            session.error = err.message
            this.emit('session:error', { accountId, error: err })
        })
    }

    private scheduleReconnect(accountId: string, config: AccountConfig): void {
        const attempts = this.reconnectAttempts.get(accountId) || 0
        const delay = Math.min(1000 * Math.pow(2, attempts), 60000) // Exponential backoff, max 1 minute

        const session = this.sessions.get(accountId)
        if (session) {
            session.status = 'reconnecting'
        }

        this.reconnectTimers.set(accountId, setTimeout(async () => {
            try {
                await this.createSession(accountId, config)
                this.reconnectAttempts.delete(accountId)
                this.emit('session:reconnected', { accountId })
            } catch {
                this.reconnectAttempts.set(accountId, attempts + 1)
                this.scheduleReconnect(accountId, config)
            }
        }, delay))
    }

    async destroySession(accountId: string): Promise<void> {
        // Clear reconnect timer
        const timer = this.reconnectTimers.get(accountId)
        if (timer) {
            clearTimeout(timer)
            this.reconnectTimers.delete(accountId)
        }

        // Get and clean up session
        const session = this.sessions.get(accountId)
        if (session) {
            if (session.client) {
                session.client.logOff()
                session.client.removeAllListeners()
            }
            this.sessions.delete(accountId)
            this.emit('session:destroyed', { accountId })
        }
    }

    getSession(accountId: string): SteamSession | undefined {
        return this.sessions.get(accountId)
    }

    getAllSessions(): Map<string, SteamSession> {
        return new Map(this.sessions)
    }

    getSessionStatus(accountId: string): SessionStatus | undefined {
        return this.sessions.get(accountId)?.status
    }

    isOnline(accountId: string): boolean {
        return this.getSessionStatus(accountId) === 'online'
    }
}