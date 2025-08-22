export class LanguageDetector {
  private languagePatterns = {
    zh: /[\u4e00-\u9fff]/,
    ja: /[\u3040-\u309f\u30a0-\u30ff]/,
    ko: /[\uac00-\ud7af]/,
    ru: /[а-яА-Я]/,
    es: /[áéíóúñ¿¡]/i,
  };

  detect(text: string, fallbackLanguage: string): string {
    const trimmedText = text.trim();
    
    if (!trimmedText) {
      return fallbackLanguage;
    }

    for (const [lang, pattern] of Object.entries(this.languagePatterns)) {
      if (pattern.test(trimmedText)) {
        return lang;
      }
    }

    const hasLatinAlphabet = /[a-zA-Z]/.test(trimmedText);
    if (hasLatinAlphabet) {
      return this.detectLatinLanguage(trimmedText, fallbackLanguage);
    }

    return fallbackLanguage;
  }

  private detectLatinLanguage(text: string, fallbackLanguage: string): string {
    const lowerText = text.toLowerCase();
    
    const spanishIndicators = [
      'qué', 'cómo', 'por qué', 'dónde', 'cuándo',
      'está', 'estás', 'están', 'estoy',
      'hola', 'gracias', 'por favor', 'sí', 'no sé'
    ];
    
    const hasSpanishIndicators = spanishIndicators.some(indicator => 
      lowerText.includes(indicator)
    );
    
    if (hasSpanishIndicators || this.languagePatterns.es.test(text)) {
      return 'es';
    }

    if (fallbackLanguage === 'en' || fallbackLanguage === 'es') {
      return fallbackLanguage;
    }

    return 'en';
  }

  detectMultiple(texts: string[], primaryLanguage: string): string {
    const languageCounts: Record<string, number> = {};
    
    for (const text of texts) {
      const detected = this.detect(text, primaryLanguage);
      languageCounts[detected] = (languageCounts[detected] || 0) + 1;
    }
    
    let maxCount = 0;
    let dominantLanguage = primaryLanguage;
    
    for (const [lang, count] of Object.entries(languageCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantLanguage = lang;
      }
    }
    
    return dominantLanguage;
  }

  isLanguageSwitch(previousLanguage: string, currentText: string): boolean {
    const detectedLanguage = this.detect(currentText, previousLanguage);
    return detectedLanguage !== previousLanguage;
  }
}