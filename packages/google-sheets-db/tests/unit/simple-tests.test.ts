/**
 * Simple test runner that focuses on core functionality without complex async setup
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import * as Option from 'effect/Option'
import { makeRowId, makeSheetId } from '../../src/types/brand.js'
import { matchQuery } from '../../src/utils/query.js'
import { testUsersWithMeta } from '../fixtures/test-data.js'
import type { WithMeta } from '../../src/types/metadata.js'

test('Google Sheets DB Core Tests', async (t) => {
  await t.test('Brand Types', async (st) => {
    await st.test('creates and uses branded IDs', () => {
      const rowId = makeRowId('test-row-123')
      const sheetId = makeSheetId('test-sheet-456')
      
      assert.equal(rowId, 'test-row-123')
      assert.equal(sheetId, 'test-sheet-456')
      
      // Can be used in collections
      const rowSet = new Set([rowId])
      assert.ok(rowSet.has(rowId))
      
      // Maintains string behavior
      assert.equal(rowId.length, 12)
      assert.ok(rowId.startsWith('test-row'))
    })
  })
  
  await t.test('Query Matching', async (st) => {
    const users = testUsersWithMeta as WithMeta<any>[]
    
    await st.test('basic field matching', () => {
      const johnQuery = { name: 'John Doe' }
      const matches = users.filter(u => matchQuery(u, johnQuery))
      assert.equal(matches.length, 1)
      assert.equal(matches[0]?.name, 'John Doe')
    })
    
    await st.test('numeric comparisons', () => {
      // Greater than
      const olderUsers = users.filter(u => matchQuery(u, { age: { $gt: 30 } }))
      assert.equal(olderUsers.length, 2) // Bob (35), Charlie (45)
      
      // Less than or equal
      const youngerUsers = users.filter(u => matchQuery(u, { age: { $lte: 30 } }))
      assert.equal(youngerUsers.length, 3) // John (30), Jane (25), Alice (28)
      
      // Range query
      const midAgeUsers = users.filter(u => matchQuery(u, { 
        age: { $gte: 25, $lt: 35 } 
      }))
      assert.equal(midAgeUsers.length, 3) // John (30), Jane (25), Alice (28)
    })
    
    await st.test('array membership with $in', () => {
      const specificUsers = users.filter(u => matchQuery(u, {
        name: { $in: ['John Doe', 'Jane Smith', 'Missing Person'] }
      }))
      assert.equal(specificUsers.length, 2) // John and Jane
    })
    
    await st.test('regex pattern matching', () => {
      const gmailUsers = users.filter(u => matchQuery(u, {
        email: { $regex: '^j.*@example\\.com$' }
      }))
      assert.equal(gmailUsers.length, 2) // john@ and jane@
      assert.ok(gmailUsers.every(u => u.email.startsWith('j')))
    })
    
    await st.test('OR conditions', () => {
      const adminOrOlder = users.filter(u => matchQuery(u, {
        $or: [
          { age: { $gt: 35 } },    // Charlie (45)
          { name: 'Jane Smith' }   // Jane
        ]
      }))
      assert.equal(adminOrOlder.length, 2)
      assert.ok(adminOrOlder.some(u => u.name === 'Jane Smith'))
      assert.ok(adminOrOlder.some(u => u.age === 45))
    })
    
    await st.test('combined conditions', () => {
      const activeYoungUsers = users.filter(u => matchQuery(u, {
        active: true,
        age: { $lt: 30 }
      }))
      assert.equal(activeYoungUsers.length, 2) // Jane (25), Alice (28)
      assert.ok(activeYoungUsers.every(u => u.active && u.age < 30))
    })
    
    await st.test('soft delete filtering', () => {
      // Create test data with one deleted user
      const usersWithDeleted = users.map((user, index) => 
        index === 0 ? { ...user, _deleted: true } : user
      )
      
      // Default excludes deleted
      const activeOnly = usersWithDeleted.filter(u => matchQuery(u, { age: { $gte: 20 } }))
      assert.equal(activeOnly.length, 4) // All except deleted John
      
      // Include deleted when specified
      const includeDeleted = usersWithDeleted.filter(u => matchQuery(u, { 
        age: { $gte: 20 }, 
        $includeDeleted: true 
      }))
      assert.equal(includeDeleted.length, 5) // All users
    })
  })
  
  await t.test('Effect Option Integration', async (st) => {
    await st.test('Option creation and checking', () => {
      const some = Option.some(42)
      const none = Option.none()
      
      assert.ok(Option.isSome(some))
      assert.ok(Option.isNone(none))
      
      assert.equal(Option.getOrElse(some, () => 0), 42)
      assert.equal(Option.getOrElse(none, () => 0), 0)
    })
    
    await st.test('Option from nullable', () => {
      const validValue = Option.fromNullable('hello')
      const nullValue = Option.fromNullable(null)
      const undefinedValue = Option.fromNullable(undefined)
      
      assert.ok(Option.isSome(validValue))
      assert.ok(Option.isNone(nullValue))
      assert.ok(Option.isNone(undefinedValue))
    })
    
    await st.test('Option mapping and filtering', () => {
      const numbers = [1, 2, 3, 4, 5]
      
      const evenOptions = numbers.map(n => 
        n % 2 === 0 ? Option.some(n) : Option.none()
      )
      
      const evenValues = evenOptions
        .filter(Option.isSome)
        .map(opt => opt.value)
      
      assert.deepEqual(evenValues, [2, 4])
    })
  })
  
  await t.test('Schema Validation Concepts', async (st) => {
    await st.test('field extraction from test schema', () => {
      // This tests the concept we use in the repository factory
      const mockSchema = {
        fields: {
          email: 'string',
          name: 'string', 
          age: 'number',
          active: 'boolean'
        }
      }
      
      const fields = Object.keys(mockSchema.fields)
      const metaFields = ['_id', '_createdAt', '_updatedAt', '_deleted', '_deletedAt']
      const allFields = [...metaFields, ...fields]
      
      assert.deepEqual(fields, ['email', 'name', 'age', 'active'])
      assert.equal(allFields.length, 9) // 5 meta + 4 schema fields
      assert.ok(allFields.includes('email'))
      assert.ok(allFields.includes('_id'))
    })
  })
})