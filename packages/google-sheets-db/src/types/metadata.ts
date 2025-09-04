import * as S from '@effect/schema/Schema'
import type { RowId } from './brand.js'

/**
 * Schema for metadata that is automatically added to all entities.
 * Includes ID, timestamps, and soft-delete tracking.
 */
export const Metadata = S.Struct({
  _id: S.String.pipe(S.brand('RowId')),
  _deleted: S.optional(S.Boolean),
  _deletedAt: S.optional(S.String),
  _createdAt: S.String,
  _updatedAt: S.String,
})

/**
 * Type derived from the Metadata schema.
 * Contains all metadata fields for an entity.
 */
export type Metadata = S.Schema.Type<typeof Metadata>

/**
 * Utility type that adds metadata fields to any entity type.
 * Used throughout the repository to ensure all entities have required metadata.
 * @template T - The base entity type
 */
export type WithMeta<T> = T & Metadata