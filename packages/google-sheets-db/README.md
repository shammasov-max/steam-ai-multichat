# google-sheets-db

## Type-Safe Google Sheets Database Wrapper with Effect-TS

A production-ready TypeScript library that transforms Google Sheets into a fully-featured database with in-memory caching, schema validation, and CRUD operations. Built on Effect-TS for robust error handling and dependency injection.

### Core Features

**🚀 In-Memory Performance**  
Loads entire sheet into memory on initialization for lightning-fast queries. All operations work on cache first, then sync to Google Sheets.

**📋 Schema-Driven Design**  
Define your data model with Effect Schemas - the library automatically manages sheet columns, validates data, and handles nested JSON objects seamlessly.

**🔍 Rich Query API**  
MongoDB-like query operators (`$gt`, `$lt`, `$regex`, `$or`) with type-safe autocompletion. Support for pagination, sorting, and complex filters.

**♻️ Soft Delete with Purging**  
Safe soft-delete mechanism marks rows as deleted without breaking references. Purge operation physically removes deleted rows when needed.

**⚡ Batch Operations**  
Intelligent batching for bulk inserts and updates. Automatically chooses optimal strategy based on operation size.

**🏗️ Repository Pattern**  
Factory function generates type-safe repositories from schemas. Clean separation between data access and business logic.

## Installation

```bash
yarn add google-spreadsheet @effect/schema effect
```

## Quick Start

### 1. Set up Google Sheets API

1. Create a Google Cloud Project
2. Enable the Google Sheets API
3. Create a Service Account
4. Download the service account JSON key
5. Share your Google Sheet with the service account email

### 2. Basic Usage

```typescript
import { createRepository, SheetsLayer } from '@packages/google-sheets-db'
import * as S from '@effect/schema/Schema'
import * as Effect from 'effect/Effect'

// Define your data schema
const UserSchema = S.Struct({
  email: S.String,
  name: S.String,
  age: S.Number,
  role: S.Literal('admin', 'user'),
  settings: S.Struct({
    theme: S.Literal('light', 'dark'),
    notifications: S.Boolean,
  }),
})

type User = S.Schema.Type<typeof UserSchema>

// Create a program
const program = Effect.gen(function* () {
  // Create type-safe repository
  const users = yield* createRepository(UserSchema, 'Users')
  
  // Create a user with nested object
  const user = yield* users.create({
    email: 'john@example.com',
    name: 'John Doe',
    age: 30,
    role: 'user',
    settings: { theme: 'dark', notifications: true }
  })
  
  // Query with MongoDB-like operators
  const adults = yield* users.findMany({
    age: { $gte: 18 },
    role: 'user',
    $orderBy: 'name',
    $limit: 10
  })
  
  // Complex OR queries
  const adminOrOlder = yield* users.findMany({
    $or: [
      { role: 'admin' },
      { age: { $gt: 30 } }
    ]
  })
  
  return { user, adults, adminOrOlder }
})

// Run with configuration
Effect.runPromise(
  program.pipe(
    Effect.provide(SheetsLayer({
      spreadsheetId: 'your-sheet-id',
      credentials: {
        client_email: 'your-email@project.iam.gserviceaccount.com',
        private_key: '-----BEGIN PRIVATE KEY-----\n...'
      }
    }))
  )
)
```

## API Reference

### Repository Interface

All repositories provide these methods:

#### `create(data: T): Effect<WithMeta<T>, SheetError>`
Creates a new entity with auto-generated ID and timestamps.

```typescript
const user = yield* users.create({
  email: 'user@example.com',
  name: 'User Name',
  age: 25,
  role: 'user'
})
```

#### `createMany(data: T[]): Effect<WithMeta<T>[], SheetError>`
Bulk create multiple entities efficiently.

```typescript
const newUsers = yield* users.createMany([
  { email: 'user1@example.com', name: 'User One', age: 25, role: 'user' },
  { email: 'user2@example.com', name: 'User Two', age: 30, role: 'admin' }
])
```

#### `findOne(query: Query<T>): Effect<Option<WithMeta<T>>, SheetError>`
Find a single entity matching the query.

```typescript
const user = yield* users.findOne({ email: 'user@example.com' })
// user is Option.Option<WithMeta<User>>
```

#### `findMany(query?: Query<T>): Effect<WithMeta<T>[], SheetError>`
Find multiple entities with optional filtering, sorting, and pagination.

```typescript
const users = yield* users.findMany({
  age: { $gte: 18, $lt: 65 },
  role: 'user',
  $orderBy: 'name',
  $order: 'asc',
  $limit: 50,
  $offset: 0
})
```

#### `update(query: Query<T>, data: Partial<T>): Effect<number, SheetError>`
Update entities matching the query. Returns count of updated entities.

```typescript
const updatedCount = yield* users.update(
  { role: 'user' },
  { role: 'premium' }
)
```

#### `delete(query: Query<T>): Effect<number, SheetError>`
Soft delete entities (sets `_deleted: true`). Returns count of deleted entities.

```typescript
const deletedCount = yield* users.delete({ age: { $lt: 13 } })
```

#### `purgeDeleted(): Effect<number, SheetError>`
Permanently remove soft-deleted entities from the sheet.

```typescript
const purgedCount = yield* users.purgeDeleted()
```

#### `count(query?: Query<T>): Effect<number, SheetError>`
Count entities matching the query.

```typescript
const totalUsers = yield* users.count()
const activeAdmins = yield* users.count({ role: 'admin' })
```

#### `sync(): Effect<void, SheetError>`
Synchronize cache with Google Sheet (useful for multi-client scenarios).

```typescript
yield* users.sync()
```

### Query Operators

#### Comparison Operators
- `$gt`: Greater than
- `$gte`: Greater than or equal
- `$lt`: Less than
- `$lte`: Less than or equal

```typescript
const adults = yield* users.findMany({
  age: { $gte: 18, $lt: 65 }
})
```

#### Array Operators
- `$in`: Value is in array

```typescript
const specificRoles = yield* users.findMany({
  role: { $in: ['admin', 'moderator'] }
})
```

#### String Operators
- `$regex`: Regular expression match

```typescript
const gmailUsers = yield* users.findMany({
  email: { $regex: '@gmail\\.com$' }
})
```

#### Logical Operators
- `$or`: Logical OR

```typescript
const adminOrOlder = yield* users.findMany({
  $or: [
    { role: 'admin' },
    { age: { $gt: 30 } }
  ]
})
```

#### Special Operators
- `$includeDeleted`: Include soft-deleted entities
- `$orderBy`: Field to sort by
- `$order`: Sort direction (`'asc'` or `'desc'`)
- `$limit`: Maximum results
- `$offset`: Skip results

### Metadata Fields

All entities automatically include these metadata fields:

- `_id`: Unique UUID identifier
- `_createdAt`: ISO timestamp of creation
- `_updatedAt`: ISO timestamp of last update
- `_deleted`: Boolean flag for soft deletion
- `_deletedAt`: ISO timestamp of deletion (optional)

## Key Architecture Decisions

### In-Memory First Architecture
The library loads entire sheets into memory for optimal performance. This works well for datasets up to 10,000 rows. All operations are performed on the cache first, then synchronized with Google Sheets.

### Schema-Driven Column Management
Sheet columns are automatically created and maintained based on your Effect Schema definitions. Nested objects are serialized as JSON strings in sheet cells.

### Effect-TS Integration
Built on Effect-TS for:
- Composable error handling
- Type-safe dependency injection via Layers
- Functional programming patterns
- Testability through Effect's runtime

### Soft Delete Pattern
Entities are never immediately removed from sheets. Instead, they're marked with `_deleted: true`. This preserves data integrity and enables audit trails. Use `purgeDeleted()` when you need to physically remove data.

### Repository Factory Pattern
A single `createRepository` function generates type-safe repositories for any schema. This eliminates code duplication while maintaining full type safety.

## Advanced Usage

### Custom Error Handling

```typescript
import { SheetError } from '@packages/google-sheets-db'

const program = Effect.gen(function* () {
  const users = yield* createRepository(UserSchema, 'Users')
  return yield* users.findOne({ email: 'nonexistent@example.com' })
}).pipe(
  Effect.catchTag('SheetError', (error) => {
    if (error.reason === 'NOT_FOUND') {
      console.log('Sheet not found, creating default user')
      return Effect.succeed(Option.none())
    }
    return Effect.fail(error)
  })
)
```

### Multi-Repository Operations

```typescript
const program = Effect.gen(function* () {
  const users = yield* createRepository(UserSchema, 'Users')
  const posts = yield* createRepository(PostSchema, 'Posts')
  
  // Atomic operations across repositories
  const user = yield* users.create({ /* user data */ })
  const post = yield* posts.create({ 
    authorId: user._id,
    title: 'First Post'
  })
  
  return { user, post }
})
```

### Testing with Mock Layers

```typescript
import { Layer } from 'effect/Layer'

// Create mock layer for testing
const TestSheetsLayer = Layer.succeed(
  SheetsService,
  new MockSheetsServiceImpl()
)

// Use in tests
const testProgram = program.pipe(Effect.provide(TestSheetsLayer))
```

## Use Cases

Perfect for small to medium datasets (up to 10K rows) where you need:

- **Rapid Prototyping**: No database setup required
- **User-Editable Data**: Leverage Google Sheets UI for data management
- **Simple CMS**: Content management with version history
- **Configuration Management**: App settings and feature flags
- **Audit Trails**: Soft-delete preserves change history
- **Collaborative Data**: Multiple users can edit via Google Sheets

## Limitations

- **Scale**: Not suitable for datasets > 10K rows
- **Concurrency**: Limited by Google Sheets API rate limits
- **Real-time**: Not designed for high-frequency updates
- **Transactions**: No atomic transactions across multiple operations

## TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Contributing

This package is part of the effect-redux monorepo. When contributing:

1. Follow the existing code style and patterns
2. Add tests for new functionality
3. Update documentation for API changes
4. Ensure type safety is maintained throughout

## License

This project is licensed under the MIT License.