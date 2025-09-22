# Subagent Parallel Execution Plan

## Executive Summary
Distribute remaining refactoring tasks across 5 subagents in 2 waves to achieve maximum parallelization while avoiding conflicts.

**Time Savings**: 3 hours sequential → 45 minutes parallel (75% reduction)

## Wave 1: Parallel Code Modifications (3 agents, 30-40 minutes)

### Subagent 1: Type Inference Optimization
**Type**: general-purpose
**Scope**: packages/isomorphic/src/**/*.ts
**Tasks**:
1. Remove redundant `export type X = S.Schema.Type<typeof XSchema>` patterns
2. Replace with `type X = InferSchema<typeof XSchema>` for internal types
3. Keep explicit exports only for public APIs
4. Target files:
   - slices/*.ts (except dialogs.ts)
   - events/*.ts
   - types/*.ts

**Avoid**:
- packages/dialogs/**
- packages/server/**
- Any test files

**Expected LOC Reduction**: ~30 lines

**Specific Instructions**:
```typescript
// BEFORE:
export type AccountStatus = S.Schema.Type<typeof AccountStatusSchema>

// AFTER (for internal types):
type AccountStatus = InferSchema<typeof AccountStatusSchema>

// Keep explicit for public APIs only
```

---

### Subagent 2: ReturnType Pattern Application
**Type**: general-purpose
**Scope**: packages/server/src/**/*.ts, packages/steam-api/src/**/*.ts
**Tasks**:
1. Identify functions with explicit return type annotations
2. Remove annotations where type can be inferred
3. Apply `ReturnType<typeof fn>` pattern where type alias needed
4. Focus on service methods and utility functions

**Avoid**:
- packages/isomorphic/**
- packages/dialogs/**
- Any slice files

**Expected LOC Reduction**: ~25 lines

**Specific Instructions**:
```typescript
// BEFORE:
interface ServiceResult {
  success: boolean
  data: any
}
function processData(): ServiceResult {
  return { success: true, data: {} }
}

// AFTER:
function processData() {
  return { success: true, data: {} }
}
type ServiceResult = ReturnType<typeof processData>
```

---

### Subagent 3: Complete Dialogs Slice Refactoring
**Type**: general-purpose
**Scope**: packages/isomorphic/src/slices/dialogs.ts
**Tasks**:
1. Replace dialogs.ts with dialogs-optimized.ts content
2. Update all imports in other files
3. Apply schema-helpers utilities throughout
4. Use error-factories for error classes
5. Ensure all tests still pass

**Avoid**:
- Other slice files
- Server or steam-api packages

**Expected LOC Reduction**: ~292 lines

**Specific Instructions**:
- Use existing dialogs-optimized.ts as template
- Import utilities from '../utils/schema-helpers'
- Import error factories from '../utils/error-factories'
- Test with: `yarn test packages/isomorphic/tests/*dialog*`

## Wave 2: Validation & Cleanup (2 agents, 15-20 minutes)

### Subagent 4: Type Checking & Test Fixes
**Type**: fixer
**Scope**: All packages
**Tasks**:
1. Run `yarn typecheck` and fix any errors
2. Run `yarn test` and fix any failures
3. Update imports if needed
4. Resolve any circular dependencies
5. Clean up unused exports

**Dependencies**: Must run after Wave 1 completes

**Success Criteria**:
- Zero TypeScript errors
- All tests passing
- No broken imports

---

### Subagent 5: Metrics & Documentation
**Type**: general-purpose
**Scope**: refactor/ directory
**Tasks**:
1. Count actual LOC reduction achieved
2. Update state.json with final metrics
3. Generate comprehensive optimization report
4. Create migration guide for team
5. Document new patterns for future use

**Dependencies**: Must run after Wave 1 completes

**Deliverables**:
- refactor/final-report.md
- refactor/migration-guide.md
- Updated state.json with final metrics

## Risk Mitigation

### File Conflict Prevention
- Each agent works on separate packages
- Clear "Avoid" lists prevent overlap
- Git commits after each agent completes

### Quality Assurance
- Fixer agent validates all changes
- Type checking catches integration issues
- Test suite ensures functionality preserved

### Rollback Strategy
- Each agent commits separately
- Easy revert of individual agent work
- Main branch remains untouched

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| LOC Reduction | 347+ lines | wc -l comparison |
| Type Errors | 0 | yarn typecheck |
| Test Failures | 0 | yarn test |
| Time to Complete | <45 minutes | Wall clock time |
| File Conflicts | 0 | Git merge status |

## Execution Timeline

```
0min ────── 30min ────── 40min ────── 45min
[Agent 1: Type Inference    ]
[Agent 2: ReturnType        ]
[Agent 3: Dialogs Refactor  ]
                        [Agent 4: Fix]
                        [Agent 5: Doc]
```

## Command Sequence

### Wave 1 (Parallel Execution)
```bash
# All three run simultaneously
Agent 1: /refactor apply-type-inference --package isomorphic --exclude dialogs
Agent 2: /refactor apply-returntype --packages "server,steam-api"
Agent 3: /refactor apply-utilities --file dialogs.ts --complete
```

### Wave 2 (After Wave 1 completes)
```bash
# Both run simultaneously
Agent 4: /fix --all-packages --type-errors --test-failures
Agent 5: /refactor generate-report --final --metrics
```

## Expected Outcomes

### After Wave 1
- 347+ lines removed across codebase
- All utilities applied consistently
- Dialogs slice fully optimized

### After Wave 2
- Zero errors or warnings
- Complete documentation
- Ready for production deployment

## Notes for Execution

1. **DO NOT** modify the same file in parallel
2. **DO** use the provided utility imports exactly
3. **DO** commit after each successful task
4. **DO NOT** skip the validation phase
5. **DO** preserve all functionality

This plan achieves maximum parallelization while maintaining code quality and avoiding conflicts.