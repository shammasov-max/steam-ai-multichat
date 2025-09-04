# @packages/server

Node.js backend server for the Effect-Redux Steam Multichat System, built with Effect-TS for functional programming and robust error handling.

## Features

- 🔄 **Event-Driven Architecture** - CQRS-lite pattern with event sourcing
- 📡 **Real-Time Updates** - Server-Sent Events (SSE) for live state streaming
- 🤖 **Steam Integration** - Automated Steam account management
- 🧠 **AI Dialog Management** - OpenAI GPT-4 integration for intelligent conversations
- 💾 **MongoDB Persistence** - Event store with snapshots for recovery
- 🎯 **Effect-TS** - Functional programming with dependency injection
- 📊 **Redux State** - Isomorphic state management with frontend
- 🔒 **Type-Safe** - Full TypeScript with strict mode

## Tech Stack

- **Node.js 18+** - JavaScript runtime
- **Effect-TS** - Functional programming framework
- **Express** - HTTP server (minimal usage)
- **Redux Toolkit** - State management
- **MongoDB** - Event and snapshot storage
- **Steam Libraries** - Unofficial Steam APIs
- **OpenAI SDK** - AI dialog generation
- **TypeScript** - Type safety

## Project Structure

```
server/
├── src/
│   ├── index.ts           # Application entry point
│   ├── server.ts          # HTTP/SSE server setup
│   ├── layers/            # Effect-TS layers
│   │   ├── ConfigLayer.ts
│   │   ├── DatabaseLayer.ts
│   │   ├── SteamLayer.ts
│   │   └── OpenAILayer.ts
│   ├── services/          # Business logic services
│   │   ├── AccountService.ts
│   │   ├── DialogService.ts
│   │   ├── CommandService.ts
│   │   └── EventBus.ts
│   ├── adapters/          # External integrations
│   │   ├── steam/
│   │   ├── openai/
│   │   └── mongodb/
│   ├── commands/          # Command handlers
│   │   ├── AddAccountFromMaFile.ts
│   │   ├── CreateDialog.ts
│   │   └── SendMessage.ts
│   ├── store/             # Redux store setup
│   │   ├── configureStore.ts
│   │   └── middleware/
│   ├── api/               # HTTP/SSE endpoints
│   │   ├── commandRouter.ts
│   │   └── eventStream.ts
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── package.json
├── tsconfig.json
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 5.0+ running
- Yarn package manager
- Steam account with Steam Guard (for testing)
- OpenAI API key

### Installation

```bash
# From project root
yarn workspace @packages/server install

# Or from server directory
cd packages/server
yarn install
```

### Environment Configuration

Create `.env` in the server directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=effect-redux
MONGODB_EVENTS_COLLECTION=events
MONGODB_SNAPSHOTS_COLLECTION=snapshots

# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=8000

# Steam Configuration (optional for dev)
STEAM_API_KEY=your-steam-api-key
DEFAULT_PROXY_URL=http://proxy.example.com:8080

# Security
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Development

```bash
# Start development server with hot reload
yarn dev

# Server will be available at http://localhost:3000
```

### Production

```bash
# Build the application
yarn build

# Start production server
yarn start

# Or with PM2
pm2 start dist/index.js --name effect-redux-server
```

## Available Scripts

```bash
# Development
yarn dev              # Start with tsx watch mode
yarn build           # Compile TypeScript
yarn start           # Run compiled JavaScript

# Testing
yarn test            # Run tests
yarn test:watch      # Run tests in watch mode
yarn test:coverage   # Generate coverage report

# Code Quality
yarn typecheck       # TypeScript type checking
yarn lint           # Run ESLint
yarn lint:fix       # Fix linting issues
yarn format         # Format with Prettier
```

## API Documentation

### Command Endpoint

**POST /api/command**

Execute commands that modify system state.

#### Request Format

```typescript
{
    type: string        // Command type
    payload: object     // Command-specific data
}
```

#### Available Commands

##### AddAccountFromMaFile
Add a Steam account using maFile authentication:

```typescript
{
    type: "AddAccountFromMaFile",
    payload: {
        maFileJSON: string,     // Steam Guard mobile authenticator data
        proxyUrl: string,       // Dedicated proxy for this account
        label?: string          // Optional display name
    }
}
```

##### RemoveAccount
Remove an account from the system:

```typescript
{
    type: "RemoveAccount",
    payload: {
        accountId: string       // Account to remove
    }
}
```

##### CreateDialog
Start a new AI-powered dialog:

```typescript
{
    type: "CreateDialog",
    payload: {
        accountId?: string,         // Specific account or auto-assign
        playerSteamId64: string,    // Target player
        goal?: string,              // Conversation objective
        language?: 'zh'|'ja'|'ko'|'en'|'es'  // Dialog language
    }
}
```

##### ToggleAgent
Enable/disable AI agent for a dialog:

```typescript
{
    type: "ToggleAgent",
    payload: {
        dialogId: string,       // Dialog to modify
        enabled: boolean        // Agent state
    }
}
```

##### SendMessage
Send a message in a dialog:

```typescript
{
    type: "SendMessage",
    payload: {
        dialogId: string,       // Target dialog
        text: string           // Message content
    }
}
```

#### Response Format

Success:
```json
{
    "ok": true,
    "data": {}  // Command-specific response data
}
```

Error:
```json
{
    "ok": false,
    "error": "Error message"
}
```

### Event Stream Endpoint

**GET /api/event-stream**

Server-Sent Events stream for real-time state updates.

#### Connection

```javascript
const eventSource = new EventSource('http://localhost:3000/api/event-stream')

// Initial snapshot
eventSource.addEventListener('snapshot', (event) => {
    const { state } = JSON.parse(event.data)
    // Replace entire client state
})

// Event batches
eventSource.addEventListener('batch', (event) => {
    const { events } = JSON.parse(event.data)
    // Apply events to client state
})

// Error handling
eventSource.addEventListener('error', (event) => {
    console.error('SSE connection error:', event)
})
```

#### Event Format

All events follow the Redux action format:

```typescript
{
    type: string,           // Event type (e.g., "account.connected")
    payload: object,        // Event data
    meta: {
        schemaVersion: 1,
        id: string,         // Unique event ID
        ts: number,         // UTC timestamp (ms)
        kind: string,       // Same as type
        aggregate: {
            type: string,   // Entity type
            id: string      // Entity ID
        }
    }
}
```

## Effect-TS Architecture

### Layer Composition

```typescript
import { Layer, Effect } from 'effect'

// Define service layers
const ConfigLayer = Layer.effect(ConfigTag, loadConfig())
const DatabaseLayer = Layer.effect(DatabaseTag, createMongoConnection())
const SteamLayer = Layer.effect(SteamTag, createSteamClient())
const OpenAILayer = Layer.effect(OpenAITag, createOpenAIClient())

// Compose application layer
const AppLayer = Layer.mergeAll(
    ConfigLayer,
    DatabaseLayer,
    SteamLayer,
    OpenAILayer
)

// Run program with dependencies
const program = Effect.gen(function* () {
    const config = yield* ConfigTag
    const db = yield* DatabaseTag
    // ... application logic
})

Effect.runPromise(
    program.pipe(Effect.provide(AppLayer))
)
```

### Service Pattern

```typescript
import { Context, Effect } from 'effect'

// Define service interface
interface AccountService {
    connect: (id: string) => Effect.Effect<Account, AccountError>
    disconnect: (id: string) => Effect.Effect<void, AccountError>
    findById: (id: string) => Effect.Effect<Account, NotFoundError>
}

// Create service tag
const AccountServiceTag = Context.GenericTag<AccountService>('AccountService')

// Implement service
const AccountServiceLive = Layer.effect(
    AccountServiceTag,
    Effect.gen(function* () {
        const db = yield* DatabaseTag
        const steam = yield* SteamTag
        const events = yield* EventBusTag
        
        return {
            connect: (id) => pipe(
                db.accounts.findById(id),
                Effect.flatMap(account => 
                    steam.connect(account.maFile)
                ),
                Effect.tap(() => 
                    events.emit(accountConnected({ accountId: id }))
                )
            ),
            // ... other methods
        }
    })
)
```

### Error Handling

```typescript
// Define error types with tags
class AccountNotFoundError {
    readonly _tag = 'AccountNotFoundError'
    constructor(readonly accountId: string) {}
}

class SteamConnectionError {
    readonly _tag = 'SteamConnectionError'
    constructor(readonly reason: string) {}
}

// Handle errors in program
const program = pipe(
    accountService.connect('account_123'),
    Effect.catchTag('AccountNotFoundError', (error) =>
        Effect.logError(`Account ${error.accountId} not found`)
    ),
    Effect.catchTag('SteamConnectionError', (error) =>
        Effect.logError(`Steam connection failed: ${error.reason}`)
    )
)
```

## State Management

### Redux Store Configuration

```typescript
import { configureStore } from '@reduxjs/toolkit'
import { accountsSlice } from '@packages/isomorphic/slices/accounts'
import { dialogsSlice } from '@packages/isomorphic/slices/dialogs'
import { systemSlice } from '@packages/isomorphic/slices/system'

export const store = configureStore({
    reducer: {
        accounts: accountsSlice.reducer,
        dialogs: dialogsSlice.reducer,
        system: systemSlice.reducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(eventEmitterMiddleware)
            .concat(snapshotMiddleware)
})
```

### Event Emission

```typescript
// Middleware to emit events over SSE
const eventEmitterMiddleware = (store) => (next) => (action) => {
    const result = next(action)
    
    // Emit to SSE clients
    if (shouldEmitEvent(action)) {
        sseManager.broadcast({
            type: 'batch',
            data: { events: [action] }
        })
    }
    
    return result
}
```

## Steam Integration

### Account Connection

```typescript
import SteamUser from 'steam-user'
import { Effect } from 'effect'

const connectAccount = (maFile: MaFile, proxyUrl: string) =>
    Effect.async<SteamUser, SteamError>((resume) => {
        const client = new SteamUser({
            httpProxy: proxyUrl,
            autoRelogin: true
        })
        
        client.logOn({
            accountName: maFile.account_name,
            password: maFile.password,
            twoFactorCode: generateTwoFactorCode(maFile.shared_secret)
        })
        
        client.on('loggedOn', () => resume(Effect.succeed(client)))
        client.on('error', (err) => resume(Effect.fail(new SteamError(err))))
    })
```

### Rate Limiting

```typescript
// Enforce 1 invite per minute per account
const inviteScheduler = {
    canInvite: (accountId: string): boolean => {
        const lastInvite = rateLimits[accountId]?.lastInviteAt
        if (!lastInvite) return true
        return Date.now() - lastInvite >= 60000
    },
    
    recordInvite: (accountId: string): void => {
        rateLimits[accountId] = { lastInviteAt: Date.now() }
    }
}
```

## MongoDB Integration

### Event Store

```typescript
const eventStore = {
    append: (event: DomainEvent) =>
        Effect.gen(function* () {
            const db = yield* DatabaseTag
            const collection = db.collection('events')
            
            yield* Effect.tryPromise({
                try: () => collection.insertOne({
                    ...event,
                    timestamp: Date.now()
                }),
                catch: (error) => new DatabaseError(error)
            })
        }),
    
    getEvents: (since?: number) =>
        Effect.gen(function* () {
            const db = yield* DatabaseTag
            const collection = db.collection('events')
            
            const query = since ? { timestamp: { $gt: since } } : {}
            
            return yield* Effect.tryPromise({
                try: () => collection.find(query).toArray(),
                catch: (error) => new DatabaseError(error)
            })
        })
}
```

### Snapshot Management

```typescript
const snapshotStore = {
    save: (state: AppState) =>
        Effect.gen(function* () {
            const db = yield* DatabaseTag
            const collection = db.collection('snapshots')
            
            yield* Effect.tryPromise({
                try: () => collection.replaceOne(
                    { id: 'system' },
                    {
                        id: 'system',
                        state,
                        timestamp: Date.now(),
                        version: state.version + 1
                    },
                    { upsert: true }
                ),
                catch: (error) => new DatabaseError(error)
            })
        }),
    
    load: () =>
        Effect.gen(function* () {
            const db = yield* DatabaseTag
            const collection = db.collection('snapshots')
            
            const snapshot = yield* Effect.tryPromise({
                try: () => collection.findOne(
                    { id: 'system' },
                    { sort: { timestamp: -1 } }
                ),
                catch: (error) => new DatabaseError(error)
            })
            
            return snapshot?.state || getInitialState()
        })
}
```

## Testing

### Unit Tests

```typescript
import { Effect, TestContext, Layer } from 'effect'
import { describe, it, expect } from '@effect/vitest'

describe('AccountService', () => {
    const TestDatabaseLayer = Layer.succeed(DatabaseTag, mockDatabase)
    const TestSteamLayer = Layer.succeed(SteamTag, mockSteamClient)
    
    const TestLayer = Layer.mergeAll(
        TestDatabaseLayer,
        TestSteamLayer,
        AccountServiceLive
    )
    
    it('should connect account', () =>
        Effect.gen(function* () {
            const service = yield* AccountServiceTag
            const account = yield* service.connect('account_123')
            
            expect(account.status).toBe('connected')
        }).pipe(
            Effect.provide(TestLayer),
            Effect.runPromise
        )
    )
})
```

### Integration Tests

```typescript
import request from 'supertest'
import { app } from '../src/server'

describe('Command API', () => {
    it('should create dialog', async () => {
        const response = await request(app)
            .post('/api/command')
            .send({
                type: 'CreateDialog',
                payload: {
                    playerSteamId64: '12345678901234567',
                    goal: 'Test conversation',
                    language: 'en'
                }
            })
        
        expect(response.status).toBe(200)
        expect(response.body.ok).toBe(true)
        expect(response.body.data.dialogId).toBeDefined()
    })
})
```

## Performance Optimization

### Connection Pooling

```typescript
// MongoDB connection pool
const mongoClient = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 10000
})

// Steam client pool
const steamPool = new Map<string, SteamUser>()
const getSteamClient = (accountId: string) => {
    if (!steamPool.has(accountId)) {
        steamPool.set(accountId, new SteamUser())
    }
    return steamPool.get(accountId)!
}
```

### Event Batching

```typescript
// Batch events before sending over SSE
const eventBatcher = {
    queue: [] as DomainEvent[],
    timer: null as NodeJS.Timeout | null,
    
    add: (event: DomainEvent) => {
        eventBatcher.queue.push(event)
        
        if (!eventBatcher.timer) {
            eventBatcher.timer = setTimeout(() => {
                eventBatcher.flush()
            }, 50) // 50ms batching window
        }
    },
    
    flush: () => {
        if (eventBatcher.queue.length > 0) {
            sseManager.broadcast({
                type: 'batch',
                data: { events: eventBatcher.queue }
            })
            eventBatcher.queue = []
        }
        eventBatcher.timer = null
    }
}
```

## Monitoring

### Health Check

**GET /health**

```json
{
    "status": "healthy",
    "uptime": 3600,
    "mongodb": "connected",
    "accounts": {
        "total": 100,
        "connected": 85,
        "disconnected": 15
    },
    "dialogs": {
        "active": 42,
        "completed": 158
    }
}
```

### Metrics

```typescript
// Prometheus-style metrics
const metrics = {
    accountsConnected: new Counter('accounts_connected_total'),
    dialogsCreated: new Counter('dialogs_created_total'),
    messagesProcessed: new Counter('messages_processed_total'),
    aiResponseTime: new Histogram('ai_response_duration_seconds'),
    eventProcessingTime: new Histogram('event_processing_duration_seconds')
}
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY packages/server/package.json ./packages/server/

# Install dependencies
RUN yarn install --frozen-lockfile --production

# Copy source
COPY packages/server ./packages/server
COPY packages/isomorphic ./packages/isomorphic

# Build
RUN yarn workspace @packages/server build

# Run
CMD ["yarn", "workspace", "@packages/server", "start"]
```

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
    apps: [{
        name: 'effect-redux-server',
        script: './packages/server/dist/index.js',
        instances: 1,
        exec_mode: 'fork',
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true
    }]
}
```

## Troubleshooting

### Common Issues

#### MongoDB Connection Failed
- Check MongoDB is running: `mongod --version`
- Verify connection string in .env
- Check firewall rules

#### Steam Authentication Failed
- Verify maFile format is correct
- Check Steam Guard is enabled
- Ensure proxy is working
- Check for rate limiting

#### SSE Connection Drops
- Increase timeout settings
- Check for proxy/firewall interference
- Verify keep-alive headers

#### High Memory Usage
- Limit Redux store size
- Implement snapshot pruning
- Check for memory leaks with heap dumps

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

### Server-Specific Guidelines

1. **Effect-TS Patterns**: Use Effect types consistently
2. **Error Handling**: Define tagged error types
3. **Testing**: Mock external services in tests
4. **Performance**: Monitor event processing time
5. **Security**: Never log sensitive data
6. **Documentation**: Update API docs for new endpoints

## License

Part of the Effect-Redux project. See root LICENSE file.