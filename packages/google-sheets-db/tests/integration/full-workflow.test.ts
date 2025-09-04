import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import { createRepository, SheetsLayer } from '../../src/index.js'
import { ComplexUserSchema, type ComplexUser } from '../fixtures/test-data.js'
import { MockGoogleSpreadsheet, MockGoogleSpreadsheetWorksheet } from '../mocks/MockGoogleSpreadsheet.js'
import { SheetsService } from '../../src/services/SheetsService.js'
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to read private key, fallback to mock key if not found
let privateKey: string
let hasRealCredentials = false
try {
  // Navigate from current file to project root: ../../../../
  const projectRoot = path.resolve(__dirname, '../../../../');
  const keyPath = path.join(projectRoot, 'google-service_private_key.pem');
  privateKey = fs.readFileSync(keyPath, 'utf-8')
  hasRealCredentials = true
  console.log('✓ Found real Google Sheets credentials - will use real API')
} catch {
  privateKey = '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY_FOR_TESTING\n-----END PRIVATE KEY-----\n'
  console.log('⚠️  Using mock credentials - tests will use in-memory mocks')
}

const realSheetsConfig = {
  spreadsheetId: '1nJm6q238nL6xVUIsrYWcSZ7EtFizV3GBO_xy1kXlR28',
  credentials: {
    client_email: 'steam-ai-multichat@steam-ai-multichats.iam.gserviceaccount.com',
    private_key: privateKey
  }
}

test('Full workflow integration', async (t) => {
  const createSheetsLayer = () => {
    if (hasRealCredentials) {
      // Use real Google Sheets API
      console.log('🔗 Using REAL Google Sheets API')
      return SheetsLayer(realSheetsConfig)
    } else {
      // Use mock implementation
      console.log('🧪 Using Mock Google Sheets')
      const doc = new MockGoogleSpreadsheet('1nJm6q238nL6xVUIsrYWcSZ7EtFizV3GBO_xy1kXlR28')
    
      // Pre-authenticate and load info
      doc.useServiceAccountAuth({
        client_email: 'steam-ai-multichat@steam-ai-multichats.iam.gserviceaccount.com',
        private_key: privateKey
      })
      doc.loadInfo()
      
      // Add a sheet for complex users
      const sheet = new MockGoogleSpreadsheetWorksheet()
      doc.sheetsByTitle['ComplexUsers'] = sheet
      
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
          return s.getRows().then(rows => Effect.succeed(rows as any))
        }
      })
    }
  }
  
  await t.test('complete CRUD workflow with complex schema', async () => {
    const program = Effect.gen(function* () {
      const users = yield* createRepository(ComplexUserSchema, 'ComplexUsers')
      
      // 1. Create users with nested objects and arrays
      const admin = yield* users.create({
        email: 'admin@company.com',
        name: 'Admin User',
        age: 35,
        role: 'admin',
        settings: {
          theme: 'dark',
          notifications: true,
          language: 'en',
        },
        tags: ['power-user', 'beta-tester', 'vip'],
      })
      
      const regularUsers = yield* users.createMany([
        {
          email: 'john@company.com',
          name: 'John Developer',
          age: 28,
          role: 'user',
          settings: { theme: 'light', notifications: false, language: 'es' },
          tags: ['developer', 'frontend'],
        },
        {
          email: 'jane@company.com',
          name: 'Jane Manager',
          age: 32,
          role: 'moderator',
          settings: { theme: 'dark', notifications: true, language: 'fr' },
          tags: ['manager', 'team-lead'],
        },
      ])
      
      // 2. Query with complex conditions
      const darkThemeUsers = yield* users.findMany({
        $or: [
          { role: 'admin' },
          { age: { $gte: 30 } }
        ],
        $orderBy: 'name',
      })
      
      // 3. Update nested properties
      const updateCount = yield* users.update(
        { role: 'user' },
        { 
          role: 'moderator' as const,
          tags: ['promoted', 'moderator'],
        }
      )
      
      // 4. Find updated user
      const promotedUser = yield* users.findOne({ email: 'john@company.com' })
      
      // 5. Soft delete some users
      const deleteCount = yield* users.delete({ age: { $lt: 30 } })
      
      // 6. Count active vs all
      const activeCount = yield* users.count()
      const totalCount = yield* users.count({ $includeDeleted: true })
      
      // 7. Purge deleted
      const purgedCount = yield* users.purgeDeleted()
      
      // 8. Final count
      const finalCount = yield* users.count({ $includeDeleted: true })
      
      return {
        admin,
        regularUsers,
        darkThemeUsers,
        updateCount,
        promotedUser,
        deleteCount,
        activeCount,
        totalCount,
        purgedCount,
        finalCount,
      }
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(createSheetsLayer()))
    )
    
    // Verify admin creation with nested data
    assert.equal(result.admin.email, 'admin@company.com')
    assert.equal(result.admin.role, 'admin')
    assert.deepEqual(result.admin.settings, {
      theme: 'dark',
      notifications: true,
      language: 'en',
    })
    assert.deepEqual(result.admin.tags, ['power-user', 'beta-tester', 'vip'])
    
    // Verify bulk creation
    assert.equal(result.regularUsers.length, 2)
    
    // Verify complex query
    assert.equal(result.darkThemeUsers.length, 2) // Admin and Jane (age >= 30)
    
    // Verify update
    assert.equal(result.updateCount, 1) // John was updated
    if (Option.isSome(result.promotedUser)) {
      assert.equal(result.promotedUser.value.role, 'moderator')
      assert.deepEqual(result.promotedUser.value.tags, ['promoted', 'moderator'])
    }
    
    // Verify soft delete
    assert.equal(result.deleteCount, 1) // John (28) was deleted
    assert.equal(result.activeCount, 2) // Admin and Jane remain
    assert.equal(result.totalCount, 3) // All 3 still in database
    
    // Verify purge
    assert.equal(result.purgedCount, 1) // John was purged
    assert.equal(result.finalCount, 2) // Only Admin and Jane remain
  })
  
  await t.test('handles $regex queries on nested fields', async () => {
    const program = Effect.gen(function* () {
      const users = yield* createRepository(ComplexUserSchema, 'ComplexUsers')
      
      // Create test data
      yield* users.createMany([
        {
          email: 'test1@gmail.com',
          name: 'Gmail User 1',
          age: 25,
          role: 'user',
          settings: { theme: 'light', notifications: true, language: 'en' },
          tags: ['gmail'],
        },
        {
          email: 'test2@yahoo.com',
          name: 'Yahoo User',
          age: 30,
          role: 'user',
          settings: { theme: 'dark', notifications: false, language: 'es' },
          tags: ['yahoo'],
        },
        {
          email: 'test3@gmail.com',
          name: 'Gmail User 2',
          age: 35,
          role: 'admin',
          settings: { theme: 'light', notifications: true, language: 'en' },
          tags: ['gmail', 'admin'],
        },
      ])
      
      // Query with regex
      const gmailUsers = yield* users.findMany({
        email: { $regex: '@gmail\\.com$' }
      })
      
      const nameWithUser = yield* users.findMany({
        name: { $regex: 'User \\d' }
      })
      
      return { gmailUsers, nameWithUser }
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(createSheetsLayer()))
    )
    
    assert.equal(result.gmailUsers.length, 2)
    assert.ok(result.gmailUsers.every(u => u.email.endsWith('@gmail.com')))
    
    assert.equal(result.nameWithUser.length, 2) // "Gmail User 1" and "Gmail User 2" match "User \\d"
  })
  
  await t.test('sync refreshes cache from sheet', async () => {
    const program = Effect.gen(function* () {
      const users = yield* createRepository(ComplexUserSchema, 'ComplexUsers')
      
      // Create initial data
      yield* users.create({
        email: 'sync@example.com',
        name: 'Sync Test',
        age: 30,
        role: 'user',
        settings: { theme: 'light', notifications: true, language: 'en' },
        tags: ['test'],
      })
      
      const beforeSync = yield* users.count()
      
      // Simulate external modification (would normally be done outside)
      // In real scenario, another client modifies the sheet
      
      // Sync to refresh cache
      yield* users.sync()
      
      const afterSync = yield* users.count()
      
      return { beforeSync, afterSync }
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(createSheetsLayer()))
    )
    
    assert.equal(result.beforeSync, 1)
    assert.equal(result.afterSync, 1) // Count remains same after sync
  })
  
  await t.test('handles errors gracefully', async () => {
    const program = Effect.gen(function* () {
      // Create repository for non-existent sheet (should auto-create)
      const result = yield* createRepository(ComplexUserSchema, 'NonExistentSheet')
        .pipe(
          Effect.map(() => 'success'),
          Effect.catchTag('SheetError', (error) => 
            Effect.succeed(`error: ${error.reason}`)
          )
        )
      
      return result
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(createSheetsLayer()))
    )
    
    // Should succeed since sheets are auto-created by default
    assert.equal(result, 'success')
  })
  
  await t.test('pagination works correctly with complex queries', async () => {
    const program = Effect.gen(function* () {
      const users = yield* createRepository(ComplexUserSchema, 'ComplexUsers')
      
      // Create 10 users
      const usersData = Array.from({ length: 10 }, (_, i) => ({
        email: `user${i}@example.com`,
        name: `User ${String(i).padStart(2, '0')}`,
        age: 20 + i,
        role: i % 3 === 0 ? 'admin' as const : i % 2 === 0 ? 'moderator' as const : 'user' as const,
        settings: {
          theme: i % 2 === 0 ? 'dark' as const : 'light' as const,
          notifications: i % 2 === 0,
          language: 'en',
        },
        tags: [`tag${i}`],
      }))
      
      yield* users.createMany(usersData)
      
      // Get first page
      const page1 = yield* users.findMany({
        $orderBy: 'age',
        $order: 'asc',
        $limit: 3,
        $offset: 0,
      })
      
      // Get second page
      const page2 = yield* users.findMany({
        $orderBy: 'age',
        $order: 'asc',
        $limit: 3,
        $offset: 3,
      })
      
      // Get with complex filter and pagination
      const filtered = yield* users.findMany({
        role: { $in: ['admin', 'moderator'] },
        $orderBy: 'name',
        $limit: 2,
      })
      
      return { page1, page2, filtered }
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(createSheetsLayer()))
    )
    
    // Verify pagination
    assert.equal(result.page1.length, 3)
    assert.equal(result.page1[0]?.age, 20)
    assert.equal(result.page1[1]?.age, 21)
    assert.equal(result.page1[2]?.age, 22)
    
    assert.equal(result.page2.length, 3)
    assert.equal(result.page2[0]?.age, 23)
    assert.equal(result.page2[1]?.age, 24)
    assert.equal(result.page2[2]?.age, 25)
    
    // Verify filtered pagination
    assert.equal(result.filtered.length, 2)
    assert.ok(result.filtered.every(u => 
      u.role === 'admin' || u.role === 'moderator'
    ))
  })
})
