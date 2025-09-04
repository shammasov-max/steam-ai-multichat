/**
 * Example usage of the Google Sheets Database package.
 * Shows how to define schemas, create repositories, and perform CRUD operations.
 */

import * as S from '@effect/schema/Schema'
import * as Effect from 'effect/Effect'
import { createRepository, SheetsLayer, type SheetsConfig } from '../src/index.js'

// Define user schema with nested settings
const UserSchema = S.Struct({
  email: S.String,
  name: S.String,
  age: S.Number,
  role: S.Literal('admin', 'user'),
  settings: S.Struct({
    theme: S.Literal('light', 'dark'),
    notifications: S.Boolean,
  }),
})

type User = S.Schema.Type<typeof UserSchema>

// Configuration (replace with your actual values)
const config: SheetsConfig = {
  spreadsheetId: 'your-spreadsheet-id-here',
  credentials: {
    client_email: 'your-service-account@your-project.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n'
  }
}

// Main program demonstrating repository usage
const program = Effect.gen(function* () {
  console.log('Creating user repository...')
  
  // Create a type-safe repository for users
  const users = yield* createRepository(UserSchema, 'Users')
  
  console.log('Creating users...')
  
  // Create individual user
  const john = yield* users.create({
    email: 'john@example.com',
    name: 'John Doe',
    age: 30,
    role: 'user',
    settings: { 
      theme: 'dark', 
      notifications: true 
    }
  })
  
  console.log('Created user:', john)
  
  // Create multiple users at once
  const newUsers = yield* users.createMany([
    {
      email: 'jane@example.com',
      name: 'Jane Smith',
      age: 28,
      role: 'admin',
      settings: { theme: 'light', notifications: false }
    },
    {
      email: 'bob@example.com',
      name: 'Bob Wilson',
      age: 35,
      role: 'user',
      settings: { theme: 'dark', notifications: true }
    }
  ])
  
  console.log('Created users:', newUsers)
  
  console.log('Querying users...')
  
  // Find users with complex query
  const adults = yield* users.findMany({
    age: { $gte: 18 },
    role: 'user',
    $orderBy: 'name',
    $limit: 10
  })
  
  console.log('Adult users:', adults)
  
  // Find single user by email
  const foundUser = yield* users.findOne({ email: 'john@example.com' })
  console.log('Found user:', foundUser)
  
  // Query with OR conditions
  const adminOrOlder = yield* users.findMany({
    $or: [
      { role: 'admin' },
      { age: { $gt: 30 } }
    ]
  })
  
  console.log('Admin or older users:', adminOrOlder)
  
  console.log('Updating users...')
  
  // Update users matching a condition
  const updatedCount = yield* users.update(
    { age: { $lt: 30 } },
    { role: 'user' as const }
  )
  
  console.log(`Updated ${updatedCount} users`)
  
  console.log('Counting users...')
  
  // Count total users
  const totalUsers = yield* users.count()
  console.log(`Total users: ${totalUsers}`)
  
  // Count admin users
  const adminCount = yield* users.count({ role: 'admin' })
  console.log(`Admin users: ${adminCount}`)
  
  console.log('Soft deleting users...')
  
  // Soft delete users (marks as deleted but keeps data)
  const deletedCount = yield* users.delete({ age: { $gt: 35 } })
  console.log(`Soft deleted ${deletedCount} users`)
  
  // Count active users (excludes soft-deleted)
  const activeUsers = yield* users.count()
  console.log(`Active users: ${activeUsers}`)
  
  // Count including deleted
  const allUsers = yield* users.count({ $includeDeleted: true })
  console.log(`All users (including deleted): ${allUsers}`)
  
  console.log('Purging deleted users...')
  
  // Permanently remove soft-deleted users
  const purgedCount = yield* users.purgeDeleted()
  console.log(`Purged ${purgedCount} users permanently`)
  
  console.log('Syncing with sheet...')
  
  // Sync cache with sheet (useful for multi-client scenarios)
  yield* users.sync()
  console.log('Cache synchronized with Google Sheet')
  
  return 'Program completed successfully!'
})

// Example of error handling
const programWithErrorHandling = program.pipe(
  Effect.catchAll(error => {
    console.error('Program failed:', error)
    return Effect.succeed('Program failed with error')
  })
)

// Run the program
if (import.meta.main) {
  Effect.runPromise(
    programWithErrorHandling.pipe(
      Effect.provide(SheetsLayer(config))
    )
  ).then(result => {
    console.log(result)
  })
}