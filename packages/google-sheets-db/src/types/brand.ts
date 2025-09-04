/**
 * Utility type for creating branded types.
 * Branded types add compile-time safety to prevent mixing different kinds of IDs.
 */
export type Brand<T, B> = T & { readonly __brand: B }

/**
 * Branded type for Google Sheets row IDs.
 * These are UUIDs that uniquely identify each row in a sheet.
 */
export type RowId = Brand<string, 'RowId'>

/**
 * Branded type for Google Sheets sheet IDs.
 * These identify specific sheets within a Google Spreadsheet.
 */
export type SheetId = Brand<string, 'SheetId'>

/**
 * Creates a branded RowId from a string.
 * @param id - The raw string ID
 * @returns A branded RowId
 */
export const makeRowId = (id: string): RowId => id as RowId

/**
 * Creates a branded SheetId from a string.
 * @param id - The raw string ID
 * @returns A branded SheetId
 */
export const makeSheetId = (id: string): SheetId => id as SheetId