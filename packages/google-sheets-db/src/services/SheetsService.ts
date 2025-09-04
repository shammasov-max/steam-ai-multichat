import type { GoogleSpreadsheet, GoogleSpreadsheetRow } from 'google-spreadsheet'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import type { SheetError } from '../errors/SheetError.js'

/**
 * Service interface for Google Sheets operations.
 * Provides access to the spreadsheet document and sheet operations.
 */
export interface SheetsService {
  /** The Google Spreadsheet document instance */
  readonly doc: GoogleSpreadsheet
  
  /**
   * Gets all rows from a specific sheet.
   * @param title - The sheet title/name
   * @returns Effect containing array of rows or SheetError
   */
  readonly getSheet: (title: string) => Effect.Effect<GoogleSpreadsheetRow[], SheetError>
}

/**
 * Context tag for dependency injection of SheetsService.
 * Used with Effect's Layer system for clean dependency management.
 */
export const SheetsService = Context.GenericTag<SheetsService>('SheetsService')