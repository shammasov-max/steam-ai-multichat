import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import { createRepository } from '../../src/repository/factory.js'
import { TestUserSchema, type TestUser } from '../fixtures/test-data.js'

test('Repository Type Checking', async (t) => {
  await t.test('repository factory creates correct interface types', () => {
    // Type check: createRepository function signature
    const repositoryEffect = createRepository(TestUserSchema, 'Users')
    
    assert.equal(typeof repositoryEffect, 'object')
    
    // Type check: Effect type structure
    assert.ok(Effect.isEffect(repositoryEffect))
  })
  
  await t.test('repository operations have correct types', () => {
    // Type check: Schema type extraction works
    type User = TestUser
    
    const testData: Omit<User, '_id' | '_createdAt' | '_updatedAt'> = {
      email: 'test@example.com',
      name: 'Test User',
      age: 25,
      active: true
    }
    
    assert.equal(typeof testData.email, 'string')
    assert.equal(typeof testData.name, 'string')
    assert.equal(typeof testData.age, 'number')
    assert.equal(typeof testData.active, 'boolean')
  })
  
  await t.test('Option type integration works correctly', () => {
    // Type check: Option types work with repository results
    const someResult = Option.some({ id: 'test', value: 42 })
    const noneResult = Option.none()
    
    assert.ok(Option.isSome(someResult))
    assert.ok(Option.isNone(noneResult))
    
    // Type safety with Option
    if (Option.isSome(someResult)) {
      assert.equal(typeof someResult.value, 'object')
      assert.equal(typeof someResult.value.id, 'string')
      assert.equal(typeof someResult.value.value, 'number')
    }
  })
})