# @packages/dummy-front

A comprehensive headless frontend testing package for Redux/Effect-TS applications with advanced saga integration, browser testing capabilities, and Redux DevTools support.

## Overview

The `dummy-front` package provides a sophisticated testing infrastructure for applications using Redux with Effect-TS patterns. It eliminates the need for DOM overhead while providing powerful tools for testing complex async event chains, saga flows, and state management scenarios.

### Purpose and Benefits

- **Headless Testing**: Test Redux/Effect applications without browser DOM overhead
- **Effect-Saga Integration**: First-class support for Effect-TS patterns in Redux sagas
- **Advanced Scenario Building**: Generate complex test data and state configurations
- **Browser Testing Support**: Optional Playwright integration for full browser testing
- **Redux DevTools Integration**: Debug test scenarios with full DevTools support
- **Type-Safe Testing**: Complete TypeScript support with Effect-aware test utilities

### Key Features

- 🚀 **Effect-Redux Store Factory**: Creates Redux stores with Effect-TS middleware
- 🏗️ **Scenario Builders**: Generate complex test data for accounts, dialogs, and system state
- 🧪 **Saga Test Runners**: Test Effect-based sagas with comprehensive assertion utilities
- 🌐 **Browser Testing**: Playwright integration for full browser scenarios
- 🔧 **DevTools Support**: Redux DevTools with remote debugging capabilities
- 📊 **Action Streaming**: Real-time action monitoring for testing async flows
- 🎯 **Matcher Library**: Rich assertion utilities for action and state testing

## Installation & Setup

### Package Installation

```bash
# Install from workspace root
yarn workspace @packages/dummy-front install

# Or install dependencies for the entire workspace
yarn install
```

### Workspace Configuration

Ensure your `package.json` includes the dummy-front workspace:

```json
{
  "workspaces": [
    "packages/*"
  ]
}
```

### Environment Variables

The package uses minimal environment configuration:

- `NODE_ENV`: Controls development features (default: 'development')
- `HEADED`: Run browser tests in headed mode (default: false)
- `CROSS_BROWSER`: Enable cross-browser testing (default: false)
- `SLOW_MO`: Slow down browser tests for debugging (default: 0)

### Development vs Production Setup

```typescript
// Development setup (with DevTools and debugging)
import { main } from '@packages/dummy-front'

const result = await main({
  loadData: 'complex',
  setupGlobals: true,
  enableLogging: true,
})

// Production/CI setup (minimal)
const result = await main({
  loadData: false,
  setupGlobals: false,
  enableLogging: false,
})
```

## Core Concepts

### Effect-Saga Integration

The package provides seamless integration between Effect-TS and Redux through custom middleware and saga bridges:

```typescript
import { Effect } from 'effect'
import { createSaga, SagaEffects } from '@packages/isomorphic/src/effect-redux/saga-bridge'

// Create Effect-based saga
const mySaga = createSaga('my-saga',
  Effect.gen(function* () {
    const store = yield* StoreService
    const { stream } = yield* ActionStream

    // Use Effect patterns in saga
    yield* Effect.log('Saga started')

    // Listen to action stream
    yield* pipe(
      stream,
      Stream.filter(action => action.type === 'myAction'),
      Stream.runForEach(action =>
        Effect.log(`Processed: ${action.type}`)
      )
    )
  })
)
```

### Store Factory and Middleware

The store factory creates Redux stores with Effect middleware pre-configured:

```typescript
import { withStore, createTestStore } from './src/store/store-factory'

// Create store with Effect middleware
const program = Effect.gen(function* () {
  const { store, stream, emit } = yield* createTestStore

  // Store is ready with Effect-saga middleware
  store.dispatch({ type: 'test/action' })

  // Stream provides real-time action monitoring
  yield* pipe(
    stream,
    Stream.take(5),
    Stream.runCollect
  )
})

// Run with store context
const result = await Effect.runPromise(withStore(program))
```

### Scenario Builders for Test Data

Generate complex test scenarios with the `ScenarioBuilder` class:

```typescript
import { ScenarioBuilder, createScenario } from './src/test-utils/scenario-builder'

// Use pre-built scenarios
const simple = createScenario.simpleAccount()
const complex = createScenario.fullSystem()

// Build custom scenarios
const builder = new ScenarioBuilder()
builder.configureSystem({
  rateLimitPerMinute: 30,
  maxDialogsPerAccount: 5,
})

const accountId = builder.connectedAccount()
const dialogId = builder.createDialog({
  accountId,
  messageCount: 10,
  withAssessment: true,
  continuationScore: 0.8,
})

// Get actions to dispatch
const actions = builder.getActions()
actions.forEach(action => store.dispatch(action))
```

### Saga Test Runners and Utilities

The test runner provides a complete testing environment for sagas:

```typescript
import { runSagaTest, matchers, effects } from './src/saga-tests/test-runner'

const test = runSagaTest('My Saga Test', (ctx) =>
  Effect.gen(function* () {
    // Dispatch actions
    yield* ctx.dispatch({ type: 'test/start' })

    // Wait for responses
    const action = yield* ctx.waitFor(
      matchers.ofType('test/complete'),
      5000
    )

    // Run test sagas
    const testSaga = effects.respondTo(
      matchers.ofType('trigger'),
      () => ({ type: 'response' })
    )
    yield* ctx.runSaga(testSaga)

    // Assert state
    const state = yield* ctx.getState()
    assert.strictEqual(state.someValue, expectedValue)
  })
)

// Run with store context
await Effect.runPromise(withStore(test))
```

## Usage Examples

### Basic Store Initialization

```typescript
import { initializeDummyFront } from '@packages/dummy-front'

// Initialize with defaults
const result = await initializeDummyFront()

// Access store and utilities
const { store, testData, utilities } = result
console.log('Store state:', store.getState())

// Use global utilities (available as window.dummyFront or global.dummyFront)
dummyFront.debug.logState()
dummyFront.scenarios.simple()
```

### Writing Saga Tests

```typescript
import { assert, describe, it } from '@effect/vitest'
import { Effect, Duration } from 'effect'
import { runSagaTest, matchers, effects } from '@packages/dummy-front/src/saga-tests/test-runner'
import { withStore } from '@packages/dummy-front/src/store/store-factory'

describe('My Saga Tests', () => {
  it.effect('should handle async event chain', () =>
    withStore(
      runSagaTest('Async Event Chain', (ctx) =>
        Effect.gen(function* () {
          // Create saga that responds to events
          const responseSaga = effects.respondTo(
            matchers.ofType('event/trigger'),
            (action) => ({
              type: 'event/response',
              payload: { originalId: action.payload.id }
            })
          )

          yield* ctx.runSaga(responseSaga)

          // Trigger the chain
          yield* ctx.dispatch({
            type: 'event/trigger',
            payload: { id: 'test-123' }
          })

          // Wait for response
          const response = yield* ctx.waitFor(
            matchers.ofTypeWithPayload('event/response',
              (payload) => payload.originalId === 'test-123'
            ),
            2000
          )

          assert.strictEqual(response.payload.originalId, 'test-123')
        })
      )
    )
  )
})
```

### Using Scenario Builders

```typescript
import { ScenarioBuilder } from '@packages/dummy-front/src/test-utils/scenario-builder'

// Create a complex test scenario
const builder = new ScenarioBuilder()

// Setup system configuration
builder.configureSystem({
  rateLimitPerMinute: 60,
  maxDialogsPerAccount: 10,
})

// Create multiple accounts with different states
const connectedAccounts = Array.from({ length: 3 }, () =>
  builder.connectedAccount()
)
const failedAccount = builder.accountWithFailedAuth('2FA expired')

// Create dialogs with varying characteristics
connectedAccounts.forEach((accountId, index) => {
  builder.createDialog({
    accountId,
    messageCount: 5 + index * 2,
    withAssessment: true,
    continuationScore: 0.9 - index * 0.1,
  })

  if (index === 1) {
    // Add an alert scenario
    builder.dialogWithAlert(accountId)
  }
})

// Apply the scenario to your store
const actions = builder.getActions()
for (const action of actions) {
  store.dispatch(action)
}
```

### Browser Testing with Playwright

```typescript
import { test, expect } from '@playwright/test'

test('Redux DevTools integration', async ({ page }) => {
  // Navigate to the dummy-front app
  await page.goto('http://localhost:5173')

  // Wait for store initialization
  await page.waitForFunction('window.dummyFront !== undefined')

  // Execute scenario in browser
  await page.evaluate(() => {
    const scenario = window.dummyFront.scenarios.complex()
    scenario.actions.forEach(action =>
      window.dummyFront.dispatch(action)
    )
  })

  // Check state through global utilities
  const accountCount = await page.evaluate(() => {
    const state = window.dummyFront.getState()
    return Object.keys(state.accounts.entities).length
  })

  expect(accountCount).toBeGreaterThan(0)

  // Test DevTools integration (if available)
  if (process.env.NODE_ENV === 'development') {
    await page.evaluate(() => {
      window.dummyFront.debug.logState()
    })
  }
})
```

### Redux DevTools Integration

```typescript
// DevTools are automatically configured in development
const store = createTestStore({
  enableDevTools: true,
  debug: true,
})

// DevTools will show:
// - All dispatched actions
// - State changes
// - Time-travel debugging
// - Action payload inspection

// For remote debugging (useful in headless environments)
const config = {
  enableDevTools: true,
  devToolsOptions: {
    hostname: 'localhost',
    port: 8000,
    secure: false,
  }
}
```

## API Reference

### Store Factory API

#### `createTestStore()`

Creates a Redux store with Effect-saga middleware.

**Returns:** `Effect<{ store: TestStore, actionQueue: Queue, actionStream: Stream }>`

#### `withStore<A, E>(effect: Effect<A, E, StoreService>)`

Provides store context to an Effect.

**Parameters:**
- `effect`: Effect that requires store services

**Returns:** `Effect<A, E, never>`

#### `StoreService`

Context service providing access to the Redux store.

```typescript
const store = yield* StoreService
store.dispatch(action)
const state = store.getState()
```

#### `ActionStream`

Context service providing action streaming capabilities.

```typescript
const { stream, emit } = yield* ActionStream
yield* emit(action) // Dispatch action
yield* Stream.take(5)(stream) // Monitor actions
```

### Scenario Builder API

#### `ScenarioBuilder`

Main class for building test scenarios.

**Methods:**

- `createAccount(options)`: Create account with specific state
- `connectedAccount()`: Create connected account
- `accountWithFailedAuth(reason)`: Create account with auth failure
- `createDialog(options)`: Create dialog with messages
- `dialogNearingLimit(accountId)`: Create dialog near continuation threshold
- `dialogWithAlert(accountId)`: Create dialog with operator alert
- `configureSystem(options)`: Setup system configuration
- `getActions()`: Get all actions to dispatch
- `clear()`: Clear all actions

#### `createScenario`

Static factory methods for common scenarios.

**Methods:**

- `simpleAccount()`: Simple connected account
- `accountWithDialog()`: Account with active dialog
- `accountWithFailedAuth()`: Account with authentication failure
- `dialogNearingLimit()`: Dialog approaching threshold
- `fullSystem()`: Complex multi-account scenario
- `custom(fn)`: Custom scenario with builder function

### Test Runner API

#### `runSagaTest(name, testFn)`

Create and run a saga test with full context.

**Parameters:**
- `name`: Test name for logging
- `testFn`: Test function receiving `SagaTestContext`

**Returns:** `Effect<A, E, StoreService | ActionStream | ConfigService>`

#### `SagaTestContext`

Test context provided to saga tests.

**Properties:**

- `store`: Redux store instance
- `actions$`: Action stream for monitoring
- `dispatch(action)`: Dispatch action
- `waitFor(predicate, timeout?)`: Wait for specific action
- `runSaga(saga)`: Start a test saga
- `getState()`: Get current store state

### Matcher Utilities

Action matchers for filtering and testing:

```typescript
import { matchers } from '@packages/dummy-front/src/saga-tests/test-runner'

// Type matching
matchers.ofType('action/type')
matchers.ofTypes('type1', 'type2', 'type3')
matchers.notOfTypes('exclude1', 'exclude2')

// Payload matching
matchers.withPayload(payload => payload.id === 'test')
matchers.ofTypeWithPayload('type', payload => payload.valid)

// Meta matching
matchers.withMeta('key', 'value')
matchers.testEvent('test-id')
```

## Testing Patterns

### Common Saga Testing Patterns

#### 1. Event Response Testing

```typescript
const test = runSagaTest('Event Response', (ctx) =>
  Effect.gen(function* () {
    // Create responding saga
    const saga = effects.respondTo(
      matchers.ofType('request'),
      (action) => ({
        type: 'response',
        payload: { requestId: action.payload.id }
      })
    )

    yield* ctx.runSaga(saga)
    yield* ctx.dispatch({ type: 'request', payload: { id: '123' } })

    const response = yield* ctx.waitFor(
      matchers.ofType('response'),
      1000
    )

    assert.strictEqual(response.payload.requestId, '123')
  })
)
```

#### 2. Action Sequence Testing

```typescript
const test = runSagaTest('Action Sequence', (ctx) =>
  Effect.gen(function* () {
    // Dispatch sequence
    const sequence = effects.dispatchSequence(
      { type: 'step1' },
      { type: 'step2' },
      { type: 'step3' }
    )

    yield* ctx.runSaga(sequence)

    // Verify sequence
    yield* assertSaga.actionSequence(ctx, [
      'step1', 'step2', 'step3'
    ], 2000)
  })
)
```

#### 3. State Change Testing

```typescript
const test = runSagaTest('State Changes', (ctx) =>
  Effect.gen(function* () {
    const initialState = yield* ctx.getState()

    yield* ctx.dispatch({
      type: 'update',
      payload: { value: 'new' }
    })

    yield* assertSaga.stateMatches(
      ctx,
      state => state.someSlice.value,
      'new'
    )
  })
)
```

### Async Event Chain Testing

For complex async flows, use stream-based testing:

```typescript
const test = runSagaTest('Complex Async Chain', (ctx) =>
  Effect.gen(function* () {
    // Create chain monitoring saga
    const chainSaga = effects.collectActions(5,
      matchers.ofTypes('chain/start', 'chain/progress', 'chain/complete')
    )

    yield* ctx.runSaga(chainSaga)

    // Trigger chain
    yield* ctx.dispatch({ type: 'chain/start' })

    // Wait for all events
    const events = yield* pipe(
      ctx.actions$,
      Stream.filter(matchers.ofTypes('chain/start', 'chain/complete')),
      Stream.take(2),
      Stream.timeout(Duration.seconds(5)),
      Stream.runCollect
    )

    assert.strictEqual(events.length, 2)
  })
)
```

### Error Handling Tests

Test error scenarios with proper Effect error handling:

```typescript
const test = runSagaTest('Error Handling', (ctx) =>
  Effect.gen(function* () {
    // Create error-producing saga
    const errorSaga = createSaga('error-saga',
      Effect.gen(function* () {
        yield* Effect.fail(new Error('Test error'))
      })
    )

    // Test error propagation
    const result = yield* Effect.either(ctx.runSaga(errorSaga))

    assert.isTrue(Effect.isLeft(result))
    assert.instanceOf(result.left, Error)
  })
)
```

### Integration Test Strategies

#### 1. End-to-End Scenario Testing

```typescript
const integrationTest = runSagaTest('E2E Scenario', (ctx) =>
  Effect.gen(function* () {
    // Load complex scenario
    const scenario = createScenario.fullSystem()

    for (const action of scenario.actions) {
      yield* ctx.dispatch(action)
      yield* Effect.sleep(Duration.millis(10))
    }

    // Verify final state
    const state = yield* ctx.getState()
    assert.isTrue(Object.keys(state.accounts.entities).length > 0)
    assert.isTrue(Object.keys(state.dialogs.entities).length > 0)
  })
)
```

#### 2. Cross-Service Integration

```typescript
const crossServiceTest = runSagaTest('Cross-Service', (ctx) =>
  Effect.gen(function* () {
    // Test interaction between different services
    const accountSaga = effects.respondTo(
      matchers.ofType('account/connected'),
      (action) => ({
        type: 'dialog/enable',
        payload: { accountId: action.payload.accountId }
      })
    )

    const dialogSaga = effects.respondTo(
      matchers.ofType('dialog/enable'),
      (action) => ({
        type: 'ai/activate',
        payload: { accountId: action.payload.accountId }
      })
    )

    yield* ctx.runSaga(accountSaga)
    yield* ctx.runSaga(dialogSaga)

    // Trigger chain
    yield* ctx.dispatch({
      type: 'account/connected',
      payload: { accountId: 'test-123' }
    })

    // Verify chain completion
    const aiActivation = yield* ctx.waitFor(
      matchers.ofType('ai/activate'),
      2000
    )

    assert.strictEqual(aiActivation.payload.accountId, 'test-123')
  })
)
```

## Configuration

### Vite Configuration

The package includes pre-configured Vite setup:

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@packages/isomorphic': resolve(__dirname, '../isomorphic/src'),
    },
  },
  optimizeDeps: {
    include: ['effect', '@effect/schema', '@reduxjs/toolkit', 'redux'],
    exclude: ['@packages/isomorphic'],
  },
  server: {
    port: 5173,
    open: false,
  },
})
```

### Playwright Options

Comprehensive browser testing configuration:

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './src/tests',
  fullyParallel: true,
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [{
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      launchOptions: {
        headless: !process.env.HEADED,
        args: [
          '--remote-debugging-port=9222',
          '--disable-web-security',
          '--allow-running-insecure-content',
        ],
      },
    },
  }],
})
```

### Redux DevTools Setup

DevTools configuration for debugging:

```typescript
// Automatic in development
const config = {
  enableDevTools: true,
  debug: true,
  sagaTimeout: 5000,
}

// Remote DevTools (for headless environments)
const remoteConfig = {
  enableDevTools: true,
  devToolsOptions: {
    hostname: 'localhost',
    port: 8000,
    secure: false,
    suppressConnectErrors: false,
  }
}
```

### CI/CD Configuration

Example GitHub Actions configuration:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'

      - run: yarn install --frozen-lockfile

      # Unit and saga tests
      - run: yarn workspace @packages/dummy-front test

      # Browser tests (headless)
      - run: yarn workspace @packages/dummy-front test:browser
        env:
          CI: true

      # Upload test results
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: packages/dummy-front/test-results/
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Store Initialization Failures

**Problem:** Store fails to initialize with Effect middleware

**Solution:**
```typescript
// Ensure all required services are provided
const program = Effect.gen(function* () {
  // ... your code
}).pipe(
  Effect.provide(StoreLayer),
  Effect.provide(Layer.succeed(ConfigService, defaultConfig))
)
```

#### 2. Action Stream Not Working

**Problem:** Actions aren't appearing in the stream

**Solution:**
```typescript
// Make sure to use the correct dispatch method
const { emit } = yield* ActionStream
yield* emit(action) // Use this instead of store.dispatch directly

// Or ensure middleware is capturing actions
const captureMiddleware: Middleware = () => (next) => (action) => {
  Queue.unsafeOffer(actionQueue, action) // This should be present
  return next(action)
}
```

#### 3. Saga Tests Timing Out

**Problem:** Tests fail with timeout errors

**Solution:**
```typescript
// Increase timeout for complex tests
yield* ctx.waitFor(predicate, 10000) // 10 seconds

// Or check if saga is actually running
yield* Effect.log('Saga started') // Add logging
yield* ctx.runSaga(mySaga)
yield* Effect.sleep(Duration.millis(100)) // Give saga time to start
```

#### 4. DevTools Not Connecting

**Problem:** Redux DevTools not showing in browser

**Solution:**
```typescript
// Check DevTools configuration
const config = {
  enableDevTools: process.env.NODE_ENV === 'development',
  devToolsOptions: {
    trace: true,
    traceLimit: 25,
  }
}

// For remote DevTools, ensure server is running
// remotedev --hostname=localhost --port=8000
```

#### 5. Type Errors with Effect

**Problem:** TypeScript errors with Effect types

**Solution:**
```typescript
// Ensure proper Effect imports
import { Effect, pipe } from 'effect'

// Use proper typing for saga tests
const test: Effect.Effect<void, never, StoreService> =
  runSagaTest('test', (ctx) => /* ... */)

// Provide correct context types
const program = Effect.gen(function* () {
  const store = yield* StoreService // This should be typed correctly
})
```

### Debugging Techniques

#### 1. Action Logging

```typescript
// Enable debug logging
const config = {
  debug: true, // Enables action logging
  enableLogging: true,
}

// Manual action logging
yield* Effect.log(`Action dispatched: ${action.type}`)
```

#### 2. State Inspection

```typescript
// Use debug utilities
dummyFront.debug.logState()
dummyFront.debug.logAccounts()
dummyFront.debug.logDialogs()

// In tests
const state = yield* ctx.getState()
console.log('Current state:', JSON.stringify(state, null, 2))
```

#### 3. Stream Monitoring

```typescript
// Monitor action stream
const monitor = pipe(
  stream,
  Stream.tap(action => Effect.log(`Stream: ${action.type}`)),
  Stream.runDrain
)

yield* Effect.fork(monitor)
```

#### 4. Browser DevTools

```typescript
// Run in headed mode for debugging
// HEADED=true yarn test:browser

// Access global utilities in browser console
window.dummyFront.debug.logState()
window.dummyFront.getState()
window.dummyFront.dispatch({ type: 'test/action' })
```

### Performance Tips

#### 1. Reduce Action Overhead

```typescript
// Batch actions when possible
const batchActions = [action1, action2, action3]
for (const action of batchActions) {
  store.dispatch(action)
  // Small delay to prevent overwhelming
  yield* Effect.sleep(Duration.millis(5))
}
```

#### 2. Optimize Stream Processing

```typescript
// Use takeWhile instead of infinite streams
yield* pipe(
  stream,
  Stream.takeWhile(action => action.type !== 'stop'),
  Stream.runForEach(processAction)
)
```

#### 3. Memory Management

```typescript
// Clear scenario builders after use
builder.clear()

// Dispose stores in tests
yield* Effect.addFinalizer(() =>
  Effect.promise(() => store.dispose())
)
```

## Examples Directory

The package includes comprehensive examples in `src/examples/`:

### Available Examples

#### 1. `dialog-saga.test.ts`
- **Purpose**: Demonstrates dialog management with AI assessment chains
- **Features**: Message flow testing, operator alerts, async event coordination
- **Run**: `yarn test src/examples/dialog-saga.test.ts`

#### 2. `account-saga.test.ts`
- **Purpose**: Account connection and authentication testing
- **Features**: Connection status management, proxy handling, error scenarios
- **Run**: `yarn test src/examples/account-saga.test.ts`

#### 3. Browser Examples (`src/tests/`)
- **Purpose**: Full browser testing with Playwright
- **Features**: DevTools integration, global utilities testing
- **Run**: `yarn test:browser`

### How to Run Examples

```bash
# Run all examples
yarn test

# Run specific example
yarn test src/examples/dialog-saga.test.ts

# Run browser examples
yarn test:browser

# Run examples in watch mode
yarn test:watch
```

### Learning Path

1. **Start with Simple Examples**: Begin with `account-saga.test.ts` to understand basic patterns
2. **Progress to Complex Flows**: Move to `dialog-saga.test.ts` for advanced async patterns
3. **Browser Integration**: Explore browser tests for full-stack scenarios
4. **Custom Scenarios**: Build your own scenarios using `ScenarioBuilder`
5. **Advanced Patterns**: Study effect builders and saga coordination

## Future Enhancements

### Planned Features

#### 1. Enhanced DevTools Integration
- [ ] Time-travel debugging with saga replay
- [ ] Action diffing and comparison tools
- [ ] Performance profiling for saga execution
- [ ] Visual action flow diagrams

#### 2. Advanced Testing Utilities
- [ ] Snapshot testing for complex state
- [ ] Property-based testing integration
- [ ] Visual regression testing for DevTools
- [ ] Load testing utilities for high-volume scenarios

#### 3. Improved Documentation
- [ ] Interactive examples with live coding
- [ ] Video tutorials for complex patterns
- [ ] Migration guides from other testing frameworks
- [ ] Best practices cookbook

#### 4. Extended Browser Support
- [ ] Mobile browser testing
- [ ] Accessibility testing integration
- [ ] Cross-platform compatibility testing
- [ ] Automated visual testing

#### 5. Performance Optimizations
- [ ] Lazy loading for large scenarios
- [ ] Streaming optimizations for high-frequency actions
- [ ] Memory usage optimization
- [ ] Parallel test execution improvements

### Contributing Guidelines

We welcome contributions to the dummy-front package! Here's how to get started:

#### Setting Up Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd dummy-front

# Install dependencies
yarn install

# Run tests to ensure everything works
yarn test
```

#### Development Workflow

1. **Create Feature Branch**: `git checkout -b feature/your-feature-name`
2. **Write Tests**: Add tests for new functionality
3. **Implement Feature**: Write the implementation
4. **Run Tests**: Ensure all tests pass (`yarn test`)
5. **Type Check**: Verify TypeScript types (`yarn typecheck`)
6. **Lint Code**: Fix any linting issues (`yarn lint:fix`)
7. **Submit PR**: Create a pull request with clear description

#### Code Standards

- Follow existing TypeScript patterns
- Use Effect-TS for all async operations
- Include comprehensive tests for new features
- Document public APIs with JSDoc comments
- Follow existing naming conventions

#### Areas for Contribution

- **New Saga Patterns**: Additional saga testing utilities
- **Browser Testing**: Enhanced Playwright integration
- **Documentation**: Examples and tutorials
- **Performance**: Optimization improvements
- **DevTools**: Enhanced debugging features

### Roadmap

#### Q1 2024
- [ ] Enhanced DevTools integration
- [ ] Performance profiling tools
- [ ] Advanced scenario patterns

#### Q2 2024
- [ ] Visual testing utilities
- [ ] Mobile browser support
- [ ] Accessibility testing integration

#### Q3 2024
- [ ] Load testing capabilities
- [ ] Advanced debugging tools
- [ ] Cross-platform testing

#### Q4 2024
- [ ] AI-powered test generation
- [ ] Interactive documentation
- [ ] Performance optimization suite

---

## Support and Community

### Getting Help

- **Documentation**: This README and inline code comments
- **Examples**: Comprehensive examples in `src/examples/`
- **Issues**: GitHub issues for bugs and feature requests
- **Discussions**: GitHub discussions for questions and ideas

### Best Practices

1. **Start Simple**: Begin with basic scenarios before complex ones
2. **Test Early**: Write tests as you develop features
3. **Use TypeScript**: Leverage full type safety
4. **Monitor Performance**: Use debugging tools to optimize
5. **Share Patterns**: Contribute useful patterns back to the community

### License

This package is part of the larger project and follows the same licensing terms.

---

**Happy Testing with Effect-TS and Redux!** 🚀