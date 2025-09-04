# @packages/steam-api

Effect-TS based Steam integration utilities for the Effect-Redux Steam Multichat System, providing type-safe wrappers around unofficial Steam APIs.

## Features

- 🎮 **Steam Client Management** - Automated account connection and session handling
- 🔐 **Steam Guard Support** - Mobile authenticator (maFile) integration
- 👥 **Friends & Chat** - Friend invites and messaging capabilities
- 🌐 **Proxy Support** - Per-account proxy configuration
- ⚡ **Effect-TS Integration** - Functional error handling and dependency injection
- 🔄 **Connection Resilience** - Auto-reconnect with exponential backoff
- 📊 **Rate Limiting** - Built-in rate limit enforcement
- 🛡️ **Type Safety** - Full TypeScript with strict types

## Tech Stack

- **Effect-TS** - Functional programming framework
- **steam-user** - Unofficial Steam client library
- **steamcommunity** - Steam Community API wrapper
- **steam-totp** - Steam Guard code generation
- **node-steam-tradeoffer-manager** - Trade offer handling
- **TypeScript** - Type safety

## Project Structure

```
steam-api/
├── src/
│   ├── index.ts              # Public API exports
│   ├── SteamClient.ts        # Main Steam client wrapper
│   ├── SteamAuthenticator.ts # Steam Guard authentication
│   ├── SteamFriends.ts       # Friends and chat management
│   ├── SteamProxy.ts         # Proxy configuration
│   ├── layers/               # Effect-TS layers
│   │   ├── SteamClientLayer.ts
│   │   └── ProxyLayer.ts
│   ├── services/             # Service implementations
│   │   ├── ConnectionService.ts
│   │   ├── MessageService.ts
│   │   └── InviteService.ts
│   ├── errors/               # Error definitions
│   │   ├── SteamErrors.ts
│   │   └── AuthErrors.ts
│   ├── types/                # TypeScript types
│   │   ├── MaFile.ts
│   │   ├── SteamTypes.ts
│   │   └── Events.ts
│   └── utils/                # Utility functions
│       ├── TwoFactorAuth.ts
│       └── RateLimiter.ts
├── tests/
├── package.json
└── tsconfig.json
```

## Installation

```bash
# From project root
yarn workspace @packages/steam-api install

# Or from steam-api directory
cd packages/steam-api
yarn install
```

## Basic Usage

### Creating a Steam Client

```typescript
import { SteamClient } from '@packages/steam-api'
import { Effect } from 'effect'

const program = Effect.gen(function* () {
    const client = yield* SteamClient.create({
        accountName: 'your_account',
        password: 'your_password',
        twoFactorCode: '2FA_CODE',
        proxyUrl: 'http://proxy:8080'
    })
    
    yield* client.connect()
    
    console.log('Connected to Steam!')
})

Effect.runPromise(program)
```

### Using MaFile Authentication

```typescript
import { SteamClient, MaFile } from '@packages/steam-api'
import { Effect } from 'effect'

const maFile: MaFile = {
    shared_secret: 'your_shared_secret',
    serial_number: 'serial',
    revocation_code: 'R12345',
    uri: 'otpauth://...',
    server_time: '1234567890',
    account_name: 'account_name',
    token_gid: 'token',
    identity_secret: 'identity_secret',
    secret_1: 'secret',
    status: 1,
    device_id: 'android:device-id',
    fully_enrolled: true,
    Session: {
        SessionID: 'session_id',
        SteamLogin: 'login_token',
        SteamLoginSecure: 'secure_token',
        WebCookie: 'web_cookie',
        OAuthToken: 'oauth_token',
        SteamID: '76561198000000000'
    }
}

const program = Effect.gen(function* () {
    const client = yield* SteamClient.fromMaFile(maFile, {
        proxyUrl: 'http://proxy:8080'
    })
    
    yield* client.connect()
})
```

## API Reference

### SteamClient

Main class for Steam client operations.

#### Methods

##### `create(options: SteamClientOptions): Effect<SteamClient, SteamError>`
Create a new Steam client instance.

```typescript
const client = yield* SteamClient.create({
    accountName: 'account',
    password: 'password',
    twoFactorCode: '12345',
    proxyUrl: 'http://proxy:8080',
    autoReconnect: true,
    reconnectDelay: 5000
})
```

##### `connect(): Effect<void, ConnectionError>`
Connect to Steam network.

```typescript
yield* client.connect()
```

##### `disconnect(): Effect<void, never>`
Disconnect from Steam network.

```typescript
yield* client.disconnect()
```

##### `sendMessage(steamId: string, message: string): Effect<void, MessageError>`
Send a message to a Steam user.

```typescript
yield* client.sendMessage('76561198000000000', 'Hello!')
```

##### `addFriend(steamId: string): Effect<void, InviteError>`
Send a friend invite.

```typescript
yield* client.addFriend('76561198000000000')
```

##### `removeFriend(steamId: string): Effect<void, FriendError>`
Remove a friend.

```typescript
yield* client.removeFriend('76561198000000000')
```

### SteamAuthenticator

Handle Steam Guard authentication.

#### Methods

##### `generateTwoFactorCode(sharedSecret: string): string`
Generate a Steam Guard code.

```typescript
import { SteamAuthenticator } from '@packages/steam-api'

const code = SteamAuthenticator.generateTwoFactorCode('shared_secret')
console.log(code) // "A1B2C"
```

##### `getConfirmations(maFile: MaFile): Effect<Confirmation[], AuthError>`
Get pending confirmations.

```typescript
const confirmations = yield* SteamAuthenticator.getConfirmations(maFile)
```

##### `acceptConfirmation(maFile: MaFile, confirmation: Confirmation): Effect<void, AuthError>`
Accept a confirmation.

```typescript
yield* SteamAuthenticator.acceptConfirmation(maFile, confirmation)
```

### SteamFriends

Manage friends and chat.

#### Methods

##### `getFriendsList(): Effect<Friend[], FriendsError>`
Get list of friends.

```typescript
const friends = yield* steamFriends.getFriendsList()
```

##### `getPersona(steamId: string): Effect<Persona, PersonaError>`
Get user persona information.

```typescript
const persona = yield* steamFriends.getPersona('76561198000000000')
console.log(persona.name, persona.state)
```

##### `setPersonaState(state: PersonaState): Effect<void, never>`
Set your persona state.

```typescript
yield* steamFriends.setPersonaState(PersonaState.Online)
```

## Effect-TS Integration

### Layer Architecture

```typescript
import { Layer, Effect, Context } from 'effect'
import { SteamClient } from '@packages/steam-api'

// Define service tag
const SteamServiceTag = Context.GenericTag<{
    client: SteamClient
    sendMessage: (to: string, text: string) => Effect.Effect<void, MessageError>
}>('SteamService')

// Create service layer
const SteamServiceLive = Layer.effect(
    SteamServiceTag,
    Effect.gen(function* () {
        const config = yield* ConfigTag
        
        const client = yield* SteamClient.fromMaFile(
            config.maFile,
            { proxyUrl: config.proxyUrl }
        )
        
        yield* client.connect()
        
        return {
            client,
            sendMessage: (to, text) => client.sendMessage(to, text)
        }
    })
)

// Use in program
const program = Effect.gen(function* () {
    const steam = yield* SteamServiceTag
    yield* steam.sendMessage('76561198000000000', 'Hello from Effect!')
})

Effect.runPromise(
    program.pipe(Effect.provide(SteamServiceLive))
)
```

### Error Handling

```typescript
// Define error types
export class SteamConnectionError {
    readonly _tag = 'SteamConnectionError'
    constructor(
        readonly reason: string,
        readonly code?: string
    ) {}
}

export class SteamAuthError {
    readonly _tag = 'SteamAuthError'
    constructor(
        readonly message: string,
        readonly requiresEmailAuth?: boolean,
        readonly requiresMobileAuth?: boolean
    ) {}
}

export class SteamRateLimitError {
    readonly _tag = 'SteamRateLimitError'
    constructor(
        readonly retryAfter: number
    ) {}
}

// Handle errors
const program = pipe(
    client.connect(),
    Effect.catchTag('SteamConnectionError', (error) =>
        Effect.logError(`Connection failed: ${error.reason}`)
    ),
    Effect.catchTag('SteamAuthError', (error) =>
        error.requiresEmailAuth
            ? handleEmailAuth()
            : handleMobileAuth()
    ),
    Effect.catchTag('SteamRateLimitError', (error) =>
        Effect.delay(error.retryAfter * 1000)(
            client.connect()
        )
    )
)
```

## Rate Limiting

Built-in rate limiting for Steam API calls:

```typescript
import { RateLimiter } from '@packages/steam-api/utils'

const inviteRateLimiter = new RateLimiter({
    maxRequests: 1,
    windowMs: 60000  // 1 invite per minute
})

const sendInvite = (steamId: string) =>
    Effect.gen(function* () {
        yield* inviteRateLimiter.check()
        yield* client.addFriend(steamId)
        inviteRateLimiter.record()
    })
```

## Proxy Configuration

### Per-Account Proxy

```typescript
const client = yield* SteamClient.create({
    accountName: 'account',
    password: 'password',
    proxyUrl: 'http://user:pass@proxy.example.com:8080'
})
```

### Proxy Rotation

```typescript
import { ProxyManager } from '@packages/steam-api/utils'

const proxyManager = new ProxyManager([
    'http://proxy1.example.com:8080',
    'http://proxy2.example.com:8080',
    'http://proxy3.example.com:8080'
])

const clientWithRotation = yield* SteamClient.create({
    accountName: 'account',
    password: 'password',
    proxyUrl: proxyManager.getNext()
})
```

## Events

Steam client events are exposed as Effect streams:

```typescript
import { Stream } from 'effect'

// Listen to messages
const messageStream = client.messages$.pipe(
    Stream.tap((message) =>
        Effect.log(`Message from ${message.steamId}: ${message.text}`)
    )
)

// Listen to friend requests
const friendRequestStream = client.friendRequests$.pipe(
    Stream.tap((request) =>
        Effect.log(`Friend request from ${request.steamId}`)
    )
)

// Run streams
yield* Stream.runDrain(
    Stream.merge(messageStream, friendRequestStream)
)
```

## MaFile Structure

The maFile (Mobile Authenticator File) format:

```typescript
interface MaFile {
    shared_secret: string      // For generating 2FA codes
    serial_number: string      // Device serial
    revocation_code: string    // Recovery code
    uri: string               // OTP URI
    server_time: string       // Server time offset
    account_name: string      // Steam account name
    token_gid: string         // Token GUID
    identity_secret: string   // For confirmations
    secret_1: string          // Additional secret
    status: number            // Enrollment status
    device_id: string         // Android device ID
    fully_enrolled: boolean   // Enrollment complete
    Session?: {               // Optional session data
        SessionID: string
        SteamLogin: string
        SteamLoginSecure: string
        WebCookie: string
        OAuthToken: string
        SteamID: string
    }
}
```

## Testing

### Unit Tests

```typescript
import { Effect, TestContext } from 'effect'
import { SteamClient } from '@packages/steam-api'

describe('SteamClient', () => {
    it('should connect successfully', () =>
        Effect.gen(function* () {
            const client = yield* SteamClient.create({
                accountName: 'test',
                password: 'test',
                mockMode: true  // Use mock mode for testing
            })
            
            yield* client.connect()
            
            const status = yield* client.getStatus()
            expect(status).toBe('connected')
        }).pipe(
            Effect.runPromise
        )
    )
})
```

### Integration Tests

```typescript
describe('Steam Integration', () => {
    let client: SteamClient
    
    beforeEach(() =>
        Effect.gen(function* () {
            client = yield* SteamClient.fromMaFile(testMaFile, {
                proxyUrl: process.env.TEST_PROXY_URL
            })
        }).pipe(Effect.runPromise)
    )
    
    it('should send and receive messages', () =>
        Effect.gen(function* () {
            yield* client.connect()
            yield* client.sendMessage(TEST_STEAM_ID, 'Test message')
            
            const message = yield* client.messages$.pipe(
                Stream.take(1),
                Stream.runCollect
            )
            
            expect(message[0].text).toBe('Test response')
        }).pipe(Effect.runPromise)
    )
})
```

## Common Issues & Solutions

### Connection Issues

#### Invalid Credentials
- Verify account name and password
- Check if Steam Guard is enabled
- Ensure 2FA code is current (within 30 seconds)

#### Proxy Connection Failed
- Test proxy connectivity separately
- Check proxy authentication
- Verify proxy supports HTTPS

#### Rate Limiting
- Implement exponential backoff
- Use different accounts for load distribution
- Respect Steam's rate limits (1 invite/minute)

### Authentication Issues

#### Steam Guard Required
```typescript
const program = pipe(
    client.connect(),
    Effect.catchTag('SteamAuthError', (error) => {
        if (error.requiresMobileAuth) {
            const code = SteamAuthenticator.generateTwoFactorCode(sharedSecret)
            return client.connectWith2FA(code)
        }
        return Effect.fail(error)
    })
)
```

#### Session Expired
- Refresh session tokens
- Re-authenticate with credentials
- Store and reuse valid sessions

### Performance Optimization

#### Connection Pooling
```typescript
class SteamClientPool {
    private pool = new Map<string, SteamClient>()
    
    get(accountId: string): Effect.Effect<SteamClient, PoolError> {
        if (this.pool.has(accountId)) {
            return Effect.succeed(this.pool.get(accountId)!)
        }
        
        return Effect.gen(function* () {
            const client = yield* createClientForAccount(accountId)
            this.pool.set(accountId, client)
            return client
        })
    }
}
```

#### Message Batching
```typescript
const batchedSend = Stream.debounce(
    messageQueue$,
    '100 millis'
).pipe(
    Stream.mapEffect((messages) =>
        Effect.forEach(messages, (msg) =>
            client.sendMessage(msg.to, msg.text)
        )
    )
)
```

## Security Best Practices

1. **Never log sensitive data** - maFile contents, passwords, session tokens
2. **Rotate proxies regularly** - Avoid detection and bans
3. **Store maFiles securely** - Encrypt at rest, use secure storage
4. **Rate limit operations** - Respect Steam's limits
5. **Handle sessions carefully** - Don't share between accounts
6. **Use dedicated proxies** - One proxy per account
7. **Monitor for bans** - Detect and handle VAC/trade bans

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

### Steam-API Specific Guidelines

1. **Effect-TS patterns** - Use Effect types consistently
2. **Error handling** - Define specific error types
3. **Rate limiting** - Always respect Steam's limits
4. **Testing** - Mock Steam services in tests
5. **Security** - Never expose sensitive data
6. **Documentation** - Document Steam-specific behaviors

## Resources

- [Steam Web API Documentation](https://steamcommunity.com/dev)
- [node-steam-user Documentation](https://github.com/DoctorMcKay/node-steam-user)
- [Steam Guard Mobile Authenticator](https://github.com/Jessecar96/SteamDesktopAuthenticator)
- [Effect-TS Documentation](https://www.effect.website/)

## License

Part of the Effect-Redux project. See root LICENSE file.

## Disclaimer

This package uses unofficial Steam APIs. Use at your own risk and respect Steam's Terms of Service. The authors are not responsible for any account bans or restrictions resulting from the use of this software.