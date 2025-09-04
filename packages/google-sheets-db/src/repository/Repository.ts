import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import type { Query } from '../types/query.js'
import type { WithMeta } from '../types/metadata.js'
import type { SheetError } from '../errors/SheetError.js'

/**
 * Repository interface for CRUD operations on Google Sheets data.
 * Provides a type-safe, database-like API for sheet operations.
 * @template T - The entity type managed by this repository
 */
export interface Repository<T> {
  /**
   * Creates a new entity.
   * Automatically adds metadata (ID, timestamps).
   * @param data - The entity data to create
   * @returns The created entity with metadata
   */
  readonly create: (data: T) => Effect.Effect<WithMeta<T>, SheetError>
  
  /**
   * Creates multiple entities in a batch.
   * More efficient than multiple individual creates.
   * @param data - Array of entities to create
   * @returns Array of created entities with metadata
   */
  readonly createMany: (data: T[]) => Effect.Effect<WithMeta<T>[], SheetError>
  
  /**
   * Finds a single entity matching the query.
   * Returns None if no match found.
   * @param query - Query conditions
   * @returns Option containing the matched entity or None
   */
  readonly findOne: (query: Query<T>) => Effect.Effect<Option.Option<WithMeta<T>>, SheetError>
  
  /**
   * Finds all entities matching the query.
   * Supports pagination, sorting, and filtering.
   * @param query - Optional query conditions
   * @returns Array of matching entities
   */
  readonly findMany: (query?: Query<T>) => Effect.Effect<WithMeta<T>[], SheetError>
  
  /**
   * Updates entities matching the query.
   * Automatically updates the _updatedAt timestamp.
   * @param query - Query to find entities to update
   * @param data - Partial data to update
   * @returns Number of entities updated
   */
  readonly update: (query: Query<T>, data: Partial<T>) => Effect.Effect<number, SheetError>
  
  /**
   * Soft-deletes entities matching the query.
   * Sets _deleted flag and _deletedAt timestamp.
   * @param query - Query to find entities to delete
   * @returns Number of entities deleted
   */
  readonly delete: (query: Query<T>) => Effect.Effect<number, SheetError>
  
  /**
   * Permanently removes soft-deleted entities from the sheet.
   * This operation cannot be undone.
   * @returns Number of entities purged
   */
  readonly purgeDeleted: () => Effect.Effect<number, SheetError>
  
  /**
   * Counts entities matching the query.
   * @param query - Optional query conditions
   * @returns Count of matching entities
   */
  readonly count: (query?: Query<T>) => Effect.Effect<number, SheetError>
  
  /**
   * Synchronizes the cache with the Google Sheet.
   * Useful for multi-client scenarios where the sheet may be modified externally.
   */
  readonly sync: () => Effect.Effect<void, SheetError>
}