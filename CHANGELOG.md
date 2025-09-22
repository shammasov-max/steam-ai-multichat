# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2025-09-22] - Phase 5 Complete
### Optimized
- **Code Reduction**: Achieved 568-line reduction across 8 files (109% of target)
- **Type Inference**: Eliminated redundant type annotations across isomorphic package
- **ReturnType Patterns**: Applied ReturnType utility pattern in steam-api package (110 lines reduced)
- **Schema Utilities**: Refactored dialogs slice using createUnionSchema and withAnnotations utilities
- **Error Factories**: Consolidated 14 error classes into factory patterns (56 lines reduced)

### Added
- **Optimization Patterns**: Established 4 reusable optimization patterns
  - Type inference optimization for internal types
  - ReturnType utility pattern for service definitions
  - Schema helper utilities for DRY schema creation
  - Error factory pattern for consistent error handling
- **Documentation**: Comprehensive migration guide and final report
- **Metrics Tracking**: Detailed optimization metrics in `/refactor/state.json`

### Performance
- **Codebase Impact**: 0.63% reduction in total lines (89,806 line codebase)
- **Parallel Execution**: Successfully executed optimization in parallel waves
- **Type Safety**: Enhanced type inference while maintaining strict TypeScript compliance

### Developer Experience
- Added comprehensive Plan Generation Instructions to CLAUDE.md
  - Model selection guidelines (Opus/Sonnet/Haiku) with parallelization limits
  - Structured hybrid plan format for parallel task execution
  - Subagent coordination rules with file ownership boundaries
  - Mandatory cleanup requirements for Node.js processes
  - Required parallel execution analysis for all implementation plans

### Changed
- **BREAKING**: Completed Phase 3C Part 1 - Full migration to Effect-TS services in dialogs package
  - Removed all legacy non-Effect service implementations
  - Dialogs package now exclusively uses Effect-TS patterns
- Updated service imports throughout dialogs package to use Effect implementations
  - `AIService` → `AIServiceEffect`
  - `ScoringEngine` → `ScoringEngineEffect`
  - `DialogManager` → `DialogManagerService`
- Fixed Logger integration in DialogManagerEffect
  - Replaced `SimpleLogger` with `LoggerLayer`
  - Proper Effect-TS Logger service integration

### Removed
- Deleted legacy service implementations (non-Effect versions)
  - `packages/dialogs/src/services/AIService.ts`
  - `packages/dialogs/src/services/DialogManager.ts`
  - `packages/dialogs/src/services/ScoringEngine.ts`
- Removed non-existent resilience patterns from AIServiceEffect
  - Cleaned up references to undefined exponentialBackoff, CircuitBreaker functions
  - Simplified to direct service implementation

### Fixed
- Fixed AIServiceOps interface to include all error types
  - Added OpenAIAPIError, InvalidResponseError, RateLimitError, ConnectionError
  - Proper error type union for generateResponse and testConnection methods
- Resolved all TypeScript compilation errors in dialogs package
- Fixed missing type exports in services index

### Improved
- Simplified AIServiceEffect by removing unnecessary complexity
- Reduced code by ~200 lines through cleanup of unused patterns
- Enhanced type safety with complete error type definitions

## [0.9.0] - 2024-09-15

### Added
- Effect-Redux integration in `packages/isomorphic/src/effect-redux/`
  - Redux middleware with Effect-TS integration
  - Saga bridge for Effect-based patterns
  - Store factory with runtime integration
- Complete Effect-TS service implementations
  - `AIServiceEffect.ts` - AI service with Effect patterns
  - `ScoringEngineEffect.ts` - Dialog scoring with Effect
  - `ContextCompressorEffect.ts` - Context compression service
  - `LanguageDetectorEffect.ts` - Language detection service
- Configuration system with Effect Config patterns
  - `ConfigService.ts` - Centralized configuration management
  - `ConfigSchema.ts` - Validated configuration schemas
  - `ConfigLive.ts` - Environment-based configuration layers

### Changed
- Migrated all dialog services to Effect-TS patterns
- Refactored MongoDB layer to use Effect-TS resource management
- Updated Steam API integration with Effect-TS connection pooling

## [0.8.0] - 2024-09-11

### Added
- `DialogManagerEffect.ts` (171 lines) - Full Effect service pattern implementation
- `MongoDatabaseEffect.ts` (262 lines) - Complete Effect MongoDB implementation
- `SteamAgentEffect.ts` (348 lines) - Effect-based Steam API with connection pooling
- Query batching via `findBatch` method in repositories
- Optional per-repository caching with TTL support
- Structured error handling with tagged errors

### Changed
- Reduced `ScoringEngine.ts` complexity by 53% (538 → 254 lines)
- Implemented proper resource management with `Effect.addFinalizer`
- Added backward compatibility wrapper for Steam API migration

### Removed
- Deleted 2,702 lines of unused experimental code
- Removed duplicate memoized implementations (420 lines)
- Cleaned up unused Steam API refactor code (710 lines)

## [0.7.0] - 2024-09-08

### Added
- Structured JSON logging with `SimpleLogger` implementation
- Six memoized selectors to `createEntitySlice` for performance
- `entityTypes.ts` for better type separation
- Branded types using TypeID for entity identifiers
- Effect Schema validation at system boundaries

### Fixed
- Eliminated 30+ TypeScript `any` types with proper generics
- Resolved all critical TypeScript compilation issues

### Changed
- Achieved 100% type coverage in production code
- Improved Redux architecture with memoized selectors

## [0.6.0] - 2024-09-01

### Added
- Initial Effect-TS pattern implementations
- MongoDB event sourcing with snapshots
- AI-powered dialog assessment with OpenAI GPT-4
- Real-time updates via Server-Sent Events (SSE)
- Multi-language support (Chinese, Japanese, Korean, English, Spanish)
- Steam account automation via unofficial APIs
- Google Sheets database adapter

### Changed
- Adopted CQRS-lite event-driven architecture
- Implemented Redux-based state management (isomorphic)
- Established monorepo structure with Yarn workspaces

### Security
- Added rate limiting for Steam friend invites (1 per minute)
- Implemented proxy support for each Steam account
- Added environment-based configuration management

## [0.5.0] - 2024-08-15

### Added
- Initial project setup with TypeScript monorepo
- Core packages structure:
  - `packages/frontend` - React SPA
  - `packages/server` - Node.js backend
  - `packages/isomorphic` - Shared code
  - `packages/steam-api` - Steam integration
  - `packages/dialogs` - Dialog management
  - `packages/db` - Database layer
  - `packages/google-sheets-db` - Google Sheets adapter

### Changed
- Established TypeScript strict mode configuration
- Set up ESLint and Prettier with custom rules
- Configured Vitest for testing with Effect-TS support

[Unreleased]: https://github.com/your-org/effect-redux/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/your-org/effect-redux/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/your-org/effect-redux/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/your-org/effect-redux/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/your-org/effect-redux/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/your-org/effect-redux/releases/tag/v0.5.0