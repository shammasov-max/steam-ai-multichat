import * as S from '@effect/schema/Schema'

/**
 * Custom error class for Google Sheets operations.
 * Extends TaggedError for proper Effect error handling.
 */
export class SheetError extends S.TaggedError<SheetError>()('SheetError', {
  /** The reason for the error */
  reason: S.Literal(
    'AUTH',                   // Authentication failed
    'NOT_FOUND',              // Sheet or row not found
    'VALIDATION',             // Schema validation failed
    'NETWORK',                // Network request failed
    'SHEET_CREATION_FAILED',  // Sheet creation failed
    'DELETE_FAILED'           // Row deletion failed
  ),
  /** Human-readable error message */
  message: S.String,
}) {}