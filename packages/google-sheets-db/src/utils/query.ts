import type { Query } from '../types/query.js'
import type { WithMeta } from '../types/metadata.js'

/**
 * Matches an item against a query object.
 * Supports MongoDB-like query operators and conditions.
 * @param item - The item to test
 * @param query - The query conditions
 * @returns True if the item matches the query
 */
export const matchQuery = <T>(
  item: WithMeta<T>, 
  query: Query<T>
): boolean => {
  // Check soft-delete status
  if (query.$includeDeleted !== true && item._deleted) {
    return false
  }
  
  // Handle OR conditions
  if (query.$or) {
    return query.$or.some(q => matchQuery(item, q))
  }
  
  // Check each field condition
  for (const [key, condition] of Object.entries(query)) {
    // Skip special query operators
    if (key.startsWith('$')) continue
    
    const value = item[key as keyof WithMeta<T>]
    
    // Handle operator conditions
    if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
      const ops = condition as any
      
      // Comparison operators
      if ('$gt' in ops && !(value > ops.$gt)) return false
      if ('$lt' in ops && !(value < ops.$lt)) return false
      if ('$gte' in ops && !(value >= ops.$gte)) return false
      if ('$lte' in ops && !(value <= ops.$lte)) return false
      
      // Array membership
      if ('$in' in ops && !ops.$in.includes(value)) return false
      
      // Regex matching
      if ('$regex' in ops && !new RegExp(ops.$regex).test(String(value))) return false
    } else if (value !== condition) {
      // Direct equality check
      return false
    }
  }
  
  return true
}