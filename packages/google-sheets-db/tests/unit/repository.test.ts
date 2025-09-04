import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import { createRepository } from '../../src/repository/factory.js'
import { SheetsService } from '../../src/services/SheetsService.js'
import { MockGoogleSpreadsheet, MockGoogleSpreadsheetWorksheet } from '../mocks/MockGoogleSpreadsheet.js'
import { TestUserSchema, type TestUser } from '../fixtures/test-data.js'

test('Repository operations', async (t) => {
  const createMockLayer = () => {
    const doc = new MockGoogleSpreadsheet('test-sheet-id')
    const sheet = new MockGoogleSpreadsheetWorksheet()
    doc.sheetsByTitle['Users'] = sheet
    
    return Layer.succeed(SheetsService, {
      doc: doc as any,
      getSheet: () => Effect.succeed(sheet.getRows() as any)
    })
  }
  
  await t.test('create adds new entity with metadata', async () => {
    const program = Effect.gen(function* () {
      const users = yield* createRepository(TestUserSchema, 'Users')
      
      const user = yield* users.create({
        email: 'test@example.com',
        name: 'Test User',
        age: 25,
        active: true,
      })
      
      return user
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(createMockLayer()))
    )
    
    assert.equal(result.email, 'test@example.com')
    assert.equal(result.name, 'Test User')
    assert.equal(result.age, 25)
    assert.ok(result._id)
    assert.ok(result._createdAt)
    assert.ok(result._updatedAt)
    assert.equal(result._deleted, undefined)
  })
  
  await t.test('createMany adds multiple entities', async () => {
    const program = Effect.gen(function* () {
      const users = yield* createRepository(TestUserSchema, 'Users')
      
      const newUsers = yield* users.createMany([
        { email: 'user1@example.com', name: 'User 1', age: 20, active: true },
        { email: 'user2@example.com', name: 'User 2', age: 30, active: false },
        { email: 'user3@example.com', name: 'User 3', age: 40, active: true },
      ])
      
      return newUsers
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(createMockLayer()))
    )
    
    assert.equal(result.length, 3)
    assert.equal(result[0]?.name, 'User 1')
    assert.equal(result[1]?.name, 'User 2')
    assert.equal(result[2]?.name, 'User 3')
    assert.ok(result.every(u => u._id && u._createdAt && u._updatedAt))
  })
  
  await t.test('findOne returns matching entity', async () => {
    const program = Effect.gen(function* () {
      const users = yield* createRepository(TestUserSchema, 'Users')
      
      // Create some users first
      yield* users.create({ email: 'john@example.com', name: 'John', age: 30, active: true })
      yield* users.create({ email: 'jane@example.com', name: 'Jane', age: 25, active: false })
      
      // Find one
      const found = yield* users.findOne({ email: 'john@example.com' })
      
      return found
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(createMockLayer()))
    )
    
    assert.ok(Option.isSome(result))
    if (Option.isSome(result)) {
      assert.equal(result.value.name, 'John')
      assert.equal(result.value.age, 30)
    }
  })
  
  await t.test('findOne returns None for non-existent', async () => {
    const program = Effect.gen(function* () {
      const users = yield* createRepository(TestUserSchema, 'Users')
      
      const found = yield* users.findOne({ email: 'nonexistent@example.com' })
      
      return found
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(createMockLayer()))
    )
    
    assert.ok(Option.isNone(result))
  })
  
  await t.test('findMany returns all matching entities', async () => {
    const program = Effect.gen(function* () {
      const users = yield* createRepository(TestUserSchema, 'Users')
      
      // Create test data
      yield* users.createMany([
        { email: 'alice@example.com', name: 'Alice', age: 22, active: true },
        { email: 'bob@example.com', name: 'Bob', age: 35, active: true },
        { email: 'charlie@example.com', name: 'Charlie', age: 28, active: false },
        { email: 'david@example.com', name: 'David', age: 45, active: true },
      ])
      
      // Find with query
      const activeUsers = yield* users.findMany({ active: true })
      const olderUsers = yield* users.findMany({ age: { $gte: 30 } })
      
      return { activeUsers, olderUsers }
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(createMockLayer()))
    )
    
    assert.equal(result.activeUsers.length, 3) // Alice, Bob, David
    assert.equal(result.olderUsers.length, 2) // Bob (35), David (45)
  })
  
  await t.test('findMany with sorting and pagination', async () => {
    const program = Effect.gen(function* () {
      const users = yield* createRepository(TestUserSchema, 'Users')
      
      // Create test data
      yield* users.createMany([
        { email: 'user1@example.com', name: 'User A', age: 30, active: true },
        { email: 'user2@example.com', name: 'User B', age: 25, active: true },
        { email: 'user3@example.com', name: 'User C', age: 35, active: true },
        { email: 'user4@example.com', name: 'User D', age: 20, active: true },
        { email: 'user5@example.com', name: 'User E', age: 40, active: true },
      ])
      
      // Find with sorting and pagination
      const sorted = yield* users.findMany({
        $orderBy: 'age',
        $order: 'desc',
        $limit: 3,
        $offset: 1,
      })
      
      return sorted
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(createMockLayer()))
    )
    
    assert.equal(result.length, 3)
    assert.equal(result[0]?.age, 35) // Second highest after 40
    assert.equal(result[1]?.age, 30)
    assert.equal(result[2]?.age, 25)
  })
  
  await t.test('update modifies matching entities', async () => {
    const program = Effect.gen(function* () {
      const users = yield* createRepository(TestUserSchema, 'Users')
      
      // Create test data
      yield* users.createMany([
        { email: 'user1@example.com', name: 'User 1', age: 20, active: true },
        { email: 'user2@example.com', name: 'User 2', age: 25, active: false },
        { email: 'user3@example.com', name: 'User 3', age: 30, active: true },
      ])
      
      // Update users with age < 30
      const updateCount = yield* users.update(
        { age: { $lt: 30 } },
        { active: false }
      )
      
      // Verify update
      const updatedUsers = yield* users.findMany({ active: false })
      
      return { updateCount, updatedUsers }
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(createMockLayer()))
    )
    
    assert.equal(result.updateCount, 2) // User 1 and User 2
    assert.equal(result.updatedUsers.length, 2) // User 1 and User 2 have active: false
  })
  
  await t.test('delete soft-deletes matching entities', async () => {
    const program = Effect.gen(function* () {
      const users = yield* createRepository(TestUserSchema, 'Users')
      
      // Create test data
      yield* users.createMany([
        { email: 'keep1@example.com', name: 'Keep 1', age: 20, active: true },
        { email: 'delete1@example.com', name: 'Delete 1', age: 35, active: true },
        { email: 'keep2@example.com', name: 'Keep 2', age: 25, active: true },
        { email: 'delete2@example.com', name: 'Delete 2', age: 40, active: true },
      ])
      
      // Delete users older than 30
      const deleteCount = yield* users.delete({ age: { $gt: 30 } })
      
      // Count active users
      const activeCount = yield* users.count()
      
      // Count all including deleted
      const totalCount = yield* users.count({ $includeDeleted: true })
      
      return { deleteCount, activeCount, totalCount }
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(createMockLayer()))
    )
    
    assert.equal(result.deleteCount, 2) // Delete 1 and Delete 2
    assert.equal(result.activeCount, 2) // Keep 1 and Keep 2
    assert.equal(result.totalCount, 4) // All 4 still exist
  })
  
  await t.test('purgeDeleted removes soft-deleted entities', async () => {
    const program = Effect.gen(function* () {
      const users = yield* createRepository(TestUserSchema, 'Users')
      
      // Create and delete some users
      yield* users.createMany([
        { email: 'user1@example.com', name: 'User 1', age: 30, active: true },
        { email: 'user2@example.com', name: 'User 2', age: 35, active: true },
        { email: 'user3@example.com', name: 'User 3', age: 40, active: true },
      ])
      
      yield* users.delete({ age: { $gte: 35 } })
      
      // Count before purge
      const beforePurge = yield* users.count({ $includeDeleted: true })
      
      // Purge deleted
      const purgedCount = yield* users.purgeDeleted()
      
      // Count after purge
      const afterPurge = yield* users.count({ $includeDeleted: true })
      
      return { beforePurge, purgedCount, afterPurge }
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(createMockLayer()))
    )
    
    assert.equal(result.beforePurge, 3)
    assert.equal(result.purgedCount, 2) // User 2 and User 3
    assert.equal(result.afterPurge, 1) // Only User 1 remains
  })
  
  await t.test('count returns correct counts', async () => {
    const program = Effect.gen(function* () {
      const users = yield* createRepository(TestUserSchema, 'Users')
      
      // Create test data
      yield* users.createMany([
        { email: 'young1@example.com', name: 'Young 1', age: 20, active: true },
        { email: 'young2@example.com', name: 'Young 2', age: 22, active: false },
        { email: 'old1@example.com', name: 'Old 1', age: 40, active: true },
        { email: 'old2@example.com', name: 'Old 2', age: 45, active: true },
      ])
      
      const totalCount = yield* users.count()
      const activeCount = yield* users.count({ active: true })
      const youngCount = yield* users.count({ age: { $lt: 30 } })
      const oldActiveCount = yield* users.count({ 
        age: { $gte: 40 }, 
        active: true 
      })
      
      return { totalCount, activeCount, youngCount, oldActiveCount }
    })
    
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(createMockLayer()))
    )
    
    assert.equal(result.totalCount, 4)
    assert.equal(result.activeCount, 3)
    assert.equal(result.youngCount, 2)
    assert.equal(result.oldActiveCount, 2)
  })
})