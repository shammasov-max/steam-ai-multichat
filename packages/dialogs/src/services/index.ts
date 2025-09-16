import { Layer, pipe, Effect } from 'effect'

// Import all service layers from Effect implementations
import {
    AIServiceEffect as AIService,
    AIServiceLive,
    makeAIServiceLayer as AIServiceWithConfig,
    AIServiceConfig as AIConfig,
    AIConfigEffect as AIConfigTag,
    AIServiceError as AIError,
    RateLimitError,
    InvalidResponseError,
    OpenAIAPIError,
    ConnectionError,
    type AIModel,
    type AIResponse
} from './AIServiceEffect'
import {
    ScoringEngineEffect as ScoringEngine,
    ScoringEngineLive,
    ScoringError,
    InvalidInputError,
    type ScoringResult
} from './ScoringEngineEffect'
import {
    ContextCompressorEffect,
    ContextCompressorLive,
    makeContextCompressorLayer
} from './ContextCompressorEffect'
import {
    LanguageDetector,
    LanguageDetectorLive
} from './LanguageDetectorEffect'
import {
    DialogManagerService as DialogManager,
    DialogManagerLive
} from '../DialogManagerEffect'

// Re-export services for external use
export {
    // AI Service
    AIService,
    AIServiceLive,
    AIServiceWithConfig,
    AIConfig,
    AIConfigTag,
    AIError,
    RateLimitError,
    InvalidResponseError,
    OpenAIAPIError,
    ConnectionError,

    // Scoring Engine
    ScoringEngine,
    ScoringEngineLive,
    ScoringError,
    InvalidInputError,

    // Dialog Manager
    DialogManager,
    DialogManagerLive,

    // Context Compressor
    ContextCompressorEffect,
    ContextCompressorLive,
    makeContextCompressorLayer,

    // Language Detector
    LanguageDetector,
    LanguageDetectorLive
}

// Re-export types
export type { AIModel, ScoringResult, AIResponse }

/**
 * Combined layer for all dialog services with default configuration
 * This provides all services needed for dialog management in one layer
 */
export const DialogServicesLive = pipe(
    // Language detector (no config needed)
    LanguageDetectorLive,

    // Context compressor with default config
    Layer.provideMerge(makeContextCompressorLayer()),

    // Scoring engine with default config
    Layer.provideMerge(ScoringEngineLive)

    // Note: AI Service and Dialog Manager require additional dependencies
    // They must be provided separately based on your configuration
)

/**
 * Factory function to create complete dialog services layer with custom AI config
 * @param aiConfig Configuration for AI service (requires API key)
 * @returns Complete layer with all dialog services
 */
export const makeDialogServicesLayer = (aiConfig: AIConfig) =>
    pipe(
        DialogServicesLive,
        Layer.provideMerge(AIServiceWithConfig(aiConfig)),
        Layer.provideMerge(DialogManagerLive)
    )

/**
 * Test layer for dialog services with mock implementations
 */
export const DialogServicesTest = pipe(
    LanguageDetectorLive,
    Layer.provideMerge(makeContextCompressorLayer()),
    Layer.provideMerge(ScoringEngineLive)
    // Note: Add test/mock implementations of AIService and DialogManager as needed
)