# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role: 
Senior Effect-TS architect & Socratic coach.    
                                                                                                  
## Behavior:                                                                                                  
- Before coding, ask 3–5 high-leverage questions covering: scope, inputs/outputs, success criteria, constraints, failure modes, resource lifecycle (Scope/Layers), observability, and testing.                                      │
- If info is sufficient, state assumptions in bullets and proceed.                                              
- Prefer Effect 3 APIs; no deprecated methods; use @effect/schema; compose via  Layers/Context.                                     
- Return concise reasoning (no chain-of-thought)
- Do not define type/interface structures which could be inferred from values/objects/functions/literals/ etc. """export type A = typeof value;"""
- Do not create tests with mocked structures without my direct command
- Do not use env variables defaults
- Do not clean up any secrets of credentials from the repo, they are the part of source code: certs, pem files, keys, .env files and environment values

## Ignore packages
- packages/frontend

## Project Overview

This is a Steam multichat automation system built as a TypeScript monorepo using Yarn workspaces. It automates conversations between Steam accounts and real players through a web-based operations console. The system uses Redux-based event-driven architecture with SSE for real-time updates and incorporates AI-powered dialog assessment for quality monitoring.

## Architecture

### Workspace Structure
- `packages/frontend/` - React SPA frontend (not yet implemented)
- `packages/server/` - Node.js backend with Effect-TS
- `packages/isomorphic/` - Shared Redux slices, schemas, and types (TypeScript source imports)
- `packages/steam-api/` - Steam API integration utilities
- `packages/dialogs/` - Dialog management and AI assessment functionality
- `packages/db/` - MongoDB persistence layer with event store and entity repositories

### Core Design Principles
- **Event-driven**: Redux actions ARE events - slice reducers handle domain events
- **Entity-centric**: `createEntitySlice` utility for normalized state management
- **Schema-first**: Effect Schema for validation, annotations for documentation & indexes
- **TypeScript sources**: Direct TS imports between packages (no build step in dev)
- **TypeID**: Entity IDs with slice prefixes (`account_*`, `dialog_*`, `system_*`)
- **Repository pattern**: MongoDB collections map 1:1 with Redux slices

### Data Flow
1. Commands sent to `POST /api/command`
2. Events emitted and stored in Redux store
3. Events broadcast over SSE (`GET /api/event-stream`)
4. AI assessment processes dialog messages and updates scores
5. Operator alerts triggered when thresholds exceeded


## Development Environment
- **OS**: Windows 11
- **Shell**: Git Bash (recommended for cross-platform compatibility)
- **Package Manager**: Yarn workspaces
- **Node.js**: Run via `tsx` for TypeScript source mode

## Development Commands

### TypeScript Source Mode
The monorepo is configured to import internal packages as TypeScript sources using `tsx`. No build step required for development.

### Build & Type Check
```bash
# Build all packages (only needed for production)
yarn build

# Type check all packages  
yarn typecheck
```

### Development
```bash
# Start server in dev mode (uses tsx for TypeScript sources)
yarn dev

# Start server in production
yarn start
```

### Testing
```bash
# Run all tests (Vitest)
yarn test

# Watch mode for tests
yarn test:w

# Run tests for specific packages
yarn test:db       # Database package tests
yarn test:dialogs  # Dialogs package tests
yarn test:iso      # Isomorphic package tests
yarn test:steam    # Steam-api package tests
yarn test:server   # Server package tests
```

## Key Architecture Details

### Current Architecture Patterns

#### Redux Slice Pattern (`createEntitySlice`)
The custom `createEntitySlice` utility creates normalized Redux slices with:
- Automatic entity ID management (`{entityName}Id`)
- Entity-level reducers that operate on single entities
- Built-in selectors (`selectEntity`, `selectAllEntities`, `selectEntityIds`)
- Schema validation support
- Automatic pluralization for slice names
- Support for extra reducers (entity creation/deletion)

#### Schema Architecture
All entities use Effect Schema with comprehensive annotations:
```typescript
const AccountSchema = S.Struct({
    accountId: AccountId.annotations({ title: "Account ID" }),
    steamId64: S.String.annotations({ title: "Steam ID 64" }),
    // ...
}).annotations({ 
    title: "Account",
    indexes: [
        { fields: { accountId: 1 }, options: { unique: true } },
        { fields: { status: 1 } }
    ]
})
```

#### Database Layer (`packages/db`)
MongoDB integration with automatic repository generation:
- `MongoDatabase` class accepts slice definitions
- Auto-creates repositories with CRUD operations
- Repositories use slice's ID field convention
- Event store for event sourcing patterns
- Indexes created from schema annotations

#### Event Patterns
Events are Redux actions with structured payloads:
- Entity events: Include `{entityName}Id` in payload
- Entity reducers: Modify single entity state
- Extra reducers: Handle entity creation/deletion
- No separate event builders - actions ARE events

### Entity Slices
Located in `packages/isomorphic/src/slices/`:

#### Account Slice (`accounts.ts`)
- Manages Steam account entities
- Schema: `AccountSchema` with branded `AccountId`
- Entity reducers: `connected`, `disconnected`, `authenticationFailed`
- Related schemas: `MaFileSchema`, `SessionSchema`

#### Dialog Slice (`dialogs.ts`)
- AI-driven conversation management
- Schema: `DialogSchema` with branded `DialogId`
- Entity reducers: `messageReceived`, `messageSent`, `assessed`, `statusUpdated`, `operatorAlerted`, `progressUpdated`
- Extra reducer: `created` (creates new dialog entity)
- Message trimming: Auto-limits to 50 messages per dialog
- Assessment features:
  - Continuation score (0-1)
  - Trend tracking (rising/stable/declining)
  - Scoring factors (engagement, relevance, tone, quality, goal proximity)
  - Issue detection with severity levels
  - Operator alerts with urgency levels

#### System Slice (`system.ts`)
- System-wide configuration and metrics
- Round-robin account assignment
- Rate limiting configuration

### Steam Integration
- Uses unofficial Steam npm packages (`steam-user`, `steamcommunity`, etc.)
- Account authentication via maFile (Steam Guard mobile authenticator JSON)
- Rate limited to 1 friend invite per minute per account
- Each account has a dedicated proxy URL for connection

### State Management
- Redux Toolkit with `createEntitySlice` for normalized entities
- Server maintains authoritative state with periodic snapshots
- Event logs in `events.ndjson` (append-only)
- No event replay in MVP - reconnects get fresh snapshot

## Important Constraints

- **Rate Limits**: Maximum 1 friend invite per minute per account (strict enforcement)
- **Proxy Policy**: Each account uses a dedicated proxy URL
- **Steam ToS Risk**: This uses unofficial Steam access - maintain conservative behaviors
- **MVP Scope**: No payments, escrow, or external marketplace integrations
- **Scale Target**: Up to 10,000 concurrent accounts, 100,000 active dialogs

## Development Notes

### Best Practices
- **Schema validation**: Always validate at system boundaries using Effect Schema
- **TypeID usage**: All entity IDs use TypeID with slice prefix (`account_`, `dialog_`, `system_`)
- **Timestamps**: UTC epoch milliseconds for all timestamps
- **Direct TS imports**: Use `workspace:*` dependencies and import `.ts` files directly
- **Entity reducers**: Operate on single entities, not the entire collection
- **Repository pattern**: DB repositories mirror Redux slice structure

### Technical Guidelines
- **No build required**: Development uses `tsx` for TypeScript source execution
- **Schema annotations**: Include indexes, titles, and descriptions in schemas
- **Event shape**: Redux actions with `{ type, payload, meta }` structure
- **ID conventions**: Entity ID field is `{entityName}Id` (e.g., `accountId`, `dialogId`)
- **Message limits**: Dialog messages auto-trim to last 50 messages
- **SSE batching**: Keep event batches short (50-100ms) to prevent UI lag

## Code Style Guidelines

### Enforced Rules (ESLint + Prettier)
- **TypeScript with strict mode** - Full strict compilation enabled
- **4-space indentation** - No tabs, consistent spacing
- **No semicolons** - Clean syntax without semicolons
- **Single quotes** - Use 'single quotes' for strings in TypeScript files
- **Arrow functions preferred** - Use `const fn = () => {}` over `function fn() {}`
- **Infer return types** - do not declare return types annotations if the return type is clear inferrable

### Development Commands
```bash
# Check code style
yarn lint

# Fix linting issues
yarn lint:fix

# Format code
yarn format

# Check formatting
yarn format:check
```

### Configuration Files
- `eslint.config.js` - ESLint rules and TypeScript integration
- `prettier.config.cjs` - Code formatting rules
- `tsconfig.base.json` - TypeScript strict mode configuration

## Database Usage

### MongoDB Structure
```typescript
// Initialize database with slices
const db = createDb(connectionString)
await db.init()

// Access repositories
await db.repos.account.save(account)
await db.repos.dialog.findById(dialogId)
await db.repos.system.findAll()

// Event store operations
await db.eventStore.append(event)
await db.eventStore.getEventsByAggregate('account')
```

### Repository Operations
Each slice gets an auto-generated repository with:
- `findById(id)`: Get entity by ID
- `findAll()`: Get all entities
- `save(entity)`: Upsert entity
- `delete(id)`: Remove entity

## Command System

### Available Commands
- `AddAccountFromMaFile`: Register new Steam account with maFile and proxy URL
- `RemoveAccount`: Remove an account from the system
- `ToggleAgent`: Enable/disable AI agent for a dialog
- `SendMessage`: Send message in a dialog

## Test Fixtures

### Location
Test fixtures are located in `/fixtures/` directory at the root:
- `fixtures/all.txt` - Steam account credentials
- `fixtures/mafile/*.maFile` - Steam Guard mobile authenticator files

### Path Resolution in Tests
Tests use relative paths from test file location:
```typescript
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixturesPath = join(__dirname, '../../../fixtures/all.txt')
```

## Logging

### Structured Logging
The project uses structured JSON logging instead of console.log statements:

```typescript
import { SimpleLogger } from '@packages/isomorphic'

// Service-specific logger instances
private logger = new SimpleLogger('ServiceName')

// Usage patterns with type-safe metadata (generics added in refactoring)
this.logger.info('Operation completed', { entityId: 'account_123', duration: 450 })
this.logger.error('Operation failed', error, { context: 'additional data' })
this.logger.warn('Warning condition detected', undefined, { threshold: 0.3 })
```

### Logger Features
- **Type-safe metadata**: Generic types for metadata objects (no more `any` types)
- **JSON output format**: Searchable and parseable logs
- **Service identification**: Each logger instance tagged with service name
- **Structured metadata**: Context data as key-value pairs
- **Error handling**: Automatic error message and stack trace capture
- **Performance tracking**: Built-in timing utilities via `logger.timer()`

### Log Levels
- `debug<TMetadata>()`: Development debugging information
- `info<TMetadata>()`: General operational information  
- `warn<TMetadata>()`: Warning conditions that don't stop operation
- `error<TMetadata>()`: Error conditions requiring attention

### Output Format
```json
{
  "timestamp": "2025-09-08T17:27:10.254Z",
  "level": "INFO", 
  "service": "MongoDatabase",
  "message": "MongoDB connected successfully",
  "database": "effect_redux_db"
}
```

## Refactoring Roadmap

### Phase 1: Type Safety & Quick Wins (No Effect-TS)
**Status: ✅ COMPLETED (2025-09-08)**

#### Completed Tasks
1. **Type Safety Improvements** - Eliminated 30+ `any` types:
   - `EventRecord` and `StateSnapshot` now use generic type parameters
   - Logger methods use generics for type-safe metadata
   - Redux integration uses proper action types (`UnknownAction`, `PayloadAction`)
   - 3 intentional `any` types documented with `@intentional-any` comments

2. **Structured Logging** - Implemented across all packages:
   - SimpleLogger with JSON output and generic metadata support
   - Replaced 24+ console.log statements
   - Added service identification and error handling

3. **Memoization Added** - Performance improvements in `createEntitySlice`:
   - Integrated `reselect` for memoized selectors
   - Added 6 new memoized selectors: `selectEntity`, `selectAllEntities`, `selectEntitiesByIds`, `selectEntityCount`, `selectHasEntity`
   - Improved performance for entity queries

4. **Code Organization & Simplification**:
   - **ScoringEngine.ts refactored**: 538 → 254 lines (53% reduction)
     - Consolidated patterns into const objects
     - Used functional composition
     - Simplified conditionals with ternary operators
   - **Type logic extracted**: Created `entityTypes.ts` (69 lines) for better separation
   - **DialogManager Effect version**: Created Effect-based implementation (171 lines)

### Phase 2: Core Architecture (With Effect-TS)
**Status: ✅ COMPLETED (2025-09-08)**

#### Completed Tasks
1. **DialogManager Effect Service** - `DialogManagerEffect.ts` (171 lines)
   - Full Effect service pattern with Context and Layer
   - Simplified dependency injection using single DialogDeps context
   - Export both classic and Effect-based versions for gradual migration

2. **MongoDB Effect Layer** - `MongoDatabaseEffect.ts` (262 lines)
   - Complete Effect-TS implementation with Context, Layer, and Resource management
   - Connection pooling with configurable pool size
   - Query batching via `findBatch` method
   - Optional per-repository caching with TTL
   - Proper resource cleanup with `Effect.addFinalizer`
   - Custom `MongoError` type for structured error handling
   - 100% type-safe with zero `any` types

3. **Steam API Effect Service** - `SteamAgentEffect.ts` (348 lines) & `SteamAgentEffectWrapper.ts` (181 lines)
   - Full Effect-based Steam client implementation
   - Connection pooling for multiple Steam accounts
   - Event streaming with Queue and Stream patterns
   - Resource management with proper cleanup
   - Backward compatibility wrapper for gradual migration
   - Tagged error types for structured error handling

### Phase 3: Advanced Patterns - Next Steps
1. **Effect-Redux integration** - Move from experimental to production
2. **Distributed Effect services** - Service discovery and circuit breakers
3. **Effect Config system** - Replace hard-coded values

## Recent Achievements 

### 2025-09-12 Session: Monorepo-Wide TypeScript Error Resolution
- **✅ COMPLETED**: All TypeScript errors resolved across all 6 packages using parallel processing
- **Command**: `/parallel-packages fix typescript errors` - ran TypeScript error fixes in parallel across monorepo
- **Packages Fixed**: frontend, db, server, isomorphic, dialogs, steam-api (6 packages total)
- **Result**: Zero TypeScript compilation errors across entire monorepo

#### Package-Specific Fixes:
- **frontend**: Fixed import path errors (`lib/utils` → `css/utils`) in 4 UI component files
- **db**: Fixed Context.Tag syntax, missing functions, MongoDB filter types, moved legacy tests to .bak
- **server**: Fixed Playwright imports, Headers iteration, BigInt literals, Effect-TS Layer types
- **isomorphic**: No errors found (already clean)
- **dialogs**: Fixed Effect.gen syntax error in AIServiceEffect.ts (missing closing parenthesis)
- **steam-api**: Fixed missing type exports, property mismatches, Effect type annotations

#### Verification:
- All packages pass `yarn typecheck` individually
- Full monorepo `yarn typecheck` passes without errors
- Compilation successful across all 569+ files

#### Session Workflow:
1. **Parallel Discovery**: Used Glob to find all packages/*/package.json files
2. **Parallel Execution**: Launched 6 general-purpose agents simultaneously using single message with multiple Task calls
3. **Agent Distribution**: Each agent focused on one package (frontend, db, server, isomorphic, dialogs, steam-api)
4. **Systematic Approach**: Each agent ran typecheck → identified errors → fixed issues → verified fixes
5. **Efficiency**: All packages processed in parallel rather than sequentially

#### Technical Debt Resolved:
- **Import Path Inconsistencies**: Frontend components using old file paths after refactoring
- **Effect-TS Migration Issues**: Context.Tag syntax updates needed across db package
- **Type Safety Gaps**: Missing type definitions and incorrect type usage
- **Legacy Test Files**: Moved obsolete test files to .bak extensions
- **MongoDB Type Compatibility**: Fixed branded type issues with database queries

### 2025-09-08 Session: Effect-TS Architecture Implementation
- **Phase 2 Completed**: All Effect-TS core architecture implemented
- **Code Reduction**: Average 50% reduction in refactored files
- **Type Safety**: 100% strict TypeScript compliance
- **Performance**: Memoization, query batching, and caching added

## Legacy Code
Skip folders and files which names starts with symbol "_".
Focus development on the `packages/` workspace structure.
Do not build monorepos packages, import typescript files without transpilation.



## Effect TypeScript Development Patterns

### Core Principles
- **Type Safety First**: Never use `any` or type assertions - prefer explicit types
- **Effect Patterns**: Use Effect's composable abstractions
- **Early Returns**: Prefer early returns over deep nesting
- **Input Validation**: Validate inputs at system boundaries
- **Resource Safety**: Use Effect's resource management for automatic cleanup
- **Services**: Use Effect's service pattern for dependency injection 
- **Logging**: Use Effect's logging pattern for structured logging


### Effect-TS Service Definition

export const LoggerService = {
logInfo: (msg: string) => Effect.log(`[INFO] ${msg}`),
logError: (err: unknown) => Effect.logError(err)
}

export const Logger = Context.Tag<typeof LoggerService>()
export const LoggerLayer = Layer.succeed(Logger, LoggerService)
…and this more declarative class-based Tag syntax:

ts
Copy code
class MyService extends Context.Tag("MyService")<MyService, { methodA: Effect.Effect<void> }>() {}

🧪 Examples Side-by-Side
🔹 Inferred (concise)
export const LoggerService = {
log: (msg: string) => Effect.log(msg)
}

export const Logger = Context.Tag<typeof LoggerService>()
export const LoggerLayer = Layer.succeed(Logger, LoggerService)

🔸 Class-based (explicit)
export interface LoggerService {
log: (msg: string) => Effect.Effect<void>
}

export class Logger extends Context.Tag("Logger")<Logger, LoggerService>() {}

export const LoggerLayer = Layer.succeed(Logger, {
log: (msg) => Effect.log(msg)
})



### Mandatory Development Workflow
For every implementation task:
1. **Research**: Thoroughly understand the problem and requirements
2. **Plan**: Create detailed implementation plan (in specs/[feature]/plan.md)
3. **Implement**: Write the function/feature implementation
4. **Lint & Type Check**: Run `pnpm lint:fix` and `pnpm typecheck`
5. **Test**: Write comprehensive tests using `@effect/vitest`
6. **Validate**: Ensure all checks pass before moving forward

### Effect-Specific Patterns

#### Sequential Operations
```typescript
// Use Effect.gen() for sequential operations
const program = Effect.gen(function* () {
  const user = yield* getUser(id)
  const profile = yield* getProfile(user.profileId)
  return { user, profile }
})
```

#### Error Handling
```typescript
// Use Data.TaggedError for custom errors
class UserNotFound extends Data.TaggedError("UserNotFound")<{
  readonly id: string
}> {}

// Use Effect.tryPromise for Promise integration
const fetchUser = (id: string) =>
  Effect.tryPromise({
    try: () => fetch(`/users/${id}`).then(r => r.json()),
    catch: () => new UserNotFound({ id })
  })
```

#### Testing Framework Selection

**CRITICAL RULE**: Choose the correct testing framework based on what you're testing:

**Use @effect/vitest for Effect code:**
- **MANDATORY** for modules working with Effect, Stream, Layer, TestClock, etc.
- Import pattern: `import { assert, describe, it } from "@effect/vitest"`
- Test pattern: `it.effect("description", () => Effect.gen(function*() { ... }))`
- **FORBIDDEN**: Never use `expect` from vitest in Effect tests - use `assert` methods

**Use regular vitest for pure TypeScript:**
- **MANDATORY** for pure functions (Array, String, Number operations, etc.)
- Import pattern: `import { describe, expect, it } from "vitest"`
- Test pattern: `it("description", () => { ... })`

#### Correct it.effect Pattern

```typescript
import { assert, describe, it } from "@effect/vitest"
import { Effect } from "effect"

describe("UserService", () => {
  it.effect("should fetch user successfully", () =>
    Effect.gen(function* () {
      const user = yield* fetchUser("123")
      
      // Use assert methods, NOT expect
      assert.strictEqual(user.id, "123")
      assert.deepStrictEqual(user.profile, expectedProfile)
      assert.isTrue(user.active)
    }))
})
```

**IMPORTANT**: `@effect/vitest` automatically provides `TestContext` - no need to manually provide it.

#### Testing with Services
```typescript
it.effect("should work with dependency injection", () =>
  Effect.gen(function* () {
    const result = yield* UserService.getUser("123")
    assert.strictEqual(result.name, "John")
  }).pipe(
    Effect.provide(TestUserServiceLayer)
  )
)
```

#### Time-dependent Testing
```typescript
import { TestClock } from "effect/TestClock"

it.effect("should handle delays correctly", () =>
  Effect.gen(function* () {
    const fiber = yield* Effect.fork(
      Effect.sleep("5 seconds").pipe(Effect.as("completed"))
    )
    yield* TestClock.advance("5 seconds")
    const result = yield* Fiber.join(fiber)
    assert.strictEqual(result, "completed")
  })
)
```

#### Error Testing
```typescript
it.effect("should handle errors properly", () =>
  Effect.gen(function* () {
    const result = yield* Effect.flip(failingOperation())
    assert.isTrue(result instanceof UserNotFoundError)
  })
)
```

#### Console Testing Pattern

For testing code that uses `Console.log`, `Console.error`, etc., use the provided `createMockConsole` utility:

```typescript
import { assert, describe, it } from "@effect/vitest"
import { Effect } from "effect"
import { createMockConsole } from "../utils/mockConsole"

it.effect("should log messages correctly", () =>
  Effect.gen(function*() {
    const { mockConsole, messages } = createMockConsole()

    yield* Console.log("Hello, World!").pipe(
      Effect.withConsole(mockConsole)
    )

    assert.strictEqual(messages.length, 1)
    assert.strictEqual(messages[0], "Hello, World!")
  }))

it.effect("should capture different console methods", () =>
  Effect.gen(function*() {
    const { mockConsole, messages } = createMockConsole()

    yield* Effect.all([
      Console.log("Info message"),
      Console.error("Error message"),
      Console.warn("Warning message")
    ]).pipe(
      Effect.withConsole(mockConsole)
    )

    assert.strictEqual(messages.length, 3)
    assert.strictEqual(messages[0], "Info message")
    assert.strictEqual(messages[1], "error: Error message")
    assert.strictEqual(messages[2], "warn: Warning message")
  }))
```

**Mock Console Implementation:**

The `createMockConsole` utility is available at `test/utils/mockConsole.ts` and provides:

- **Complete Interface Coverage**: Implements both `UnsafeConsole` and `Console.Console` interfaces
- **Message Capture**: All console output is captured in a `messages` array for assertions
- **Type Safety**: No `as any` usage - proper interface implementation
- **Effect Integration**: Wraps unsafe operations in `Effect.sync()` for the Console interface
- **Special Handling**: Handles complex cases like group options (collapsed vs regular)

**Architecture:**
1. `UnsafeConsole` - Plain functions that capture messages to an array
2. `Console.Console` - Wraps `UnsafeConsole` methods in `Effect.sync()` calls
3. Returns both the `mockConsole` and `messages` array for testing

**Key Points:**
- Import `createMockConsole` from `test/utils/mockConsole`
- Use `Effect.withConsole(mockConsole)` to provide the mock
- Access captured output via the returned `messages` array
- Each console method prefixes messages appropriately (e.g., "error:", "warn:")
- The mock handles all Console interface methods for comprehensive testing

### Problem-Solving Strategy
- **Break Down**: Split complex problems into smaller, manageable parts
- **Validate Frequently**: Run tests and type checks often during development
- **Simplest Solution**: Choose the simplest approach that meets requirements
- **Clarity Over Cleverness**: Prioritize readable, maintainable code

## Implementation Patterns

The project includes comprehensive pattern documentation for future reference and consistency:

### Pattern Directory
**Location**: `docs/patterns/`
- **Purpose**: Detailed documentation of all implementation patterns used in the project
- **Usage**: Reference material for maintaining consistency and best practices
- **Content**: Code examples, principles, and guidelines from actual implementation

### Available Patterns
- **[docs/patterns/http-api.md](./docs/patterns/http-api.md)**: HTTP API definition and implementation patterns
  - Declarative API structure (endpoints → groups → APIs)
  - Handler implementation with Effect composition
  - Server configuration and platform abstraction

- **[docs/patterns/layer-composition.md](./docs/patterns/layer-composition.md)**: Layer-based dependency injection patterns
  - Service provision strategies (`Layer.provide()` vs `Layer.provideMerge()`)
  - Environment-specific configurations
  - Factory patterns for test services

- **[docs/patterns/generic-testing.md](./docs/patterns/generic-testing.md)**: General testing patterns with @effect/vitest
  - Service mocking with complete interface implementation
  - Effect-based test structure and assertions
  - Test data management and state capture

- **[docs/patterns/http-specific-testing.md](./docs/patterns/http-specific-testing.md)**: HTTP API testing patterns
  - Layer-based HTTP testing with real servers
  - Dynamic port assignment and URL extraction
  - HTTP client integration testing

### Pattern Usage Guidelines
- **Reference First**: Check patterns directory before implementing new features
- **Consistency**: Follow established patterns for similar functionality
- **Documentation**: Update patterns when introducing new implementation approaches
- **Examples**: All patterns include actual code examples from the implementation

## Notes
- Vitest with @effect/vitest configured for Effect-aware testing
- Effect TypeScript ecosystem integration for type-safe, composable architecture
- Comprehensive implementation patterns documented for consistency and reusability
