/**
 * @packageDocumentation
 * Google Sheets Database - Type-safe Google Sheets wrapper with Effect-TS
 * 
 * This package provides a production-ready TypeScript library that transforms 
 * Google Sheets into a fully-featured database with in-memory caching, 
 * schema validation, and CRUD operations.
 * 
 * @example
 * ```typescript
 * import { createRepository, SheetsLayer } from '@packages/google-sheets-db'
 * import * as S from '@effect/schema/Schema'
 * import * as Effect from 'effect/Effect'
 * 
 * const UserSchema = S.Struct({
 *   email: S.String,
 *   name: S.String,
 *   age: S.Number
 * })
 * 
 * const program = Effect.gen(function* () {
 *   const users = yield* createRepository(UserSchema, 'Users')
 *   
 *   const user = yield* users.create({
 *     email: 'john@example.com',
 *     name: 'John Doe',
 *     age: 30
 *   })
 *   
 *   return user
 * })
 * 
 * Effect.runPromise(
 *   program.pipe(
 *     Effect.provide(SheetsLayer({
 *       spreadsheetId: 'your-sheet-id',
 *       credentials: {
 *         client_email: 'your-service-account@project.iam.gserviceaccount.com',
 *         private_key: '-----BEGIN PRIVATE KEY-----\n...'
 *       }
 *     }))
 *   )
 * )
 * ```
 */

// Core factory function
export { createRepository } from './repository/factory.js'

// Layer for dependency injection
export { SheetsLayer, type SheetsConfig } from './layers/SheetsLayer.js'
export { 
  EnhancedSheetsLayer, 
  createEnhancedSheetsLayer,
  type EnhancedSheetsConfig 
} from './layers/EnhancedSheetsLayer.js'

// Error types
export { SheetError } from './errors/SheetError.js'

// Type exports
export type { 
  Brand, 
  RowId, 
  SheetId 
} from './types/brand.js'

export type { 
  Metadata, 
  WithMeta 
} from './types/metadata.js'

export type { 
  Query, 
  Operators 
} from './types/query.js'

export type { 
  Repository 
} from './repository/Repository.js'

// Service exports (for advanced usage)
export { SheetsService } from './services/SheetsService.js'
export { SheetsServiceImpl } from './services/SheetsServiceImpl.js'

// Cache export (for advanced usage)
export { MemoryCache } from './cache/MemoryCache.js'

// Utility exports
export { matchQuery } from './utils/query.js'
export { makeRowId, makeSheetId } from './types/brand.js'
export { 
  validateAndConfigureSheet, 
  validateSpreadsheetStructure,
  type SheetValidationConfig 
} from './utils/schema-validator.js'