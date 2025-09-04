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
  const setup = async () => {
    const doc = new MockGoogleSpreadsheet('test-sheet-id')
    const sheet = new MockGoogleSpreadsheetWorksheet()
    doc.sheetsByTitle['TestSheet'] = sheet
    
    // Add some initial rows to the sheet
    for (const user of testUsersWithMeta) {
      await sheet.addRow({
        _id: user._id,
        email: user.email,
        name: user.name,
        age: String(user.age),
        active: String(user.active),
        _createdAt: user._createdAt,
        _updatedAt: user._updatedAt,
        _deleted: String(user._deleted || false),
      })
    }
    
    const initialCache = HashMap.fromIterable(
      testUsersWithMeta.map(user => [makeRowId(user._id), user as WithMeta<any>])
    )
    
    const ref = await Effect.runPromise(Ref.make(initialCache))
    const rows = await sheet.getRows()
    const cache = new MemoryCache(ref, rows, 'TestSheet', doc as any)
    
    return { cache, sheet, doc }
  }
  
  await t.test('get retrieves item by ID', async () => {
    const { cache } = await setup()
    const rowId = makeRowId('test-id-0')
    const result = await Effect.runPromise(cache.get(rowId))
    
    assert.ok(Option.isSome(result))
    if (Option.isSome(result)) {
      assert.equal(result.value.name, 'John Doe')
    }
  })
  
  await t.test('get returns None for non-existent ID', async () => {
    const { cache } = await setup()
    const rowId = makeRowId('non-existent')
    const result = await Effect.runPromise(cache.get(rowId))
    
    assert.ok(Option.isNone(result))
  })
  
  await t.test('getAll retrieves all items', async () => {
    const { cache } = await setup()
    const result = await Effect.runPromise(cache.getAll())
    
    assert.equal(result.length, 5)
    assert.ok(result.some(u => u.name === 'John Doe'))
  })
  
  await t.test('set updates existing item in cache and sheet', async () => {
    const { cache, sheet } = await setup()
    const rowId = makeRowId('test-id-0')
    
    const updatedUser = {
      ...testUsersWithMeta[0]!,
      name: 'John Updated',
      age: 31,
    }
    
    await Effect.runPromise(cache.set(rowId, updatedUser as WithMeta<any>))
    
    // Check cache was updated
    const fromCache = await Effect.runPromise(cache.get(rowId))
    
    // Check sheet was updated
    const rows = await sheet.getRows()
    const sheetRow = rows.find(r => r.get('_id') === 'test-id-0')
    
    if (Option.isSome(fromCache)) {
      assert.equal(fromCache.value.name, 'John Updated')
      assert.equal(fromCache.value.age, 31)
    }
    
    assert.equal(sheetRow?.get('name'), 'John Updated')
    assert.equal(sheetRow?.get('age'), '31')
  })
  
  await t.test('set adds new item to cache and sheet', async () => {
    const { cache, sheet } = await setup()
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
    
    await Effect.runPromise(cache.set(newId, newUser as WithMeta<any>))
    
    // Check cache was updated
    const fromCache = await Effect.runPromise(cache.get(newId))
    
    // Check sheet was updated
    const rows = await sheet.getRows()
    const sheetRow = rows.find(r => r.get('_id') === 'new-user-id')
    
    if (Option.isSome(fromCache)) {
      assert.equal(fromCache.value.name, 'New User')
      assert.equal(fromCache.value.age, 40)
    }
    
    assert.ok(sheetRow)
    assert.equal(sheetRow?.get('name'), 'New User')
    assert.equal(rows.length, 6) // 5 original + 1 new
  })
  
  await t.test('remove deletes item from cache', async () => {
    const { cache } = await setup()
    const rowId = makeRowId('test-id-0')
    
    // Verify item exists
    const before = await Effect.runPromise(cache.get(rowId))
    
    // Remove item
    await Effect.runPromise(cache.remove(rowId))
    
    // Verify item is gone
    const after = await Effect.runPromise(cache.get(rowId))
    
    assert.ok(Option.isSome(before))
    assert.ok(Option.isNone(after))
  })
  
  await t.test('query filters items with predicate', async () => {
    const { cache } = await setup()
    
    const activeUsers = await Effect.runPromise(
      cache.query(item => item.active === true)
    )
    const olderUsers = await Effect.runPromise(
      cache.query(item => item.age > 30)
    )
    const nameStartsWithJ = await Effect.runPromise(
      cache.query(item => item.name.startsWith('J'))
    )
    
    assert.equal(activeUsers.length, 3) // John, Jane, Alice
    assert.equal(olderUsers.length, 2) // Bob (35), Charlie (45)
    assert.equal(nameStartsWithJ.length, 2) // John, Jane
  })
})