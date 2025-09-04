import { EventEmitter } from 'events'
import { SessionManager } from '../session/session-manager'
import { RateLimiter } from '../rate-limiter/rate-limiter'
import { MessageQueue, QueueConfig } from '../queues/message-queue'
import { AccountConfig, SteamSession, MessageOptions, RateLimitConfig } from '../types'

export interface SteamClientConfig {
    rateLimits?: RateLimitConfig
    queue?: QueueConfig
    autoReconnect?: boolean
}

export class SteamClient extends EventEmitter {
    private sessionManager: SessionManager
    private rateLimiter: RateLimiter
    private messageQueue: MessageQueue
    private config: SteamClientConfig

    constructor(config: SteamClientConfig = {}) {
        super()
        this.config = config
        
        this.sessionManager = new SessionManager()
        this.rateLimiter = new RateLimiter(config.rateLimits)
        this.messageQueue = new MessageQueue(
            this.sessionManager,
            this.rateLimiter,
            config.queue
        )

        this.setupEventForwarding()
    }

    private setupEventForwarding(): void {
        // Forward session events
        this.sessionManager.on('session:connected', (data) => {
            this.emit('account:connected', data)
        })

        this.sessionManager.on('session:disconnected', (data) => {
            this.emit('account:disconnected', data)
        })

        this.sessionManager.on('session:error', (data) => {
            this.emit('account:error', data)
        })

        this.sessionManager.on('session:reconnected', (data) => {
            this.emit('account:reconnected', data)
        })

        // Forward message events
        this.sessionManager.on('message:received', (data) => {
            this.emit('message:received', data)
        })

        // Forward friend events
        this.sessionManager.on('friend:request', (data) => {
            this.emit('friend:request', data)
        })
    }

    // Account Management
    async connectAccount(accountId: string, config: AccountConfig): Promise<SteamSession> {
        const accountConfig = {
            ...config,
            autoReconnect: config.autoReconnect ?? this.config.autoReconnect ?? true
        }
        
        const session = await this.sessionManager.createSession(accountId, accountConfig)
        this.emit('account:ready', { accountId, session })
        return session
    }

    async disconnectAccount(accountId: string): Promise<void> {
        await this.messageQueue.clearQueue(accountId)
        await this.sessionManager.destroySession(accountId)
    }

    getAccountSession(accountId: string): SteamSession | undefined {
        return this.sessionManager.getSession(accountId)
    }

    getAllAccountSessions(): Map<string, SteamSession> {
        return this.sessionManager.getAllSessions()
    }

    isAccountOnline(accountId: string): boolean {
        return this.sessionManager.isOnline(accountId)
    }

    // Messaging
    async sendMessage(options: MessageOptions): Promise<void> {
        await this.messageQueue.enqueueMessage(options)
    }

    async sendMessageImmediate(accountId: string, steamId: string, content: string): Promise<void> {
        const session = this.sessionManager.getSession(accountId)
        
        if (!session || session.status !== 'online') {
            throw new Error(`Account ${accountId} is not online`)
        }

        return this.rateLimiter.executeMessage(accountId, steamId, async () => {
            return new Promise((resolve, reject) => {
                try {
                    session.client.chat.sendFriendMessage(steamId, content)
                    resolve()
                } catch (err) {
                    reject(err)
                }
            })
        })
    }

    async sendMessageBatch(messages: MessageOptions[]): Promise<void> {
        await this.messageQueue.enqueueBatch(messages)
    }

    // Friend Management
    async acceptFriendRequest(accountId: string, steamId: string): Promise<void> {
        const session = this.sessionManager.getSession(accountId)
        
        if (!session || session.status !== 'online') {
            throw new Error(`Account ${accountId} is not online`)
        }

        return this.rateLimiter.executeFriendRequest(accountId, async () => {
            return new Promise((resolve, reject) => {
                session.client.addFriend(steamId, (err: Error | null) => {
                    if (err) reject(err)
                    else resolve()
                })
            })
        })
    }

    async removeFriend(accountId: string, steamId: string): Promise<void> {
        const session = this.sessionManager.getSession(accountId)
        
        if (!session || session.status !== 'online') {
            throw new Error(`Account ${accountId} is not online`)
        }

        session.client.removeFriend(steamId)
    }

    async blockUser(accountId: string, steamId: string): Promise<void> {
        const session = this.sessionManager.getSession(accountId)
        
        if (!session || session.status !== 'online') {
            throw new Error(`Account ${accountId} is not online`)
        }

        return new Promise((resolve, reject) => {
            session.client.blockUser(steamId, (err: Error | null) => {
                if (err) reject(err)
                else resolve()
            })
        })
    }

    // Queue Management
    async getQueueStatus(accountId: string, steamId?: string) {
        return this.messageQueue.getQueueStatus(accountId, steamId)
    }

    async pauseMessageQueue(accountId: string): Promise<void> {
        return this.messageQueue.pauseQueue(accountId)
    }

    async resumeMessageQueue(accountId: string): Promise<void> {
        return this.messageQueue.resumeQueue(accountId)
    }

    async clearMessageQueue(accountId: string, steamId?: string): Promise<void> {
        return this.messageQueue.clearQueue(accountId, steamId)
    }

    // Rate Limit Info
    getQueueSizes(): Map<string, number> {
        return this.rateLimiter.getQueueSizes()
    }

    getMessageQueueSize(accountId: string): number {
        return this.rateLimiter.getQueueSize(accountId, 'message')
    }

    getFriendQueueSize(accountId: string): number {
        return this.rateLimiter.getQueueSize(accountId, 'friend')
    }

    // Cleanup
    async shutdown(): Promise<void> {
        // Disconnect all accounts
        const sessions = this.sessionManager.getAllSessions()
        for (const [accountId] of sessions) {
            await this.disconnectAccount(accountId)
        }

        // Close message queue
        await this.messageQueue.close()

        // Clear rate limiter
        this.rateLimiter.clearAllQueues()

        this.removeAllListeners()
    }
}