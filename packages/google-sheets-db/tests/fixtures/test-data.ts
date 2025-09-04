import * as S from '@effect/schema/Schema'

/**
 * Test schemas and data for unit tests
 */

// Simple test schema
export const TestUserSchema = S.Struct({
  email: S.String,
  name: S.String,
  age: S.Number,
  active: S.Boolean,
})

export type TestUser = S.Schema.Type<typeof TestUserSchema>

// Complex test schema with nested objects
export const ComplexUserSchema = S.Struct({
  email: S.String,
  name: S.String,
  age: S.Number,
  role: S.Literal('admin', 'user', 'moderator'),
  settings: S.Struct({
    theme: S.Literal('light', 'dark'),
    notifications: S.Boolean,
    language: S.String,
  }),
  tags: S.Array(S.String),
})

export type ComplexUser = S.Schema.Type<typeof ComplexUserSchema>

// Test data
export const testUsers: TestUser[] = [
  { email: 'john@example.com', name: 'John Doe', age: 30, active: true },
  { email: 'jane@example.com', name: 'Jane Smith', age: 25, active: true },
  { email: 'bob@example.com', name: 'Bob Wilson', age: 35, active: false },
  { email: 'alice@example.com', name: 'Alice Brown', age: 28, active: true },
  { email: 'charlie@example.com', name: 'Charlie Davis', age: 45, active: false },
]

export const complexUsers: ComplexUser[] = [
  {
    email: 'admin@example.com',
    name: 'Admin User',
    age: 30,
    role: 'admin',
    settings: { theme: 'dark', notifications: true, language: 'en' },
    tags: ['power-user', 'beta-tester'],
  },
  {
    email: 'user@example.com',
    name: 'Regular User',
    age: 25,
    role: 'user',
    settings: { theme: 'light', notifications: false, language: 'es' },
    tags: ['new'],
  },
  {
    email: 'mod@example.com',
    name: 'Moderator User',
    age: 28,
    role: 'moderator',
    settings: { theme: 'dark', notifications: true, language: 'fr' },
    tags: ['trusted', 'veteran'],
  },
]

// Test data with metadata (simulating database records)
export const testUsersWithMeta = testUsers.map((user, index) => ({
  ...user,
  _id: `test-id-${index}`,
  _createdAt: new Date(2024, 0, index + 1).toISOString(),
  _updatedAt: new Date(2024, 0, index + 1).toISOString(),
  _deleted: false,
}))

export const testCredentials = {
  client_email: 'test@test-project.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIBVAIBADANBgkqhkiG9w0BAQEFAASCAT4wggE6AgEAAkEAwJdrur\n-----END PRIVATE KEY-----\n',
}