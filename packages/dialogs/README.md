# Dialog AI Service - Test Suite

This project contains a comprehensive test suite for the Dialog AI Service using Playwright framework. The tests are organized to run in parallel across different context windows for optimal efficiency.

## Test Architecture

### Context Window Organization

The test suite is designed to run in 5 parallel context windows:

#### Context Window 1: Core Services Unit Tests
- **Files**: `tests/unit/AIService.test.ts`, `tests/unit/LanguageDetector.test.ts`
- **Focus**: OpenAI integration, language detection algorithms
- **Coverage**: API communication, multi-language support, error handling

#### Context Window 2: Business Logic Tests
- **Files**: `tests/unit/ScoringEngine.test.ts`, `tests/unit/ContextCompressor.test.ts`
- **Focus**: Scoring algorithms, context compression logic
- **Coverage**: User engagement scoring, conversation summarization, memory management

#### Context Window 3: Integration & Database Tests
- **Files**: `tests/integration/DialogManager.test.ts`, `tests/database/prisma.test.ts`
- **Focus**: Full workflow integration, database operations
- **Coverage**: End-to-end dialog management, data persistence, relationship integrity

#### Context Window 4: API & E2E Tests
- **Files**: `tests/e2e/dialog-flow.test.ts`, `tests/api/endpoints.test.ts`
- **Focus**: Complete dialog lifecycle, API contract testing
- **Coverage**: Real conversation flows, multi-language dialogs, error scenarios

#### Context Window 5: Performance & Edge Cases
- **Files**: `tests/performance/load.test.ts`, `tests/edge-cases/error-handling.test.ts`
- **Focus**: Performance benchmarks, edge case handling
- **Coverage**: Load testing, memory usage, error recovery, boundary conditions

## Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key (for E2E tests)

### Install Dependencies
```bash
npm install
```

### Environment Setup
Create `.env.test` file:
```bash
DATABASE_URL="postgresql://test:test@localhost:5432/dialog_ai_test"
OPENAI_API_KEY="your-openai-api-key"
NODE_ENV="test"
LOG_LEVEL="silent"
```

### Database Setup
```bash
# Setup test database
npx prisma migrate reset --force --skip-seed
npx prisma generate
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run by Context Window
```bash
# Context Window 1: Core Services
npm run test:unit -- tests/unit/AIService.test.ts tests/unit/LanguageDetector.test.ts

# Context Window 2: Business Logic
npm run test:unit -- tests/unit/ScoringEngine.test.ts tests/unit/ContextCompressor.test.ts

# Context Window 3: Integration & Database
npm run test:integration

# Context Window 4: API & E2E
npm run test:e2e

# Context Window 5: Performance & Edge Cases
npm run test:performance
```

### Run Tests in Parallel (All Context Windows)
```bash
npm run test:parallel
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Debug Mode
```bash
npm run test:debug
```

## Test Categories

### Unit Tests
- **AIService**: OpenAI integration, response generation, error handling
- **LanguageDetector**: Multi-language detection, script recognition
- **ScoringEngine**: Conversation scoring, trend analysis, issue detection
- **ContextCompressor**: Message compression, fact extraction, multilingual support

### Integration Tests
- **DialogManager**: Complete dialog lifecycle with real dependencies
- **Database Operations**: Prisma model testing, relationship integrity

### End-to-End Tests
- **Dialog Flows**: Complete conversation scenarios in multiple languages
- **API Contracts**: Input validation, response structure, error handling

### Performance Tests
- **Load Testing**: Concurrent dialogs, message throughput
- **Memory Management**: Resource usage, memory leak detection
- **Scalability**: Burst traffic, production load simulation

### Edge Case Tests
- **Input Validation**: Malformed data, extreme values, special characters
- **Error Handling**: Database failures, AI service errors, network issues
- **Resource Constraints**: Memory pressure, rapid requests, configuration issues

## Test Features

### Multi-Language Support
Tests cover all supported languages:
- **Chinese (zh)**: Simplified Chinese text and cultural patterns
- **Japanese (ja)**: Hiragana, Katakana, and Kanji character sets
- **Korean (ko)**: Hangul script and honorific patterns
- **English (en)**: Standard Latin script with various dialects
- **Spanish (es)**: Latin script with Spanish-specific markers

### Mock Services
- **MockOpenAI**: Simulates OpenAI API responses for predictable testing
- **MockPrisma**: Database mocking for isolated unit tests
- **TestHelpers**: Utilities for data generation and test setup

### Performance Benchmarks
- Dialog creation: < 3 seconds per dialog
- Message processing: < 8 seconds average
- Concurrent operations: 15+ dialogs simultaneously
- Memory usage: < 500MB under load
- Context compression: Maintains performance with 30+ messages

### Test Data
- **Fixtures**: Pre-defined test scenarios and conversation flows
- **Generators**: Dynamic test data creation with realistic patterns
- **Multi-language**: Native language test cases for cultural accuracy

## Parallel Execution Benefits

### Speed Optimization
- **5x Faster**: Tests run simultaneously across context windows
- **Resource Efficiency**: Each window focuses on specific functionality
- **Isolation**: No test interference between windows

### Scalability
- **Independent Execution**: Context windows can run on different machines
- **Selective Testing**: Run specific windows based on changes
- **CI/CD Friendly**: Easy integration with build pipelines

### Maintainability
- **Clear Separation**: Logical grouping of related tests
- **Easy Debugging**: Isolated test failures
- **Modular Structure**: Add new test categories without conflicts

## Continuous Integration

### GitHub Actions Example
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test-context-1:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit -- tests/unit/AIService.test.ts tests/unit/LanguageDetector.test.ts

  test-context-2:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit -- tests/unit/ScoringEngine.test.ts tests/unit/ContextCompressor.test.ts

  # ... additional context windows
```

## Test Metrics

### Coverage Targets
- **Unit Tests**: 95%+ code coverage
- **Integration Tests**: 90%+ workflow coverage
- **E2E Tests**: 100% API contract coverage
- **Performance Tests**: Key metrics benchmarked

### Quality Gates
- All tests must pass before deployment
- Performance thresholds must be met
- Memory usage within acceptable limits
- Error handling verified for all scenarios

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Reset test database
npx prisma migrate reset --force --skip-seed
npx prisma generate
```

#### OpenAI API Rate Limits
- Use test API key with higher limits
- Implement exponential backoff in tests
- Mock AI responses for unit tests

#### Memory Issues
- Increase Node.js memory limit: `--max-old-space-size=4096`
- Clean up test data between runs
- Monitor memory usage during long test runs

#### Timeout Issues
- Adjust Playwright timeout settings
- Use faster AI model for testing (gpt-3.5-turbo)
- Optimize database queries in tests

### Debug Tips
1. Use `npm run test:debug` for step-by-step execution
2. Check test logs for detailed error information
3. Run individual test files to isolate issues
4. Verify environment variables are correctly set
5. Ensure database is accessible and properly configured

## Contributing

### Adding New Tests
1. Follow the context window organization
2. Use existing test patterns and helpers
3. Include both positive and negative test cases
4. Add performance benchmarks for new features
5. Update this README with new test categories

### Test Conventions
- Use descriptive test names
- Group related tests with `describe` blocks
- Include setup and teardown as needed
- Mock external dependencies appropriately
- Assert meaningful expectations

### Performance Considerations
- Keep test execution time reasonable
- Use appropriate timeout values
- Clean up resources after tests
- Monitor memory usage in performance tests
- Batch database operations when possible