import PQueue from 'p-queue'
import { MessageOptions } from '../types'
import { SessionManager } from '../session/session-manager'
import { RateLimiter } from '../rate-limiter/rate-limiter'

export interface QueueConfig {
    concurrency?: number
    interval?: number
    intervalCap?: number
}

export class MessageQueue {
    private queues = new Map<string, PQueue>()
    private sessionManager: SessionManager
    private rateLimiter: RateLimiter
    private config: QueueConfig

    constructor(
        sessionManager: SessionManager,
        rateLimiter: RateLimiter,
        config: QueueConfig = {}
    ) {
        this.sessionManager = sessionManager
        this.rateLimiter = rateLimiter
        this.config = {
            concurrency: 1,
            interval: 1000,
            intervalCap: 1,
            ...config
        }
    }

    private getQueue(key: string): PQueue {
        if (!this.queues.has(key)) {
            const queueOptions: any = {}
            if (this.config.concurrency !== undefined) {
                queueOptions.concurrency = this.config.concurrency
            }
            if (this.config.interval !== undefined) {
                queueOptions.interval = this.config.interval
            }
            if (this.config.intervalCap !== undefined) {
                queueOptions.intervalCap = this.config.intervalCap
            }
            const queue = new PQueue(queueOptions)

            this.queues.set(key, queue)
        }

        return this.queues.get(key)!
    }

    async enqueueMessage(options: MessageOptions): Promise<void> {
        const { accountId, steamId } = options
        const key = `messages:${accountId}:${steamId}`
        const queue = this.getQueue(key)

        const task = async () => {
            return this.rateLimiter.executeMessage(
                accountId,
                steamId,
                () => this.sendMessage(accountId, steamId, options.content)
            )
        }

        const priority = options.priority === 'high' ? 10 : options.priority === 'low' ? 1 : 5
        
        return queue.add(task, { priority })
    }

    async enqueueBatch(messages: MessageOptions[]): Promise<void[]> {
        const promises: Promise<void>[] = []

        for (const message of messages) {
            const promise = this.enqueueMessage(message)
            promises.push(promise)
        }

        return Promise.all(promises)
    }

    private async sendMessage(accountId: string, steamId: string, content: string): Promise<void> {
        const session = this.sessionManager.getSession(accountId)
        
        if (!session) {
            throw new Error(`No session found for account ${accountId}`)
        }

        if (session.status !== 'online') {
            throw new Error(`Account ${accountId} is not online (status: ${session.status})`)
        }

        return new Promise((resolve, reject) => {
            try {
                session.client.chat.sendFriendMessage(steamId, content)
                resolve()
            } catch (err) {
                reject(err)
            }
        })
    }

    async getQueueStatus(accountId: string, steamId?: string): Promise<{
        pending: number
        size: number
        isPaused: boolean
    }> {
        const key = steamId 
            ? `messages:${accountId}:${steamId}`
            : `messages:${accountId}:*`

        let pending = 0
        let size = 0
        let isPaused = false

        for (const [queueKey, queue] of this.queues) {
            if (queueKey.startsWith(key.replace('*', ''))) {
                pending += queue.pending
                size += queue.size
                if (queue.isPaused) {
                    isPaused = true
                }
            }
        }

        return { pending, size, isPaused }
    }

    async clearQueue(accountId: string, steamId?: string): Promise<void> {
        const key = steamId 
            ? `messages:${accountId}:${steamId}`
            : `messages:${accountId}:*`

        for (const [queueKey, queue] of this.queues) {
            if (queueKey.startsWith(key.replace('*', ''))) {
                queue.clear()
            }
        }
    }

    async pauseQueue(accountId: string): Promise<void> {
        for (const [key, queue] of this.queues) {
            if (key.startsWith(`messages:${accountId}:`)) {
                queue.pause()
            }
        }
    }

    async resumeQueue(accountId: string): Promise<void> {
        for (const [key, queue] of this.queues) {
            if (key.startsWith(`messages:${accountId}:`)) {
                queue.start()
            }
        }
    }

    async close(): Promise<void> {
        for (const queue of this.queues.values()) {
            queue.clear()
            queue.pause()
        }
        
        this.queues.clear()
    }
}