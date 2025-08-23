import { test, expect } from '@playwright/test';
import { LanguageDetector } from '../../src/services/LanguageDetector';
import { TestData } from '../fixtures/test-data';
import { TestHelpers } from '../utils/test-helpers';

test.describe('LanguageDetector Unit Tests', () => {
  let languageDetector: LanguageDetector;

  test.beforeEach(() => {
    languageDetector = new LanguageDetector();
  });

  test.describe('Single Text Detection', () => {
    test('should detect Chinese text correctly', () => {
      TestData.languageTexts.chinese.forEach(text => {
        const result = languageDetector.detect(text, 'en');
        expect(result).toBe('zh');
        TestHelpers.expectValidLanguage(result);
      });
    });

    test('should detect Japanese text correctly', () => {
      TestData.languageTexts.japanese.forEach(text => {
        const result = languageDetector.detect(text, 'en');
        expect(result).toBe('ja');
        TestHelpers.expectValidLanguage(result);
      });
    });

    test('should detect Korean text correctly', () => {
      TestData.languageTexts.korean.forEach(text => {
        const result = languageDetector.detect(text, 'en');
        expect(result).toBe('ko');
        TestHelpers.expectValidLanguage(result);
      });
    });

    test('should detect English text correctly', () => {
      TestData.languageTexts.english.forEach(text => {
        const result = languageDetector.detect(text, 'zh');
        expect(result).toBe('en');
        TestHelpers.expectValidLanguage(result);
      });
    });

    test('should detect Spanish text correctly', () => {
      TestData.languageTexts.spanish.forEach(text => {
        const result = languageDetector.detect(text, 'en');
        expect(result).toBe('es');
        TestHelpers.expectValidLanguage(result);
      });
    });

    test('should detect Russian text correctly', () => {
      const russianTexts = [
        'Привет, как дела?',
        'Мне нужна помощь',
        'Это очень интересно'
      ];

      russianTexts.forEach(text => {
        const result = languageDetector.detect(text, 'en');
        expect(result).toBe('ru');
        TestHelpers.expectValidLanguage(result);
      });
    });

    test('should fall back to provided fallback language for empty text', () => {
      const result = languageDetector.detect('', 'zh');
      expect(result).toBe('zh');
    });

    test('should fall back to provided fallback language for whitespace only', () => {
      const result = languageDetector.detect('   \n\t  ', 'ja');
      expect(result).toBe('ja');
    });

    test('should fall back to provided fallback language for unrecognized text', () => {
      const result = languageDetector.detect('xyz123!@#', 'ko');
      expect(result).toBe('ko');
    });

    test('should detect mixed CJK text prioritizing first detected', () => {
      const mixedText = '你好こんにちは안녕하세요';
      const result = languageDetector.detect(mixedText, 'en');
      expect(result).toBe('zh'); // Chinese appears first
    });

    test('should detect Latin text with Spanish indicators', () => {
      const spanishTexts = [
        '¿Cómo estás?',
        'Hola, ¿qué tal?',
        'No sé qué hacer',
        'Está muy bien',
        'Por favor, ayúdame'
      ];

      spanishTexts.forEach(text => {
        const result = languageDetector.detect(text, 'en');
        expect(result).toBe('es');
      });
    });

    test('should default to English for Latin text without Spanish indicators', () => {
      const englishTexts = [
        'Hello there',
        'How are you doing?',
        'This is a test message',
        'Please help me with this'
      ];

      englishTexts.forEach(text => {
        const result = languageDetector.detect(text, 'zh');
        expect(result).toBe('en');
      });
    });

    test('should respect fallback language for ambiguous Latin text', () => {
      const ambiguousText = 'test message';
      
      let result = languageDetector.detect(ambiguousText, 'es');
      expect(result).toBe('es');
      
      result = languageDetector.detect(ambiguousText, 'en');
      expect(result).toBe('en');
    });

    test('should handle numbers and special characters', () => {
      const textsWithNumbers = [
        '我有123个苹果', // Chinese with numbers
        'I have 456 apples', // English with numbers  
        'Tengo 789 manzanas', // Spanish with numbers
        '私は999個持っています' // Japanese with numbers
      ];

      expect(languageDetector.detect(textsWithNumbers[0], 'en')).toBe('zh');
      expect(languageDetector.detect(textsWithNumbers[1], 'zh')).toBe('en');
      expect(languageDetector.detect(textsWithNumbers[2], 'en')).toBe('es');
      expect(languageDetector.detect(textsWithNumbers[3], 'en')).toBe('ja');
    });

    test('should handle emoji and unicode characters', () => {
      const textsWithEmoji = [
        '你好😊',
        'Hello 👋',
        'こんにちは🎌',
        '안녕하세요🇰🇷',
        'Hola 🇪🇸'
      ];

      expect(languageDetector.detect(textsWithEmoji[0], 'en')).toBe('zh');
      expect(languageDetector.detect(textsWithEmoji[1], 'zh')).toBe('en');
      expect(languageDetector.detect(textsWithEmoji[2], 'en')).toBe('ja');
      expect(languageDetector.detect(textsWithEmoji[3], 'en')).toBe('ko');
      expect(languageDetector.detect(textsWithEmoji[4], 'en')).toBe('es');
    });
  });

  test.describe('Multiple Text Detection', () => {
    test('should detect dominant language in multiple texts', () => {
      const mixedTexts = [
        '你好',
        'Hello',
        '谢谢',
        '再见',
        'Thank you'
      ];

      const result = languageDetector.detectMultiple(mixedTexts, 'en');
      expect(result).toBe('zh'); // 3 Chinese vs 2 English
    });

    test('should fall back to primary language when texts are evenly split', () => {
      const evenTexts = [
        'Hello',
        '你好',
        'Thank you',
        '谢谢'
      ];

      const result = languageDetector.detectMultiple(evenTexts, 'es');
      expect(result).toBe('es'); // Falls back to primary when tied
    });

    test('should handle empty array', () => {
      const result = languageDetector.detectMultiple([], 'ja');
      expect(result).toBe('ja');
    });

    test('should handle single text in array', () => {
      const result = languageDetector.detectMultiple(['こんにちは'], 'en');
      expect(result).toBe('ja');
    });

    test('should count each text independently', () => {
      const multipleTexts = [
        'English text one',
        'English text two',
        'English text three',
        '中文文本一',
        '中文文本二'
      ];

      const result = languageDetector.detectMultiple(multipleTexts, 'ko');
      expect(result).toBe('en'); // 3 English vs 2 Chinese
    });
  });

  test.describe('Language Switch Detection', () => {
    test('should detect language switch from English to Chinese', () => {
      const isSwitch = languageDetector.isLanguageSwitch('en', '你好，我想了解服务');
      expect(isSwitch).toBe(true);
    });

    test('should detect language switch from Chinese to English', () => {
      const isSwitch = languageDetector.isLanguageSwitch('zh', 'Hello, I want to know about the service');
      expect(isSwitch).toBe(true);
    });

    test('should not detect switch when language remains the same', () => {
      const isSwitch = languageDetector.isLanguageSwitch('en', 'Another English message');
      expect(isSwitch).toBe(false);
    });

    test('should not detect switch for Chinese to Chinese', () => {
      const isSwitch = languageDetector.isLanguageSwitch('zh', '另一个中文消息');
      expect(isSwitch).toBe(false);
    });

    test('should detect switch from Japanese to Korean', () => {
      const isSwitch = languageDetector.isLanguageSwitch('ja', '안녕하세요');
      expect(isSwitch).toBe(true);
    });

    test('should handle ambiguous text switches', () => {
      // When text is ambiguous, it should fall back to previous language
      const isSwitch = languageDetector.isLanguageSwitch('zh', 'test 123');
      expect(isSwitch).toBe(false); // Falls back to 'zh', so no switch
    });

    test('should handle empty text switches', () => {
      const isSwitch = languageDetector.isLanguageSwitch('en', '');
      expect(isSwitch).toBe(false); // Empty text falls back to previous
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle very long texts', () => {
      const longChineseText = '这是一个非常长的中文文本。'.repeat(100);
      const result = languageDetector.detect(longChineseText, 'en');
      expect(result).toBe('zh');
    });

    test('should handle very short texts', () => {
      expect(languageDetector.detect('你', 'en')).toBe('zh');
      expect(languageDetector.detect('a', 'zh')).toBe('en');
      expect(languageDetector.detect('お', 'en')).toBe('ja');
      expect(languageDetector.detect('한', 'en')).toBe('ko');
    });

    test('should handle texts with only punctuation', () => {
      const punctuationTexts = [
        '!@#$%^&*()',
        '......',
        '??!!',
        '---+++',
        '《》「」'
      ];

      punctuationTexts.forEach(text => {
        const result = languageDetector.detect(text, 'es');
        expect(result).toBe('es'); // Should fall back
      });
    });

    test('should handle mixed script boundaries', () => {
      const boundaryTexts = [
        'Hello你好',
        '你好World',
        'こんにちはHello',
        '안녕Hello세요'
      ];

      expect(languageDetector.detect(boundaryTexts[0], 'en')).toBe('zh'); // CJK detected first
      expect(languageDetector.detect(boundaryTexts[1], 'en')).toBe('zh');
      expect(languageDetector.detect(boundaryTexts[2], 'en')).toBe('ja');
      expect(languageDetector.detect(boundaryTexts[3], 'en')).toBe('ko');
    });

    test('should handle null and undefined gracefully', () => {
      expect(() => languageDetector.detect(null as any, 'en')).toThrow();
      expect(() => languageDetector.detect(undefined as any, 'en')).toThrow();
    });

    test('should handle non-string inputs gracefully', () => {
      expect(() => languageDetector.detect(123 as any, 'en')).toThrow();
      expect(() => languageDetector.detect({} as any, 'en')).toThrow();
      expect(() => languageDetector.detect([] as any, 'en')).toThrow();
    });
  });

  test.describe('Performance Tests', () => {
    test('should process multiple detections quickly', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        languageDetector.detect('测试文本', 'en');
        languageDetector.detect('Test text', 'zh');
        languageDetector.detect('テストテキスト', 'en');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    test('should handle large text detection efficiently', () => {
      const largeText = '这是一个包含大量中文字符的非常长的文本内容。'.repeat(1000);
      
      const startTime = Date.now();
      const result = languageDetector.detect(largeText, 'en');
      const endTime = Date.now();
      
      expect(result).toBe('zh');
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });
  });
});