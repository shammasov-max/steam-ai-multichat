import { Effect, Context, Layer, Data, pipe } from 'effect'
import { CompressedContext, UserInfo } from '../types'
import { ConfigService, getContextConfig } from '@packages/isomorphic'

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
export class CompressionError extends Data.TaggedError('CompressionError')<{
  readonly message: string
  readonly cause?: Error
}> {}

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
const PATTERNS = {
  rejection: [
    /no thanks/i, /not interested/i, /don't want/i,
    /不需要/i, /不感兴趣/i, /不用了/i,
    /いいえ/i, /結構です/i,
    /아니요/i, /관심없/i,
    /no gracias/i, /no me interesa/i
  ],
  agreement: [
    /yes|yeah|sure|okay|ok|agree|sounds good|let's do it/i,
    /好的|可以|同意|没问题|行/i,
    /はい|いいです|分かりました|了解/i,
    /네|좋아요|알겠습니다/i,
    /sí|de acuerdo|está bien|vale/i
  ],
  preference: [
    /i (like|prefer|love|hate|dislike)/i,
    /我(喜欢|偏好|讨厌)/i, /(好き|嫌い|苦手)/i,
    /(좋아|싫어)/i, /me (gusta|encanta|disgusta)/i
  ],
  personalInfo: [
    /my name is/i, /i am \d+ years old/i, /i live in/i, /i work/i,
    /我叫/i, /我住在/i, /私は.*です/i
  ],
  greeting: [
    /^(hi|hello|hey|greetings)(\s+there)?$/i,
    /^good\s+(morning|afternoon|evening)$/i,
    /^(你好|您好)$/, /^(こんにちは|おはよう|おはようございます)$/,
    /^(안녕|안녕하세요)$/, /^(hola|buenos días|buenas tardes)$/i
  ],
  farewell: [
    /^(bye|goodbye|see you later|take care)$/i,
    /^(再见|拜拜)$/, /^(さようなら|またね|じゃあね)$/,
    /^(안녕히|다음에)$/, /^(adiós|hasta luego|hasta pronto)$/i
  ]
}

const TOPIC_KEYWORDS = {
  gaming: /game|play|level|character|quest|mission/i,
  coaching: /coach|training|improve|skill|lesson/i,
  subscription: /subscribe|payment|price|cost|fee|monthly/i,
  premium: /premium|vip|exclusive|special|upgrade/i,
  support: /help|support|assist|guide|tutorial/i
}

// Helper functions
const hasPattern = (content: string, patterns: RegExp[]) => 
  patterns.some(p => p.test(content))

const containsQuestion = (content: string) => 
  content.includes('?') || /^(what|when|where|who|why|how|is|are|can|could|would|will)/i.test(content)

const containsImportantInfo = (content: string) => {
  const c = content.toLowerCase()
  return hasPattern(c, PATTERNS.rejection) ||
         hasPattern(c, PATTERNS.agreement) ||
         containsQuestion(c) ||
         hasPattern(c, PATTERNS.personalInfo) ||
         /\$|price|cost|\d+/.test(c)
}

const isSimpleGreeting = (content: string) => {
  const trimmed = content.trim()
  return !trimmed.includes('\n') && trimmed.length <= 20 && hasPattern(trimmed, PATTERNS.greeting)
}

const isSimpleFarewell = (content: string) => {
  const trimmed = content.trim()
  return !trimmed.includes('\n') && trimmed.length <= 20 && hasPattern(trimmed, PATTERNS.farewell)
}

const extractSnippet = (content: string, maxLength = 50) =>
  content.length <= maxLength ? content : content.substring(0, maxLength) + '...'

const extractPreference = (content: string) => {
  const match = content.match(/i (like|prefer|love|hate|dislike) (\w+)/i)
  return match ? `User ${match[1]}s: ${match[2]}` : null
}

const extractPersonalInfo = (content: string) => {
  const matchers = [
    [/my name is (\w+)/i, (m: RegExpMatchArray) => `User name: ${m[1]}`],
    [/i am (\d+) years old/i, (m: RegExpMatchArray) => `User age: ${m[1]}`],
    [/i live in ([\w\s]+)/i, (m: RegExpMatchArray) => `User location: ${m[1]}`]
  ] as const
  
  for (const [pattern, formatter] of matchers) {
    const match = content.match(pattern)
    if (match) return formatter(match)
  }
  return null
}

const deduplicateFacts = (facts: string[]) => 
  [...new Set(facts.map(f => f.toLowerCase().trim()))].slice(0, 10)

const extractTopics = (messages: Message[]) => {
  const topics = new Set<string>()
  for (const message of messages) {
    for (const [topic, pattern] of Object.entries(TOPIC_KEYWORDS)) {
      if (pattern.test(message.content)) topics.add(topic)
    }
  }
  return [...topics]
}

const analyzeMessages = (messages: Message[]) => {
  const userMessages = messages.filter(m => m.role === 'USER')
  let positive = 0, negative = 0, neutral = 0
  
  for (const msg of userMessages) {
    const content = msg.content.toLowerCase()
    if (hasPattern(content, PATTERNS.agreement)) positive++
    else if (hasPattern(content, PATTERNS.rejection)) negative++
    else neutral++
  }
  
  const stance = 
    negative > positive * 2 ? 'resistant' :
    positive > negative * 2 ? 'receptive' :
    neutral > (positive + negative) ? 'neutral/exploring' : 'mixed'
  
  const progress = 
    positive > 0 && negative === 0 ? 'positive trajectory' :
    negative > positive ? 'facing resistance' :
    messages.length > 10 && positive === 0 ? 'slow progress' :
    positive > 0 && negative > 0 ? 'mixed signals' : 'initial phase'
  
  return { stance, progress, rejectionCount: negative }
}

// Implementation helpers
const extractFactsFromMessages = (messages: Message[]) => {
  const facts: string[] = []
  
  for (const msg of messages) {
    const content = msg.content
    const lower = content.toLowerCase()
    
    if (hasPattern(lower, PATTERNS.rejection)) {
      facts.push(`User rejection detected: "${extractSnippet(content)}"`)
    }
    if (hasPattern(lower, PATTERNS.agreement)) {
      facts.push(`User agreement: "${extractSnippet(content)}"`)
    }
    
    const preference = extractPreference(content)
    if (preference) facts.push(preference)
    
    if (containsQuestion(lower) && msg.role === 'USER') {
      facts.push(`User question: "${extractSnippet(content)}"`)
    }
    
    const info = extractPersonalInfo(content)
    if (info) facts.push(info)
  }
  
  return deduplicateFacts(facts)
}

const createSummaryFromAnalysis = (messages: Message[]) => {
  const topics = extractTopics(messages)
  const { stance, progress, rejectionCount } = analyzeMessages(messages)
  
  const parts: string[] = []
  if (topics.length > 0) parts.push(`Discussion about ${topics.join(', ')}`)
  if (stance) parts.push(`User stance: ${stance}`)
  if (progress) parts.push(`Progress: ${progress}`)
  if (rejectionCount > 0) parts.push(`User has rejected ${rejectionCount} time(s)`)
  
  return parts.join('. ') || 'Conversation ongoing.'
}

const compressMessageContent = (content: string) => {
  if (isSimpleGreeting(content)) return '[GREETING]'
  if (isSimpleFarewell(content)) return '[FAREWELL]'
  if (content.length <= 500) return content
  
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [content]
  const important = sentences.filter(s => containsImportantInfo(s.toLowerCase()))
  
  return important.length > 0
    ? important.join(' ').substring(0, 400) + '...'
    : content.substring(0, 400) + '...'
}

// Create the service implementation
const makeContextCompressor = (config: ContextConfig): ContextCompressorOps => ({
  extractKeyFacts: (messages) =>
    Effect.try({
      try: () => extractFactsFromMessages(messages),
      catch: (error) => new CompressionError({ message: 'Failed to extract key facts', cause: error as Error })
    }),

  createSummary: (messages) =>
    Effect.try({
      try: () => createSummaryFromAnalysis(messages),
      catch: (error) => new CompressionError({ message: 'Failed to create summary', cause: error as Error })
    }),

  compressMessage: (content) =>
    Effect.try({
      try: () => compressMessageContent(content),
      catch: (error) => new CompressionError({ message: 'Failed to compress message', cause: error as Error })
    }),

  compress: (messages, goal, init, userInfo) =>
    Effect.try({
      try: () => {
        const shouldCompress = messages.length > config.compressionAfterMessages
        const messagesToSummarize = shouldCompress 
          ? messages.slice(0, -config.keepLastMessagesVerbatim)
          : messages
        
        const keepCount = shouldCompress 
          ? config.keepLastMessagesVerbatim 
          : messages.length
        
        const recentMessages = messages.slice(-keepCount).map(msg => ({
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: compressMessageContent(msg.content)
        }))
        
        return {
          summary: shouldCompress ? createSummaryFromAnalysis(messagesToSummarize) : '',
          keyFacts: extractFactsFromMessages(messages),
          recentMessages,
          goal,
          init,
          ...(userInfo && { userInfo })
        }
      },
      catch: (error) => new CompressionError({ message: 'Failed to compress context', cause: error as Error })
    })
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
  if (config) {
    return pipe(
      Layer.succeed(ContextConfigEffect, config),
      Layer.provideMerge(ContextCompressorLive)
    )
  }
  
  // Use ConfigService for defaults
  return pipe(
    Layer.effect(ContextConfigEffect, getContextConfig),
    Layer.provideMerge(ContextCompressorLive)
  )
}