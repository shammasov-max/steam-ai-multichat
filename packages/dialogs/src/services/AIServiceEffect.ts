import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'
import * as Duration from 'effect/Duration'
import { pipe } from 'effect/Function'
import OpenAI from 'openai'
import { CompressedContext } from '../types'
import { Logger } from '@packages/isomorphic'
// Resilience features removed - not needed for happy path

export type AIModel = 
  | 'gpt-3.5-turbo'
  | 'dall-e-2'
  | 'text-embedding-3-small'
  | 'codex-mini-latest'
  | 'chatgpt-4o-latest'
  | 'gpt-4.1'
  | 'gpt-4.1-2025-04-14'
  | 'dall-e-3'
  | 'gpt-4.1-nano'
  | 'gpt-3.5-turbo-instruct-0914'
  | 'gpt-4o-mini-search-preview'
  | 'gpt-4.1-nano-2025-04-14'
  | 'gpt-3.5-turbo-16k'
  | 'gpt-4o-search-preview'
  | 'gpt-3.5-turbo-instruct'
  | 'gpt-4o-mini-search-preview-2025-03-11'
  | 'omni-moderation-2024-09-26'
  | 'gpt-4o-2024-11-20'
  | 'gpt-4o-2024-05-13'
  | 'omni-moderation-latest'
  | 'o1-pro'
  | 'gpt-4o-transcribe'
  | 'o1-pro-2025-03-19'
  | 'gpt-4o-search-preview-2025-03-11'
  | 'o4-mini-deep-research-2025-06-26'
  | 'o4-mini-deep-research'
  | 'o1-mini-2024-09-12'
  | 'tts-1-hd-1106'
  | 'gpt-4o-2024-08-06'
  | 'o1'
  | 'gpt-4o-mini-2024-07-18'
  | 'gpt-4o-mini'
  | 'gpt-4o-mini-audio-preview'
  | 'gpt-5-mini'
  | 'gpt-5-mini-2025-08-07'
  | 'o1-2024-12-17'
  | 'gpt-5'
  | 'tts-1'
  | 'gpt-5-nano-2025-08-07'
  | 'gpt-5-nano'
  | 'gpt-4o-mini-audio-preview-2024-12-17'
  | 'o3-mini-2025-01-31'
  | 'o3-mini'
  | 'gpt-4-0125-preview'
  | 'gpt-4-turbo'
  | 'gpt-4-1106-preview'
  | 'o1-mini'
  | 'gpt-4-turbo-preview'
  | 'tts-1-1106'
  | 'tts-1-hd'
  | 'babbage-002'
  | 'gpt-4-turbo-2024-04-09'
  | 'gpt-5-2025-08-07'
  | 'whisper-1'
  | 'gpt-4.1-mini'
  | 'gpt-4.1-mini-2025-04-14'
  | 'gpt-4o-realtime-preview'
  | 'gpt-4o-mini-transcribe'
  | 'gpt-4o-mini-tts'
  | 'gpt-5-chat-latest'
  | 'gpt-4o-realtime-preview-2024-12-17'
  | 'gpt-4o-audio-preview-2024-12-17'
  | 'davinci-002'
  | 'text-embedding-ada-002'
  | 'gpt-4o-audio-preview-2024-10-01'
  | 'gpt-4o'
  | 'gpt-4'
  | 'gpt-4o-realtime-preview-2024-10-01'
  | 'gpt-4o-audio-preview'
  | 'o4-mini'
  | 'o4-mini-2025-04-16'
  | 'gpt-4o-realtime-preview-2025-06-03'
  | 'gpt-3.5-turbo-1106'
  | 'text-embedding-3-large'
  | 'gpt-4-0613'
  | 'gpt-image-1'
  | 'gpt-4o-audio-preview-2025-06-03'
  | 'gpt-4o-mini-realtime-preview'
  | 'gpt-4o-mini-realtime-preview-2024-12-17'
  | 'gpt-3.5-turbo-0125'
  | 'o3'
  | 'o3-2025-04-16'

export interface AIServiceConfig {
  apiKey: string
  model?: AIModel
  maxTokensPerRequest?: number
  retryDelayMs?: number
  maxRetries?: number
  // Resilience features removed - not needed for happy path
}

export interface AIResponse {
  text: string
  tokensUsed: number
  strategy?: string
}

// Error types using Effect's TaggedError
import { Data } from 'effect'

export class AIServiceError extends Data.TaggedError('AIServiceError')<{
  readonly message: string
  readonly cause?: unknown
}> {}

export class OpenAIAPIError extends Data.TaggedError('OpenAIAPIError')<{
  readonly message: string
  readonly statusCode?: number
  readonly cause?: unknown
}> {}

export class InvalidResponseError extends Data.TaggedError('InvalidResponseError')<{
  readonly message: string
  readonly response?: unknown
}> {}

export class RateLimitError extends Data.TaggedError('RateLimitError')<{
  readonly message: string
  readonly retryAfter?: number
}> {}

export class ConnectionError extends Data.TaggedError('ConnectionError')<{
  readonly message: string
  readonly cause?: unknown
}> {}

// Service Interface
interface AIServiceOps {
  readonly generateResponse: (
    context: CompressedContext,
    userMessage: string,
    language: string
  ) => Effect.Effect<AIResponse, AIServiceError>
  readonly testConnection: () => Effect.Effect<boolean, AIServiceError>
}

// Service Tag
export class AIServiceEffect extends Context.Tag('AIService')<AIServiceEffect, AIServiceOps>() {}

// Configuration Tag
export class AIConfigEffect extends Context.Tag('AIConfig')<AIConfigEffect, Required<AIServiceConfig>>() {}

// Create the service implementation with resilience patterns
const makeAIService = (
  config: Required<AIServiceConfig>,
  openai: OpenAI
): Effect.Effect<AIServiceOps, never, Logger> => 
  Effect.gen(function* () {
    const logger = yield* Logger

    return {
    generateResponse: (context, userMessage, language) =>
        pipe(
          Effect.tryPromise({
        try: async () => {
          const systemPrompt = buildSystemPrompt(context, language)
          
          const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            ...formatRecentMessages(context.recentMessages),
            { role: 'user', content: userMessage }
          ]

          const response = await openai.chat.completions.create({
            model: config.model,
            messages,
            max_tokens: calculateMaxTokens(messages, config.maxTokensPerRequest),
            temperature: 0.7,
            presence_penalty: 0.3,
            frequency_penalty: 0.3
          })

          const choice = response.choices[0]
          if (!choice) {
            throw new Error('No response choice received from OpenAI')
          }
          
          const tokensUsed = response.usage?.total_tokens || 0
          const messageContent = choice.message?.content || ''
          const strategy = extractStrategy(messageContent)

          return {
            text: cleanResponse(messageContent),
            tokensUsed,
            strategy
          }
        },
        catch: (error) => {
          Effect.runSync(logger.error('OpenAI API error', error as Error))
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          
          // Check for specific error types
          if (error instanceof Error && error.message.includes('rate limit')) {
            return new RateLimitError({ 
              message: 'OpenAI rate limit exceeded',
              retryAfter: 60000 
            })
          }
          
          if (error instanceof Error && error.message.includes('No response choice')) {
            return new InvalidResponseError({ 
              message: errorMessage,
              response: error 
            })
          }
          
          if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT'))) {
            return new ConnectionError({ 
              message: 'Failed to connect to OpenAI API',
              cause: error 
            })
          }
          
          // Check for OpenAI API errors with status codes
          const statusCode = (error as any)?.response?.status
          if (statusCode) {
            return new OpenAIAPIError({ 
              message: errorMessage,
              statusCode,
              cause: error 
            })
          }
          
          return new AIServiceError({ 
            message: `Failed to generate AI response: ${errorMessage}`,
            cause: error 
          })
          }
        })
      ),

    testConnection: () =>
      pipe(
        Effect.tryPromise({
        try: async () => {
          const response = await openai.models.list()
          return response && response.data && response.data.length > 0
        },
        catch: (error) => {
          Effect.runSync(logger.error('OpenAI connection test failed', error as Error))
          
          if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT'))) {
            return new ConnectionError({ 
              message: 'Failed to connect to OpenAI API',
              cause: error 
            })
          }
          
          return new AIServiceError({ 
            message: 'Connection test failed',
            cause: error 
          })
        }
        })
      )
    }
  })

// Helper functions (pure, no side effects)
const buildSystemPrompt = (
  context: CompressedContext,
  language: string
): string => {
  const languageInstructions = getLanguageInstructions(language)
  const goalInstructions = context.goal
  const contextSummary = context.summary || 'New conversation started.'
  const keyFacts = context.keyFacts.length > 0 
    ? `Key facts:\n${context.keyFacts.map(f => `- ${f}`).join('\n')}`
    : ''

  return `You are an AI assistant helping to achieve a specific goal through natural conversation.

${languageInstructions}

INITIAL INSTRUCTIONS:
${context.init}

GOAL:
${goalInstructions}

CONTEXT:
${contextSummary}
${keyFacts}

USER INFO:
${context.userInfo ? JSON.stringify(context.userInfo, null, 2) : 'No specific user information available.'}


INSTRUCTIONS:
1. Maintain natural, engaging conversation in ${language}
2. Guide the conversation towards the goal without being pushy
3. Be helpful and understanding of user concerns
4. If user shows resistance, offer alternatives or address concerns
5. Detect emotional tone and adjust response accordingly
6. Keep responses concise but informative
7. Build trust through empathy and understanding

IMPORTANT:
- Never lie or provide false information
- Respect user's decision if they explicitly refuse
- Maintain professional and friendly tone
- Focus on user benefits and value proposition`
}

const getLanguageInstructions = (language: string): string => {
  const instructions: Record<string, string> = {
    zh: 'Respond in Simplified Chinese. Use polite and respectful language appropriate for Chinese culture.',
    ja: 'Respond in Japanese. Use appropriate keigo (polite language) and cultural considerations.',
    ko: 'Respond in Korean. Use appropriate honorifics and formal language.',
    en: 'Respond in English. Use clear, professional, and friendly language.',
    es: 'Respond in Spanish. Use formal "usted" form unless context suggests informal "tú".'
  }
  return instructions[language] || instructions['en']!
}

const formatRecentMessages = (messages: CompressedContext['recentMessages']): OpenAI.Chat.ChatCompletionMessageParam[] => {
  return messages.map(msg => ({
    role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
    content: msg.content
  }))
}

const calculateMaxTokens = (messages: OpenAI.Chat.ChatCompletionMessageParam[], maxTokensPerRequest: number): number => {
  const estimatedPromptTokens = JSON.stringify(messages).length / 4
  const remainingTokens = maxTokensPerRequest - estimatedPromptTokens
  return Math.max(500, Math.min(2000, Math.floor(remainingTokens)))
}

const extractStrategy = (response: string): string => {
  const strategyMatch = response.match(/\[STRATEGY: (.*?)\]/)
  return strategyMatch?.[1] || 'initial'
}

const cleanResponse = (response: string): string => {
  return response
    .replace(/\[STRATEGY:.*?\]/g, '')
    .replace(/\[INTERNAL:.*?\]/g, '')
    .trim()
}

// Import resilience patterns
import { 
    exponentialBackoff, 
    CircuitBreaker, 
    withResilience,
    retryWithExponentialBackoff 
} from '@packages/isomorphic'
import { Schedule } from 'effect'

// Enhanced service with resilience
const makeResilientAIService = (
  config: Required<AIServiceConfig>,
  openai: OpenAI
): Effect.Effect<AIServiceOps, never, Logger> => 
  Effect.gen(function* () {
    const logger = yield* Logger
    
    // Create circuit breaker for OpenAI API
    const circuitBreaker = yield* CircuitBreaker.make({
      failureThreshold: 5,
      resetTimeout: Duration.seconds(60),
      halfOpenMaxAttempts: 3
    })
    
    const baseService = yield* makeAIService(config, openai)
    
    // Wrap generateResponse with resilience patterns
    const resilientGenerateResponse: AIServiceOps['generateResponse'] = (context, userMessage, language) =>
      withResilience(
        baseService.generateResponse(context, userMessage, language),
        {
          retry: {
            schedule: exponentialBackoff(
              Duration.millis(config.retryDelayMs),
              Duration.seconds(30),
              2
            ).pipe(
              Schedule.whileInput((attempt: number) => attempt < config.maxRetries)
            ),
            filter: (error: any) => {
              // Retry on rate limit and connection errors
              if (error instanceof RateLimitError || error instanceof ConnectionError) {
                return true
              }
              // Don't retry on invalid response errors
              if (error instanceof InvalidResponseError) {
                return false
              }
              return true
            }
          },
          timeout: Duration.seconds(30),
          circuitBreaker: {
            failureThreshold: 5,
            resetTimeout: Duration.seconds(60),
            halfOpenMaxAttempts: 3
          }
        }
      ).pipe(
        Effect.catchAll((error: any) =>
          Effect.gen(function* () {
            if (error._tag !== 'CircuitBreakerError') return Effect.fail(error)
            yield* logger.error('Circuit breaker open for OpenAI API', undefined, {
              state: (error as any).state,
              lastFailure: (error as any).lastFailureTime
            })
            return yield* Effect.fail(new ConnectionError({
              message: 'OpenAI API circuit breaker is open - too many failures',
              cause: error
            }))
          })
        ),
        Effect.catchAll((error: any) =>
          Effect.gen(function* () {
            if (error._tag !== 'RetryExhaustedError') return Effect.fail(error)
            yield* logger.error('Retry attempts exhausted for OpenAI API', undefined, {
              attempts: (error as any).attempts
            })
            return yield* Effect.fail(new AIServiceError({
              message: `Failed after ${(error as any).attempts} retry attempts`,
              cause: (error as any).lastError
            }))
          })
        )
      )
    
    // Wrap testConnection with retry
    const resilientTestConnection: AIServiceOps['testConnection'] = () =>
      retryWithExponentialBackoff(
        baseService.testConnection(),
        3,
        Duration.seconds(1)
      ).pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            yield* logger.error('Connection test failed after retries', undefined, { error })
            return yield* Effect.fail(error)
          })
        )
      )
    
    return {
      generateResponse: resilientGenerateResponse,
      testConnection: resilientTestConnection
    }
  })

// Layer creation with resilience patterns
export const AIServiceLive = Layer.effect(
  AIServiceEffect,
  Effect.gen(function* () {
    const config = yield* AIConfigEffect
    const logger = yield* Logger
    const openai = new OpenAI({ apiKey: config.apiKey })
    
    yield* logger.info('Initializing AI Service with resilience patterns', { 
      model: config.model,
      resilience: 'enabled',
      maxRetries: config.maxRetries,
      retryDelayMs: config.retryDelayMs
    })
    
    // Use resilient service implementation
    return yield* makeResilientAIService(config, openai)
  })
)

// Factory function for creating the layer with configuration
export const makeAIServiceLayer = (config: AIServiceConfig) => {
  const fullConfig: Required<AIServiceConfig> = {
    apiKey: config.apiKey,
    model: config.model || 'gpt-4-turbo-preview',
    maxTokensPerRequest: config.maxTokensPerRequest || 8000,
    retryDelayMs: config.retryDelayMs || 1000,
    maxRetries: config.maxRetries || 3,
    // Resilience disabled - not needed for happy path
  }
  
  return Layer.succeed(AIConfigEffect, fullConfig).pipe(
    Layer.provideMerge(AIServiceLive)
  )
}

// Backward compatibility wrapper removed - use Effect-based API directly