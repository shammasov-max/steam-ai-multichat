import { Effect, Context, Layer, Stream, Queue, Ref, Duration, Fiber, Data } from 'effect'
import * as Http from '@effect/platform/HttpServer'
import * as HttpRouter from '@effect/platform/HttpRouter'
import * as HttpServerRequest from '@effect/platform/HttpServerRequest'
import * as HttpServerResponse from '@effect/platform/HttpServerResponse'
import * as HttpMiddleware from '@effect/platform/HttpMiddleware'
import * as HttpServer from '@effect/platform/HttpServer'
import { ConfigService } from '@packages/isomorphic/config/ConfigService'
import { Logger } from '@packages/isomorphic/utils/LoggerService'
// import {
//     createService,
//     createServiceError,
//     RateLimiter,
//     RateLimiterLive,
//     withLogging,
//     withRateLimit
// } from '@packages/isomorphic/effect-patterns'

// Temporary fallback implementations
const createServiceError = (name: string) => {
    return class extends Data.TaggedError(name)<{
        readonly operation: string
        readonly message: string
        readonly cause?: unknown
    }> {
        static create(operation: string, message: string, cause?: unknown) {
            return new this({ operation, message, cause })
        }
    }
}
const withLogging = <A, E, R>(effect: Effect.Effect<A, E, R>, _name: string) => effect
// Placeholder for RateLimiter service
export interface RateLimiterService {}
export class RateLimiter extends Context.Tag('RateLimiter')<RateLimiter, RateLimiterService>() {}
export const RateLimiterLive = Layer.succeed(RateLimiter, {} as RateLimiterService)
import { createRoutes } from './routes'

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
    // SSE Manager will be implemented later
    
    // Internal state
    const serverFiber = yield* Ref.make<Fiber.RuntimeFiber<never, any> | null>(null)
    const startTime = Date.now()
    const requestCounter = yield* Ref.make(0)
    
    // Get server configuration
    const serverConfig = yield* config.getServer()
    
    // Create HTTP app with middleware
    const app = createRoutes({
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
    
    const service: ServerServiceOps = {
        start: () =>
            withLogging(
                Effect.gen(function* () {
                    const fiber = yield* Ref.get(serverFiber)
                    if (fiber) {
                        return yield* Effect.fail(
                            ServerError.create('start', 'Server already running')
                        )
                    }

                    // Create and start server
                    const serverFiberInstance = yield* HttpServer.serve(app).pipe(Effect.fork)

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
                    yield* logger.info('Server stopped')
                }),
                'ServerStop'
            ),

        restart: () =>
            withLogging(
                Effect.gen(function* () {
                    yield* service.stop().pipe(Effect.orElse(() => Effect.void))
                    yield* service.start()
                    yield* logger.info('Server restarted')
                }),
                'ServerRestart'
            ),
        
        getHealth: () =>
            Effect.gen(function* () {
                const fiber = yield* Ref.get(serverFiber)
                const clients = 0 // TODO: implement client count tracking
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
                const service = yield* ServerService
                const health = yield* service.getHealth()
                return {
                    ...health.metrics,
                    uptime: health.uptime,
                    status: health.status
                }
            })
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
    Layer.provide(RateLimiterLive)
)

// ============================================================================
// SSE Manager Types (simplified)
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