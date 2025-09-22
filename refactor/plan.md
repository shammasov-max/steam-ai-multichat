# Refactor Plan - Phase 5: Code Optimization & Type Inference
*Updated: 2025-09-22*
*Previous Phase: Phase 4 - Dynamic Service Reconfiguration (Partial)*

## Code Optimization Goals
- **Target LOC Reduction**: 3.5% (520 lines)
- **Type Definitions to Eliminate**: 15 redundant exports
- **Patterns to Extract**: 8 shared utilities
- **Error Classes to Consolidate**: 14 → 3

## Initial State Analysis

### Current Architecture
- **Configuration**: ✅ Simplified to 2 env vars (completed in Phase 4)
- **Type System**: Heavy use of explicit type exports (27 instances)
- **Code Patterns**: Significant duplication in schemas, errors, and services
- **Total Files**: 112 TypeScript files in packages directory

### Problem Areas
1. **Type Redundancy**: 27 explicit `export type X = S.Schema.Type<...>` declarations
2. **Pattern Duplication**: Similar schemas, error classes, and service patterns
3. **Verbose Annotations**: Repetitive schema annotations throughout
4. **Missing Utilities**: No shared helpers for common patterns

### Dependencies
- Effect 3.x for SubscriptionRef, Ref patterns
- Redux for SystemSlice state management
- MongoDB for persistence

## Refactoring Tasks (Hybrid Optimal Approach)

### Phase 1: Pattern Extraction (2 hours) - Priority 1
- [ ] Create `packages/isomorphic/src/utils/schema-helpers.ts`
- [ ] Implement `createEntitySchema()` utility (-100 lines)
- [ ] Implement `createUnionSchema()` utility (-50 lines)
- [ ] Implement `createErrorClass()` factory (-55 lines)
- [ ] Implement `withAnnotations()` helper (-30 lines)
- [ ] Test utilities with existing schemas

### Phase 2: Apply Patterns (1 hour) - Priority 2
- [ ] Refactor accounts slice to use utilities (-25 lines)
- [ ] Refactor dialogs slice to use utilities (-35 lines)
- [ ] Refactor systemSlice to use utilities (-20 lines)
- [ ] Consolidate 14 error classes → 3 factories (-55 lines)
- [ ] Extract common test helpers (-40 lines)

### Phase 3: Type Inference (1 hour) - Priority 3
- [ ] Remove redundant type exports (15 internal) (-30 lines)
- [ ] Keep public API types explicit (12 types)
- [ ] Use ReturnType for service methods (-25 lines)
- [ ] Use Parameters utility where applicable (-15 lines)

### Phase 4: Cleanup & Validation (30 min) - Priority 4
- [ ] Simplify verbose annotations (-40 lines)
- [ ] Remove unused imports (-20 lines)
- [ ] Run full type check
- [ ] Run all tests
- [ ] Update documentation

## Implementation Patterns

### Pattern 1: Entity Schema Factory
```typescript
export const createEntitySchema = <T extends Record<string, any>>(
  name: string,
  fields: T
) => S.Struct({
  [`${name.toLowerCase()}Id`]: S.String,
  createdAt: S.Number,
  updatedAt: S.Number,
  ...fields
}).annotations({ title: name })
```

### Pattern 2: Union Schema Helper
```typescript
export const createUnionSchema = <const T extends ReadonlyArray<string>>(
  name: string,
  values: T
) => {
  const schema = S.Union(...values.map(v => S.Literal(v)))
  return schema.annotations({ title: name })
}

// Usage: const StatusSchema = createUnionSchema('Status', ['active', 'paused'] as const)
```

### Pattern 3: Error Class Factory
```typescript
export const createErrorClass = <T extends Record<string, any>>(
  name: string,
  fields?: T
) => class extends Data.TaggedError(name)<T> {}

// Usage: const NotFoundError = createErrorClass('NotFound', { id: S.String })
```

## Validation Checklist
- [ ] All patterns successfully extracted to utilities
- [ ] No broken imports after refactoring
- [ ] Type inference maintains type safety
- [ ] All tests passing (100% required)
- [ ] Type checking passes without errors
- [ ] LOC reduction target achieved (520 lines)
- [ ] Documentation updated with new patterns
- [ ] No performance regressions

## De-Para Mapping

| Before | After | LOC Saved | Status |
|--------|-------|-----------|--------|
| export type X = S.Schema.Type<...> | Type inference | 40 | Pending |
| Individual error classes | Error factory pattern | 55 | Pending |
| Repeated entity schemas | createEntitySchema() | 100 | Pending |
| Verbose annotations | withAnnotations() | 40 | Pending |
| Duplicate test helpers | Shared utilities | 40 | Pending |
| Manual union schemas | createUnionSchema() | 50 | Pending |
| Explicit return types | ReturnType utility | 25 | Pending |

## Risk Assessment

### Low Risk
- Removing AIConfigEffect Tag
- Cleaning up imports

### Medium Risk
- Adding SubscriptionRef patterns
- Service restart logic

### High Risk
- Automatic service reconfiguration
- Config change during active operations

## Success Metrics

| Metric | Before | Target | Actual | Status |
|--------|---------|---------|--------|--------|
| Total LOC | ~15,000 | ~14,480 | - | Pending |
| Type Exports | 27 | 12 | - | Pending |
| Error Classes | 14 | 3 | - | Pending |
| Shared Utilities | 0 | 8 | - | Pending |
| Test Pass Rate | 100% | 100% | - | Required |
| Type Check | Pass | Pass | - | Required |

## Next Steps
1. Create feature branch for optimization
2. Implement Phase 1 utilities
3. Apply patterns incrementally
4. Validate after each phase
5. Document final patterns for team

## Session History
- Phase 3C: ✅ Dialogs package fully migrated to Effect-TS
- Phase 4: ✅ Config simplified (partial - cleanup tasks completed)
- Phase 5: 🔄 Code optimization through type inference and patterns (current)