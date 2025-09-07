import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import * as Ref from 'effect/Ref'
import * as HashMap from 'effect/HashMap'
import { MemoryCache } from '../../src/cache/MemoryCache.js'
import { MockGoogleSpreadsheet, MockGoogleSpreadsheetWorksheet } from '../mocks/MockGoogleSpreadsheet.js'
import { makeRowId, type RowId } from '../../src/types/brand.js'
import type { WithMeta } from '../../src/types/metadata.js'
import { TestUserSchema, testUsersWithMeta } from '../fixtures/test-data.js'
test('MemoryCache', async (t) => {
  const setup = () => {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    const doc = new MockGoogleSpreadsheet(spreadsheetId)
    const sheet = new MockGoogleSpreadsheetWorksheet()
    const sheetName = process.env.GOOGLE_SHEETS_TEST_SHEET_NAME
    doc.sheetsByTitle[sheetName] = sheet
    
    // Add some initial rows to the sheet
    const rows = testUsersWithMeta.map((user, index) => ({
      _id: user._id,
      email: user.email,
      name: user.name,
      age: String(user.age),
      active: String(user.active),
      _createdAt: user._createdAt,
      _updatedAt: user._updatedAt,
      _deleted: String(user._deleted || false),
    }))
    
    rows.forEach(row => sheet.addRow(row))
    
    const initialCache = HashMap.fromIterable(
      testUsersWithMeta.map(user => [makeRowId(user._id), user as WithMeta<any>])
    )
    
    return Effect.gen(function* () {
      const cacheRef = yield* Ref.make(initialCache)
      const cache = new MemoryCache(
        cacheRef,
        sheetName,
        doc as any
      )
      return { cache, sheet, doc }
    })
  }
  
  await t.test('get retrieves item by ID', async () => {
    const program = Effect.gen(function* () {
      const { cache } = yield* setup()
      const rowId = makeRowId('test-id-0')
      const result = yield* cache.get(rowId)
      
      return result
    })
    
    const result = await Effect.runPromise(program)
    assert.ok(Option.isSome(result))
    if (Option.isSome(result)) {
      assert.equal(result.value.name, 'John Doe')
    }
  })
  
  await t.test('get returns None for non-existent ID', async () => {
    const program = Effect.gen(function* () {
      const { cache } = yield* setup()
      const rowId = makeRowId('non-existent')
      const result = yield* cache.get(rowId)
      
      return result
    })
    
    const result = await Effect.runPromise(program)
    assert.ok(Option.isNone(result))
  })
  
  await t.test('getAll retrieves all items', async () => {
    const program = Effect.gen(function* () {
      const { cache } = yield* setup()
      const result = yield* cache.getAll()
      
      return result
    })
    
    const result = await Effect.runPromise(program)
    assert.equal(result.length, 5)
    assert.ok(result.some(u => u.name === 'John Doe'))
  })
  
  await t.test('set updates existing item in cache and sheet', async () => {
    const program = Effect.gen(function* () {
      const { cache, sheet } = yield* setup()
      const rowId = makeRowId('test-id-0')
      
      const updatedUser = {
        ...testUsersWithMeta[0]!,
        name: 'John Updated',
        age: 31,
      }
      
      yield* cache.set(rowId, updatedUser as WithMeta<any>)
      
      // Check cache was updated
      const fromCache = yield* cache.get(rowId)
      
      // Check sheet was updated
      const rows = yield* Effect.tryPromise(() => sheet.getRows())
      const sheetRow = rows.find(r => r.get('_id') === 'test-id-0')
      
      return { fromCache, sheetRow }
    })
    
    const result = await Effect.runPromise(program)
    
    if (Option.isSome(result.fromCache)) {
      assert.equal(result.fromCache.value.name, 'John Updated')
      assert.equal(result.fromCache.value.age, 31)
    }
    
    assert.equal(result.sheetRow?.get('name'), 'John Updated')
    assert.equal(result.sheetRow?.get('age'), '31')
  })
  
  await t.test('set adds new item to cache and sheet', async () => {
    const program = Effect.gen(function* () {
      const { cache, sheet } = yield* setup()
      const newId = makeRowId('new-user-id')
      
      const newUser = {
        _id: 'new-user-id',
        email: 'new@example.com',
        name: 'New User',
        age: 40,
        active: true,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      }
      
      yield* cache.set(newId, newUser as WithMeta<any>)
      
      // Check cache was updated
      const fromCache = yield* cache.get(newId)
      
      // Check sheet was updated
      const rows = yield* Effect.tryPromise(() => sheet.getRows())
      const sheetRow = rows.find(r => r.get('_id') === 'new-user-id')
      
      return { fromCache, sheetRow, totalRows: rows.length }
    })
    
    const result = await Effect.runPromise(program)
    
    if (Option.isSome(result.fromCache)) {
      assert.equal(result.fromCache.value.name, 'New User')
      assert.equal(result.fromCache.value.age, 40)
    }
    
    assert.ok(result.sheetRow)
    assert.equal(result.sheetRow?.get('name'), 'New User')
    assert.equal(result.totalRows, 6) // 5 original + 1 new
  })
  
  await t.test('remove deletes item from cache', async () => {
    const program = Effect.gen(function* () {
      const { cache } = yield* setup()
      const rowId = makeRowId('test-id-0')
      
      // Verify item exists
      const before = yield* cache.get(rowId)
      
      // Remove item
      yield* cache.remove(rowId)
      
      // Verify item is gone
      const after = yield* cache.get(rowId)
      
      return { before, after }
    })
    
    const result = await Effect.runPromise(program)
    assert.ok(Option.isSome(result.before))
    assert.ok(Option.isNone(result.after))
  })
  
  await t.test('bulkSet adds multiple items efficiently', async () => {
    const program = Effect.gen(function* () {
      const { cache, sheet } = yield* setup()
      
      const newUsers = [
        {
          _id: 'bulk-1',
          email: 'bulk1@example.com',
          name: 'Bulk User 1',
          age: 20,
          active: true,
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
        },
        {
          _id: 'bulk-2',
          email: 'bulk2@example.com',
          name: 'Bulk User 2',
          age: 21,
          active: true,
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
        },
      ]
      
      yield* cache.bulkSet(newUsers as WithMeta<any>[])
      
      // Check cache was updated
      const user1 = yield* cache.get(makeRowId('bulk-1'))
      const user2 = yield* cache.get(makeRowId('bulk-2'))
      
      // Check sheet was updated
      const rows = yield* Effect.tryPromise(() => sheet.getRows())
      
      return { user1, user2, totalRows: rows.length }
    })
    
    const result = await Effect.runPromise(program)
    
    if (Option.isSome(result.user1)) {
      assert.equal(result.user1.value.name, 'Bulk User 1')
    }
    if (Option.isSome(result.user2)) {
      assert.equal(result.user2.value.name, 'Bulk User 2')
    }
    
    assert.equal(result.totalRows, 7) // 5 original + 2 new
  })
  
  await t.test('query filters items with predicate', async () => {
    const program = Effect.gen(function* () {
      const { cache } = yield* setup()
      
      const activeUsers = yield* cache.query(item => item.active === true)
      const olderUsers = yield* cache.query(item => item.age > 30)
      const nameStartsWithJ = yield* cache.query(item => 
        item.name.startsWith('J')
      )
      
      return { activeUsers, olderUsers, nameStartsWithJ }
    })
    
    const result = await Effect.runPromise(program)
    
    assert.equal(result.activeUsers.length, 3) // John, Jane, Alice
    assert.equal(result.olderUsers.length, 2) // Bob (35), Charlie (45)
    assert.equal(result.nameStartsWithJ.length, 2) // John, Jane
  })
  
  await t.test('fromRow deserializes JSON fields correctly', async () => {
    const program = Effect.gen(function* () {
      const { cache } = yield* setup()
      
      // Create a row with JSON data
      const mockRow = {
        toObject: () => ({
          _id: 'json-test',
          email: 'json@example.com',
          name: 'JSON User',
          age: '30',
          active: 'true',
          settings: '{"theme":"dark","notifications":true}',
          tags: '["tag1","tag2"]',
          _createdAt: '2024-01-01T00:00:00.000Z',
          _updatedAt: '2024-01-01T00:00:00.000Z',
          _deleted: 'false',
        })
      }
      
      const result = cache.fromRow(TestUserSchema)(mockRow as any)
      
      return result
    })
    
    const result = await Effect.runPromise(program)
    
    assert.equal(result.email, 'json@example.com')
    assert.equal(result.age, '30')
    assert.deepEqual(result.settings, { theme: 'dark', notifications: true })
    assert.deepEqual(result.tags, ['tag1', 'tag2'])
    assert.equal(result._deleted, false)
  })
})
