/**
 * MongoDB-style query operators for different data types.
 * Provides type-safe operators based on the field type.
 */
export type Operators<T> = T extends number 
  ? T | { 
      $gt?: T
      $lt?: T
      $gte?: T
      $lte?: T
      $in?: T[]
    }
  : T extends string 
  ? T | { 
      $regex?: string
      $in?: T[]
    }
  : T | { 
      $in?: T[]
    }

/**
 * Query type for filtering entities.
 * Supports MongoDB-like query syntax with type safety.
 * @template T - The entity type to query
 */
export type Query<T> = {
  [K in keyof T]?: Operators<T[K]>
} & {
  /** OR condition - matches if any of the nested queries match */
  $or?: Query<T>[]
  /** Maximum number of results to return */
  $limit?: number
  /** Number of results to skip */
  $offset?: number
  /** Field to order results by */
  $orderBy?: keyof T
  /** Sort order for results */
  $order?: 'asc' | 'desc'
  /** Whether to include soft-deleted entities */
  $includeDeleted?: boolean
}