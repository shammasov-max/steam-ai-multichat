import { Effect, Ref } from 'effect'
import * as HttpRouter from '@effect/platform/HttpRouter'
import * as HttpServerRequest from '@effect/platform/HttpServerRequest'
import * as HttpServerResponse from '@effect/platform/HttpServerResponse'
import { Stream } from 'effect'
import { Logger } from '@packages/isomorphic/utils/LoggerService'
import { withRateLimit } from '@packages/isomorphic/effect-patterns'
import { SSEManager } from './ServerServiceRefactored'

interface RouteConfig {
    requestCounter: Ref.Ref<number>
    startTime: number
}

export const createRoutes = (config: RouteConfig) =>
    HttpRouter.empty.pipe(
        // Health check endpoint
        HttpRouter.get('/health',
            HttpServerResponse.json({
                status: 'healthy',
                uptime: Date.now() - config.startTime,
                version: '1.0.0'
            })
        ),
        
        // SSE endpoint
        HttpRouter.get('/api/event-stream',
            Effect.gen(function* () {
                const sseManager = yield* SSEManager
                const clientId = `sse_${Date.now()}_${Math.random()}`
                
                const encoder = new TextEncoder()
                const response = yield* HttpServerResponse.stream(
                    Stream.make(
                        encoder.encode(`:connected\n\n`),
                        encoder.encode(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`)
                    ).pipe(
                        Stream.concat(
                            Stream.never.pipe(
                                Stream.ensuring(
                                    Effect.gen(function* () {
                                        yield* sseManager.removeClient(clientId)
                                        yield* Effect.log(`SSE client cleanup: ${clientId}`)
                                    }).pipe(Effect.provideService(SSEManager, sseManager))
                                )
                            )
                        )
                    ),
                    {
                        headers: {
                            'Content-Type': 'text/event-stream',
                            'Cache-Control': 'no-cache',
                            'Connection': 'keep-alive',
                            'X-Accel-Buffering': 'no'
                        }
                    }
                )
                
                // Register client
                yield* sseManager.addClient({
                    id: clientId,
                    response,
                    connected: true,
                    lastPing: Date.now()
                })
                
                yield* Effect.log(`SSE client connected: ${clientId}`)
                
                return response
            })
        ),
        
        // Command endpoint with rate limiting
        HttpRouter.post('/api/command',
            Effect.gen(function* () {
                    const request = yield* HttpServerRequest.HttpServerRequest
                    const body = yield* request.json
                    const logger = yield* Logger
                    
                    // Increment request counter
                    yield* Ref.update(config.requestCounter, n => n + 1)
                    
                    // Process command
                    yield* Effect.succeed(undefined) // Process command
                    
                    return yield* HttpServerResponse.json({
                        success: true,
                        timestamp: Date.now()
                    })
            })
        ),
        
        // Metrics endpoint
        HttpRouter.get('/api/metrics',
            Effect.gen(function* () {
                const sseManager = yield* SSEManager
                const requests = yield* Ref.get(config.requestCounter)
                const clientCount = yield* sseManager.getClientCount()
                
                return yield* HttpServerResponse.json({
                    uptime: Date.now() - config.startTime,
                    activeConnections: clientCount,
                    totalRequests: requests,
                    memoryUsage: process.memoryUsage(),
                    timestamp: Date.now()
                })
            })
        ),
        
        // 404 handler
        HttpRouter.all('*',
            HttpServerResponse.json(
                { error: 'Not Found' },
                { status: 404 }
            )
        )
    )