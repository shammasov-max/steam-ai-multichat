import { Effect, Context, Layer, Data, Stream, Queue, Schedule, Ref, Duration, Fiber } from 'effect'
import * as Http from '@effect/platform/HttpServer'
import * as HttpError from '@effect/platform/HttpServerError'
import * as HttpRouter from '@effect/platform/HttpRouter'
import * as HttpServerRequest from '@effect/platform/HttpServerRequest'
import * as HttpServerResponse from '@effect/platform/HttpServerResponse'
import * as HttpMiddleware from '@effect/platform/HttpMiddleware'
import * as NodePlatform from '@effect/platform-node'
import { createServer } from 'http'
import { ConfigService } from '@packages/isomorphic/config/ConfigService'
import { Logger } from '@packages/isomorphic/utils/LoggerService'
import { ReduxService } from '@packages/isomorphic/effect-redux/ReduxService'

// ============================================================================
// Error Types
// ============================================================================

export class ServerError extends Data.TaggedError('ServerError')<{
    readonly operation: string
    readonly message: string
    readonly cause?: unknown
}> {}

export class SSEError extends Data.TaggedError('SSEError')<{
    readonly clientId: string
    readonly message: string
    readonly cause?: unknown
}> {}

export class RateLimitError extends Data.TaggedError('RateLimitError')<{
    readonly endpoint: string
    readonly limit: number
    readonly window: string
}> {}

export class WebSocketError extends Data.TaggedError('WebSocketError')<{
    readonly connectionId: string
    readonly message: string
    readonly cause?: unknown
}> {}

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

export interface SSEClient {
    readonly id: string
    readonly response: HttpServerResponse.HttpServerResponse
    readonly connected: boolean
    readonly lastPing: number
}

export interface RateLimitEntry {
    readonly count: number
    readonly resetAt: number
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
    // Server lifecycle
    readonly start: () => Effect.Effect<void, ServerError>
    readonly stop: () => Effect.Effect<void, ServerError>
    readonly restart: () => Effect.Effect<void, ServerError>
    
    // SSE operations
    readonly addSSEClient: (client: SSEClient) => Effect.Effect<void, never>
    readonly removeSSEClient: (clientId: string) => Effect.Effect<void, never>
    readonly broadcastSSE: (event: string, data: unknown) => Effect.Effect<void, SSEError>
    readonly sendSSE: (clientId: string, event: string, data: unknown) => Effect.Effect<void, SSEError>
    
    // WebSocket operations
    readonly handleWebSocket: (request: HttpServerRequest.HttpServerRequest) => Effect.Effect<HttpServerResponse.HttpServerResponse, WebSocketError>
    readonly broadcastWebSocket: (message: unknown) => Effect.Effect<void, WebSocketError>
    
    // Health & Metrics
    readonly getHealth: () => Effect.Effect<HealthStatus, never>
    readonly getMetrics: () => Effect.Effect<Record<string, unknown>, never>
    
    // Rate limiting
    readonly checkRateLimit: (ip: string, endpoint: string) => Effect.Effect<boolean, RateLimitError>
}

// ============================================================================
// Context Tags
// ============================================================================

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
    
    // Internal state
    const sseClients = yield* Ref.make<Map<string, SSEClient>>(new Map())
    const rateLimitMap = yield* Ref.make<Map<string, RateLimitEntry>>(new Map())
    const serverFiber = yield* Ref.make<Fiber.RuntimeFiber<never, ServerError> | null>(null)
    const startTime = Date.now()
    const requestCounter = yield* Ref.make(0)
    
    // Get server configuration
    const serverConfig = yield* config.getServer()
    
    // Rate limit check implementation
    const checkRateLimit = (ip: string, endpoint: string) =>
        Effect.gen(function* () {
            const limits = yield* config.getRateLimit()
            const key = `${ip}:${endpoint}`
            const now = Date.now()
            
            const entries = yield* Ref.get(rateLimitMap)
            const entry = entries.get(key)
            
            if (!entry || entry.resetAt < now) {
                // Create new entry
                yield* Ref.update(rateLimitMap, map => {
                    const newMap = new Map(map)
                    newMap.set(key, {
                        count: 1,
                        resetAt: now + 60000 // 1 minute window
                    })
                    return newMap
                })
                return true
            }
            
            if (entry.count >= limits.apiRequests.perMinute) {
                return yield* Effect.fail(new RateLimitError({
                    endpoint,
                    limit: limits.apiRequests.perMinute,
                    window: '1 minute'
                }))
            }
            
            // Increment counter
            yield* Ref.update(rateLimitMap, map => {
                const newMap = new Map(map)
                newMap.set(key, {
                    ...entry,
                    count: entry.count + 1
                })
                return newMap
            })
            
            return true
        })
    
    // SSE heartbeat
    const sseHeartbeat = Effect.gen(function* () {
        while (true) {
            yield* Effect.sleep(Duration.seconds(30))
            const clients = yield* Ref.get(sseClients)
            
            for (const [id, client] of clients) {
                if (!client.connected || Date.now() - client.lastPing > 60000) {
                    yield* Ref.update(sseClients, map => {
                        const newMap = new Map(map)
                        newMap.delete(id)
                        return newMap
                    })
                    yield* logger.info(`SSE client disconnected: ${id}`)
                }
            }
        }
    }).pipe(Effect.fork)
    
    // Create HTTP routes
    const createRoutes = () =>
        HttpRouter.empty.pipe(
            // Health check
            HttpRouter.get('/health', 
                HttpServerResponse.json({
                    status: 'healthy',
                    uptime: Date.now() - startTime,
                    version: '1.0.0'
                })
            ),
            
            // SSE endpoint
            HttpRouter.get('/api/event-stream',
                Effect.gen(function* () {
                    const request = yield* HttpServerRequest.HttpServerRequest
                    const clientId = `sse_${Date.now()}_${Math.random()}`
                    
                    const response = yield* HttpServerResponse.stream(
                        Stream.make(
                            `:connected\n\n`,
                            `event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`
                        ).pipe(
                            Stream.concat(
                                Stream.never.pipe(
                                    Stream.ensuring(
                                        Effect.gen(function* () {
                                            yield* Ref.update(sseClients, map => {
                                                const newMap = new Map(map)
                                                newMap.delete(clientId)
                                                return newMap
                                            })
                                            yield* logger.info(`SSE client cleanup: ${clientId}`)
                                        })
                                    )
                                )
                            )
                        ),
                        {
                            headers: Http.Headers.fromInput({
                                'Content-Type': 'text/event-stream',
                                'Cache-Control': 'no-cache',
                                'Connection': 'keep-alive',
                                'X-Accel-Buffering': 'no'
                            })
                        }
                    )
                    
                    // Register client
                    yield* Ref.update(sseClients, map => {
                        const newMap = new Map(map)
                        newMap.set(clientId, {
                            id: clientId,
                            response,
                            connected: true,
                            lastPing: Date.now()
                        })
                        return newMap
                    })
                    
                    yield* logger.info(`SSE client connected: ${clientId}`)
                    
                    return response
                })
            ),
            
            // Command endpoint
            HttpRouter.post('/api/command',
                Effect.gen(function* () {
                    const request = yield* HttpServerRequest.HttpServerRequest
                    const body = yield* request.json
                    
                    // Increment request counter
                    yield* Ref.update(requestCounter, n => n + 1)
                    
                    // Process command (integrate with Redux)
                    yield* logger.info('Command received', body)
                    
                    return HttpServerResponse.json({
                        success: true,
                        timestamp: Date.now()
                    })
                })
            ),
            
            // Metrics endpoint
            HttpRouter.get('/api/metrics',
                Effect.gen(function* () {
                    const clients = yield* Ref.get(sseClients)
                    const requests = yield* Ref.get(requestCounter)
                    
                    return HttpServerResponse.json({
                        uptime: Date.now() - startTime,
                        activeConnections: clients.size,
                        totalRequests: requests,
                        memoryUsage: process.memoryUsage(),
                        timestamp: Date.now()
                    })
                })
            )
        )
    
    // Apply middleware
    const app = createRoutes().pipe(
        // CORS middleware
        serverConfig.cors.enabled
            ? HttpMiddleware.cors({
                allowedOrigins: serverConfig.cors.origins,
                allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization'],
                credentials: true
            })
            : (x: any) => x,
        
        // Logging middleware
        HttpMiddleware.logger
    )
    
    // Service implementation
    const service: ServerServiceOps = {
        start: () =>
            Effect.gen(function* () {
                const fiber = yield* Ref.get(serverFiber)
                if (fiber) {
                    return yield* Effect.fail(new ServerError({
                        operation: 'start',
                        message: 'Server already running'
                    }))
                }
                
                // Start heartbeat
                yield* sseHeartbeat
                
                // Create and start server
                const serverFiberInstance = yield* NodePlatform.HttpServer.serve(app, {
                    port: serverConfig.port
                }).pipe(
                    Effect.fork
                )
                
                yield* Ref.set(serverFiber, serverFiberInstance)
                yield* logger.info(`Server started on ${serverConfig.host}:${serverConfig.port}`)
            }).pipe(
                Effect.catchAll(cause =>
                    Effect.fail(new ServerError({
                        operation: 'start',
                        message: 'Failed to start server',
                        cause
                    }))
                )
            ),
        
        stop: () =>
            Effect.gen(function* () {
                const fiber = yield* Ref.get(serverFiber)
                if (!fiber) {
                    return yield* Effect.fail(new ServerError({
                        operation: 'stop',
                        message: 'Server not running'
                    }))
                }
                
                yield* Fiber.interrupt(fiber)
                yield* Ref.set(serverFiber, null)
                yield* logger.info('Server stopped')
            }),
        
        restart: () =>
            Effect.gen(function* () {
                yield* service.stop().pipe(Effect.orElse(() => Effect.void))
                yield* service.start()
                yield* logger.info('Server restarted')
            }),
        
        addSSEClient: (client) =>
            Ref.update(sseClients, map => {
                const newMap = new Map(map)
                newMap.set(client.id, client)
                return newMap
            }),
        
        removeSSEClient: (clientId) =>
            Ref.update(sseClients, map => {
                const newMap = new Map(map)
                newMap.delete(clientId)
                return newMap
            }),
        
        broadcastSSE: (event, data) =>
            Effect.gen(function* () {
                const clients = yield* Ref.get(sseClients)
                const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
                
                yield* Effect.all(
                    Array.from(clients.values()).map(client =>
                        Effect.try({
                            try: () => {
                                // In real implementation, write to the response stream
                                return true
                            },
                            catch: () => new SSEError({
                                clientId: client.id,
                                message: 'Failed to send SSE message'
                            })
                        })
                    ),
                    { concurrency: 'unbounded' }
                )
            }),
        
        sendSSE: (clientId, event, data) =>
            Effect.gen(function* () {
                const clients = yield* Ref.get(sseClients)
                const client = clients.get(clientId)
                
                if (!client) {
                    return yield* Effect.fail(new SSEError({
                        clientId,
                        message: 'Client not found'
                    }))
                }
                
                const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
                // In real implementation, write to the specific client's response stream
            }),
        
        handleWebSocket: (request) =>
            Effect.fail(new WebSocketError({
                connectionId: 'ws_new',
                message: 'WebSocket not implemented yet'
            })),
        
        broadcastWebSocket: (message) =>
            Effect.fail(new WebSocketError({
                connectionId: 'broadcast',
                message: 'WebSocket not implemented yet'
            })),
        
        getHealth: () =>
            Effect.gen(function* () {
                const clients = yield* Ref.get(sseClients)
                const requests = yield* Ref.get(requestCounter)
                const fiber = yield* Ref.get(serverFiber)
                
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
                        activeConnections: clients.size,
                        requestsPerMinute: Math.round(requests / ((Date.now() - startTime) / 60000)),
                        memoryUsage: process.memoryUsage().heapUsed
                    }
                } as HealthStatus
            }),
        
        getMetrics: () =>
            Effect.gen(function* () {
                const health = yield* service.getHealth()
                return {
                    ...health.metrics,
                    uptime: health.uptime,
                    status: health.status
                }
            }),
        
        checkRateLimit
    }
    
    return service
})

// ============================================================================
// Layer Creation
// ============================================================================

export const ServerServiceLive = Layer.scoped(
    ServerService,
    Effect.gen(function* () {
        const service = yield* makeServerService
        
        // Add finalizer for cleanup
        yield* Effect.addFinalizer(() =>
            Effect.gen(function* () {
                yield* service.stop().pipe(Effect.orElse(() => Effect.void))
                yield* Effect.logInfo('Server service cleaned up')
            })
        )
        
        return service
    })
)

// ============================================================================
// Convenience Functions
// ============================================================================

export const startServer = Effect.gen(function* () {
    const server = yield* ServerService
    yield* server.start()
})

export const stopServer = Effect.gen(function* () {
    const server = yield* ServerService
    yield* server.stop()
})

export const broadcastEvent = (event: string, data: unknown) =>
    Effect.gen(function* () {
        const server = yield* ServerService
        yield* server.broadcastSSE(event, data)
    })

export const getServerHealth = Effect.gen(function* () {
    const server = yield* ServerService
    return yield* server.getHealth()
})