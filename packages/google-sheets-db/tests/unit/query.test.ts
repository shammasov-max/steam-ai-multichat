import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { matchQuery } from '../../src/utils/query.js'
import type { WithMeta } from '../../src/types/metadata.js'
import { testUsersWithMeta } from '../fixtures/test-data.js'

test('Query matching', async (t) => {
  const users = testUsersWithMeta as WithMeta<any>[]
  
  await t.test('matches exact values', () => {
    const query = { name: 'John Doe' }
    const matches = users.filter(u => matchQuery(u, query))
    
    assert.equal(matches.length, 1)
    assert.equal(matches[0]?.name, 'John Doe')
  })
  
  await t.test('matches with $gt operator', () => {
    const query = { age: { $gt: 30 } }
    const matches = users.filter(u => matchQuery(u, query))
    
    assert.equal(matches.length, 2) // Bob (35) and Charlie (45)
    assert.ok(matches.every(u => u.age > 30))
  })
  
  await t.test('matches with $gte operator', () => {
    const query = { age: { $gte: 30 } }
    const matches = users.filter(u => matchQuery(u, query))
    
    assert.equal(matches.length, 3) // John (30), Bob (35), Charlie (45)
    assert.ok(matches.every(u => u.age >= 30))
  })
  
  await t.test('matches with $lt operator', () => {
    const query = { age: { $lt: 30 } }
    const matches = users.filter(u => matchQuery(u, query))
    
    assert.equal(matches.length, 2) // Jane (25) and Alice (28)
    assert.ok(matches.every(u => u.age < 30))
  })
  
  await t.test('matches with $lte operator', () => {
    const query = { age: { $lte: 30 } }
    const matches = users.filter(u => matchQuery(u, query))
    
    assert.equal(matches.length, 3) // John (30), Jane (25), Alice (28)
    assert.ok(matches.every(u => u.age <= 30))
  })
  
  await t.test('matches with $in operator', () => {
    const query = { name: { $in: ['John Doe', 'Jane Smith'] } }
    const matches = users.filter(u => matchQuery(u, query))
    
    assert.equal(matches.length, 2)
    assert.ok(matches.some(u => u.name === 'John Doe'))
    assert.ok(matches.some(u => u.name === 'Jane Smith'))
  })
  
  await t.test('matches with $regex operator', () => {
    const query = { email: { $regex: '^j.*@example\\.com$' } }
    const matches = users.filter(u => matchQuery(u, query))
    
    assert.equal(matches.length, 2) // john@ and jane@
    assert.ok(matches.every(u => u.email.startsWith('j')))
  })
  
  await t.test('matches with $or operator', () => {
    const query = {
      $or: [
        { age: { $gt: 35 } },
        { name: 'Jane Smith' }
      ]
    }
    const matches = users.filter(u => matchQuery(u, query))
    
    assert.equal(matches.length, 2) // Charlie (45) and Jane (25)
    assert.ok(matches.some(u => u.name === 'Jane Smith'))
    assert.ok(matches.some(u => u.age === 45))
  })
  
  await t.test('combines multiple conditions', () => {
    const query = {
      age: { $gte: 25, $lte: 35 },
      active: true
    }
    const matches = users.filter(u => matchQuery(u, query))
    
    assert.equal(matches.length, 3) // John (30), Jane (25), Alice (28)
    assert.ok(matches.every(u => u.age >= 25 && u.age <= 35 && u.active))
  })
  
  await t.test('excludes soft-deleted by default', () => {
    const usersWithDeleted = [...users]
    usersWithDeleted[0] = { ...usersWithDeleted[0]!, _deleted: true }
    
    const query = { age: { $gte: 25 } }
    const matches = usersWithDeleted.filter(u => matchQuery(u, query))
    
    // Should exclude John who is now deleted
    assert.equal(matches.length, 4) // All except John
    assert.ok(!matches.some(u => u.name === 'John Doe'))
  })
  
  await t.test('includes soft-deleted when specified', () => {
    const usersWithDeleted = [...users]
    usersWithDeleted[0] = { ...usersWithDeleted[0]!, _deleted: true }
    
    const query = { age: { $gte: 25 }, $includeDeleted: true }
    const matches = usersWithDeleted.filter(u => matchQuery(u, query))
    
    // Should include John even though deleted
    assert.equal(matches.length, 5) // All users
    assert.ok(matches.some(u => u.name === 'John Doe'))
  })
  
  await t.test('handles empty query', () => {
    const query = {}
    const matches = users.filter(u => matchQuery(u, query))
    
    assert.equal(matches.length, users.length)
  })
  
  await t.test('handles non-matching query', () => {
    const query = { name: 'Non Existent User' }
    const matches = users.filter(u => matchQuery(u, query))
    
    assert.equal(matches.length, 0)
  })
})