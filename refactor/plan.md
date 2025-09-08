# Refactor Plan - 2025-01-08

## Initial State Analysis

### Current Architecture
- **Monorepo Structure**: TypeScript Yarn workspaces with Effect-TS architecture
- **Core Pattern**: Redux + Effect-TS with entity slices and event-driven design
- **Key Packages**: 
  - `isomorphic`: Redux slices and shared types (has experimental code with TypeScript ignores)
  - `db`: MongoDB persistence layer
  - `dialogs`: AI-powered dialog management
  - `server`: Backend with Effect-TS
  - `frontend`: React SPA (has TypeScript errors)
  - `steam-api`: Steam integration

### Problem Areas

#### 1. TypeScript Compilation Issues
- **5 files with @ts-nocheck**: Experimental Effect-Redux integration code suppressing type errors
- **Frontend errors**: JSX attribute duplicates, incorrect AG-Grid types, missing properties
- **Export naming issues**: External module names cannot be resolved in store-saga-integration.ts

#### 2. Architectural Inconsistencies
- **Experimental code mixed with production**: Effect-saga patterns are proof-of-concept but mixed in base directory
- **Large file complexity**: Several files exceed 400 lines (ScoringEngine, DialogManager, store-saga-integration)
- **Type inference issues**: Heavy reliance on TypeScript ignores instead of proper typing

#### 3. Code Organization
- **Mixed concerns**: Base directory contains both production utilities and experimental code
- **Unclear boundaries**: Effect saga integration is tightly coupled with example store
- **Missing abstractions**: Complex scoring and dialog logic could be better modularized

### Dependencies
- **Effect 3.0**: Core functional programming library
- **Redux Toolkit**: State management
- **MongoDB**: Database layer
- **OpenAI**: AI service integration
- **Steam packages**: Unofficial Steam API access

### Test Coverage
- Unit tests exist for createEntitySlice
- Integration tests for database layer
- Missing tests for experimental Effect-saga code
- Frontend tests need updating

## Refactoring Tasks

### Phase 1: Quick Wins (Low Risk)
- [x] Fix TypeScript errors in tests (parameter types)
- [ ] Clean up duplicate JSX attributes in frontend
- [ ] Fix AG-Grid type mismatches
- [ ] Add missing property definitions

### Phase 2: Structural Improvements (Medium Risk)
- [ ] **Separate experimental code**
  - Move Effect-saga experiments to `packages/isomorphic/src/experimental/`
  - Keep production createEntitySlice in base
  - Create clear boundary between stable and experimental APIs

- [ ] **Fix type exports**
  - Export required types from example-store.ts
  - Resolve external module naming issues
  - Remove need for @ts-nocheck directives

- [ ] **Modularize complex services**
  - Split ScoringEngine into smaller focused modules
  - Extract dialog state management from DialogManager
  - Create separate context compression strategies

### Phase 3: Architectural Refactoring (Higher Risk)
- [ ] **Implement proper Effect patterns**
  - Convert experimental generators to proper Effect.gen usage
  - Add proper service layers with Context
  - Implement proper error handling with Effect

- [ ] **Optimize bundle structure**
  - Split large modules into smaller chunks
  - Implement code splitting for frontend
  - Remove unused dependencies

- [ ] **Enhance type safety**
  - Replace all @ts-nocheck with proper types
  - Implement stricter TypeScript configuration
  - Add runtime validation with Effect Schema

### Phase 4: Performance Optimizations
- [ ] **Reduce file sizes**
  - Split files > 300 lines into logical modules
  - Extract reusable utilities
  - Minimize bundle sizes

- [ ] **Improve import efficiency**
  - Use barrel exports wisely
  - Implement lazy loading where appropriate
  - Optimize dependency tree

## Validation Checklist
- [ ] All TypeScript errors resolved
- [ ] No @ts-nocheck or @ts-ignore remaining
- [ ] All tests passing
- [ ] Build successful
- [ ] Type checking clean
- [ ] No orphaned code
- [ ] Documentation updated
- [ ] Experimental code clearly separated
- [ ] Frontend compiles without errors
- [ ] Effect patterns properly implemented

## De-Para Mapping

| Before | After | Status |
|--------|-------|--------|
| packages/isomorphic/src/base/effect-saga.ts | packages/isomorphic/src/experimental/effect-saga.ts | Pending |
| packages/isomorphic/src/base/store-saga-integration.ts | packages/isomorphic/src/experimental/store-saga-integration.ts | Pending |
| packages/isomorphic/src/base/example-store.ts | packages/isomorphic/src/experimental/example-store.ts | Pending |
| @ts-nocheck directives | Proper TypeScript types | Pending |
| Large monolithic files | Modular focused modules | Pending |
| Mixed production/experimental | Clear separation | Pending |

## Risk Assessment

### Low Risk Changes
- Fixing TypeScript compilation errors
- Updating import paths
- Adding missing type definitions

### Medium Risk Changes
- Moving files to new directories
- Splitting large modules
- Updating test configurations

### High Risk Changes
- Rewriting Effect-saga patterns
- Changing core architectural patterns
- Modifying production entity slice behavior

## Rollback Strategy
1. Git checkpoint before each phase
2. Incremental commits at logical boundaries
3. Test validation after each change
4. Maintain backward compatibility for APIs
5. Keep original experimental code until new implementation validated

## Success Metrics
- **Zero TypeScript errors**: Full compilation without suppressions
- **Improved maintainability**: Files < 300 lines
- **Clear architecture**: Separation of concerns
- **Better performance**: Reduced bundle size
- **Enhanced type safety**: No type suppressions needed

## Next Steps
1. Create git checkpoint
2. Start with Phase 1 quick wins
3. Validate each change with tests
4. Progress through phases systematically
5. Document breaking changes if any