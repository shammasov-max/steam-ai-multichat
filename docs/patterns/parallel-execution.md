# Parallel Execution Pattern

This pattern describes the parallel task execution strategy for efficient development using multiple Claude subagents.

## Overview

The parallel execution pattern enables multiple development tasks to run simultaneously using different Claude models (Opus, Sonnet, Haiku) based on task complexity. This approach can reduce implementation time by 60-70% compared to sequential execution.

## Core Principles

### 1. Model Selection Based on Complexity

- **Opus** (max 2 parallel): Complex architecture design, Effect-TS service composition, deep analysis
- **Sonnet** (max 5 parallel): Standard implementation, refactoring, testing, Redux work
- **Haiku** (max 8 parallel): Simple tasks, configuration, basic CRUD operations

### 2. Task Grouping Strategy

Tasks are grouped by **package/directory** to minimize conflicts:
- Each subagent owns specific files within their package
- Clear boundaries prevent merge conflicts
- Package-level isolation ensures clean interfaces

### 3. File Ownership

Each subagent receives:
- **Scope**: Files they will modify
- **Avoid list**: Files they must NOT touch (owned by other subagents)
- **Commit prefix**: [S1], [S2], etc. for tracking

## Implementation Example

### Timeline Visualization
```
0h ────── 1h ────── 2h ────── 3h
[Design]  [Impl]    [Test]        <- Opus/Sonnet
[Redux............] [Integrate]   <- Sonnet
[Types]   [Fix]                   <- Haiku
```

### Wave-Based Execution

**Wave 1 (Parallel - Independent Tasks)**
```markdown
1. **Service Design** [Opus, general-purpose]
   Design DialogAnalyzer Effect service with Layer composition
   Scope: dialogs/src/services/DialogAnalyzer.ts
   Avoid: isomorphic/*, server/*
   Commit: [S1]

2. **Redux Slice** [Sonnet, general-purpose]
   Implement analytics slice using createEntitySlice pattern
   Scope: isomorphic/src/slices/analytics.ts
   Avoid: dialogs/*, server/*
   Commit: [S2]

3. **Type Definitions** [Haiku, general-purpose]
   Create schemas and branded types
   Scope: isomorphic/src/types/*.ts
   Avoid: dialogs/*, server/*
   Commit: [S3]
```

**Wave 2 (After Sync - Dependent Tasks)**
```markdown
1. **Implementation** [Sonnet, general-purpose]
   Implement service following Wave 1 interface
   Scope: dialogs/src/services/{DialogAnalyzer.ts, index.ts}
   Dependencies: Wave 1.1 interface required
   Commit: [S1]
```

## Synchronization Strategy

### Hybrid Approach
- **Independent progress**: Tasks without dependencies can proceed immediately
- **Critical sync points**: Integration, deployment, and testing phases require synchronization
- **Explicit dependencies**: Clearly stated in plan (e.g., "Wave 2.1 requires Wave 1.1")

## Never Parallelize

Certain operations must always be sequential:
- **Database migrations**: Schema changes must be ordered
- **Docker operations**: Container management requires coordination
- **Port-binding services**: Prevents port conflicts

## Cleanup Requirements

Every subagent MUST at task completion:
- Kill all Node.js processes started during their run
- Close file handles and database connections
- Report completion status

## Success Metrics

### Time Efficiency
- Sequential execution: 8-10 hours typical
- Parallel execution: 3-4 hours typical
- Efficiency gain: 60-70% time reduction

### Quality Indicators
- All subagents report "complete" status
- No merge conflicts
- Tests pass after integration

## Best Practices

1. **Balance workload**: Don't over-split tasks; group related work
2. **Clear boundaries**: Explicit file ownership prevents conflicts
3. **Model economy**: Use simplest model that can handle the task
4. **Dependency clarity**: State all dependencies explicitly
5. **Testing strategy**: Simple features parallel, complex sequential

## Common Patterns

### Pattern 1: Feature Implementation
```
Wave 1: [Parallel] Schema, Types, Redux Slice
Wave 2: [Parallel] Service Implementation, Repository
Wave 3: [Sequential] Integration Testing
```

### Pattern 2: Refactoring
```
Wave 1: [Parallel] Separate packages refactoring
Wave 2: [Sequential] Cross-package integration updates
Wave 3: [Parallel] Test updates per package
```

### Pattern 3: Bug Fixes
```
Wave 1: [Parallel] Independent bug fixes by package
Wave 2: [Parallel] Test additions for each fix
Wave 3: [Sequential] Integration verification
```

## Subagent Types

- **general-purpose**: Default for implementation and design
- **fixer**: TypeScript and linting fixes post-implementation
- **tester**: Test fixes with Effect-TS patterns
- **statusline-setup**: Status line configuration
- **output-style-setup**: Output style configuration

## Integration with CLAUDE.md

This pattern is fully documented in the project's CLAUDE.md file under "Plan Generation Instructions". All plans must include:
1. Model recommendations for each task
2. Parallel execution analysis
3. Time estimates (parallel vs sequential)
4. Clear dependency mapping

## References

- [CLAUDE.md Plan Generation Instructions](/CLAUDE.md#plan-generation-instructions)
- [Effect-TS Layer Composition](./layer-composition.md)
- [Redux Slice Pattern](/packages/isomorphic/src/slices/README.md)