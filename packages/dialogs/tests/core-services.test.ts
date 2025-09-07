import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { LanguageDetector } from '../src/services/LanguageDetector.js'

test('LanguageDetector - Essential Type Checking', async (t) => {
  await t.test('language detection types work correctly', () => {
    const languageDetector = new LanguageDetector()
    
    // Type check: detect method returns string
    const chineseResult: string = languageDetector.detect('你好世界', 'en')
    assert.equal(typeof chineseResult, 'string')
    assert.equal(chineseResult, 'zh')
    
    // Type check: detectWithConfidence returns object with correct shape
    const confidenceResult = languageDetector.detectWithConfidence('你好', 'en')
    assert.equal(typeof confidenceResult, 'object')
    assert.equal(typeof confidenceResult.language, 'string')
    assert.equal(typeof confidenceResult.confidence, 'number')
    assert.equal(confidenceResult.language, 'zh')
    assert.ok(confidenceResult.confidence >= 0 && confidenceResult.confidence <= 1)
  })
  
  await t.test('fallback language type checking', () => {
    const languageDetector = new LanguageDetector()
    
    // Type check: fallback works with supported languages
    const fallbackTypes = ['en', 'zh', 'ja', 'ko', 'es'] as const
    
    fallbackTypes.forEach(lang => {
      const result: string = languageDetector.detect('plain text', lang)
      assert.equal(typeof result, 'string')
      assert.ok(fallbackTypes.includes(result as any))
    })
  })
})