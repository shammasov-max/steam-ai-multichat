import { describe, test, expect } from 'vitest'
import { Effect, pipe } from 'effect'
import { LanguageDetector } from '../src/services/LanguageDetectorEffect.js'

describe('LanguageDetector - Essential Type Checking', () => {
  test('language detection types work correctly', async () => {
    // Create a test effect that uses the LanguageDetector service
    const detectEffect = Effect.gen(function* () {
      const detector = yield* LanguageDetector
      
      // Test Chinese detection
      const chineseResult = yield* detector.detect('你好世界', 'en')
      return chineseResult
    })
    
    // Run the effect with a mock LanguageDetector service
    const result = await pipe(
      detectEffect,
      Effect.provideService(LanguageDetector, {
        detect: (text: string, fallback: string) => {
          // Simple detection logic for testing
          if (text.includes('你好')) return Effect.succeed('zh')
          return Effect.succeed(fallback)
        },
        detectWithConfidence: (text: string, fallback: string) => {
          const language = text.includes('你好') ? 'zh' : fallback
          return Effect.succeed({ language, confidence: 0.8 })
        },
        detectMultiple: (texts: readonly string[], primaryLanguage: string) => {
          return Effect.succeed(primaryLanguage)
        },
        isLanguageSwitch: (previousLanguage: string, currentText: string) => {
          return Effect.succeed(false)
        }
      }),
      Effect.runPromise
    )
    
    expect(typeof result).toBe('string')
    expect(result).toBe('zh')
  })
  
  test('fallback language type checking', async () => {
    const fallbackTypes = ['en', 'zh', 'ja', 'ko', 'es'] as const
    
    for (const lang of fallbackTypes) {
      const detectEffect = Effect.gen(function* () {
        const detector = yield* LanguageDetector
        return yield* detector.detect('plain text', lang)
      })
      
      const result = await pipe(
        detectEffect,
        Effect.provideService(LanguageDetector, {
          detect: (_text: string, fallback: string) => Effect.succeed(fallback),
          detectWithConfidence: (_text: string, fallback: string) => 
            Effect.succeed({ language: fallback, confidence: 0.5 }),
          detectMultiple: (_texts: readonly string[], primaryLanguage: string) => 
            Effect.succeed(primaryLanguage),
          isLanguageSwitch: (_previousLanguage: string, _currentText: string) => 
            Effect.succeed(false)
        }),
        Effect.runPromise
      )
      
      expect(typeof result).toBe('string')
      expect(fallbackTypes.includes(result as any)).toBeTruthy()
    }
  })
})