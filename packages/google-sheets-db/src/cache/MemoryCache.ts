import type { GoogleSpreadsheet, GoogleSpreadsheetRow } from 'google-spreadsheet'
import * as Effect from 'effect/Effect'
import * as Ref from 'effect/Ref'
import * as HashMap from 'effect/HashMap'
import * as ReadonlyArray from 'effect/Array'
import { pipe } from 'effect/Function'
import * as S from '@effect/schema/Schema'
import type { RowId } from '../types/brand.js'
import { makeRowId } from '../types/brand.js'
import type { WithMeta } from '../types/metadata.js'

/**
 * In-memory cache for Google Sheets data.
 * Provides fast read operations and batched writes.
 * @template T - The entity type being cached
 */
export class MemoryCache<T> {
  constructor(
    private cache: Ref.Ref<HashMap.HashMap<RowId, WithMeta<T>>>,
    private sheetTitle: string,
    private doc: GoogleSpreadsheet
  ) {}

  /**
   * Converts an entity to a row format for Google Sheets.
   * Serializes nested objects as JSON strings.
   */
  private toRow = (data: WithMeta<T>): Record<string, any> => {
    const row: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      row[key] = typeof value === 'object' && value !== null && !Array.isArray(value)
        ? JSON.stringify(value)
        : String(value ?? '')
    }
    return row
  }

  /**
   * Converts a Google Sheets row to an entity.
   * Deserializes JSON strings back to objects.
   */
  fromRow = <S extends S.Schema.Any>(_schema: S) => 
    (row: GoogleSpreadsheetRow): WithMeta<S.Schema.Type<S>> => {
      const data: Record<string, any> = {}
      const rawData = row.toObject()
      
      for (const [key, value] of Object.entries(rawData)) {
        if (key.startsWith('_')) {
          data[key] = key === '_deleted' ? value === 'true' : value
        } else {
          try {
            data[key] = value && (value.startsWith('{') || value.startsWith('[')) 
              ? JSON.parse(value) 
              : value
          } catch {
            data[key] = value
          }
        }
      }
      
      return data as WithMeta<S.Schema.Type<S>>
    }

  /**
   * Gets a single entity by ID from the cache.
   */
  readonly get = (id: RowId) => 
    pipe(
      Ref.get(this.cache),
      Effect.map(HashMap.get(id))
    )

  /**
   * Gets all entities from the cache.
   */
  readonly getAll = () =>
    pipe(
      Ref.get(this.cache),
      Effect.map(HashMap.values),
      Effect.map(ReadonlyArray.fromIterable)
    )

  /**
   * Sets/updates a single entity in cache and syncs to sheet.
   */
  readonly set = (id: RowId, data: WithMeta<T>) =>
    Effect.gen(function* (this: MemoryCache<T>) {
      // Update cache
      yield* Ref.update(this.cache, HashMap.set(id, data))
      
      // Sync to sheet
      const sheet = yield* Effect.try(() => {
        const foundSheet = this.doc.sheetsByTitle[this.sheetTitle]
        if (!foundSheet) {
          throw new Error(`Sheet '${this.sheetTitle}' not found`)
        }
        return foundSheet
      })
      
      const rows = yield* Effect.tryPromise(() => sheet.getRows())
      const row = rows.find(r => r.get('_id') === id)
      
      if (row) {
        // Update existing row
        const rowData = this.toRow(data)
        for (const [key, value] of Object.entries(rowData)) {
          row.set(key, value)
        }
        yield* Effect.tryPromise(() => row.save())
      } else {
        // Add new row
        yield* Effect.tryPromise(() => sheet.addRow(this.toRow(data)))
      }
      
      return data
    }.bind(this))

  /**
   * Removes an entity from the cache.
   */
  readonly remove = (id: RowId) =>
    Ref.update(this.cache, HashMap.remove(id))

  /**
   * Bulk sets multiple entities efficiently.
   * Uses batch operations when more than 10 items.
   */
  readonly bulkSet = (items: WithMeta<T>[]) =>
    Effect.gen(function* (this: MemoryCache<T>) {
      // Update cache
      const updates = items.map(item => [makeRowId(item._id), item] as const)
      yield* Ref.update(this.cache, cache => 
        updates.reduce((acc, [id, data]) => HashMap.set(id, data)(acc), cache)
      )
      
      // Sync to sheet
      const sheet = yield* Effect.try(() => {
        const foundSheet = this.doc.sheetsByTitle[this.sheetTitle]
        if (!foundSheet) {
          throw new Error(`Sheet '${this.sheetTitle}' not found`)
        }
        return foundSheet
      })
      
      if (items.length > 10) {
        // Batch update/create for performance
        const existingRows = yield* Effect.tryPromise(() => sheet.getRows())
        const existingRowMap = new Map(existingRows.map(row => [row.get('_id'), row]))
        
        const updatesAndInserts = items.map(item => ({
          item,
          existingRow: existingRowMap.get(item._id)
        }))
        
        // Update existing rows
        const updates = updatesAndInserts
          .filter(({ existingRow }) => existingRow)
          .map(({ item, existingRow }) => {
            const rowData = this.toRow(item)
            for (const [key, value] of Object.entries(rowData)) {
              existingRow!.set(key, value)
            }
            return existingRow!.save()
          })
        
        // Insert new rows
        const newRows = updatesAndInserts
          .filter(({ existingRow }) => !existingRow)
          .map(({ item }) => this.toRow(item))
        
        // Execute updates and inserts
        yield* Effect.tryPromise(() => Promise.all(updates))
        if (newRows.length > 0) {
          yield* Effect.tryPromise(() => sheet.addRows(newRows))
        }
      } else {
        // Individual updates for small batches
        yield* Effect.all(items.map(item => this.set(makeRowId(item._id), item)))
      }
      
      return items
    }.bind(this))

  /**
   * Queries the cache with a predicate function.
   */
  readonly query = (predicate: (item: WithMeta<T>) => boolean) =>
    pipe(
      this.getAll(),
      Effect.map(ReadonlyArray.filter(predicate))
    )
}