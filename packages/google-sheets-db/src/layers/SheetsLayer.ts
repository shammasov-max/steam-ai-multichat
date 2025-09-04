import { GoogleSpreadsheet } from 'google-spreadsheet'
import * as Layer from 'effect/Layer'
import * as Effect from 'effect/Effect'
import { SheetsService } from '../services/SheetsService.js'
import { SheetsServiceImpl } from '../services/SheetsServiceImpl.js'
import { SheetError } from '../errors/SheetError.js'

/**
 * Configuration for creating a Google Sheets connection.
 */
export interface SheetsConfig {
  /** The Google Spreadsheet ID */
  spreadsheetId: string
  /** Service account credentials */
  credentials: {
    /** Service account email */
    client_email: string
    /** Service account private key */
    private_key: string
  }
}

/**
 * Creates an Effect Layer for Google Sheets dependency injection.
 * This layer handles authentication and spreadsheet initialization.
 * 
 * @param config - Configuration including spreadsheet ID and credentials
 * @returns Layer providing SheetsService
 * 
 * @example
 * const layer = SheetsLayer({
 *   spreadsheetId: 'your-sheet-id',
 *   credentials: {
 *     client_email: 'service-account@project.iam.gserviceaccount.com',
 *     private_key: '-----BEGIN PRIVATE KEY-----\n...'
 *   }
 * })
 * 
 * const program = createRepository(UserSchema, 'Users')
 *   .pipe(Effect.provide(layer))
 */
export const SheetsLayer = (config: SheetsConfig) =>
  Layer.effect(
    SheetsService,
    Effect.gen(function* () {
      const doc = new GoogleSpreadsheet(config.spreadsheetId)
      
      // Authenticate with service account
      yield* Effect.tryPromise({
        try: () => doc.useServiceAccountAuth(config.credentials),
        catch: () => new SheetError({ 
          reason: 'AUTH', 
          message: 'Authentication failed' 
        })
      })
      
      // Load spreadsheet metadata
      yield* Effect.tryPromise({
        try: () => doc.loadInfo(),
        catch: () => new SheetError({ 
          reason: 'NETWORK', 
          message: 'Failed to load sheet info' 
        })
      })
      
      return new SheetsServiceImpl(doc)
    })
  )