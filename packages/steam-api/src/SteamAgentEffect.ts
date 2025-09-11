import { Effect, Context, Layer, Schema, Queue, Stream, Scope, Pool } from 'effect'
import SteamUser from 'steam-user'
import SteamTotp from 'steam-totp'
import { SimpleLogger } from '@packages/isomorphic'
import { SteamAgentConfig, Friend, ChatMessage } from './types'

// Error types
export class SteamEffectError extends Schema.TaggedError<SteamEffectError>()('SteamEffectError', {
    operation: Schema.String,
    message: Schema.String,
    code: Schema.optional(Schema.Number)
}) {}

export class SteamAuthError extends Schema.TaggedError<SteamAuthError>()('SteamAuthError', {
    message: Schema.String,
    attempts: Schema.Number
}) {}

// Event types
export type SteamEvent = 
    | { _tag: 'LoggedOn'; steamId: string }
    | { _tag: 'Disconnected'; code: number; message: string }
    | { _tag: 'FriendMessage'; steamId: string; message: string }
    | { _tag: 'FriendTyping'; steamId: string }
    | { _tag: 'FriendRelationship'; steamId: string; relationship: number }
    | { _tag: 'Error'; error: Error }

// Steam connection state
export interface SteamConnection {
    readonly client: SteamUser
    readonly config: SteamAgentConfig
    readonly steamId: string
    readonly isLoggedIn: boolean
    readonly events: Queue.Queue<SteamEvent>
    readonly chatHistory: Map<string, ChatMessage[]>
}

// Services
export class SteamConfig extends Context.Tag('SteamConfig')<SteamConfig, SteamAgentConfig>() {}

export class SteamConnectionService extends Context.Tag('SteamConnection')<SteamConnectionService, SteamConnection>() {}

export class SteamConnectionPool extends Context.Tag('SteamConnectionPool')<SteamConnectionPool, {
    acquire: (config: SteamAgentConfig) => Effect.Effect<SteamConnection, SteamEffectError, Scope.Scope>
    release: (steamId: string) => Effect.Effect<void, never>
    getAll: () => Effect.Effect<readonly SteamConnection[], never>
}>() {}

// Helper functions
const trySteam = <A>(operation: string, fn: () => Promise<A>) =>
    Effect.tryPromise({
        try: fn,
        catch: (e) => new SteamEffectError({ operation, message: String(e) })
    })

const generateAuthCode = (secret: string, offset?: number) =>
    Effect.try({
        try: () => SteamTotp.generateAuthCode(secret, offset),
        catch: (e) => new SteamAuthError({ message: String(e), attempts: 1 })
    })

// Create Steam client with Effect
const createSteamClient = (config: SteamAgentConfig) =>
    Effect.gen(function* () {
        const logger = new SimpleLogger('SteamEffect')
        const client = new SteamUser()
        const events = yield* Queue.unbounded<SteamEvent>()
        const chatHistory = new Map<string, ChatMessage[]>()
        
        // Setup event handlers
        client.on('loggedOn', () => {
            Queue.unsafeOffer(events, { _tag: 'LoggedOn', steamId: client.steamID?.toString() || '' })
        })
        
        client.on('disconnected', (code: number, msg?: string) => {
            Queue.unsafeOffer(events, { _tag: 'Disconnected', code, message: msg || '' })
        })
        
        client.on('error', (err: Error) => {
            Queue.unsafeOffer(events, { _tag: 'Error', error: err })
        })
        
        client.chat.on('friendMessage', (msg: any) => {
            const steamId = msg.steamid_friend.toString()
            const message = msg.message
            
            // Store in chat history
            if (!chatHistory.has(steamId)) {
                chatHistory.set(steamId, [])
            }
            chatHistory.get(steamId)!.push({
                steamID: steamId,
                message,
                timestamp: Date.now(),
                direction: 'incoming'
            })
            
            Queue.unsafeOffer(events, { _tag: 'FriendMessage', steamId, message })
        })
        
        client.chat.on('friendTyping', (msg: any) => {
            Queue.unsafeOffer(events, { _tag: 'FriendTyping', steamId: msg.steamid_friend.toString() })
        })
        
        client.on('friendRelationship', (steamID: any, relationship: number) => {
            Queue.unsafeOffer(events, { 
                _tag: 'FriendRelationship', 
                steamId: steamID.toString(), 
                relationship 
            })
        })
        
        // Login with retry logic
        const maFile = JSON.parse(config.maFile)
        
        yield* Effect.async<void, SteamEffectError>((resume) => {
            let attempts = 0
            const maxAttempts = 3
            
            const steamGuardHandler = (_: any, callback: (code: string) => void, lastWrong: boolean) => {
                attempts++
                if (lastWrong && attempts >= maxAttempts) {
                    resume(Effect.fail(new SteamEffectError({
                        operation: 'login',
                        message: `Steam Guard failed after ${maxAttempts} attempts`
                    })))
                    return
                }
                
                const offset = lastWrong ? (attempts === 2 ? 30 : -30) : undefined
                try {
                    const code = SteamTotp.generateAuthCode(maFile.shared_secret, offset)
                    callback(code)
                } catch (e) {
                    resume(Effect.fail(new SteamEffectError({
                        operation: 'generateAuthCode',
                        message: String(e)
                    })))
                }
            }
            
            client.on('steamGuard', steamGuardHandler)
            
            client.once('loggedOn', () => {
                client.off('steamGuard', steamGuardHandler)
                logger.info('Steam logged on', { steamId: client.steamID?.toString() })
                resume(Effect.void)
            })
            
            client.once('error', (err: Error) => {
                client.off('steamGuard', steamGuardHandler)
                resume(Effect.fail(new SteamEffectError({
                    operation: 'login',
                    message: err.message
                })))
            })
            
            // Generate initial auth code
            const authCode = SteamTotp.generateAuthCode(maFile.shared_secret)
            
            client.logOn({
                accountName: config.userName,
                password: config.password,
                twoFactorCode: authCode
            })
        })
        
        return {
            client,
            config,
            steamId: client.steamID?.toString() || '',
            isLoggedIn: true,
            events,
            chatHistory
        } as SteamConnection
    })

// Steam Connection Layer
export const SteamConnectionLive = Layer.scoped(
    SteamConnectionService,
    Effect.gen(function* () {
        const config = yield* SteamConfig
        
        // Create resilience components - disabled for now
        // Resilience removed - not needed for happy path
        const connection = yield* createSteamClient(config)
        
        // Register cleanup
        yield* Effect.addFinalizer(() =>
            Effect.sync(() => {
                connection.client.logOff()
                new SimpleLogger('SteamEffect').info('Steam disconnected', { steamId: connection.steamId })
            })
        )
        
        return connection
    })
)

// Connection Pool Layer
export const SteamConnectionPoolLive = Layer.effect(
    SteamConnectionPool,
    Effect.gen(function* () {
        const logger = new SimpleLogger('SteamPool')
        const connections = new Map<string, SteamConnection>()
        const connectionPools = new Map<string, Pool.Pool<SteamConnection, SteamEffectError>>()
        
        return {
            acquire: (config: SteamAgentConfig) =>
                Effect.gen(function* () {
                    const key = `${config.userName}`
                    
                    // Check if we already have a pool for this config
                    let pool = connectionPools.get(key)
                    
                    if (!pool) {
                        // Create a new pool for this configuration
                        pool = yield* Pool.make({
                            acquire: createSteamClient(config),
                            size: 1 // One connection per account
                        })
                        connectionPools.set(key, pool!)
                    }
                    
                    const connection = yield* Pool.get(pool!)
                    connections.set(connection.steamId, connection)
                    
                    logger.info('Connection acquired', { 
                        steamId: connection.steamId, 
                        userName: config.userName 
                    })
                    
                    return connection
                }),
            
            release: (steamId: string) =>
                Effect.gen(function* () {
                    const connection = connections.get(steamId)
                    if (connection) {
                        connection.client.logOff()
                        connections.delete(steamId)
                        logger.info('Connection released', { steamId })
                    }
                }),
            
            getAll: () => Effect.succeed(Array.from(connections.values()))
        }
    })
)

// High-level Steam operations
export class SteamOperations extends Context.Tag('SteamOperations')<SteamOperations, {
    sendMessage: (steamId: string, message: string) => Effect.Effect<void, SteamEffectError>
    addFriend: (steamId: string) => Effect.Effect<void, SteamEffectError>
    removeFriend: (steamId: string) => Effect.Effect<void, SteamEffectError>
    getFriends: () => Effect.Effect<readonly Friend[], SteamEffectError>
    getChatHistory: (steamId: string) => Effect.Effect<readonly ChatMessage[], never>
    getEventStream: () => Stream.Stream<SteamEvent, never>
}>() {}

export const SteamOperationsLive = Layer.effect(
    SteamOperations,
    Effect.gen(function* () {
        const connection = yield* SteamConnectionService
        
        return {
            sendMessage: (steamId: string, message: string) =>
                Effect.gen(function* () {
                    // Store in chat history
                    if (!connection.chatHistory.has(steamId)) {
                        connection.chatHistory.set(steamId, [])
                    }
                    connection.chatHistory.get(steamId)!.push({
                        steamID: steamId,
                        message,
                        timestamp: Date.now(),
                        direction: 'outgoing'
                    })
                    
                    yield* trySteam('sendMessage', async () => {
                        connection.client.chat.sendFriendMessage(steamId, message)
                    })
                }),
            
            addFriend: (steamId: string) =>
                Effect.async<void, SteamEffectError>((resume) => {
                    connection.client.addFriend(steamId, (err: Error | null) => {
                        if (err) {
                            resume(Effect.fail(new SteamEffectError({
                                operation: 'addFriend',
                                message: err.message
                            })))
                        } else {
                            resume(Effect.void)
                        }
                    })
                }),
            
            removeFriend: (steamId: string) =>
                Effect.sync(() => {
                    connection.client.removeFriend(steamId)
                }),
            
            getFriends: () =>
                Effect.sync(() => {
                    const friends: Friend[] = []
                    const myFriends = connection.client.myFriends || {}
                    
                    for (const [steamId, relationship] of Object.entries(myFriends)) {
                        const user = connection.client.users[steamId]
                        friends.push({
                            steamID: steamId,
                            personaName: user?.player_name || 'Unknown',
                            avatarHash: user?.avatar_hash || '',
                            relationship: relationship as number,
                            personaState: user?.persona_state || 0
                        })
                    }
                    
                    return friends
                }),
            
            getChatHistory: (steamId: string) =>
                Effect.succeed(connection.chatHistory.get(steamId) || []),
            
            getEventStream: () =>
                Stream.fromQueue(connection.events)
        }
    })
)

// Complete Steam Layer
export const createSteamLayer = (config: SteamAgentConfig) => {
    const configLayer = Layer.succeed(SteamConfig, config)
    const connectionLayer = SteamConnectionLive.pipe(Layer.provide(configLayer))
    const operationsLayer = SteamOperationsLive.pipe(Layer.provide(connectionLayer))
    
    return Layer.mergeAll(
        configLayer,
        connectionLayer,
        operationsLayer
    )
}

// Helper to run with Steam
export const runWithSteam = <R, E, A>(
    config: SteamAgentConfig,
    program: Effect.Effect<A, E, SteamOperations | R>
) =>
    program.pipe(Effect.provide(createSteamLayer(config)))

// Pool-based helper for multiple accounts
export const runWithSteamPool = <R, E, A>(
    program: Effect.Effect<A, E, SteamConnectionPool | R>
) =>
    program.pipe(Effect.provide(SteamConnectionPoolLive))