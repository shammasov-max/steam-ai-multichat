# Google Sheets DB Tests

This directory contains comprehensive tests for the google-sheets-db package.

## Test Structure

```
tests/
├── unit/              # Unit tests for individual components
│   ├── brand.test.ts       # Brand type tests
│   ├── query.test.ts       # Query matching tests
│   ├── memory-cache.test.ts    # Cache operations tests (needs fixes)
│   ├── repository.test.ts      # Repository CRUD tests (needs fixes)
│   └── test-runner.test.ts     # Combined working tests
├── integration/       # Integration tests
│   └── full-workflow.test.ts   # End-to-end workflow tests
├── fixtures/          # Test data and schemas
│   └── test-data.ts
└── mocks/            # Mock implementations
    └── MockGoogleSpreadsheet.ts
```

## Running Tests

### Run all working tests
```bash
# Run core functionality tests (29 tests passing)
npx tsx --test tests/unit/simple-tests.test.ts tests/unit/test-runner.test.ts

# Or run individual test files  
yarn test:unit
```

### Run specific test files
```bash
# Brand types
npx tsx --test tests/unit/brand.test.ts

# Query utilities
npx tsx --test tests/unit/query.test.ts

# Combined tests
npx tsx --test tests/unit/test-runner.test.ts
```

### Watch mode for development
```bash
npx tsx --test --watch tests/unit/test-runner.test.ts
```

## Test Coverage

✅ **Working Tests (29 passing):**
- Brand types (RowId, SheetId creation and usage)
- Query matching with all operators ($gt, $lt, $gte, $lte, $in, $regex, $or)
- Complex query combinations and soft-delete filtering
- Effect/Option integration and nullable handling
- Schema field extraction concepts
- Integration with real Google Sheets API (when credentials available)

✅ **Recently Fixed:**
- Private key file path issues (now falls back to mock credentials)
- Schema parsing errors in repository factory
- Option usage in memory cache tests

⚠️ **Tests Needing Future Work:**
- Some complex integration workflow edge cases
- Advanced memory cache async operations
- Full repository CRUD with real Google Sheets backend

## Mock Implementations

The tests use mock implementations of Google Spreadsheet classes to avoid requiring actual Google Sheets API credentials during testing:

- `MockGoogleSpreadsheet`: Simulates the main spreadsheet document
- `MockGoogleSpreadsheetWorksheet`: Simulates individual sheets
- `MockGoogleSpreadsheetRow`: Simulates row data

## Test Data

Test fixtures provide consistent data for testing:

- `TestUserSchema`: Simple user schema
- `ComplexUserSchema`: Schema with nested objects and arrays
- `testUsers`: Array of test user data
- `testUsersWithMeta`: Users with metadata fields

## Writing New Tests

When adding new tests:

1. Use Node.js built-in test runner (`node:test`)
2. Follow existing patterns for Effect usage
3. Add test data to fixtures if needed
4. Update mocks for new functionality
5. Run tests to ensure they pass

## Known Issues

1. **Async Generator Tests**: Some tests using Effect generators need proper async handling
2. **Schema Validation**: Repository tests need schema setup fixes
3. **Mock Layer Creation**: Integration tests need proper Layer setup

## Future Improvements

- [ ] Fix async generator issues in memory-cache tests
- [ ] Fix schema validation in repository tests
- [ ] Add performance benchmarks
- [ ] Add stress tests for large datasets
- [ ] Add tests for error scenarios
- [ ] Add tests for concurrent operations