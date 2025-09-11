import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'
import * as Duration from 'effect/Duration'
import { pipe } from 'effect/Function'
import OpenAI from 'openai'
import { CompressedContext } from '../types'
import { SimpleLogger } from '@packages/isomorphic'
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

// Error types
export class AIServiceError extends Error {
  readonly _tag: string = 'AIServiceError'
  constructor(message: string, override readonly cause?: Error) {
    super(message)
  }
}

export class OpenAIAPIError extends AIServiceError {
  override readonly _tag = 'OpenAIAPIError' as const
  constructor(message: string, cause?: Error) {
    super(message, cause)
  }
}

export class InvalidResponseError extends AIServiceError {
  override readonly _tag = 'InvalidResponseError' as const
  constructor(message: string) {
    super(message)
  }
}

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
  openai: OpenAI,
  logger: SimpleLogger
): AIServiceOps => {

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
            throw new InvalidResponseError('No response choice received from OpenAI')
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
          logger.error('OpenAI API error', error as Error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          return new AIServiceError(`Failed to generate AI response: ${errorMessage}`, error as Error)
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
          logger.error('OpenAI connection test failed', error as Error)
          return new AIServiceError('Connection test failed', error as Error)
        }
        })
      )
  }
}

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

// Layer creation with optional resilience patterns
export const AIServiceLive = Layer.effect(
  AIServiceEffect,
  Effect.gen(function* () {
    const config = yield* AIConfigEffect
    const logger = new SimpleLogger('AIServiceEffect')
    const openai = new OpenAI({ apiKey: config.apiKey })
    
    logger.info('Initializing AI Service with resilience patterns', { 
      model: config.model,
      resilience: 'disabled'
    })
    
    // Create resilience components if enabled
    // TODO: Fix Effect layer provision for resilience patterns
    // Currently disabled to avoid fiber refs issues
    return makeAIService(config, openai, logger)
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