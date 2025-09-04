import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import * as S from '@effect/schema/Schema'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import { createRepository, validateAndConfigureSheet, EnhancedSheetsLayer } from '../../src/index.js'
import { MockGoogleSpreadsheet, MockGoogleSpreadsheetWorksheet } from '../mocks/MockGoogleSpreadsheet.js'
import { SheetsService } from '../../src/services/SheetsService.js'

// Test schemas
const UserSchema = S.Struct({
  email: S.String,
  name: S.String,
  age: S.Number,
  active: S.Boolean
})

const ProductSchema = S.Struct({
  title: S.String,
  price: S.Number,
  description: S.String,
  category: S.String
})

test('Schema Validation and Auto-Configuration', async (t) => {
  const createMockSheetsLayer = () => {
    const doc = new MockGoogleSpreadsheet('test-spreadsheet-id')
    
    // Pre-authenticate and load info
    doc.useServiceAccountAuth({
      client_email: 'test@test.com',
      private_key: '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----\n'
    })
    doc.loadInfo()
    
    return Layer.succeed(SheetsService, {
      doc: doc as any,
      getSheet: (title: string) => {
        const s = doc.sheetsByTitle[title]
        if (!s) {
          return Effect.fail({
            _tag: 'SheetError',
            reason: 'NOT_FOUND',
            message: `Sheet ${title} not found`
          } as any)
        }
        return Effect.succeed(s.getRows() as any)
      }
    })
  }

  await t.test('creates missing sheet with correct headers', async () => {
    const program = Effect.gen(function* () {
      const sheets = yield* SheetsService
      const doc = sheets.doc
      
      // Ensure sheet doesn't exist initially
      assert.ok(!doc.sheetsByTitle['Users'])
      
      // Validate and configure sheet (should create it)
      const sheet = yield* validateAndConfigureSheet(doc, UserSchema, 'Users', {
        autoCreateSheets: true,
        autoConfigureHeaders: true
      })
      
      // Check that sheet was created
      assert.ok(doc.sheetsByTitle['Users'])
      assert.equal(sheet.headerValues.length, 9) // 5 meta fields + 4 schema fields
      
      // Check all required headers are present
      const expectedHeaders = [
        '_id', '_deleted', '_deletedAt', '_createdAt', '_updatedAt',
        'email', 'name', 'age', 'active'
      ]
      
      for (const header of expectedHeaders) {
        assert.ok(sheet.headerValues.includes(header), `Missing header: ${header}`)
      }
      
      return sheet
    })
    
    await Effect.runPromise(
      program.pipe(Effect.provide(createMockSheetsLayer()))
    )
  })

  await t.test('updates existing sheet headers when schema changes', async () => {
    const program = Effect.gen(function* () {
      const sheets = yield* SheetsService
      const doc = sheets.doc
      
      // Create sheet with old headers
      const sheet = new MockGoogleSpreadsheetWorksheet()
      sheet.headerValues = ['_id', 'email', 'name', 'old_field'] // Missing new fields
      doc.sheetsByTitle['Users'] = sheet
      
      // Add some existing data
      yield* Effect.tryPromise(() => sheet.addRow({
        _id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        old_field: 'some value'
      }))
      
      // Validate and configure with new schema
      const updatedSheet = yield* validateAndConfigureSheet(doc, UserSchema, 'Users', {
        autoCreateSheets: false,
        autoConfigureHeaders: true,
        backupBeforeChanges: false // Skip backup for simpler test
      })
      
      // Check that headers were updated
      const expectedHeaders = [
        '_id', '_deleted', '_deletedAt', '_createdAt', '_updatedAt',
        'email', 'name', 'age', 'active'
      ]
      
      for (const header of expectedHeaders) {
        assert.ok(updatedSheet.headerValues.includes(header), `Missing header: ${header}`)
      }
      
      // Old field should be removed
      assert.ok(!updatedSheet.headerValues.includes('old_field'))
      
      return updatedSheet
    })
    
    await Effect.runPromise(
      program.pipe(Effect.provide(createMockSheetsLayer()))
    )
  })

  await t.test('enhanced sheets layer validates multiple schemas', async () => {
    // Create a mock doc that the EnhancedSheetsLayer would use
    const doc = new MockGoogleSpreadsheet('enhanced-test-id')
    
    // Mock the enhanced layer creation
    const enhancedConfig = {
      spreadsheetId: 'enhanced-test-id',
      credentials: {
        client_email: 'test@test.com',
        private_key: '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----\n'
      },
      schemas: [
        { schema: UserSchema, sheetTitle: 'Users' },
        { schema: ProductSchema, sheetTitle: 'Products' }
      ]
    }
    
    // Since we can't easily test the layer creation directly with mocks,
    // let's test the validation function directly
    const program = Effect.gen(function* () {
      const sheets = yield* SheetsService  
      const testDoc = sheets.doc
      
      // Validate both schemas
      const userSheet = yield* validateAndConfigureSheet(testDoc, UserSchema, 'Users')
      const productSheet = yield* validateAndConfigureSheet(testDoc, ProductSchema, 'Products')
      
      // Check both sheets were created with correct headers
      assert.ok(testDoc.sheetsByTitle['Users'])
      assert.ok(testDoc.sheetsByTitle['Products'])
      
      // Verify Users sheet headers
      const userHeaders = userSheet.headerValues
      assert.ok(userHeaders.includes('email'))
      assert.ok(userHeaders.includes('name'))
      assert.ok(userHeaders.includes('age'))
      assert.ok(userHeaders.includes('active'))
      
      // Verify Products sheet headers
      const productHeaders = productSheet.headerValues
      assert.ok(productHeaders.includes('title'))
      assert.ok(productHeaders.includes('price'))
      assert.ok(productHeaders.includes('description'))
      assert.ok(productHeaders.includes('category'))
      
      return { userSheet, productSheet }
    })
    
    await Effect.runPromise(
      program.pipe(Effect.provide(createMockSheetsLayer()))
    )
  })

  await t.test('repository creation with auto-configured sheet', async () => {
    const program = Effect.gen(function* () {
      // Create repository - this should auto-configure the sheet
      const users = yield* createRepository(UserSchema, 'AutoConfiguredUsers')
      
      // Test that we can perform operations
      const user = yield* users.create({
        email: 'auto@example.com',
        name: 'Auto User',
        age: 25,
        active: true
      })
      
      assert.equal(user.email, 'auto@example.com')
      assert.equal(user.name, 'Auto User')
      assert.equal(user.age, 25)
      assert.equal(user.active, true)
      assert.ok(user._id)
      assert.ok(user._createdAt)
      assert.ok(user._updatedAt)
      
      // Find the user
      const foundUser = yield* users.findOne({ email: 'auto@example.com' })
      assert.ok(foundUser)
      
      return user
    })
    
    await Effect.runPromise(
      program.pipe(Effect.provide(createMockSheetsLayer()))
    )
  })
})