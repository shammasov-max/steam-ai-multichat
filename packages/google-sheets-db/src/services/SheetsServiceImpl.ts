import type { GoogleSpreadsheet, GoogleSpreadsheetRow } from 'google-spreadsheet'
import * as Effect from 'effect/Effect'
import { SheetError } from '../errors/SheetError.js'
import type { SheetsService } from './SheetsService.js'

/**
 * Implementation of the SheetsService interface.
 * Handles actual Google Sheets API operations.
 */
export class SheetsServiceImpl implements SheetsService {
  constructor(readonly doc: GoogleSpreadsheet) {}
  
  /**
   * Gets all rows from a specific sheet.
   * @param title - The sheet title/name
   * @returns Effect containing array of rows or SheetError
   */
  getSheet = (title: string): Effect.Effect<GoogleSpreadsheetRow[], SheetError> =>
    Effect.gen(function* (this: SheetsServiceImpl) {
      const sheet = this.doc.sheetsByTitle[title]
      if (!sheet) {
        return yield* Effect.fail(new SheetError({
          reason: 'NOT_FOUND',
          message: `Sheet ${title} not found`
        }))
      }
      
      return yield* Effect.tryPromise({
        try: () => sheet.getRows(),
        catch: () => new SheetError({ 
          reason: 'NETWORK', 
          message: 'Failed to fetch rows' 
        })
      })
    }.bind(this))
}