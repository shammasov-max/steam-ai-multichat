// Core Dialog Manager
export { 
    DialogManagerService, 
    DialogManagerLive,
    DialogManagerWithServices,
    runWithDialogManager,
    createDialog,
    processMessage
} from './DialogManagerEffect'

// Individual Services and Layers
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
    LanguageDetectorLive,
    
    // Unified Layer Compositions
    DialogServicesLive,
    makeDialogServicesLayer,
    makeDialogServicesWithConfig
} from './services'

// Types
export * from './types'
export type { 
    AIResponse, 
    AIServiceConfig, 
    AIModel, 
    AIServiceError,
    ScoringResult,
    ScoringError,
    DetectionResult,
    LanguageDetectionError,
    CompressionError
} from './services'
