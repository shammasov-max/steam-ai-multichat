import { EventEmitter } from 'events'
import { Effect, Fiber, Stream } from 'effect'
import { SteamAgentConfig, Friend, ChatMessage } from './types'
import { 
    createSteamLayer, 
    SteamOperations, 
    SteamEvent,
    SteamEffectError 
} from './SteamAgentEffect'

/**
 * Backward-compatible wrapper for SteamAgentEffect
 * Provides the same API as the original SteamAgent but uses Effect internally
 */
export class SteamAgentEffectWrapper extends EventEmitter {
    private layer: ReturnType<typeof createSteamLayer>
    private config: SteamAgentConfig
    private isLoggedIn: boolean = false
    private eventSubscription: Fiber.RuntimeFiber<void, unknown> | null = null
    
    constructor(config: SteamAgentConfig) {
        super()
        this.config = config
        
        // Create Steam layer
        this.layer = createSteamLayer(config)
        
        // Start event stream processing
        this.startEventProcessing()
    }
    
    private startEventProcessing(): void {
        const self = this // Capture this reference
        const program = Effect.gen(function* () {
            const ops = yield* SteamOperations
            const stream = ops.getEventStream()
            
            yield* Stream.runForEach(stream, (event: SteamEvent) =>
                Effect.sync(() => {
                    switch (event._tag) {
                        case 'LoggedOn':
                            self.isLoggedIn = true
                            self.emit('loggedOn')
                            break
                        case 'Disconnected':
                            self.isLoggedIn = false
                            self.emit('disconnected', event.code, event.message)
                            break
                        case 'FriendMessage':
                            self.emit('friendMessage', event.steamId, event.message)
                            break
                        case 'FriendTyping':
                            self.emit('friendTyping', event.steamId)
                            break
                        case 'FriendRelationship':
                            self.emit('friendRelationship', event.steamId, event.relationship)
                            break
                        case 'Error':
                            self.emit('error', event.error)
                            break
                    }
                })
            )
        }).pipe(Effect.provide(this.layer))
        
        // Run event processing in background
        this.eventSubscription = Effect.runFork(program)
    }
    
    async login(): Promise<void> {
        // Connection is established automatically by the layer
        // Wait for logged on event
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Login timeout'))
            }, 30000)
            
            const successHandler = () => {
                clearTimeout(timeout)
                this.off('error', errorHandler)
                resolve()
            }
            
            const errorHandler = (err: Error) => {
                clearTimeout(timeout)
                this.off('loggedOn', successHandler)
                reject(err)
            }
            
            this.once('loggedOn', successHandler)
            this.once('error', errorHandler)
        })
    }
    
    logout(): void {
        if (this.eventSubscription) {
            Effect.runSync(Fiber.interrupt(this.eventSubscription))
            this.eventSubscription = null
        }
        this.isLoggedIn = false
    }
    
    async addFriend(steamID: string): Promise<void> {
        const program = Effect.gen(function* () {
            const ops = yield* SteamOperations
            yield* ops.addFriend(steamID)
        }).pipe(Effect.provide(this.layer))
        
        return Effect.runPromise(program)
    }
    
    async removeFriend(steamID: string): Promise<void> {
        const program = Effect.gen(function* () {
            const ops = yield* SteamOperations
            yield* ops.removeFriend(steamID)
        }).pipe(Effect.provide(this.layer))
        
        return Effect.runPromise(program)
    }
    
    getFriends(): Friend[] {
        const program = Effect.gen(function* () {
            const ops = yield* SteamOperations
            return yield* ops.getFriends()
        }).pipe(Effect.provide(this.layer))
        
        return Effect.runSync(program) as Friend[]
    }
    
    async sendMessage(steamID: string, message: string): Promise<void> {
        const program = Effect.gen(function* () {
            const ops = yield* SteamOperations
            yield* ops.sendMessage(steamID, message)
        }).pipe(Effect.provide(this.layer))
        
        return Effect.runPromise(program)
    }
    
    getIsLoggedIn(): boolean {
        return this.isLoggedIn
    }
    
    getChatHistory(steamID: string): { steamID: string; messages: ChatMessage[] } {
        const program = Effect.gen(function* () {
            const ops = yield* SteamOperations
            const messages = yield* ops.getChatHistory(steamID)
            return {
                steamID,
                messages: Array.from(messages)
            }
        }).pipe(Effect.provide(this.layer))
        
        return Effect.runSync(program)
    }
    
    getAllChatHistories(): Array<{ steamID: string; messages: ChatMessage[] }> {
        // This would need to be implemented in the Effect layer
        // For now, return empty array
        return []
    }
    
    // Additional methods for compatibility
    getPersonaState(): number {
        return 1 // Online
    }
    
    setPersonaState(state: number): void {
        // Would need to be implemented in Effect layer
    }
    
    getSteamID(): string | null {
        return this.config.userName // Approximation
    }
}

/**
 * Factory function for backward compatibility
 */
export function createSteamAgentEffect(config: SteamAgentConfig): SteamAgentEffectWrapper {
    return new SteamAgentEffectWrapper(config)
}