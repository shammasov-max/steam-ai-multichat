import { Effect, Context, Layer, Stream, Queue, Ref, Duration, Fiber } from 'effect'
import * as Http from '@effect/platform/HttpServer'
import * as HttpRouter from '@effect/platform/HttpRouter'
import * as HttpServerRequest from '@effect/platform/HttpServerRequest'
import * as HttpServerResponse from '@effect/platform/HttpServerResponse'
import * as HttpMiddleware from '@effect/platform/HttpMiddleware'
import * as NodePlatform from '@effect/platform-node'
import { ConfigService } from '@packages/isomorphic/config/ConfigService'
import { Logger } from '@packages/isomorphic/utils/LoggerService'
import { 
    createService, 
    createServiceError,
    RateLimiter,
    RateLimiterLive,
    withLogging,
    withRateLimit
} from '@packages/isomorphic/effect-patterns'
import { createRoutes } from './routes'
import { SSEManager } from './sse'

// ============================================================================
// Error Types (using new pattern)
// ============================================================================

export const ServerError = createServiceError('Server')
export const SSEError = createServiceError('SSE')
export const WebSocketError = createServiceError('WebSocket')

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ServerConfig {
    readonly port: number
    readonly host: string
    readonly cors: {
        readonly enabled: boolean
        readonly origins: readonly string[]
    }
    readonly rateLimit?: {
        readonly requestsPerMinute: number
        readonly requestsPerIP: number
    }
}

export interface HealthStatus {
    readonly status: 'healthy' | 'degraded' | 'unhealthy'
    readonly uptime: number
    readonly version: string
    readonly services: Record<string, boolean>
    readonly metrics: {
        readonly activeConnections: number
        readonly requestsPerMinute: number
        readonly memoryUsage: number
    }
}

// ============================================================================
// Service Interface
// ============================================================================

export interface ServerServiceOps {
    readonly start: () => Effect.Effect<void, InstanceType<typeof ServerError>>
    readonly stop: () => Effect.Effect<void, InstanceType<typeof ServerError>>
    readonly restart: () => Effect.Effect<void, InstanceType<typeof ServerError>>
    readonly getHealth: () => Effect.Effect<HealthStatus>
    readonly getMetrics: () => Effect.Effect<Record<string, unknown>>
}

export class ServerService extends Context.Tag('ServerService')<
    ServerService,
    ServerServiceOps
>() {}

// ============================================================================
// Implementation
// ============================================================================

const makeServerService = Effect.gen(function* () {
    const logger = yield* Logger
    const config = yield* ConfigService
    const rateLimiter = yield* RateLimiter
    const sseManager = yield* SSEManager
    
    // Internal state
    const serverFiber = yield* Ref.make<Fiber.RuntimeFiber<never, any> | null>(null)
    const startTime = Date.now()
    const requestCounter = yield* Ref.make(0)
    
    // Get server configuration
    const serverConfig = yield* config.getServer()
    
    // Create HTTP app with middleware
    const app = createRoutes({
        sseManager,
        requestCounter,
        startTime
    }).pipe(
        // Apply CORS if enabled
        serverConfig.cors.enabled
            ? HttpMiddleware.cors({
                allowedOrigins: serverConfig.cors.origins,
                allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization'],
                credentials: true
            })
            : (x: any) => x,
        
        // Add logging
        HttpMiddleware.logger
    )
    
    // Service operations
    return {
        start: () =>
            withLogging(
                Effect.gen(function* () {
                    const fiber = yield* Ref.get(serverFiber)
                    if (fiber) {
                        return yield* Effect.fail(
                            ServerError.create('start', 'Server already running')
                        )
                    }
                    
                    // Start SSE heartbeat
                    yield* sseManager.startHeartbeat()
                    
                    // Create and start server
                    const serverFiberInstance = yield* NodePlatform.HttpServer.serve(app, {
                        port: serverConfig.port
                    }).pipe(Effect.fork)
                    
                    yield* Ref.set(serverFiber, serverFiberInstance)
                    yield* logger.info(`Server started on ${serverConfig.host}:${serverConfig.port}`)
                }),
                'ServerStart'
            ),
        
        stop: () =>
            withLogging(
                Effect.gen(function* () {
                    const fiber = yield* Ref.get(serverFiber)
                    if (!fiber) {
                        return yield* Effect.fail(
                            ServerError.create('stop', 'Server not running')
                        )
                    }
                    
                    yield* Fiber.interrupt(fiber)
                    yield* Ref.set(serverFiber, null)
                    yield* sseManager.stopHeartbeat()
                    yield* logger.info('Server stopped')
                }),
                'ServerStop'
            ),
        
        restart: () =>
            Effect.gen(function* () {
                const service = yield* ServerService
                yield* service.stop().pipe(Effect.orElse(() => Effect.void))
                yield* service.start()
                yield* logger.info('Server restarted')
            }),
        
        getHealth: () =>
            Effect.gen(function* () {
                const fiber = yield* Ref.get(serverFiber)
                const clients = yield* sseManager.getClientCount()
                const requests = yield* Ref.get(requestCounter)
                
                return {
                    status: fiber ? 'healthy' : 'unhealthy',
                    uptime: Date.now() - startTime,
                    version: '1.0.0',
                    services: {
                        server: !!fiber,
                        sse: true,
                        websocket: false
                    },
                    metrics: {
                        activeConnections: clients,
                        requestsPerMinute: Math.round(requests / ((Date.now() - startTime) / 60000)),
                        memoryUsage: process.memoryUsage().heapUsed
                    }
                } as HealthStatus
            }),
        
        getMetrics: () =>
            Effect.gen(function* () {
                const health = yield* this.getHealth()
                return {
                    ...health.metrics,
                    uptime: health.uptime,
                    status: health.status
                }
            })
    } as ServerServiceOps
})

// ============================================================================
// Layer Creation
// ============================================================================

export const ServerServiceLive = Layer.scoped(
    ServerService,
    Effect.gen(function* () {
        const service = yield* makeServerService
        
        // Add cleanup finalizer
        yield* Effect.addFinalizer(() =>
            Effect.gen(function* () {
                yield* service.stop().pipe(Effect.orElse(() => Effect.void))
                yield* Effect.logInfo('Server service cleaned up')
            })
        )
        
        return service
    })
).pipe(
    Layer.provide(SSEManagerLive),
    Layer.provide(RateLimiterLive({
        maxRequests: 100,
        window: Duration.minutes(1)
    }))
)

// ============================================================================
// SSE Manager Service (extracted)
// ============================================================================

export interface SSEClient {
    readonly id: string
    readonly response: HttpServerResponse.HttpServerResponse
    readonly connected: boolean
    readonly lastPing: number
}

export interface SSEManagerOps {
    readonly addClient: (client: SSEClient) => Effect.Effect<void>
    readonly removeClient: (clientId: string) => Effect.Effect<void>
    readonly broadcast: (event: string, data: unknown) => Effect.Effect<void>
    readonly send: (clientId: string, event: string, data: unknown) => Effect.Effect<void, InstanceType<typeof SSEError>>
    readonly getClientCount: () => Effect.Effect<number>
    readonly startHeartbeat: () => Effect.Effect<Fiber.RuntimeFiber<never, never>>
    readonly stopHeartbeat: () => Effect.Effect<void>
}

export class SSEManager extends Context.Tag('SSEManager')<SSEManager, SSEManagerOps>() {}

const SSEManagerLive = createService(SSEManager, {
    name: 'SSEManager',
    operations: ({ logger, state }) =>
        Effect.gen(function* () {
            const clients = yield* state<Map<string, SSEClient>>(new Map())
            const heartbeatFiber = yield* state<Fiber.RuntimeFiber<never, never> | null>(null)
            
            const heartbeat = Effect.gen(function* () {
                while (true) {
                    yield* Effect.sleep(Duration.seconds(30))
                    const clientsMap = yield* Ref.get(clients)
                    
                    for (const [id, client] of clientsMap) {
                        if (!client.connected || Date.now() - client.lastPing > 60000) {
                            yield* Ref.update(clients, map => {
                                const newMap = new Map(map)
                                newMap.delete(id)
                                return newMap
                            })
                            yield* logger.info(`SSE client disconnected: ${id}`)
                        }
                    }
                }
            })
            
            return {
                addClient: (client) =>
                    Ref.update(clients, map => {
                        const newMap = new Map(map)
                        newMap.set(client.id, client)
                        return newMap
                    }),
                
                removeClient: (clientId) =>
                    Ref.update(clients, map => {
                        const newMap = new Map(map)
                        newMap.delete(clientId)
                        return newMap
                    }),
                
                broadcast: (event, data) =>
                    Effect.gen(function* () {
                        const clientsMap = yield* Ref.get(clients)
                        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
                        
                        yield* Effect.all(
                            Array.from(clientsMap.values()).map(client =>
                                Effect.try({
                                    try: () => {
                                        // Write to response stream
                                        return true
                                    },
                                    catch: (error) =>
                                        SSEError.create('broadcast', 'Failed to send message', error, {
                                            clientId: client.id
                                        })
                                })
                            ),
                            { concurrency: 'unbounded' }
                        )
                    }),
                
                send: (clientId, event, data) =>
                    Effect.gen(function* () {
                        const clientsMap = yield* Ref.get(clients)
                        const client = clientsMap.get(clientId)
                        
                        if (!client) {
                            return yield* Effect.fail(
                                SSEError.create('send', `Client not found: ${clientId}`)
                            )
                        }
                        
                        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
                        // Write to specific client's response stream
                    }),
                
                getClientCount: () =>
                    Effect.map(Ref.get(clients), map => map.size),
                
                startHeartbeat: () =>
                    Effect.gen(function* () {
                        const fiber = yield* Effect.fork(heartbeat)
                        yield* Ref.set(heartbeatFiber, fiber)
                        return fiber
                    }),
                
                stopHeartbeat: () =>
                    Effect.gen(function* () {
                        const fiber = yield* Ref.get(heartbeatFiber)
                        if (fiber) {
                            yield* Fiber.interrupt(fiber)
                            yield* Ref.set(heartbeatFiber, null)
                        }
                    })
            }
        })
})