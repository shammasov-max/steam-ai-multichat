# Steam Multichat Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the Steam Multichat application, covering unit tests, integration tests, E2E tests, and specific AI agent testing.

## Test Structure

```
tests/
├── unit/                           # Unit tests for individual components
│   └── steam-session-manager.spec.ts
├── bot-integration.spec.ts         # Integration tests for bot operations
├── agent-ai.spec.ts                # AI agent behavior tests
├── bot-to-user-interaction.spec.ts # Real bot-user message exchange tests
├── e2e-flow.spec.ts               # End-to-end user flow tests
├── setup.ts                        # Test environment setup
└── fixtures.ts                     # Test data and helpers
```

## Test Categories

### 1. Unit Tests
Tests individual components in isolation with mocked dependencies.

**Coverage:**
- Steam session manager operations
- Round-robin task assignment
- Rate limiting logic
- Message queue handling
- Database operations

**Run:** `npm run test:unit`

### 2. Integration Tests
Tests the interaction between multiple components using real Steam credentials.

**Coverage:**
- Bot authentication with real maFiles
- Task creation and assignment workflow
- Friend request handling with rate limiting
- Chat message flow
- Data persistence
- Concurrent operations

**Run:** `npm run test:integration`

### 3. AI Agent Tests
Specifically tests the AI agent's behavior and responses.

**Coverage:**
- Scripted message generation
- Message personalization based on task details
- Agent enable/disable functionality
- Message timing and delays
- Error handling
- Concurrent chat handling

**Run:** `npm run test:integration` (includes agent tests)

### 4. Bot-to-User Interaction Tests
Tests real message exchanges between bots and users using separate maFiles.

**Coverage:**
- Full bot-user conversation with AI agent responses
- Multiple users interacting with same bot simultaneously
- User disabling/enabling agent mid-conversation
- Bot handling user spam gracefully
- Real Steam friend requests and acceptances
- Message delivery and persistence
- Personalized agent responses based on user's task

**Run:** `npm run test:integration` (includes interaction tests)

### 5. End-to-End Tests
Tests complete user workflows through the UI.

**Coverage:**
- Complete workflow: Add bot → Create task → Handle chat
- Bot management (add, connect, disconnect, remove)
- Task lifecycle (create, assign, dispose)
- Chat interactions with agent toggle
- Settings page functionality
- Responsive design
- Data persistence across navigation

**Run:** `npm run test:e2e`

## Test Data

### Real Credentials
Tests use real Steam credentials from `fixtures/all.txt`:
- Format: `username:password - proxyHost:proxyPort:proxyUser:proxyPass`
- Corresponding maFiles in `fixtures/mafile/`
- 10 test accounts available

### Test Database
- Separate test database: `prisma/test.db`
- Automatically created/cleaned before tests
- Seeded with default settings

## Running Tests

### Prerequisites
1. Install dependencies: `npm install`
2. Set up test environment: `npm run test:setup`
3. Ensure test accounts are available in `fixtures/`

### Commands

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:e2e           # End-to-end tests
npm run test:all          # All tests sequentially

# Debug and development
npm run test:debug        # Run with debugger
npm run test:ui          # Playwright UI mode
npm run test:report      # View test report
```

### Environment Variables
Create `.env.test` for test-specific configuration:
```env
DATABASE_URL="file:./prisma/test.db"
PORT=3001
NODE_ENV=test
CLEANUP_TEST_DB=false
TEST_TIMEOUT=180000
```

## Key Test Scenarios

### 1. Bot Connection Flow
```
1. Add bot with maFile and proxy
2. Connect bot
3. Verify status updates
4. Handle reconnection on failure
5. Clean disconnect
```

### 2. Task Assignment Flow
```
1. Create task with player Steam ID
2. Round-robin assignment to connected bot
3. Friend request with rate limiting (1/min)
4. Accept friend request
5. Open chat with agent
```

### 3. Agent Interaction Flow
```
1. Chat created with agent enabled
2. Agent sends 3-5 scripted messages
3. Messages personalized with task details
4. 4-second delay between messages
5. Task marked as resolved
```

### 4. Manual Operator Flow
```
1. Navigate to chat
2. Disable agent if needed
3. Send manual messages
4. View message history
5. Toggle agent back on
```

## Test Assertions

### Critical Assertions
- Bot connects within 30 seconds
- Rate limiting enforced (1 invite/minute per bot)
- Agent sends 3-5 messages when enabled
- Tasks transition through correct states
- Messages persist in database
- Concurrent operations don't conflict

### Performance Targets
- Bot connection: < 30s
- Task assignment: < 3s
- Message delivery: < 1s
- UI update via polling: < 2s
- Agent response time: 4s between messages

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:setup
      - run: npm run test:all
```

## Troubleshooting

### Common Issues

1. **Steam Authentication Failures**
   - Check maFile validity
   - Verify proxy connectivity
   - Check Steam Guard status

2. **Rate Limit Violations**
   - Ensure 60s between invites
   - Check system clock sync
   - Verify database timestamps

3. **Database Lock Errors**
   - Close other connections
   - Use test database only
   - Clean between test runs

4. **Timeout Errors**
   - Increase TEST_TIMEOUT
   - Check network connectivity
   - Verify proxy response time

### Debug Tools

```bash
# View detailed logs
DEBUG=* npm test

# Run single test
npx playwright test -g "bot connection"

# Interactive debugging
npm run test:debug

# Generate trace
npx playwright test --trace on
```

## Best Practices

1. **Test Isolation**
   - Each test should be independent
   - Clean database before each test
   - Don't rely on test order

2. **Real Data Usage**
   - Use actual maFiles for integration tests
   - Mock Steam API for unit tests
   - Rotate test accounts to avoid bans

3. **Assertion Quality**
   - Test behavior, not implementation
   - Verify user-visible outcomes
   - Check error scenarios

4. **Performance**
   - Run tests sequentially for Steam
   - Use single worker to avoid rate limits
   - Cache test data where possible

## Maintenance

### Regular Tasks
- Update test accounts monthly
- Rotate proxy configurations
- Review and update test assertions
- Monitor test execution times
- Update dependencies

### Adding New Tests
1. Identify test category (unit/integration/e2e)
2. Create test file in appropriate directory
3. Use existing helpers and fixtures
4. Document test purpose and assertions
5. Update this documentation

## Metrics

### Coverage Goals
- Unit tests: 80% code coverage
- Integration: All critical paths
- E2E: Main user workflows
- Agent: All script variations

### Success Criteria
- All tests pass on main branch
- < 3 minute total execution time
- Zero flaky tests
- Clear failure messages