# Configuration Guide

## Overview

The application uses a simplified configuration approach with minimal environment variables and a centralized runtime configuration store.

## Architecture

### 1. Environment Variables (Static)

Only **2 environment variables** are required:

```env
# .env file
MONGODB_URL=mongodb://localhost:27017/effect-redux  # Required
NODE_ENV=development                                 # Optional (defaults to 'development')
```

These are loaded once at startup using Effect's built-in Config module:

```typescript
// packages/isomorphic/src/config.ts
export const EnvConfig = Config.all({
    mongodbUrl: Config.string('MONGODB_URL'),
    nodeEnv: Config.literal('development', 'production', 'test')('NODE_ENV')
})
```

### 2. SystemSlice (Runtime Configuration)

All other configuration is stored in the `SystemSlice` Redux slice and persisted in MongoDB:

```typescript
// packages/isomorphic/src/slices/systemSlice.ts
export type SystemState = {
    database: {
        poolSize: number
        cache: {
            capacity: number
            ttlMinutes: number
        }
    }
    openai: {
        enabled: boolean
        apiKey?: string
        model: string
        maxTokensPerRequest: number
        timeout: number
    }
    server: {
        port: number
        host: string
        cors: {
            enabled: boolean
            origins: string[]
        }
    }
    rateLimits: {
        friendInvites: {
            perMinute: number
            perAccount: number
        }
        api: {
            perMinute: number
            perIP: number
        }
    }
    steam: {
        maxConcurrentAccounts: number
        connectionTimeout: number
        reconnectDelay: number
        maxReconnectAttempts: number
    }
    features: {
        aiAssessment: boolean
        autoReconnect: boolean
        debugLogging: boolean
        metricsCollection: boolean
    }
    runtime: {
        roundRobinIndex: number
        startedAt: number
        version: string
    }
}
```

## Service Integration

### SystemStateService

Services access configuration through the `SystemStateService` Effect service:

```typescript
// packages/isomorphic/src/system-state-service.ts
export class SystemStateService extends Context.Tag('SystemStateService')<
    SystemStateService,
    {
        get: () => SystemState
        update: (patch: Partial<SystemState>) => Effect.Effect<void>
        subscribe: (callback: (state: SystemState) => void) => Effect.Effect<() => void>
        getDatabase: () => SystemState['database']
        getOpenAI: () => SystemState['openai']
        getServer: () => SystemState['server']
        // ... other getters
    }
>() {}
```

### Usage in Services

Services can access configuration directly:

```typescript
// Example: AIService accessing OpenAI configuration
const AIServiceLive = Layer.effect(
    AIServiceEffect,
    Effect.gen(function* () {
        const systemState = yield* SystemStateService
        const openAIConfig = systemState.getOpenAI()

        if (!openAIConfig.enabled || !openAIConfig.apiKey) {
            throw new AIServiceError({ message: 'OpenAI is not configured' })
        }

        const openai = new OpenAI({ apiKey: openAIConfig.apiKey })
        // ... rest of service implementation
    })
)
```

## Startup Sequence

1. **Load Environment Variables**
   ```typescript
   const env = yield* Env
   ```

2. **Connect to MongoDB**
   ```typescript
   const connection = yield* MongoConnection
   ```

3. **Load System Configuration from Database**
   ```typescript
   const systemRepo = yield* SystemRepository
   const systemState = yield* systemRepo.initialize()
   ```

4. **Initialize Redux Store**
   ```typescript
   store.dispatch({
       type: '@@transient/SET',
       payload: { system: systemState }
   })
   ```

5. **Services Access Configuration**
   ```typescript
   const systemState = yield* SystemStateService
   const config = systemState.get()
   ```

## Configuration Management

### Reading Configuration

```typescript
// Get entire configuration
const config = systemState.get()

// Get specific sections
const dbConfig = systemState.getDatabase()
const openAIConfig = systemState.getOpenAI()

// Direct property access
const apiKey = config.openai.apiKey
const port = config.server.port
```

### Updating Configuration

Configuration can be updated at runtime through the SystemStateService:

```typescript
yield* systemState.update({
    openai: {
        model: 'gpt-4-turbo'
    }
})
```

Updates are:
- Persisted to MongoDB automatically
- Visible in Redux DevTools
- Type-safe with TypeScript

## Benefits

1. **Minimal Environment Variables**: Only 2 env vars reduces deployment complexity
2. **Centralized Configuration**: All runtime config in one place
3. **Type Safety**: Full TypeScript types via SystemState
4. **Database Persistence**: Configuration survives restarts
5. **Direct Access**: Simple property access pattern
6. **Runtime Updates**: Configuration can be changed without restart

## Migration from Old Config System

If migrating from the old ConfigService pattern:

| Old Pattern | New Pattern |
|------------|------------|
| `ConfigService.getOpenAI()` | `systemState.getOpenAI()` |
| `getDatabaseConfig()` | `systemState.getDatabase()` |
| `process.env.OPENAI_API_KEY` | `config.openai.apiKey` |
| `ConfigLive` Layer | `SystemStateServiceLive` Layer |

## Testing

For tests, provide a mock SystemStateService:

```typescript
const TestSystemState = Layer.succeed(SystemStateService, {
    get: () => DEFAULT_SYSTEM_CONFIG,
    getOpenAI: () => ({
        enabled: true,
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
        // ...
    }),
    // ... other methods
})
```

## Summary

- **Environment**: 2 variables only (MONGODB_URL, NODE_ENV)
- **Runtime Config**: Everything else in SystemSlice
- **Access Pattern**: Direct property access via SystemStateService
- **Storage**: MongoDB for persistence
- **Updates**: Can be changed at runtime without restart