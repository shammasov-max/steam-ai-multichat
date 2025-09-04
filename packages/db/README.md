# @packages/db

Database layer for the Effect-Redux system with MongoDB support for event sourcing and state snapshots.

## Features

- **Event Sourcing**: Store all domain events in MongoDB
- **Snapshot Store**: Periodic state snapshots for fast recovery
- **Repository Pattern**: Type-safe repositories with Effect-TS
- **MongoDB Integration**: Full MongoDB support with connection pooling
- **Environment Configuration**: Flexible configuration via environment variables

## Installation

```bash
yarn add mongodb dotenv
```

## Configuration

Create a `.env` file in your project root:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=effect-redux

# Optional configurations
MONGODB_EVENTS_COLLECTION=events
MONGODB_SNAPSHOTS_COLLECTION=snapshots
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
MONGODB_RETRY_WRITES=true
```

## Usage

### Basic Setup

```typescript
import { MongoDatabase } from '@packages/db'

// Create database instance
const db = new MongoDatabase()

// Initialize connection
await db.init()

// Use the database
await db.events.append(event)
await db.snapshots.saveSnapshot(state)

// Close connection when done
await db.close()
```

### With Repositories and Effect Layers

```typescript
import { Effect, Layer } from 'effect'
import { 
  MongoDatabase, 
  DatabaseTag, 
  RepositoriesLive,
  AccountRepositoryTag,
  DialogRepositoryTag,
  SystemRepositoryTag
} from '@packages/db'

// Create database layer
const DatabaseLive = Layer.effect(
  DatabaseTag,
  Effect.gen(function* () {
    const db = new MongoDatabase()
    yield* Effect.promise(() => db.init())
    return db
  })
)

// Provide to repositories
const AppLayer = Layer.provide(
  RepositoriesLive,
  DatabaseLive
)

// Use in your program
const program = Effect.gen(function* () {
  const accounts = yield* AccountRepositoryTag
  const dialogs = yield* DialogRepositoryTag
  const system = yield* SystemRepositoryTag
  
  // Find account
  const account = yield* accounts.findById("account_123")
  
  // Create dialog
  const dialog = yield* dialogs.save({
    dialogId: "dialog_456",
    accountId: "account_123",
    // ... other fields
  })
  
  // Update system state
  yield* system.updateRoundRobinIndex(1)
})

// Run with layers
Effect.runPromise(
  Effect.provide(program, AppLayer)
)
```

## MongoDB Collections

### Events Collection

Stores all domain events with the following structure:

```typescript
{
  id: string
  type: string  // e.g., "accounts/connected"
  payload: object
  meta: {
    schemaVersion: string
    id: string  // aggregate ID
    ts: number  // timestamp
    aggregate: string  // e.g., "account"
    kind: string  // e.g., "event"
  }
  timestamp: number
}
```

Indexes:
- `{ 'meta.aggregate': 1, 'meta.ts': -1 }`
- `{ type: 1, 'meta.ts': -1 }`
- `{ 'meta.ts': -1 }`
- `{ timestamp: -1 }`
- `{ 'meta.id': 1 }`

### Snapshots Collection

Stores state snapshots with versioning:

```typescript
{
  id: string  // snapshot ID (default: "system")
  state: object  // full application state
  timestamp: number
  version: number  // auto-incremented
}
```

Indexes:
- `{ id: 1, timestamp: -1, version: -1 }`
- `{ timestamp: -1 }`
- `{ version: -1 }`

## Repository Methods

### AccountRepository

- `findById(id)` - Find account by ID
- `findBySteamId64(steamId)` - Find by Steam ID
- `findByStatus(status)` - Find by connection status
- `updateStatus(id, status)` - Update account status
- `saveMaFile(id, maFile)` - Store Steam Guard data
- `getStatusCounts()` - Get statistics

### DialogRepository

- `findById(id)` - Find dialog by ID
- `findActive()` - Get active dialogs
- `addMessage(dialogId, message)` - Add message to dialog
- `updateAssessment(id, assessment)` - Update AI assessment
- `setOperatorAlert(id, alert)` - Set operator alert
- `getTopPerformingDialogs(limit)` - Get best dialogs

### SystemRepository

- `getSystem()` - Get system state
- `getNextAccountForAssignment()` - Round-robin assignment
- `updateRateLimits(accountId, timestamp)` - Track rate limits
- `getRateLimitStatus(accountId)` - Check if can invite
- `saveSystemSnapshot()` - Save current state

## ⚠️ Database Architecture Warning

**CRITICAL**: This package currently has **mixed database technologies**:
- `EventStore.ts` uses ClickHouse (incomplete implementation)
- `MongoDatabase.ts` uses MongoDB (active implementation)

**Production Risk**: This creates operational complexity and potential data consistency issues.

**Recommended Solution**: Use MongoDB-only architecture for MVP:
1. Remove `EventStore.ts` (ClickHouse implementation)  
2. Standardize on `MongoDatabase.ts` for all data storage
3. Use `MongoEventStore` for event sourcing

**Migration Status**: Currently all repositories use MongoDB. The ClickHouse EventStore is unused legacy code.

## Error Handling

All repository methods return Effect types with proper error channels:

```typescript
type RepositoryErrors = 
  | RepositoryError
  | EntityNotFoundError
  | ValidationError
  | ConcurrencyError

// Handle errors
const result = yield* pipe(
  accountRepo.findById("account_123"),
  Effect.catchTag("EntityNotFoundError", () => 
    Effect.succeed(createDefaultAccount())
  )
)
```

## Testing

Mock the database layer for testing:

```typescript
const TestDatabaseLayer = Layer.succeed(
  DatabaseTag,
  {
    events: mockEventStore,
    snapshots: mockSnapshotStore,
    // ... other methods
  }
)

const testProgram = Effect.provide(
  program,
  Layer.provide(RepositoriesLive, TestDatabaseLayer)
)
```