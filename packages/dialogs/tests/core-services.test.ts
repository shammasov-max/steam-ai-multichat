import { test, expect } from '@playwright/test';
import { ContextCompressor } from '../src/services/ContextCompressor';
import { LanguageDetector } from '../src/services/LanguageDetector';
import { ScoringEngine } from '../src/services/ScoringEngine';
import { TestHelpers } from './utils/test-helpers';
import { TestData } from './fixtures/test-data';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables - try multiple locations
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

test.describe('Core Services Tests', () => {
  test.describe('LanguageDetector', () => {
    let languageDetector: LanguageDetector;

    test.beforeEach(() => {
      languageDetector = new LanguageDetector();
    });

    test('should detect multiple languages correctly', () => {
      // Chinese
      expect(languageDetector.detect('你好世界', 'en')).toBe('zh');
      expect(languageDetector.detect('这是中文测试', 'en')).toBe('zh');
      
      // Japanese
      expect(languageDetector.detect('こんにちは世界', 'en')).toBe('ja');
      expect(languageDetector.detect('これは日本語のテストです', 'en')).toBe('ja');
      
      // Korean
      expect(languageDetector.detect('안녕하세요', 'en')).toBe('ko');
      
      // Mixed language
      expect(languageDetector.detect('你好 Hello', 'en')).toBe('zh');
      
      // Latin text fallback
      expect(languageDetector.detect('Just regular English text', 'en')).toBe('en');
      
      // Confidence detection
      const result = languageDetector.detectWithConfidence('你好 Hello', 'en');
      expect(result.language).toBe('zh');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

});