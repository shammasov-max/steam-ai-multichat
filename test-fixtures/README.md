# Test Fixtures

Shared test data for all packages.

## Structure
```
test-fixtures/
├── accounts/       # Steam account test data
│   ├── all.txt
│   └── mafiles/
├── mocks/         # Mock data for unit tests
└── samples/       # Sample API responses, etc.
```

## Usage

From any test file:
```typescript
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixturesDir = join(__dirname, '../../../test-fixtures')
```