import * as S from '@effect/schema/Schema'
import * as Effect from 'effect/Effect'
import * as ReadonlyArray from 'effect/Array'
import type { GoogleSpreadsheet } from 'google-spreadsheet'
import { SheetError } from '../errors/SheetError.js'

/**
 * Extracts all field names from a schema recursively.
 * Handles nested objects by flattening them with dot notation.
 */
const extractSchemaFields = (schema: S.Schema.Any): string[] => {
  const fields: string[] = []
  
  // Handle Schema.Struct types
  if ('fields' in schema && typeof schema.fields === 'object') {
    const schemaFields = schema.fields as Record<string, any>
    
    for (const [key, fieldSchema] of Object.entries(schemaFields)) {
      // Handle nested objects recursively
      if (fieldSchema && typeof fieldSchema === 'object' && 'fields' in fieldSchema) {
        const nestedFields = extractSchemaFields(fieldSchema)
        fields.push(...nestedFields.map(nested => `${key}.${nested}`))
      } else {
        fields.push(key)
      }
    }
  }
  
  return fields
}

/**
 * Configuration for sheet structure validation and auto-repair.
 */
export interface SheetValidationConfig {
  /** Auto-create missing sheets */
  autoCreateSheets?: boolean
  /** Auto-configure column headers */
  autoConfigureHeaders?: boolean
  /** Backup existing data before structural changes */
  backupBeforeChanges?: boolean
}

/**
 * Validates and auto-configures Google Sheets structure to match TypeScript schema.
 * 
 * @param doc - The Google Spreadsheet document
 * @param schema - Effect Schema defining the entity structure
 * @param sheetTitle - Name of the sheet to validate/create
 * @param config - Configuration options for validation behavior
 * @returns Effect containing the validated/configured sheet
 */
export const validateAndConfigureSheet = <S extends S.Schema.Any>(
  doc: GoogleSpreadsheet,
  schema: S,
  sheetTitle: string,
  config: SheetValidationConfig = {}
) => {
  const {
    autoCreateSheets = true,
    autoConfigureHeaders = true,
    backupBeforeChanges = false
  } = config

  return Effect.gen(function* () {
    // Extract all field names from schema
    const schemaFields = extractSchemaFields(schema)
    const metaFields = ['_id', '_deleted', '_deletedAt', '_createdAt', '_updatedAt']
    const allRequiredFields = [...metaFields, ...schemaFields]

    // Check if sheet exists
    let sheet = doc.sheetsByTitle[sheetTitle]
    
    if (!sheet) {
      if (autoCreateSheets) {
        console.log(`Creating missing sheet: ${sheetTitle}`)
        
        // Create the sheet
        sheet = yield* Effect.tryPromise({
          try: () => doc.addSheet({ 
            title: sheetTitle,
            headerValues: allRequiredFields 
          }),
          catch: (error) => new SheetError({ 
            reason: 'SHEET_CREATION_FAILED', 
            message: `Failed to create sheet ${sheetTitle}: ${String(error)}` 
          })
        })
      } else {
        return yield* Effect.fail(new SheetError({ 
          reason: 'NOT_FOUND', 
          message: `Sheet ${sheetTitle} not found and auto-creation is disabled` 
        }))
      }
    } else if (autoConfigureHeaders) {
      // Validate and update existing sheet headers
      const currentHeaders = sheet.headerValues || []
      const missingFields = ReadonlyArray.difference(allRequiredFields, currentHeaders)
      const extraFields = ReadonlyArray.difference(currentHeaders, allRequiredFields)

      if (!ReadonlyArray.isEmptyReadonlyArray(missingFields) || 
          !ReadonlyArray.isEmptyReadonlyArray(extraFields)) {
        
        console.log(`Updating headers for sheet: ${sheetTitle}`)
        console.log(`Missing fields: ${missingFields.join(', ')}`)
        console.log(`Extra fields: ${extraFields.join(', ')}`)

        // Backup existing data if requested
        if (backupBeforeChanges && currentHeaders.length > 0 && sheet) {
          const rows = yield* Effect.tryPromise(() => sheet.getRows())
          console.log(`Backing up ${rows.length} rows before header changes`)
          
          // Store backup data
          const backupData = rows.map(row => {
            const data: Record<string, any> = {}
            for (const header of currentHeaders) {
              data[header] = row.get(header)
            }
            return data
          })

          // Clear sheet
          if (rows.length > 0 && sheet) {
            yield* Effect.tryPromise(() => sheet.clear())
          }

          // Set new headers
          if (sheet) {
            yield* Effect.tryPromise(() => sheet.setHeaderRow(allRequiredFields))
          }

          // Restore data with field mapping
          if (backupData.length > 0) {
            const restoredRows = backupData.map(backup => {
              const restored: Record<string, any> = {}
              
              // Map existing fields
              for (const field of allRequiredFields) {
                if (field in backup) {
                  restored[field] = backup[field]
                } else if (metaFields.includes(field)) {
                  // Generate default meta values for missing fields
                  switch (field) {
                    case '_id':
                      restored[field] = crypto.randomUUID()
                      break
                    case '_deleted':
                      restored[field] = false
                      break
                    case '_createdAt':
                    case '_updatedAt':
                      restored[field] = new Date().toISOString()
                      break
                    case '_deletedAt':
                      restored[field] = null
                      break
                    default:
                      restored[field] = null
                  }
                } else {
                  // Set schema fields to null/default if missing
                  restored[field] = null
                }
              }
              
              return restored
            })

            if (sheet) {
              yield* Effect.tryPromise(() => sheet.addRows(restoredRows))
            }
          }
        } else {
          // Simple header update without data preservation
          if (sheet) {
            yield* Effect.tryPromise(() => sheet.setHeaderRow(allRequiredFields))
          }
        }
      }
    }

    return sheet
  })
}

/**
 * Validates the entire spreadsheet structure against multiple schemas.
 * Useful for validating all sheets at once during initialization.
 * 
 * @param doc - The Google Spreadsheet document
 * @param schemaConfigs - Array of schema configurations to validate
 * @param globalConfig - Global configuration for all validations
 * @returns Effect containing validation results
 */
export const validateSpreadsheetStructure = (
  doc: GoogleSpreadsheet,
  schemaConfigs: Array<{
    schema: S.Schema.Any
    sheetTitle: string
    config?: SheetValidationConfig
  }>,
  globalConfig: SheetValidationConfig = {}
) => {
  return Effect.gen(function* () {
    const results: Array<{
      sheetTitle: string
      success: boolean
      created: boolean
      updated: boolean
      error?: string
    }> = []

    for (const { schema, sheetTitle, config } of schemaConfigs) {
      const mergedConfig = { ...globalConfig, ...config }
      
      try {
        const existedBefore = !!doc.sheetsByTitle[sheetTitle]
        const sheet = yield* validateAndConfigureSheet(doc, schema, sheetTitle, mergedConfig)
        
        results.push({
          sheetTitle,
          success: true,
          created: !existedBefore,
          updated: existedBefore && mergedConfig.autoConfigureHeaders !== false,
        })
      } catch (error) {
        results.push({
          sheetTitle,
          success: false,
          created: false,
          updated: false,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  })
}