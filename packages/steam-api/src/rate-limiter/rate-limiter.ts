import PQueue from 'p-queue'
import { RateLimitConfig } from '../types'

export class RateLimiter {
    private queues = new Map<string, PQueue>()
    private config: Required<RateLimitConfig>

    constructor(config: RateLimitConfig = {}) {
        this.config = {
            messagesPerSecond: config.messagesPerSecond || 1,
            friendRequestsPerMinute: config.friendRequestsPerMinute || 1,
            windowMs: config.windowMs || 1000
        }
    }

    private getQueue(key: string, interval: number): PQueue {
        if (!this.queues.has(key)) {
            this.queues.set(key, new PQueue({
                concurrency: 1,
                interval,
                intervalCap: 1
            }))
        }
        return this.queues.get(key)!
    }

    async executeMessage<T>(
        accountId: string,
        steamId: string,
        task: () => Promise<T>
    ): Promise<T> {
        const key = `msg:${accountId}:${steamId}`
        const queue = this.getQueue(key, 1000 / this.config.messagesPerSecond)
        
        return queue.add(task) as Promise<T>
    }

    async executeFriendRequest<T>(
        accountId: string,
        task: () => Promise<T>
    ): Promise<T> {
        const key = `friend:${accountId}`
        const queue = this.getQueue(key, 60000 / this.config.friendRequestsPerMinute)
        
        return queue.add(task) as Promise<T>
    }

    async executeBatch<T>(
        key: string,
        tasks: Array<() => Promise<T>>,
        interval: number
    ): Promise<T[]> {
        const queue = this.getQueue(key, interval)
        
        return Promise.all(
            tasks.map(task => queue.add(task) as Promise<T>)
        )
    }

    getQueueSize(accountId: string, type: 'message' | 'friend' = 'message'): number {
        const prefix = type === 'message' ? 'msg:' : 'friend:'
        let size = 0
        
        for (const [key, queue] of this.queues) {
            if (key.startsWith(`${prefix}${accountId}`)) {
                size += queue.size
            }
        }
        
        return size
    }

    getQueueSizes(): Map<string, number> {
        const sizes = new Map<string, number>()
        
        for (const [key, queue] of this.queues) {
            sizes.set(key, queue.size)
        }
        
        return sizes
    }

    clearQueue(accountId: string, type?: 'message' | 'friend'): void {
        const prefix = type ? (type === 'message' ? 'msg:' : 'friend:') : ''
        
        for (const [key, queue] of this.queues) {
            if (key.startsWith(`${prefix}${accountId}`)) {
                queue.clear()
            }
        }
    }

    clearAllQueues(): void {
        for (const queue of this.queues.values()) {
            queue.clear()
        }
        this.queues.clear()
    }

}