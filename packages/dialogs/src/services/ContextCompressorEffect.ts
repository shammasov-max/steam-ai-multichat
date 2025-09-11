import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import { pipe } from 'effect/Function'
import { CompressedContext, UserInfo } from '../types'

interface Message {
  role: string
  content: string
  createdAt?: Date
}

interface ContextConfig {
  compressionAfterMessages: number
  maxMessagesInContext: number
  keepLastMessagesVerbatim: number
}

// Error types
export class CompressionError extends Error {
  readonly _tag: string = 'CompressionError'
  constructor(message: string, override readonly cause?: Error) {
    super(message)
  }
}

export class InvalidMessageError extends CompressionError {
  override readonly _tag = 'InvalidMessageError' as const
}

// Service Interface
interface ContextCompressorOps {
  readonly compress: (
    messages: Message[],
    goal: string,
    init: string,
    userInfo?: UserInfo
  ) => Effect.Effect<CompressedContext, CompressionError>
  readonly extractKeyFacts: (messages: Message[]) => Effect.Effect<string[], CompressionError>
  readonly createSummary: (messages: Message[]) => Effect.Effect<string, CompressionError>
  readonly compressMessage: (content: string) => Effect.Effect<string, CompressionError>
}

// Service Tag
export class ContextCompressorEffect extends Context.Tag('ContextCompressor')<ContextCompressorEffect, ContextCompressorOps>() {}

// Configuration Tag
export class ContextConfigEffect extends Context.Tag('ContextConfig')<ContextConfigEffect, ContextConfig>() {}

// Pattern definitions
const REJECTION_PATTERNS = [
  /no thanks/i,
  /not interested/i,
  /don't want/i,
  /不需要/i,
  /不感兴趣/i,
  /不用了/i,
  /いいえ/i,
  /結構です/i,
  /아니요/i,
  /관심없/i,
  /no gracias/i,
  /no me interesa/i
]

const AGREEMENT_PATTERNS = [
  /yes|yeah|sure|okay|ok|agree|sounds good|let's do it/i,
  /好的|可以|同意|没问题|行/i,
  /はい|いいです|分かりました|了解/i,
  /네|좋아요|알겠습니다/i,
  /sí|de acuerdo|está bien|vale/i
]

const PREFERENCE_PATTERNS = [
  /i (like|prefer|love|hate|dislike)/i,
  /我(喜欢|偏好|讨厌)/i,
  /(好き|嫌い|苦手)/i,
  /(좋아|싫어)/i,
  /me (gusta|encanta|disgusta)/i
]

const PERSONAL_INFO_PATTERNS = [
  /my name is/i,
  /i am \d+ years old/i,
  /i live in/i,
  /i work/i,
  /我叫/i,
  /我住在/i,
  /私は.*です/i
]

const GREETING_PATTERNS = [
  /^(hi|hello|hey|greetings)(\s+there)?$/i,
  /^good\s+(morning|afternoon|evening)$/i,
  /^(你好|您好)$/,
  /^(こんにちは|おはよう|おはようございます)$/,
  /^(안녕|안녕하세요)$/,
  /^(hola|buenos días|buenas tardes)$/i
]

const FAREWELL_PATTERNS = [
  /^(bye|goodbye|see you later|take care)$/i,
  /^(再见|拜拜)$/,
  /^(さようなら|またね|じゃあね)$/,
  /^(안녕히|다음에)$/,
  /^(adiós|hasta luego|hasta pronto)$/i
]

const TOPIC_KEYWORDS = {
  gaming: /game|play|level|character|quest|mission/i,
  coaching: /coach|training|improve|skill|lesson/i,
  subscription: /subscribe|payment|price|cost|fee|monthly/i,
  premium: /premium|vip|exclusive|special|upgrade/i,
  support: /help|support|assist|guide|tutorial/i
}

// Helper functions (pure)
const containsRejection = (content: string): boolean => {
  return REJECTION_PATTERNS.some(pattern => pattern.test(content))
}

const containsAgreement = (content: string): boolean => {
  return AGREEMENT_PATTERNS.some(pattern => pattern.test(content))
}

const containsPreference = (content: string): boolean => {
  return PREFERENCE_PATTERNS.some(pattern => pattern.test(content))
}

const containsQuestion = (content: string): boolean => {
  return content.includes('?') || 
         /^(what|when|where|who|why|how|is|are|can|could|would|will)/i.test(content)
}

const containsPersonalInfo = (content: string): boolean => {
  return PERSONAL_INFO_PATTERNS.some(pattern => pattern.test(content))
}

const containsImportantInfo = (content: string): boolean => {
  return containsRejection(content) ||
         containsAgreement(content) ||
         containsQuestion(content) ||
         containsPersonalInfo(content) ||
         content.includes('$') ||
         content.includes('price') ||
         content.includes('cost') ||
         /\d+/.test(content)
}

const isGreeting = (content: string): boolean => {
  const trimmedContent = content.trim()
  if (trimmedContent.includes('\n')) return false
  if (trimmedContent.length > 20) return false
  return GREETING_PATTERNS.some(pattern => pattern.test(trimmedContent))
}

const isFarewell = (content: string): boolean => {
  const trimmedContent = content.trim()
  if (trimmedContent.includes('\n')) return false
  if (trimmedContent.length > 20) return false
  return FAREWELL_PATTERNS.some(pattern => pattern.test(trimmedContent))
}

const extractSnippet = (content: string, maxLength: number = 50): string => {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

const extractPreference = (content: string): string | null => {
  const match = content.match(/i (like|prefer|love|hate|dislike) (\w+)/i)
  if (match) {
    return `User ${match[1]}s: ${match[2]}`
  }
  return null
}

const extractPersonalInfo = (content: string): string | null => {
  const nameMatch = content.match(/my name is (\w+)/i)
  if (nameMatch) return `User name: ${nameMatch[1]}`
  
  const ageMatch = content.match(/i am (\d+) years old/i)
  if (ageMatch) return `User age: ${ageMatch[1]}`
  
  const locationMatch = content.match(/i live in ([\w\s]+)/i)
  if (locationMatch) return `User location: ${locationMatch[1]}`
  
  return null
}

const deduplicateFacts = (facts: string[]): string[] => {
  const seen = new Set<string>()
  return facts.filter(fact => {
    const normalized = fact.toLowerCase().trim()
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

const extractTopics = (messages: Message[]): string[] => {
  const topics = new Set<string>()
  
  for (const message of messages) {
    for (const [topic, pattern] of Object.entries(TOPIC_KEYWORDS)) {
      if (pattern.test(message.content)) {
        topics.add(topic)
      }
    }
  }
  
  return [...topics]
}

const determineUserStance = (messages: Message[]): string => {
  const userMessages = messages.filter(m => m.role === 'USER')
  let positiveCount = 0
  let negativeCount = 0
  let neutralCount = 0
  
  for (const message of userMessages) {
    const content = message.content.toLowerCase()
    if (containsAgreement(content)) {
      positiveCount++
    } else if (containsRejection(content)) {
      negativeCount++
    } else {
      neutralCount++
    }
  }
  
  if (negativeCount > positiveCount * 2) return 'resistant'
  if (positiveCount > negativeCount * 2) return 'receptive'
  if (neutralCount > (positiveCount + negativeCount)) return 'neutral/exploring'
  return 'mixed'
}

const assessProgress = (messages: Message[]): string => {
  const totalMessages = messages.length
  const agreements = messages.filter(m => 
    m.role === 'USER' && containsAgreement(m.content.toLowerCase())
  ).length
  const rejections = messages.filter(m => 
    m.role === 'USER' && containsRejection(m.content.toLowerCase())
  ).length
  
  if (agreements > 0 && rejections === 0) return 'positive trajectory'
  if (rejections > agreements) return 'facing resistance'
  if (totalMessages > 10 && agreements === 0) return 'slow progress'
  if (agreements > 0 && rejections > 0) return 'mixed signals'
  return 'initial phase'
}

// Create the service implementation
const makeContextCompressor = (config: ContextConfig): ContextCompressorOps => ({
  extractKeyFacts: (messages) =>
    Effect.try({
      try: () => {
        const facts: string[] = []
        
        for (const message of messages) {
          const content = message.content.toLowerCase()
          
          if (containsRejection(content)) {
            facts.push(`User rejection detected: "${extractSnippet(message.content)}"`)
          }
          
          if (containsAgreement(content)) {
            facts.push(`User agreement: "${extractSnippet(message.content)}"`)
          }
          
          if (containsPreference(content)) {
            const preference = extractPreference(message.content)
            if (preference) facts.push(preference)
          }
          
          if (containsQuestion(content) && message.role === 'USER') {
            facts.push(`User question: "${extractSnippet(message.content)}"`)
          }
          
          if (containsPersonalInfo(content)) {
            const info = extractPersonalInfo(message.content)
            if (info) facts.push(info)
          }
        }
        
        return deduplicateFacts(facts).slice(0, 10)
      },
      catch: (error) => new CompressionError('Failed to extract key facts', error as Error)
    }),

  createSummary: (messages) =>
    Effect.try({
      try: () => {
        const topics = extractTopics(messages)
        const userStance = determineUserStance(messages)
        const progressMade = assessProgress(messages)
        
        const parts: string[] = []
        
        if (topics.length > 0) {
          parts.push(`Discussion about ${topics.join(', ')}`)
        }
        
        if (userStance) {
          parts.push(`User stance: ${userStance}`)
        }
        
        if (progressMade) {
          parts.push(`Progress: ${progressMade}`)
        }
        
        const rejectionCount = messages.filter(m => 
          m.role === 'USER' && containsRejection(m.content.toLowerCase())
        ).length
        
        if (rejectionCount > 0) {
          parts.push(`User has rejected ${rejectionCount} time(s)`)
        }
        
        return parts.join('. ') || 'Conversation ongoing.'
      },
      catch: (error) => new CompressionError('Failed to create summary', error as Error)
    }),

  compressMessage: (content) =>
    Effect.try({
      try: () => {
        if (isGreeting(content)) return '[GREETING]'
        if (isFarewell(content)) return '[FAREWELL]'
        
        if (content.length <= 500) return content
        
        const sentences = content.match(/[^.!?]+[.!?]+/g) || [content]
        const important = sentences.filter(s => 
          containsImportantInfo(s.toLowerCase())
        )
        
        if (important.length > 0) {
          return important.join(' ').substring(0, 400) + '...'
        }
        
        return content.substring(0, 400) + '...'
      },
      catch: (error) => new CompressionError('Failed to compress message', error as Error)
    }),

  compress: (messages, goal, init, userInfo) =>
    pipe(
      Effect.all({
        keyFacts: Effect.try({
          try: () => {
            const facts: string[] = []
            
            for (const message of messages) {
              const content = message.content.toLowerCase()
              
              if (containsRejection(content)) {
                facts.push(`User rejection detected: "${extractSnippet(message.content)}"`)
              }
              
              if (containsAgreement(content)) {
                facts.push(`User agreement: "${extractSnippet(message.content)}"`)
              }
              
              if (containsPreference(content)) {
                const preference = extractPreference(message.content)
                if (preference) facts.push(preference)
              }
              
              if (containsQuestion(content) && message.role === 'USER') {
                facts.push(`User question: "${extractSnippet(message.content)}"`)
              }
              
              if (containsPersonalInfo(content)) {
                const info = extractPersonalInfo(message.content)
                if (info) facts.push(info)
              }
            }
            
            return deduplicateFacts(facts).slice(0, 10)
          },
          catch: (error) => new CompressionError('Failed to extract key facts', error as Error)
        }),
        summary: Effect.try({
          try: () => {
            if (messages.length <= config.compressionAfterMessages) {
              return ''
            }
            
            const messagesToCompress = messages.slice(0, -config.keepLastMessagesVerbatim)
            const topics = extractTopics(messagesToCompress)
            const userStance = determineUserStance(messagesToCompress)
            const progressMade = assessProgress(messagesToCompress)
            
            const parts: string[] = []
            
            if (topics.length > 0) {
              parts.push(`Discussion about ${topics.join(', ')}`)
            }
            
            if (userStance) {
              parts.push(`User stance: ${userStance}`)
            }
            
            if (progressMade) {
              parts.push(`Progress: ${progressMade}`)
            }
            
            const rejectionCount = messagesToCompress.filter(m => 
              m.role === 'USER' && containsRejection(m.content.toLowerCase())
            ).length
            
            if (rejectionCount > 0) {
              parts.push(`User has rejected ${rejectionCount} time(s)`)
            }
            
            return parts.join('. ') || 'Conversation ongoing.'
          },
          catch: (error) => new CompressionError('Failed to create summary', error as Error)
        }),
        recentMessages: Effect.try({
          try: () => {
            const keepCount = messages.length > config.compressionAfterMessages 
              ? config.keepLastMessagesVerbatim
              : messages.length
            
            const recentMessages = messages.slice(-keepCount)
            
            return recentMessages.map(msg => {
              const content = msg.content
              let compressedContent = content
              
              if (isGreeting(content)) {
                compressedContent = '[GREETING]'
              } else if (isFarewell(content)) {
                compressedContent = '[FAREWELL]'
              } else if (content.length > 500) {
                const sentences = content.match(/[^.!?]+[.!?]+/g) || [content]
                const important = sentences.filter(s => 
                  containsImportantInfo(s.toLowerCase())
                )
                
                if (important.length > 0) {
                  compressedContent = important.join(' ').substring(0, 400) + '...'
                } else {
                  compressedContent = content.substring(0, 400) + '...'
                }
              }
              
              return {
                role: msg.role.toLowerCase() as 'user' | 'assistant',
                content: compressedContent
              }
            })
          },
          catch: (error) => new CompressionError('Failed to process recent messages', error as Error)
        })
      }),
      Effect.map(({ keyFacts, summary, recentMessages }) => ({
        summary,
        keyFacts,
        recentMessages,
        goal,
        init,
        ...(userInfo && { userInfo })
      }))
    )
})

// Layer creation
export const ContextCompressorLive = Layer.effect(
  ContextCompressorEffect,
  Effect.gen(function* () {
    const config = yield* ContextConfigEffect
    return makeContextCompressor(config)
  })
)

// Factory function for creating the layer with configuration
export const makeContextCompressorLayer = (config?: ContextConfig) => {
  const fullConfig: ContextConfig = config || {
    compressionAfterMessages: 10,
    maxMessagesInContext: 20,
    keepLastMessagesVerbatim: 5
  }
  
  return Layer.succeed(ContextConfigEffect, fullConfig).pipe(
    Layer.provideMerge(ContextCompressorLive)
  )
}

// Backward compatibility wrapper
export class ContextCompressor {
  private readonly service: ContextCompressorOps
  private config: ContextConfig

  constructor(config?: ContextConfig) {
    this.config = config || {
      compressionAfterMessages: 10,
      maxMessagesInContext: 20,
      keepLastMessagesVerbatim: 5
    }
    this.service = makeContextCompressor(this.config)
  }

  async compress(
    messages: Message[],
    goal: string,
    init: string,
    userInfo?: UserInfo
  ): Promise<CompressedContext> {
    return Effect.runPromise(this.service.compress(messages, goal, init, userInfo))
  }
}