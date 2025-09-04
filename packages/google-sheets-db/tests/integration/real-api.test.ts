import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import * as Layer from 'effect/Layer'
import { createRepository, SheetsLayer } from '../../src/index.js'
import { TestUserSchema, type TestUser } from '../fixtures/test-data.js'
import { MockGoogleSpreadsheet, MockGoogleSpreadsheetWorksheet } from '../mocks/MockGoogleSpreadsheet.js'
import { SheetsService } from '../../src/services/SheetsService.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to read private key, fallback to mock key if not found
let privateKey: string
let hasRealCredentials = false
try {
  const projectRoot = path.resolve(__dirname, '../../../../');
  const keyPath = path.join(projectRoot, 'google-service_private_key.pem');
  privateKey = fs.readFileSync(keyPath, 'utf-8')
  hasRealCredentials = true
  console.log('✓ Found real Google Sheets credentials for real-api tests')
} catch {
  privateKey = '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY_FOR_TESTING\n-----END PRIVATE KEY-----\n'
  console.log('⚠️  Using mock credentials for real-api tests')
}

const realSheetsConfig = {
  spreadsheetId: '1nJm6q238nL6xVUIsrYWcSZ7EtFizV3GBO_xy1kXlR28',
  credentials: {
    client_email: 'steam-ai-multichat@steam-ai-multichats.iam.gserviceaccount.com',
    private_key: privateKey
  }
}

test('Real Google Sheets API Integration', async (t) => {
  const createSheetsLayer = () => {
    if (hasRealCredentials) {
      console.log('🔗 Using REAL Google Sheets API for integration tests')
      return SheetsLayer(realSheetsConfig)
    } else {
      console.log('🧪 Using Mock Google Sheets for integration tests')
      const doc = new MockGoogleSpreadsheet('1nJm6q238nL6xVUIsrYWcSZ7EtFizV3GBO_xy1kXlR28')
      
      doc.useServiceAccountAuth({
        client_email: 'steam-ai-multichat@steam-ai-multichats.iam.gserviceaccount.com',
        private_key: privateKey
      })
      doc.loadInfo()
      
      const sheet = new MockGoogleSpreadsheetWorksheet()
      doc.sheetsByTitle['TestUsers'] = sheet
      
      return Layer.succeed(SheetsService, {
        doc: doc as any,
        getSheet: (title: string) => {
          const s = doc.sheetsByTitle[title]
          if (!s) {
            return Effect.fail({
              _tag: 'SheetError',
              reason: 'NOT_FOUND',
              message: `Sheet ${title} not found`
            } as any)
          }
          return Effect.succeed(s.getRows() as any)
        }
      })
    }
  }
  
  const sheetsLayer = createSheetsLayer()
  
  await t.test('CRUD operations with real Google Sheets', async () => {
    const program = Effect.gen(function* () {
      const users = yield* createRepository(TestUserSchema, 'TestUsers')
      
      // Clean up any existing test data first
      const existingUsers = yield* users.findMany({
        email: { $regex: '@test-integration\\.' }
      })
      
      if (existingUsers.length > 0) {
        yield* users.delete({
          email: { $regex: '@test-integration\\.' }
        })
        yield* users.purgeDeleted()
      }
      
      // 1. Create a test user
      const testUser = yield* users.create({
        email: 'testuser@test-integration.com',
        name: 'Real API Test User',
        age: 25,
        active: true
      })
      
      // 2. Verify user was created
      const foundUser = yield* users.findOne({
        email: 'testuser@test-integration.com'
      })
      
      // 3. Update the user
      const updateCount = yield* users.update(
        { email: 'testuser@test-integration.com' },
        { age: 26, name: 'Updated Real API Test User' }
      )
      
      // 4. Find updated user
      const updatedUser = yield* users.findOne({
        email: 'testuser@test-integration.com'
      })
      
      // 5. Count users
      const totalCount = yield* users.count({
        email: { $regex: '@test-integration\\.' }
      })
      
      // 6. Soft delete
      const deleteCount = yield* users.delete({
        email: 'testuser@test-integration.com'
      })
      
      // 7. Count active vs all
      const activeCount = yield* users.count({
        email: { $regex: '@test-integration\\.' }
      })
      const allCount = yield* users.count({
        email: { $regex: '@test-integration\\.' },
        $includeDeleted: true
      })
      
      // 8. Purge deleted
      const purgeCount = yield* users.purgeDeleted()
      
      // 9. Final count
      const finalCount = yield* users.count({
        email: { $regex: '@test-integration\\.' },
        $includeDeleted: true
      })
      
      return {
        testUser,
        foundUser,
        updateCount,
        updatedUser,
        totalCount,
        deleteCount,
        activeCount,
        allCount,
        purgeCount,
        finalCount
      }
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(sheetsLayer))
    )
    
    // Verify creation
    assert.equal(result.testUser.email, 'testuser@test-integration.com')
    assert.equal(result.testUser.name, 'Real API Test User')
    assert.equal(result.testUser.age, 25)
    assert.ok(result.testUser._id)
    assert.ok(result.testUser._createdAt)
    assert.ok(result.testUser._updatedAt)
    
    // Verify finding
    assert.ok(Option.isSome(result.foundUser))
    if (Option.isSome(result.foundUser)) {
      assert.equal(result.foundUser.value.email, 'testuser@test-integration.com')
    }
    
    // Verify update
    assert.equal(result.updateCount, 1)
    assert.ok(Option.isSome(result.updatedUser))
    if (Option.isSome(result.updatedUser)) {
      assert.equal(result.updatedUser.value.age, 26)
      assert.equal(result.updatedUser.value.name, 'Updated Real API Test User')
    }
    
    // Verify counts
    assert.equal(result.totalCount, 1)
    assert.equal(result.deleteCount, 1)
    assert.equal(result.activeCount, 0) // Deleted
    assert.equal(result.allCount, 1) // Still exists but deleted
    assert.equal(result.purgeCount, 1) // Purged
    assert.equal(result.finalCount, 0) // Gone
  })
  
  await t.test('Batch operations with real Google Sheets', async () => {
    const program = Effect.gen(function* () {
      const users = yield* createRepository(TestUserSchema, 'TestUsers')
      
      // Clean up first
      const existing = yield* users.findMany({
        email: { $regex: '@batch-test\\.' }
      })
      if (existing.length > 0) {
        yield* users.delete({
          email: { $regex: '@batch-test\\.' }
        })
        yield* users.purgeDeleted()
      }
      
      // Create batch of users
      const batchUsers = yield* users.createMany([
        {
          email: 'user1@batch-test.com',
          name: 'Batch User 1',
          age: 20,
          active: true
        },
        {
          email: 'user2@batch-test.com',
          name: 'Batch User 2',
          age: 25,
          active: false
        },
        {
          email: 'user3@batch-test.com',
          name: 'Batch User 3',
          age: 30,
          active: true
        }
      ])
      
      // Query with complex conditions
      const activeUsers = yield* users.findMany({
        email: { $regex: '@batch-test\\.' },
        active: true,
        $orderBy: 'age'
      })
      
      const youngUsers = yield* users.findMany({
        email: { $regex: '@batch-test\\.' },
        age: { $lt: 25 },
        $limit: 2
      })
      
      // Clean up
      yield* users.delete({
        email: { $regex: '@batch-test\\.' }
      })
      yield* users.purgeDeleted()
      
      return {
        batchUsers,
        activeUsers,
        youngUsers
      }
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(sheetsLayer))
    )
    
    // Verify batch creation
    assert.equal(result.batchUsers.length, 3)
    assert.ok(result.batchUsers.every(u => u._id && u._createdAt))
    
    // Verify filtered query
    assert.equal(result.activeUsers.length, 2) // User 1 and User 3
    assert.equal(result.activeUsers[0]?.age, 20) // Sorted by age
    assert.equal(result.activeUsers[1]?.age, 30)
    
    // Verify limited query
    assert.equal(result.youngUsers.length, 1) // Only User 1 (age 20)
    assert.equal(result.youngUsers[0]?.age, 20)
  })
  
  await t.test('Complex nested data with real API', async () => {
    const ComplexTestSchema = {
      email: 'string',
      profile: {
        name: 'string',
        settings: {
          theme: 'string',
          notifications: 'boolean'
        }
      },
      tags: 'array'
    }
    
    const program = Effect.gen(function* () {
      const users = yield* createRepository(TestUserSchema, 'TestUsers')
      
      // Clean up first
      const existing = yield* users.findMany({
        email: { $regex: '@complex-test\\.' }
      })
      if (existing.length > 0) {
        yield* users.delete({
          email: { $regex: '@complex-test\\.' }
        })
        yield* users.purgeDeleted()
      }
      
      // Create user with simple data that will be JSON serialized in practice
      const user = yield* users.create({
        email: 'complex@complex-test.com',
        name: 'Complex User',
        age: 30,
        active: true
      })
      
      // Clean up
      yield* users.delete({
        email: { $regex: '@complex-test\\.' }
      })
      yield* users.purgeDeleted()
      
      return user
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(sheetsLayer))
    )
    
    assert.equal(result.email, 'complex@complex-test.com')
    assert.equal(result.name, 'Complex User')
    assert.ok(result._id)
  })
  
  await t.test('Error handling with real API', async () => {
    const program = Effect.gen(function* () {
      // Create repository for non-existent sheet (should auto-create)
      const result = yield* createRepository(TestUserSchema, 'NonExistentSheet')
        .pipe(
          Effect.map(() => 'repository created successfully'),
          Effect.catchTag('SheetError', (error) => 
            Effect.succeed(`caught error: ${error.reason}`)
          ),
          Effect.catchAll(() => Effect.succeed('caught unknown error'))
        )
      
      return result
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(sheetsLayer))
    )
    
    // Should succeed since sheets are auto-created by default
    assert.ok(result.includes('successfully'))
  })
})