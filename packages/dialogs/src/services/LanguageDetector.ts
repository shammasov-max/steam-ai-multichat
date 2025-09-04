export class LanguageDetector {
  private languagePatterns = {
    zh: /[\u4e00-\u9fff]/,
    ja: /[\u3040-\u309f\u30a0-\u30ff]/,
    ko: /[\uac00-\ud7af]/,
    ru: /[а-яА-Я]/,
    es: /[áéíóúñ¿¡]/i,
  }

  detect(text: string, fallbackLanguage: string): string {
    const trimmedText = text.trim()
    
    if (!trimmedText) {
      return fallbackLanguage
    }

    // Check for Japanese-specific characters first (hiragana/katakana)
    if (this.languagePatterns.ja.test(trimmedText)) {
      return 'ja'
    }
    
    // Check for Korean
    if (this.languagePatterns.ko.test(trimmedText)) {
      return 'ko'
    }
    
    // Check for Chinese (after Japanese, since they share kanji)
    if (this.languagePatterns.zh.test(trimmedText)) {
      return 'zh'
    }
    
    // Check other languages
    for (const [lang, pattern] of Object.entries(this.languagePatterns)) {
      if (lang !== 'zh' && lang !== 'ja' && lang !== 'ko' && pattern.test(trimmedText)) {
        return lang
      }
    }

    const hasLatinAlphabet = /[a-zA-Z]/.test(trimmedText)
    if (hasLatinAlphabet) {
      return this.detectLatinLanguage(trimmedText, fallbackLanguage)
    }

    return fallbackLanguage
  }

  private detectLatinLanguage(text: string, fallbackLanguage: string): string {
    const lowerText = text.toLowerCase()
    
    const spanishIndicators = [
      'qué', 'cómo', 'por qué', 'dónde', 'cuándo',
      'está', 'estás', 'están', 'estoy',
      'hola', 'gracias', 'por favor', 'sí', 'no sé'
    ]
    
    const hasSpanishIndicators = spanishIndicators.some(indicator => 
      lowerText.includes(indicator)
    )
    
    if (hasSpanishIndicators || this.languagePatterns.es.test(text)) {
      return 'es'
    }

    if (fallbackLanguage === 'en' || fallbackLanguage === 'es') {
      return fallbackLanguage
    }

    return 'en'
  }

  detectMultiple(texts: string[], primaryLanguage: string): string {
    const languageCounts: Record<string, number> = {}
    
    for (const text of texts) {
      const detected = this.detect(text, primaryLanguage)
      languageCounts[detected] = (languageCounts[detected] || 0) + 1
    }
    
    let maxCount = 0
    let dominantLanguage = primaryLanguage
    
    for (const [lang, count] of Object.entries(languageCounts)) {
      if (count > maxCount) {
        maxCount = count
        dominantLanguage = lang
      }
    }
    
    return dominantLanguage
  }

  isLanguageSwitch(previousLanguage: string, currentText: string): boolean {
    const detectedLanguage = this.detect(currentText, previousLanguage)
    return detectedLanguage !== previousLanguage
  }

  detectWithConfidence(text: string, fallbackLanguage: string): { language: string; confidence: number } {
    const trimmedText = text.trim()
    
    if (!trimmedText) {
      return { language: fallbackLanguage, confidence: 0.1 }
    }

    // Count characters for each language
    const counts: Record<string, number> = {}
    let totalSpecialChars = 0
    
    for (const [lang, pattern] of Object.entries(this.languagePatterns)) {
      const matches = trimmedText.match(new RegExp(pattern.source, 'g')) || []
      if (matches.length > 0) {
        counts[lang] = matches.length
        totalSpecialChars += matches.length
      }
    }

    // If we have strong language-specific characters
    if (totalSpecialChars > 0) {
      let maxCount = 0
      let detectedLang = fallbackLanguage
      
      for (const [lang, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count
          detectedLang = lang
        }
      }
      
      // Calculate confidence based on ratio of specific chars to text length
      const confidence = Math.min(0.95, Math.max(0.6, (maxCount / trimmedText.length) * 2))
      return { language: detectedLang, confidence }
    }

    // Fall back to regular detection for Latin languages
    const detected = this.detect(text, fallbackLanguage)
    const confidence = detected === fallbackLanguage ? 0.3 : 0.5
    
    return { language: detected, confidence }
  }
}