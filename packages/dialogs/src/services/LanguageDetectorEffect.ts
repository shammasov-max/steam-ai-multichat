import { Effect, Context, Layer, Data, Option, Array as A, pipe, Runtime } from 'effect'
import * as S from '@effect/schema/Schema'

/**
 * Language detection result with confidence score
 */
export class DetectionResult extends S.Class<DetectionResult>('DetectionResult')({
    language: S.String,
    confidence: S.Number.pipe(S.between(0, 1))
}) {}

/**
 * Language detection error
 */
export class LanguageDetectionError extends Data.TaggedError('LanguageDetectionError')<{
    readonly message: string
    readonly text?: string
}> {}

/**
 * Language patterns configuration
 */
const languagePatterns = {
    zh: /[\u4e00-\u9fff]/,
    ja: /[\u3040-\u309f\u30a0-\u30ff]/,
    ko: /[\uac00-\ud7af]/,
    ru: /[а-яА-Я]/,
    es: /[áéíóúñ¿¡]/i,
} as const

/**
 * Spanish language indicators
 */
const spanishIndicators = [
    'qué', 'cómo', 'por qué', 'dónde', 'cuándo',
    'está', 'estás', 'están', 'estoy',
    'hola', 'gracias', 'por favor', 'sí', 'no sé'
] as const

/**
 * Language detector service interface
 */
export interface LanguageDetectorService {
    /**
     * Detect language from text
     */
    readonly detect: (text: string, fallbackLanguage: string) => Effect.Effect<string, LanguageDetectionError>
    
    /**
     * Detect language with confidence score
     */
    readonly detectWithConfidence: (text: string, fallbackLanguage: string) => Effect.Effect<DetectionResult, LanguageDetectionError>
    
    /**
     * Detect dominant language from multiple texts
     */
    readonly detectMultiple: (texts: readonly string[], primaryLanguage: string) => Effect.Effect<string, LanguageDetectionError>
    
    /**
     * Check if there's a language switch
     */
    readonly isLanguageSwitch: (previousLanguage: string, currentText: string) => Effect.Effect<boolean, LanguageDetectionError>
}

/**
 * Language detector service tag
 */
export class LanguageDetector extends Context.Tag('LanguageDetector')<
    LanguageDetector,
    LanguageDetectorService
>() {}

/**
 * Internal implementation functions
 */
const detectLatinLanguage = (text: string, fallbackLanguage: string): string => {
    const lowerText = text.toLowerCase()
    
    const hasSpanishIndicators = spanishIndicators.some(indicator => 
        lowerText.includes(indicator)
    )
    
    if (hasSpanishIndicators || languagePatterns.es.test(text)) {
        return 'es'
    }

    if (fallbackLanguage === 'en' || fallbackLanguage === 'es') {
        return fallbackLanguage
    }

    return 'en'
}

const detectLanguage = (text: string, fallbackLanguage: string): string => {
    const trimmedText = text.trim()
    
    if (!trimmedText) {
        return fallbackLanguage
    }

    // Check for Japanese-specific characters first (hiragana/katakana)
    if (languagePatterns.ja.test(trimmedText)) {
        return 'ja'
    }
    
    // Check for Korean
    if (languagePatterns.ko.test(trimmedText)) {
        return 'ko'
    }
    
    // Check for Chinese (after Japanese, since they share kanji)
    if (languagePatterns.zh.test(trimmedText)) {
        return 'zh'
    }
    
    // Check for Russian
    if (languagePatterns.ru.test(trimmedText)) {
        return 'ru'
    }
    
    // Check for Spanish
    if (languagePatterns.es.test(trimmedText)) {
        return 'es'
    }

    const hasLatinAlphabet = /[a-zA-Z]/.test(trimmedText)
    if (hasLatinAlphabet) {
        return detectLatinLanguage(trimmedText, fallbackLanguage)
    }

    return fallbackLanguage
}

/**
 * Live implementation of the LanguageDetector service
 */
export const LanguageDetectorLive = Layer.succeed(
    LanguageDetector,
    {
        detect: (text, fallbackLanguage) =>
            Effect.try({
                try: () => detectLanguage(text, fallbackLanguage),
                catch: (error) => new LanguageDetectionError({
                    message: `Failed to detect language: ${error}`,
                    text
                })
            }),

        detectWithConfidence: (text, fallbackLanguage) =>
            Effect.gen(function* () {
                const trimmedText = text.trim()
                
                if (!trimmedText) {
                    return new DetectionResult({
                        language: fallbackLanguage,
                        confidence: 0.1
                    })
                }

                // Count characters for each language
                const counts: Record<string, number> = {}
                let totalSpecialChars = 0
                
                for (const [lang, pattern] of Object.entries(languagePatterns)) {
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
                    
                    return new DetectionResult({
                        language: detectedLang,
                        confidence
                    })
                }

                // Fall back to regular detection for Latin languages
                const detected = detectLanguage(text, fallbackLanguage)
                const confidence = detected === fallbackLanguage ? 0.3 : 0.5
                
                return new DetectionResult({
                    language: detected,
                    confidence
                })
            }),

        detectMultiple: (texts, primaryLanguage) =>
            Effect.gen(function* () {
                const languageCounts: Record<string, number> = {}
                
                // Process all texts
                yield* Effect.forEach(texts, (text) =>
                    Effect.sync(() => {
                        const detected = detectLanguage(text, primaryLanguage)
                        languageCounts[detected] = (languageCounts[detected] || 0) + 1
                    })
                )
                
                // Find dominant language
                let maxCount = 0
                let dominantLanguage = primaryLanguage
                
                for (const [lang, count] of Object.entries(languageCounts)) {
                    if (count > maxCount) {
                        maxCount = count
                        dominantLanguage = lang
                    }
                }
                
                return dominantLanguage
            }),

        isLanguageSwitch: (previousLanguage, currentText) =>
            Effect.gen(function* () {
                const detectedLanguage = detectLanguage(currentText, previousLanguage)
                return detectedLanguage !== previousLanguage
            })
    }
)

/**
 * Helper functions for common use cases
 */
export const detectLanguageEffect = (text: string, fallbackLanguage: string) =>
    Effect.gen(function* () {
        const detector = yield* LanguageDetector
        return yield* detector.detect(text, fallbackLanguage)
    })

export const detectWithConfidenceEffect = (text: string, fallbackLanguage: string) =>
    Effect.gen(function* () {
        const detector = yield* LanguageDetector
        return yield* detector.detectWithConfidence(text, fallbackLanguage)
    })

export const detectMultipleEffect = (texts: readonly string[], primaryLanguage: string) =>
    Effect.gen(function* () {
        const detector = yield* LanguageDetector
        return yield* detector.detectMultiple(texts, primaryLanguage)
    })

export const isLanguageSwitchEffect = (previousLanguage: string, currentText: string) =>
    Effect.gen(function* () {
        const detector = yield* LanguageDetector
        return yield* detector.isLanguageSwitch(previousLanguage, currentText)
    })

// Backward compatibility wrapper removed - use Effect-based API directly
