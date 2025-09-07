import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import * as S from '@effect/schema/Schema'

test('Schema Type Checking', async (t) => {
  await t.test('Effect Schema struct types work correctly', () => {
    // Type check: Schema.Struct creates proper schema type
    const UserSchema = S.Struct({
      email: S.String,
      name: S.String,
      age: S.Number,
      active: S.Boolean
    })
    
    // Type check: Schema fields are correctly typed
    assert.equal(typeof UserSchema, 'function')
    assert.ok(UserSchema.fields)
    
    // Type check: Schema can be used for type inference
    type User = S.Schema.Type<typeof UserSchema>
    
    const testUser: User = {
      email: 'test@example.com',
      name: 'Test User',
      age: 30,
      active: true
    }
    
    assert.equal(typeof testUser.email, 'string')
    assert.equal(typeof testUser.name, 'string')
    assert.equal(typeof testUser.age, 'number')
    assert.equal(typeof testUser.active, 'boolean')
  })
  
  await t.test('nested schema structures type correctly', () => {
    const ComplexSchema = S.Struct({
      id: S.String,
      settings: S.Struct({
        theme: S.String,
        enabled: S.Boolean
      }),
      tags: S.Array(S.String)
    })
    
    type Complex = S.Schema.Type<typeof ComplexSchema>
    
    const testComplex: Complex = {
      id: 'test-id',
      settings: {
        theme: 'dark',
        enabled: true
      },
      tags: ['tag1', 'tag2']
    }
    
    assert.equal(typeof testComplex.id, 'string')
    assert.equal(typeof testComplex.settings, 'object')
    assert.equal(typeof testComplex.settings.theme, 'string')
    assert.equal(typeof testComplex.settings.enabled, 'boolean')
    assert.ok(Array.isArray(testComplex.tags))
    assert.equal(testComplex.tags.length, 2)
  })
})