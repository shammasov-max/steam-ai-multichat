# Migration Guide: Phase 5 Optimization Patterns
**Version**: 1.0
**Date**: 2025-09-22
**Target Audience**: Development Team

## Overview

This guide provides practical instructions for applying the optimization patterns established in Phase 5. These patterns have proven to reduce code by 568 lines while improving maintainability and type safety.

## Quick Reference

### Pattern Quick-Start
```typescript
// ✅ DO: Use utility patterns
import { createUnionSchema, withAnnotations, createErrorClass } from '../utils/schema-helpers'
import { createErrorClass } from '../utils/error-factories'

// ✅ DO: Infer types from schemas
type MyType = InferSchema<typeof MyTypeSchema>

// ✅ DO: Use ReturnType for service definitions
const makeMyService = () => ({ method: () => Effect.succeed("value") })
type MyService = ReturnType<typeof makeMyService>

// ❌ DON'T: Manual type definitions when utilities exist
export type Status = 'active' | 'paused' | 'completed' // Use createUnionSchema instead
```

## Pattern 1: Type Inference Optimization

### When to Use
- Internal types that don't need explicit documentation
- Types derived from existing schemas or values
- Complex types that can be safely inferred

### When NOT to Use
- Public API interfaces exported to other packages
- Types that serve as documentation
- Complex union types that benefit from explicit definition

### Examples

#### ✅ DO: Infer from Schema
```typescript
// Define schema first
export const DialogStatusSchema = createUnionSchema('DialogStatus', [
  'active', 'paused', 'completed', 'escalated', 'created'
] as const)

// Infer type from schema
type DialogStatus = InferSchema<typeof DialogStatusSchema>
```

#### ✅ DO: Infer from Value
```typescript
// Define configuration object
const defaultConfig = {
  retries: 3,
  timeout: 5000,
  enableLogging: true
} as const

// Infer type
export type Config = typeof defaultConfig
```

#### ❌ DON'T: Explicit when inference is clear
```typescript
// Unnecessary explicit definition
export interface Config {
  retries: number
  timeout: number
  enableLogging: boolean
}

const defaultConfig: Config = {
  retries: 3,
  timeout: 5000,
  enableLogging: true
}
```

## Pattern 2: ReturnType Utility Pattern

### When to Use
- Service factory functions with complex return types
- Functions returning objects with many methods
- When you want types to automatically update with implementation

### Benefits
- **DRY**: Single source of truth for service interface
- **Maintenance**: Types update automatically when implementation changes
- **Simplicity**: No need to maintain parallel interface definitions

### Examples

#### ✅ DO: Factory with ReturnType
```typescript
// Define implementation first
const makeDatabaseService = (connection: MongoClient) => ({
  findUser: (id: string) => Effect.tryPromise(() => collection.findOne({ id })),
  saveUser: (user: User) => Effect.tryPromise(() => collection.insertOne(user)),
  deleteUser: (id: string) => Effect.tryPromise(() => collection.deleteOne({ id })),
  // ... more methods
})

// Infer type from implementation
export type DatabaseService = ReturnType<typeof makeDatabaseService>

// Use in Context
export class DatabaseServiceTag extends Context.Tag('DatabaseService')<
  DatabaseServiceTag,
  DatabaseService
>() {}
```

#### ❌ DON'T: Parallel interface definitions
```typescript
// Avoid maintaining both interface and implementation
export interface DatabaseService {
  findUser: (id: string) => Effect.Effect<User | null, DatabaseError>
  saveUser: (user: User) => Effect.Effect<void, DatabaseError>
  deleteUser: (id: string) => Effect.Effect<void, DatabaseError>
}

const makeDatabaseService = (connection: MongoClient): DatabaseService => ({
  findUser: (id: string) => Effect.tryPromise(() => collection.findOne({ id })),
  saveUser: (user: User) => Effect.tryPromise(() => collection.insertOne(user)),
  deleteUser: (id: string) => Effect.tryPromise(() => collection.deleteOne({ id })),
})
```

### Migration Steps
1. **Identify service interfaces** with corresponding implementations
2. **Convert interface to factory function** returning implementation
3. **Replace interface with ReturnType** of factory function
4. **Update imports** to use new type
5. **Test thoroughly** to ensure no type errors

## Pattern 3: Schema Helper Utilities

### Available Utilities

#### `createUnionSchema(name, values)`
```typescript
// Before: 4 lines
export const StatusSchema = S.Union(
  S.Literal('active'),
  S.Literal('paused'),
  S.Literal('completed')
)

// After: 1 line
export const StatusSchema = createUnionSchema('Status', ['active', 'paused', 'completed'] as const)
```

#### `withAnnotations(schema, title, description)`
```typescript
// Before: Multiple lines
export const UserIdSchema = S.String.pipe(
  S.title('User ID'),
  S.description('Unique identifier for user')
)

// After: 1 line
export const UserIdSchema = withAnnotations(S.String, 'User ID', 'Unique identifier for user')
```

#### `createEntitySchema(name, fields, indexes)`
```typescript
// Before: Manual schema with annotations
export const UserSchema = S.Struct({
  userId: S.String.pipe(S.title('User ID')),
  name: S.String.pipe(S.title('Full Name')),
  email: S.String.pipe(S.title('Email Address'))
}).pipe(
  S.title('User'),
  S.annotations({
    indexes: [
      { fields: { userId: 1 }, options: { unique: true } }
    ]
  })
)

// After: Utility pattern
export const UserSchema = createEntitySchema('User', {
  userId: withAnnotations(S.String, 'User ID'),
  name: withAnnotations(S.String, 'Full Name'),
  email: withAnnotations(S.String, 'Email Address')
}, [
  { fields: { userId: 1 }, options: { unique: true } }
])
```

### Migration Checklist
- [ ] Replace manual union schemas with `createUnionSchema`
- [ ] Apply `withAnnotations` to reduce schema verbosity
- [ ] Use `createEntitySchema` for entity definitions with indexes
- [ ] Import utilities from `@packages/isomorphic/src/utils/schema-helpers`

## Pattern 4: Error Factory Pattern

### When to Use
- Multiple similar error classes
- Errors that follow consistent patterns
- When you want to reduce boilerplate

### Examples

#### ✅ DO: Use Error Factory
```typescript
import { createErrorClass } from '../utils/error-factories'

// Concise error definitions
export const UserNotFoundError = createErrorClass('UserNotFoundError', {
  userId: Schema.String,
  attempted: Schema.String
})

export const ValidationError = createErrorClass('ValidationError', {
  field: Schema.String,
  value: Schema.Unknown,
  reason: Schema.String
})
```

#### ❌ DON'T: Manual error classes for simple cases
```typescript
// Avoid repetitive boilerplate
export class UserNotFoundError extends Schema.TaggedError<UserNotFoundError>()('UserNotFoundError', {
  userId: Schema.String,
  attempted: Schema.String
}) {}

export class ValidationError extends Schema.TaggedError<ValidationError>()('ValidationError', {
  field: Schema.String,
  value: Schema.Unknown,
  reason: Schema.String
}) {}
```

### Migration Steps
1. **Identify repetitive error classes**
2. **Group by pattern similarity**
3. **Replace with factory calls**
4. **Update imports and usage**
5. **Remove original class definitions**

## Best Practices

### Do's ✅

1. **Start with utilities**: Check if a utility exists before writing manual code
2. **Infer when safe**: Use type inference for internal, non-API types
3. **Document public APIs**: Keep explicit types for exported interfaces
4. **Test utilities**: Verify that utility patterns work as expected
5. **Consistent imports**: Use utilities from centralized locations

### Don'ts ❌

1. **Over-abstract**: Don't create utilities for one-off use cases
2. **Lose type safety**: Don't sacrifice type checking for brevity
3. **Break APIs**: Don't change public interface types without migration plan
4. **Skip testing**: Don't assume utility patterns work without verification
5. **Ignore performance**: Don't create deeply nested utility calls

## Common Pitfalls & Solutions

### Pitfall 1: Breaking Public APIs
**Problem**: Changing exported interface types breaks consumers
**Solution**: Keep explicit types for public APIs, use inference internally

### Pitfall 2: Over-abstraction
**Problem**: Creating utilities for simple, one-off cases
**Solution**: Apply utilities only when pattern repeats 3+ times

### Pitfall 3: Type Inference Loss
**Problem**: Complex inferred types are hard to understand
**Solution**: Use explicit types for complex cases, inference for simple ones

### Pitfall 4: Import Confusion
**Problem**: Not knowing where utilities are located
**Solution**: Centralize utilities in known locations with clear exports

## Implementation Checklist

### Before Starting
- [ ] Review existing code for repetitive patterns
- [ ] Identify types that can be safely inferred
- [ ] Check for service interfaces with implementations
- [ ] Plan migration order (start with low-risk files)

### During Migration
- [ ] Apply one pattern at a time
- [ ] Test after each change
- [ ] Update imports consistently
- [ ] Verify type checking passes
- [ ] Ensure no runtime errors

### After Migration
- [ ] Document any new patterns discovered
- [ ] Update team coding standards
- [ ] Create PR with before/after examples
- [ ] Monitor for any issues in development

## Team Adoption Strategy

### Phase 1: Core Team (Week 1)
- Train 2-3 senior developers on patterns
- Apply patterns to 2-3 files
- Document any issues or refinements needed

### Phase 2: Full Team (Week 2-3)
- Present patterns to full team with examples
- Each developer applies patterns to assigned files
- Code review focusing on pattern usage

### Phase 3: Standards (Week 4)
- Update coding standards documentation
- Create ESLint rules for pattern enforcement
- Establish pattern as default approach

## Troubleshooting

### Type Errors After Migration
1. Check that all imports are correct
2. Verify utility function signatures match usage
3. Ensure public API types are maintained
4. Run full type check on entire codebase

### Performance Issues
1. Check for deeply nested utility calls
2. Verify type inference doesn't create circular references
3. Profile TypeScript compilation times
4. Consider explicit types for complex cases

### Build Failures
1. Ensure all utility modules are properly exported
2. Check for missing dependencies
3. Verify import paths are correct
4. Run clean build from scratch

## Support & Resources

### Documentation
- `/refactor/phase5-final-report.md` - Complete results and metrics
- `/packages/isomorphic/src/utils/` - Utility implementations
- `test/` directories - Usage examples and tests

### Getting Help
1. Check existing usage patterns in codebase
2. Review test files for examples
3. Ask team members who participated in Phase 5
4. Consult final report for detailed explanations

---
**Next Steps**: After mastering these patterns, consider proposing additional optimization opportunities based on your codebase experience.

*Last Updated: 2025-09-22*
*Phase 5 Migration Guide v1.0*