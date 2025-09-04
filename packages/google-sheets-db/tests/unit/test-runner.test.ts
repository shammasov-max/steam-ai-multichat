/**
 * Combined test runner for all google-sheets-db tests
 * Run with: npx tsx --test tests/unit/test-runner.test.ts
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import { makeRowId, makeSheetId } from '../../src/types/brand.js'
import { matchQuery } from '../../src/utils/query.js'
import { testUsersWithMeta } from '../fixtures/test-data.js'
import type { WithMeta } from '../../src/types/metadata.js'

test('google-sheets-db', async (t) => {
  await t.test('Brand types', async (t2) => {
    await t2.test('creates branded IDs', () => {
      const rowId = makeRowId('test-row-id')
      const sheetId = makeSheetId('test-sheet-id')
      
      assert.equal(rowId, 'test-row-id')
      assert.equal(sheetId, 'test-sheet-id')
    })
    
    await t2.test('maintains string behavior', () => {
      const rowId = makeRowId('row-123')
      assert.equal(rowId.length, 7)
      assert.ok(rowId.startsWith('row'))
    })
  })
  
  await t.test('Query matching', async (t2) => {
    const users = testUsersWithMeta as WithMeta<any>[]
    
    await t2.test('exact value matching', () => {
      const query = { name: 'John Doe' }
      const matches = users.filter(u => matchQuery(u, query))
      assert.equal(matches.length, 1)
      assert.equal(matches[0]?.name, 'John Doe')
    })
    
    await t2.test('comparison operators', () => {
      const gtQuery = { age: { $gt: 30 } }
      const gtMatches = users.filter(u => matchQuery(u, gtQuery))
      assert.equal(gtMatches.length, 2) // Bob (35) and Charlie (45)
      
      const lteQuery = { age: { $lte: 30 } }
      const lteMatches = users.filter(u => matchQuery(u, lteQuery))
      assert.equal(lteMatches.length, 3) // John (30), Jane (25), Alice (28)
    })
    
    await t2.test('$in operator', () => {
      const query = { name: { $in: ['John Doe', 'Jane Smith'] } }
      const matches = users.filter(u => matchQuery(u, query))
      assert.equal(matches.length, 2)
    })
    
    await t2.test('$regex operator', () => {
      const query = { email: { $regex: '^j.*@example\\.com$' } }
      const matches = users.filter(u => matchQuery(u, query))
      assert.equal(matches.length, 2) // john@ and jane@
      assert.ok(matches.every(u => u.email.startsWith('j')))
    })
    
    await t2.test('$or operator', () => {
      const query = {
        $or: [
          { age: { $gt: 35 } },
          { name: 'Jane Smith' }
        ]
      }
      const matches = users.filter(u => matchQuery(u, query))
      assert.equal(matches.length, 2) // Charlie (45) and Jane
    })
    
    await t2.test('soft-delete handling', () => {
      const usersWithDeleted = [...users]
      usersWithDeleted[0] = { ...usersWithDeleted[0]!, _deleted: true }
      
      // Should exclude deleted by default
      const query1 = { age: { $gte: 25 } }
      const matches1 = usersWithDeleted.filter(u => matchQuery(u, query1))
      assert.equal(matches1.length, 4) // All except deleted John
      
      // Should include deleted when specified
      const query2 = { age: { $gte: 25 }, $includeDeleted: true }
      const matches2 = usersWithDeleted.filter(u => matchQuery(u, query2))
      assert.equal(matches2.length, 5) // All users including deleted
    })
  })
  
  await t.test('Integration smoke test', async () => {
    // Simple test to ensure imports work
    const someOption = Option.some(42)
    const noneOption = Option.none()
    
    assert.ok(Option.isSome(someOption))
    assert.ok(Option.isNone(noneOption))
    assert.equal(Option.getOrElse(someOption, () => 0), 42)
    assert.equal(Option.getOrElse(noneOption, () => 0), 0)
  })
})