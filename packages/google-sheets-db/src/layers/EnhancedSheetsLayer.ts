import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'
import * as Layer from 'effect/Layer'
import * as Effect from 'effect/Effect'
import * as S from '@effect/schema/Schema'
import { SheetsService } from '../services/SheetsService.js'
import { SheetsServiceImpl } from '../services/SheetsServiceImpl.js'
import { SheetError } from '../errors/SheetError.js'
import { 
  validateSpreadsheetStructure, 
  type SheetValidationConfig 
} from '../utils/schema-validator.js'

/**
 * Enhanced configuration for creating a Google Sheets connection with schema validation.
 */
export interface EnhancedSheetsConfig {
  /** The Google Spreadsheet ID */
  spreadsheetId: string
  /** Service account credentials */
  credentials: {
    /** Service account email */
    client_email: string
    /** Service account private key */
    private_key: string
  }
  /** Optional schemas to validate/configure during initialization */
  schemas?: Array<{
    schema: S.Schema.Any
    sheetTitle: string
    config?: SheetValidationConfig
  }>
  /** Global validation configuration */
  validationConfig?: SheetValidationConfig
}

/**
 * Creates an enhanced Effect Layer for Google Sheets with automatic schema validation.
 * This layer handles authentication, spreadsheet initialization, and optional schema validation.
 * 
 * @param config - Enhanced configuration including schemas to validate
 * @returns Layer providing SheetsService with validated structure
 * 
 * @example
 * const layer = EnhancedSheetsLayer({
 *   spreadsheetId: 'your-sheet-id',
 *   credentials: {
 *     client_email: 'service-account@project.iam.gserviceaccount.com',
 *     private_key: '-----BEGIN PRIVATE KEY-----\n...'
 *   },
 *   schemas: [
 *     { schema: UserSchema, sheetTitle: 'Users' },
 *     { schema: OrderSchema, sheetTitle: 'Orders', config: { backupBeforeChanges: true } }
 *   ],
 *   validationConfig: { autoCreateSheets: true, autoConfigureHeaders: true }
 * })
 */
export const EnhancedSheetsLayer = (config: EnhancedSheetsConfig) =>
  Layer.effect(
    SheetsService,
    Effect.gen(function* () {
      // Create JWT auth client
      const serviceAccountAuth = new JWT({
        email: config.credentials.client_email,
        key: config.credentials.private_key,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
        ],
      })
      
      // Create document with auth
      const doc = new GoogleSpreadsheet(config.spreadsheetId, serviceAccountAuth)
      
      // Load spreadsheet metadata
      yield* Effect.tryPromise({
        try: () => doc.loadInfo(),
        catch: () => new SheetError({ 
          reason: 'NETWORK', 
          message: 'Failed to load sheet info' 
        })
      })

      // Validate and configure schemas if provided
      if (config.schemas && config.schemas.length > 0) {
        console.log(`Validating ${config.schemas.length} schemas...`)
        
        const results = yield* validateSpreadsheetStructure(
          doc,
          config.schemas,
          config.validationConfig
        )

        // Log validation results
        for (const result of results) {
          if (result.success) {
            const actions: string[] = []
            if (result.created) actions.push('created')
            if (result.updated) actions.push('updated headers')
            
            console.log(
              `✓ Sheet "${result.sheetTitle}": ${
                actions.length > 0 ? actions.join(', ') : 'validated'
              }`
            )
          } else {
            console.error(`✗ Sheet "${result.sheetTitle}": ${result.error}`)
          }
        }

        // Check for any critical failures
        const failures = results.filter(r => !r.success)
        if (failures.length > 0) {
          const failedSheets = failures.map(f => f.sheetTitle).join(', ')
          yield* Effect.logWarning(
            `Failed to validate ${failures.length} sheets: ${failedSheets}`
          )
        }

        const successes = results.filter(r => r.success).length
        console.log(`Schema validation complete: ${successes}/${results.length} sheets validated`)
      }
      
      return new SheetsServiceImpl(doc)
    })
  )

/**
 * Creates a simple enhanced layer with basic validation settings.
 * Convenient for common use cases.
 */
export const createEnhancedSheetsLayer = (
  spreadsheetId: string,
  credentials: { client_email: string; private_key: string },
  schemas: Array<{ schema: S.Schema.Any; sheetTitle: string }> = []
) => {
  return EnhancedSheetsLayer({
    spreadsheetId,
    credentials,
    schemas,
    validationConfig: {
      autoCreateSheets: true,
      autoConfigureHeaders: true,
      backupBeforeChanges: false // Default to false for performance
    }
  })
}