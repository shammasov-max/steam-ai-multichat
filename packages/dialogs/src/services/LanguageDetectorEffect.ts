import { Effect, Context, Layer, Data } from 'effect'

/**
 * Language detection result with confidence score
 */
export interface DetectionResult {
    readonly language: string
    readonly confidence: number
}

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
    
    return (hasSpanishIndicators || languagePatterns.es.test(text))
        ? 'es'
        : (fallbackLanguage === 'en' || fallbackLanguage === 'es') ? fallbackLanguage : 'en'
}

const detectLanguage = (text: string, fallbackLanguage: string): string => {
    const trimmedText = text.trim()
    
    if (!trimmedText) return fallbackLanguage

    // Check language patterns in priority order
    const patterns = [
        ['ja', languagePatterns.ja],
        ['ko', languagePatterns.ko],
        ['zh', languagePatterns.zh],
        ['ru', languagePatterns.ru],
        ['es', languagePatterns.es],
    ] as const
    
    for (const [lang, pattern] of patterns) {
        if (pattern.test(trimmedText)) return lang
    }

    return /[a-zA-Z]/.test(trimmedText)
        ? detectLatinLanguage(trimmedText, fallbackLanguage)
        : fallbackLanguage
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
            Effect.sync(() => {
                const trimmedText = text.trim()
                
                if (!trimmedText) {
                    return { language: fallbackLanguage, confidence: 0.1 }
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
                    const [detectedLang, maxCount] = Object.entries(counts).reduce(
                        ([lang, max], [currentLang, count]) => 
                            count > max ? [currentLang, count] : [lang, max],
                        [fallbackLanguage, 0]
                    )
                    
                    // Calculate confidence based on ratio of specific chars to text length
                    const confidence = Math.min(0.95, Math.max(0.6, (maxCount / trimmedText.length) * 2))
                    
                    return { language: detectedLang, confidence }
                }

                // Fall back to regular detection for Latin languages
                const detected = detectLanguage(text, fallbackLanguage)
                const confidence = detected === fallbackLanguage ? 0.3 : 0.5
                
                return { language: detected, confidence }
            }),

        detectMultiple: (texts, primaryLanguage) =>
            Effect.sync(() => {
                const languageCounts: Record<string, number> = {}
                
                // Process all texts
                for (const text of texts) {
                    const detected = detectLanguage(text, primaryLanguage)
                    languageCounts[detected] = (languageCounts[detected] || 0) + 1
                }
                
                // Find dominant language
                const [dominantLanguage] = Object.entries(languageCounts).reduce(
                    ([lang, max], [currentLang, count]) => 
                        count > max ? [currentLang, count] : [lang, max],
                    [primaryLanguage, 0]
                )
                
                return dominantLanguage
            }),

        isLanguageSwitch: (previousLanguage, currentText) =>
            Effect.sync(() => detectLanguage(currentText, previousLanguage) !== previousLanguage)
    }
)

// Use LanguageDetector service directly via Effect.gen or Effect.flatMap