import * as S from 'effect/Schema'

// ============= Branded ID Types =============

/**
 * Account ID - Unique identifier for an account entity
 * Format: account_<steamId64> or account_<uniqueId>
 */
export const AccountId = S.String.pipe(
    S.pattern(/^account_[\w-]+$/),
    S.brand('AccountId'),
    S.annotations({
        identifier: 'AccountId',
        title: 'Account ID',
        description: 'Unique identifier for an account entity',
    })
)
export type AccountId = S.Schema.Type<typeof AccountId>

/**
 * Dialog ID - Unique identifier for a dialog entity
 * Format: dialog_<accountId>_<playerSteamId64> or dialog_<uniqueId>
 */
export const DialogId = S.String.pipe(
    S.pattern(/^dialog_[\w-]+$/),
    S.brand('DialogId'),
    S.annotations({
        identifier: 'DialogId',
        title: 'Dialog ID',
        description: 'Unique identifier for a dialog entity',
    })
)
export type DialogId = S.Schema.Type<typeof DialogId>

/**
 * System ID - Singleton identifier for system entity
 * Always: system
 */
export const SystemId = S.Literal('system').pipe(
    S.brand('SystemId'),
    S.annotations({
        identifier: 'SystemId',
        title: 'System ID',
        description: 'Singleton identifier for system entity',
    })
)
export type SystemId = S.Schema.Type<typeof SystemId>

/**
 * Steam ID 64 - 64-bit Steam ID
 * Re-exported from events/core.ts for convenience
 */
import { SteamID64 as SteamID64Schema } from '../events/core'
export { SteamID64Schema as SteamID64 }

// ============= ID Creation Helpers =============

/**
 * Create a properly formatted Account ID
 */
export const createAccountId = (steamId64: string): AccountId => `account_${steamId64}` as AccountId

/**
 * Create a properly formatted Dialog ID
 */
export const createDialogId = (accountId: string, playerSteamId64: string): DialogId =>
    `dialog_${accountId}_${playerSteamId64}` as DialogId

/**
 * Get the singleton System ID
 */
export const getSystemId = (): SystemId => 'system' as SystemId

// ============= ID Validation Helpers =============

/**
 * Check if a string is a valid Account ID
 */
export const isAccountId = (value: string): value is AccountId => /^account_[\w-]+$/.test(value)

/**
 * Check if a string is a valid Dialog ID
 */
export const isDialogId = (value: string): value is DialogId => /^dialog_[\w-]+$/.test(value)

/**
 * Check if a string is a valid System ID
 */
export const isSystemId = (value: string): value is SystemId => value === 'system'
