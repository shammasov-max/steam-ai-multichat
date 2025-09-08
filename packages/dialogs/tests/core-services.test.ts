import { describe, test, expect } from 'vitest'
import { LanguageDetector } from '../src/services/LanguageDetector.js'

describe('LanguageDetector - Essential Type Checking', () => {
  test('language detection types work correctly', () => {
    const languageDetector = new LanguageDetector()
    
    // Type check: detect method returns string
    const chineseResult: string = languageDetector.detect('你好世界', 'en')
    expect(typeof chineseResult).toBe('string')
    expect(chineseResult).toBe('zh')
    
    // Type check: detectWithConfidence returns object with correct shape
    const confidenceResult = languageDetector.detectWithConfidence('你好', 'en')
    expect(typeof confidenceResult).toBe('object')
    expect(typeof confidenceResult.language).toBe('string')
    expect(typeof confidenceResult.confidence).toBe('number')
    expect(confidenceResult.language).toBe('zh')
    expect(confidenceResult.confidence).toBeGreaterThanOrEqual(0)
    expect(confidenceResult.confidence).toBeLessThanOrEqual(1)
  })
  
  test('fallback language type checking', () => {
    const languageDetector = new LanguageDetector()
    
    // Type check: fallback works with supported languages
    const fallbackTypes = ['en', 'zh', 'ja', 'ko', 'es'] as const
    
    fallbackTypes.forEach(lang => {
      const result: string = languageDetector.detect('plain text', lang)
      expect(typeof result).toBe('string')
      expect(fallbackTypes.includes(result as any)).toBeTruthy()
    })
  })
})