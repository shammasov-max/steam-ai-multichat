import * as S from '@effect/schema/Schema'
import * as Effect from 'effect/Effect'
import * as Ref from 'effect/Ref'
import * as HashMap from 'effect/HashMap'
import * as ReadonlyArray from 'effect/Array'
import * as Order from 'effect/Order'
import { pipe } from 'effect/Function'
import { makeRowId, type RowId } from '../types/brand.js'
import { Metadata, type WithMeta } from '../types/metadata.js'
import type { Query } from '../types/query.js'
import { SheetsService } from '../services/SheetsService.js'
import { SheetError } from '../errors/SheetError.js'
import { MemoryCache } from '../cache/MemoryCache.js'
import { matchQuery } from '../utils/query.js'
import { validateAndConfigureSheet } from '../utils/schema-validator.js'
import type { Repository } from './Repository.js'

/**
 * Creates a type-safe repository for a Google Sheets table.
 * The repository provides CRUD operations with in-memory caching.
 * 
 * @template S - The schema type
 * @param schema - Effect Schema defining the entity structure
 * @param sheetTitle - Name of the sheet in the Google Spreadsheet
 * @returns Effect containing the configured Repository
 * 
 * @example
 * const UserSchema = S.Struct({
 *   email: S.String,
 *   name: S.String,
 *   age: S.Number
 * })
 * 
 * const users = yield* createRepository(UserSchema, 'Users')
 */
export const createRepository = <S extends S.Schema.Any>(
  schema: S,
  sheetTitle: string
) => {
  type T = S.Schema.Type<S>
  
  const withMetaSchema = S.extend(schema, Metadata)
  
  return Effect.gen(function* () {
    const sheets = yield* SheetsService
    const doc = sheets.doc
    
    // Validate and configure sheet structure to match schema
    const sheet = yield* validateAndConfigureSheet(doc, schema, sheetTitle, {
      autoCreateSheets: true,
      autoConfigureHeaders: true,
      backupBeforeChanges: true
    })
    
    // Extract all fields for cache initialization
    const schemaFields = Object.keys((schema as any).fields || {})
    const metaFields = ['_id', '_deleted', '_deletedAt', '_createdAt', '_updatedAt']
    const allFields = [...metaFields, ...schemaFields]
    
    // Load all rows into memory
    const rows = yield* Effect.tryPromise(() => sheet.getRows())
    const initialData = rows.map(row => {
      const data: Record<string, any> = {}
      for (const field of allFields) {
        const value = row.get(field)
        if (field.startsWith('_')) {
          data[field] = field === '_deleted' ? value === 'true' : value
        } else {
          try {
            data[field] = value && (value.startsWith('{') || value.startsWith('[')) 
              ? JSON.parse(value) 
              : value
          } catch {
            data[field] = value
          }
        }
      }
      return data as WithMeta<T>
    })
    
    // Initialize cache
    const cacheRef = yield* Ref.make(
      HashMap.fromIterable(
        initialData.map(item => [item._id as RowId, item])
      )
    )
    
    const cache = new MemoryCache<T>(cacheRef, sheetTitle, doc)
    
    // Create repository implementation
    const repo: Repository<T> = {
      create: (data: T) => 
        Effect.gen(function* () {
          const withMeta: WithMeta<T> = {
            ...data,
            _id: makeRowId(crypto.randomUUID()),
            _createdAt: new Date().toISOString(),
            _updatedAt: new Date().toISOString(),
          }
          
          yield* S.validate(withMetaSchema)(withMeta).pipe(
            Effect.mapError(error => new SheetError({ 
              reason: 'VALIDATION', 
              message: `Validation failed: ${error.message}` 
            }))
          )
          return yield* cache.set(withMeta._id, withMeta)
        }).pipe(
          Effect.mapError(error => 
            error instanceof SheetError ? error : 
            new SheetError({ reason: 'NETWORK', message: `Create failed: ${error.message}` })
          )
        ),

      createMany: (data: T[]) =>
        Effect.gen(function* () {
          const withMeta = data.map(d => ({
            ...d,
            _id: makeRowId(crypto.randomUUID()),
            _createdAt: new Date().toISOString(),
            _updatedAt: new Date().toISOString(),
          }))
          
          yield* Effect.all(
            withMeta.map(item => S.validate(withMetaSchema)(item).pipe(
              Effect.mapError(error => new SheetError({ 
                reason: 'VALIDATION', 
                message: `Validation failed: ${error.message}` 
              }))
            ))
          )
          return yield* cache.bulkSet(withMeta)
        }).pipe(
          Effect.mapError(error => 
            error instanceof SheetError ? error : 
            new SheetError({ reason: 'NETWORK', message: `CreateMany failed: ${error.message}` })
          )
        ),

      findOne: (query: Query<T>) =>
        pipe(
          cache.query(item => matchQuery(item, query)),
          Effect.map(ReadonlyArray.head)
        ),

      findMany: (query: Query<T> = {}) =>
        Effect.gen(function* () {
          let results = yield* cache.query(item => matchQuery(item, query))
          
          // Apply sorting
          if (query.$orderBy) {
            const key = query.$orderBy as keyof WithMeta<T>
            const order = query.$order || 'asc'
            const orderBy = Order.make<WithMeta<T>>((a, b) => {
              const aVal = a[key]
              const bVal = b[key]
              const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
              const result = order === 'asc' ? cmp : -cmp
              return result as -1 | 0 | 1
            })
            results = ReadonlyArray.sort(results, orderBy)
          }
          
          // Apply pagination
          const offset = query.$offset || 0
          const limit = query.$limit
          
          return pipe(
            results,
            ReadonlyArray.drop(offset),
            limit ? ReadonlyArray.take(limit) : (x => x)
          )
        }),

      update: (query: Query<T>, updates: Partial<T>) =>
        Effect.gen(function* () {
          const items = yield* cache.query(item => matchQuery(item, query))
          let count = 0
          
          for (const item of items) {
            const updated = {
              ...item,
              ...updates,
              _updatedAt: new Date().toISOString(),
            }
            
            yield* S.validate(withMetaSchema)(updated).pipe(
              Effect.mapError(error => new SheetError({ 
                reason: 'VALIDATION', 
                message: `Update validation failed: ${error.message}` 
              }))
            )
            yield* cache.set(item._id, updated)
            count++
          }
          
          return count
        }).pipe(
          Effect.mapError(error => 
            error instanceof SheetError ? error : 
            new SheetError({ reason: 'NETWORK', message: `Update failed: ${error.message}` })
          )
        ),

      delete: (query: Query<T>) =>
        Effect.gen(function* () {
          const items = yield* cache.query(item => 
            matchQuery(item, query) && !item._deleted
          )
          
          let count = 0
          for (const item of items) {
            const deleted = {
              ...item,
              _deleted: true,
              _deletedAt: new Date().toISOString(),
              _updatedAt: new Date().toISOString(),
            }
            
            yield* cache.set(item._id, deleted)
            count++
          }
          
          return count
        }).pipe(
          Effect.mapError(error => 
            error instanceof SheetError ? error : 
            new SheetError({ reason: 'NETWORK', message: `Delete failed: ${error.message}` })
          )
        ),

      purgeDeleted: () =>
        Effect.gen(function* () {
          const sheet = yield* Effect.try(() => {
            const foundSheet = doc.sheetsByTitle[sheetTitle]
            if (!foundSheet) {
              throw new Error(`Sheet '${sheetTitle}' not found`)
            }
            return foundSheet
          }).pipe(
            Effect.mapError(error => new SheetError({ 
              reason: 'NOT_FOUND', 
              message: `Failed to access sheet: ${error.message}` 
            }))
          )
          const rows = yield* Effect.tryPromise(() => sheet.getRows())
          const deleted = yield* cache.query(item => item._deleted === true)
          
          // Remove from sheet in reverse order to maintain row indices
          const toDelete = rows
            .filter(row => deleted.some(d => d._id === row.get('_id')))
            .sort((a, b) => b.rowNumber - a.rowNumber)
          
          for (const row of toDelete) {
            yield* Effect.tryPromise(() => row.delete()).pipe(
              Effect.mapError(error => new SheetError({ 
                reason: 'DELETE_FAILED', 
                message: `Failed to delete row: ${error.message}` 
              }))
            )
            yield* cache.remove(row.get('_id') as RowId)
          }
          
          return toDelete.length
        }),

      count: (query: Query<T> = {}) =>
        pipe(
          cache.query(item => matchQuery(item, query)),
          Effect.map(ReadonlyArray.length)
        ),

      sync: () =>
        Effect.gen(function* () {
          const rows = yield* Effect.tryPromise(() => sheet.getRows())
          const allFields = [...metaFields, ...schemaFields]
          
          const freshData = rows.map(row => {
            const data: Record<string, any> = {}
            for (const field of allFields) {
              const value = row.get(field)
              if (field.startsWith('_')) {
                data[field] = field === '_deleted' ? value === 'true' : value
              } else {
                try {
                  data[field] = value && (value.startsWith('{') || value.startsWith('['))
                    ? JSON.parse(value)
                    : value
                } catch {
                  data[field] = value
                }
              }
            }
            return data as WithMeta<T>
          })
          
          yield* Ref.set(
            cacheRef,
            HashMap.fromIterable(
              freshData.map(item => [item._id as RowId, item])
            )
          )
        }).pipe(
          Effect.mapError(error => 
            error instanceof SheetError ? error : 
            new SheetError({ reason: 'NETWORK', message: `Sync failed: ${error.message}` })
          )
        )
    }
    
    return repo
  })
}