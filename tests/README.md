# Test Suite Documentation

This directory contains comprehensive integration and end-to-end tests for the Steam multichat automation system.

## Test Organization

### Test Categories

1. **API Tests** (`api-routes.spec.ts`) - Test all API endpoints
2. **Core Logic** (`app-core.spec.ts`) - Test business logic and services
3. **Integration** (`app-integration.spec.ts`) - Test component interactions
4. **UI Tests** (`app-ui.spec.ts`) - Test frontend components (when implemented)
5. **CRUD Operations** (`*-crud.spec.ts`) - Test data operations for entities
6. **End-to-End** (`e2e-full-flow.spec.ts`) - Complete workflow tests

### Test Structure

```
tests/
├── README.md                    # This documentation
├── setup.ts                     # Test environment setup
├── fixtures.ts                  # Test data and account fixtures
├── api-routes.spec.ts          # API endpoint tests
├── app-core.spec.ts            # Core business logic tests
├── app-integration.spec.ts     # Integration tests
├── app-ui.spec.ts              # UI component tests
├── bot-crud.spec.ts            # Bot entity CRUD tests
├── task-crud.spec.ts           # Task entity CRUD tests
├── chat-crud.spec.ts           # Chat entity CRUD tests
├── e2e-full-flow.spec.ts       # End-to-end workflow tests
└── utils/
    ├── api-helpers.ts          # API testing utilities
    ├── test-helpers.ts         # General test utilities
    └── steam-helpers.ts        # Steam-specific test utilities
```

## Running Tests

### Prerequisites

1. Start Docker containers:
   ```bash
   yarn ensure-docker
   ```

2. Start the development server:
   ```bash
   yarn dev
   ```

### Test Commands

```bash
# Run all tests
yarn test:integration

# Run specific test categories
yarn test:api           # API tests only
yarn test:core          # Core logic tests
yarn test:ui            # UI tests only
yarn test:e2e           # End-to-end tests

# Run individual test files
npx playwright test tests/api-routes.spec.ts
npx playwright test tests/e2e-full-flow.spec.ts

# Run with UI mode for debugging
npx playwright test --ui

# Run with specific browser/project
npx playwright test --project=unit
```

## Test Data and Fixtures

### Steam Test Accounts

The test suite uses real Steam accounts with:
- Valid maFiles (Steam Guard mobile authenticator)
- Dedicated sticky proxies
- Rate-limiting compliance (1 friend invite per minute per bot)

Account data is loaded from:
- `fixtures/all.txt` - Account credentials and proxy info
- `fixtures/mafile/*.maFile` - Steam Guard mobile authenticator files

### Test Data Management

- **Setup**: `setup.ts` handles database initialization and cleanup
- **Fixtures**: `fixtures.ts` provides helper functions for loading test accounts
- **Isolation**: Each test suite uses fresh database state
- **Cleanup**: Automatic cleanup after each test run

## Effect-TS Testing Patterns

### Service Testing
```typescript
import { Effect, Layer } from 'effect'
import { TestContext, TestClock, TestServices } from 'effect/Test'

const testLayer = Layer.mergeAll(
  TestServices.layer,
  MyService.test
)

Effect.runPromise(
  myTest.pipe(
    Effect.provide(testLayer)
  )
)
```

### Event-Driven Testing
```typescript
// Test event emission and handling
const testEvent = EventBuilder.build({
  type: 'bot/statusChanged',
  payload: { botId: 'bot_123', status: 'connected' },
  meta: { timestamp: Date.now() }
})

// Verify event is processed correctly
await store.dispatch(testEvent)
expect(store.getState().bots.entities['bot_123'].status).toBe('connected')
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Setup test environment
  run: |
    yarn ensure-docker
    yarn dev &
    sleep 10

- name: Run integration tests
  run: yarn test:integration
  env:
    CI: true
    NODE_ENV: test
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure dev server is running on port 3000
2. **Database Issues**: Check Docker containers and DATABASE_URL
3. **Steam Auth Failures**: Verify maFile validity and proxy connectivity
4. **Rate Limits**: Use different test accounts for parallel tests

### Debugging Tests

```bash
# Enable debug logging
DEBUG=* yarn test:integration

# Run single test with verbose output
npx playwright test tests/api-routes.spec.ts --reporter=line

# Use Playwright trace viewer
npx playwright test --trace=on
npx playwright show-trace trace.zip
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on others
2. **Cleanup**: Always clean up test data and connections
3. **Realistic Data**: Use actual Steam accounts for integration tests
4. **Rate Limiting**: Respect Steam's 1 invite/minute limit in tests
5. **Error Handling**: Test both success and failure scenarios
6. **Performance**: Keep test execution times reasonable

## Contributing

When adding new tests:

1. Follow the naming convention: `feature-action.spec.ts`
2. Add proper setup/teardown in each test suite
3. Use the utilities in `tests/utils/` for common operations
4. Document any special requirements or setup needed
5. Ensure tests pass in both local and CI environments