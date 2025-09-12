import { Layer, pipe, Effect } from 'effect'
import { ConfigService } from '@packages/isomorphic'

// Import all service layers
import { AIServiceEffect, AIServiceLive, makeAIServiceLayer } from './AIServiceEffect'
import { ScoringEngineEffect, ScoringEngineLive, makeScoringEngineLayer } from './ScoringEngineEffect'
import { ContextCompressorEffect, ContextCompressorLive, makeContextCompressorLayer } from './ContextCompressorEffect'
import { LanguageDetector, LanguageDetectorLive } from './LanguageDetectorEffect'

// Re-export services for external use
export {
    // AI Service
    AIServiceEffect,
    AIServiceLive,
    makeAIServiceLayer,
    
    // Scoring Engine
    ScoringEngineEffect,
    ScoringEngineLive,
    makeScoringEngineLayer,
    
    // Context Compressor
    ContextCompressorEffect,
    ContextCompressorLive,
    makeContextCompressorLayer,
    
    // Language Detector
    LanguageDetector,
    LanguageDetectorLive
}

// Re-export types
export type { AIResponse, AIServiceConfig, AIModel, AIServiceError } from './AIServiceEffect'
export type { ScoringResult, ScoringError } from './ScoringEngineEffect'
export type { DetectionResult, LanguageDetectionError } from './LanguageDetectorEffect'
export type { CompressionError } from './ContextCompressorEffect'

/**
 * Combined layer for all dialog services with default configuration
 * This provides all services needed for dialog management in one layer
 */
export const DialogServicesLive = pipe(
    // Language detector (no config needed)
    LanguageDetectorLive,
    
    // Context compressor with default config (will use ConfigService if available)
    Layer.provideMerge(makeContextCompressorLayer()),
    
    // Scoring engine with default config
    Layer.provideMerge(makeScoringEngineLayer({
        thresholds: {
            highSuccess: 0.7,
            moderateSuccess: 0.5,
            riskZone: 0.3,
            critical: 0.2
        },
        weights: {
            userEngagement: 0.3,
            topicRelevance: 0.25,
            emotionalTone: 0.2,
            responseQuality: 0.15,
            goalProximity: 0.1
        }
    }))
    
    // Note: AI Service requires API key, so it must be provided separately
    // Use makeAIServiceLayer({ apiKey: 'your-key' }) when composing
)

/**
 * Factory function to create complete dialog services layer with custom AI config
 * @param aiConfig Configuration for AI service (requires API key)
 * @returns Complete layer with all dialog services
 */
export const makeDialogServicesLayer = (aiConfig: { apiKey: string, model?: string }) =>
    pipe(
        DialogServicesLive,
        Layer.provideMerge(makeAIServiceLayer({
            apiKey: aiConfig.apiKey,
            model: aiConfig.model as any || 'gpt-4-turbo-preview'
        }))
    )

/**
 * Factory function to create dialog services using ConfigService
 * Requires ConfigService to be available in the environment
 */
export const makeDialogServicesWithConfig = () =>
    Effect.gen(function* () {
        const config = yield* ConfigService
        const appConfig = yield* config.getFullConfig()
        
        // Return the composed layer
        return pipe(
            LanguageDetectorLive,
            Layer.provideMerge(makeContextCompressorLayer(appConfig.context)),
            Layer.provideMerge(makeScoringEngineLayer(appConfig.scoring)),
            Layer.provideMerge(makeAIServiceLayer(appConfig.openai))
        )
    })