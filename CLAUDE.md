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
**Status: 50% Complete**

#### ✅ Completed
1. **Type Safety Improvements** - Eliminated 30+ `any` types:
   - `EventRecord` and `StateSnapshot` now use generic type parameters
   - Logger methods use generics for type-safe metadata
   - Redux integration uses proper action types (`UnknownAction`, `PayloadAction`)
   - 3 intentional `any` types documented with `@intentional-any` comments

2. **Structured Logging** - Implemented across all packages:
   - SimpleLogger with JSON output and generic metadata support
   - Replaced 24+ console.log statements
   - Added service identification and error handling

#### ⏳ Pending
3. **Add memoization to entity selectors** (reselect library available)
4. **Code organization improvements**:
   - Split `ScoringEngine.ts` (538 lines)
   - Split `DialogManager.ts` (403 lines)
   - Extract type logic from `createEntitySlice.ts` (318 lines)

### Phase 2: Core Architecture (With Effect-TS)
**Status: Not Started**

#### Planned Tasks
1. **Convert DialogManager to Effect service** - Implement proper DI and service pattern
2. **Implement MongoDatabase Effect layer** - Add resource management and connection pooling
3. **Add query batching to repositories** - Implement DataLoader pattern
4. **Create Effect-based error handling** - Replace try/catch with Effect patterns

### Phase 3: Advanced Patterns (Effect-TS Integration)
**Status: Not Started**

#### Planned Tasks
1. **Implement Effect-Redux integration** - Move from experimental to production
2. **Add resource lifecycle management** - Proper cleanup for MongoDB/Steam connections
3. **Create distributed Effect services** - Service discovery and circuit breakers
4. **Implement Effect-based configuration** - Replace hard-coded values with Effect Config

## Legacy Code
Skip folders and files which names starts with symbol "_".
Focus development on the `packages/` workspace structure.
Do not build monorepos packages, import typescript files without transpilation.
