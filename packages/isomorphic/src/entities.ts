import { defineEntity } from './define-entity'
import { getSystemId } from './types/branded'
import { AccountSchema } from './slices/accounts'
import { DialogSchema } from './slices/dialogs'
import { SystemStateSchema } from './slices/systemSlice'

// ============================================================================
// Entity Definitions - Single source of truth
// ============================================================================

/**
 * Account Entity
 * Manages Steam account connections and status
 */
export const Account = defineEntity(
    'account',
    AccountSchema,
    {}, // No custom entity reducers
    undefined, // No extra reducers
    [] // Initial state is empty
)

/**
 * Dialog Entity
 * Manages conversations between accounts and players
 */
export const Dialog = defineEntity(
    'dialog',
    DialogSchema,
    {}, // No custom entity reducers
    undefined, // No extra reducers
    [] // Initial state is empty
)

/**
 * System Entity
 * Global system configuration and state
 */
export const System = defineEntity(
    'system',
    SystemStateSchema,
    {}, // No custom entity reducers
    undefined, // No extra reducers
    [
        {
            systemId: getSystemId(),
            roundRobin: {
                pointer: 0,
                eligibleAccountIds: [],
            },
            rateLimits: {},
        },
    ] // System has initial state
)

// ============================================================================
// Unified Entities Export
// ============================================================================

/**
 * All entities in one place for easy access
 */
export const entities = {
    Account,
    Dialog,
    System,
} as const

// ============================================================================
// Redux Store Configuration Helper
// ============================================================================

/**
 * Creates the root reducer from all entity reducers
 */
export const createRootReducer = () => ({
    [Account.name]: Account.reducer,
    [Dialog.name]: Dialog.reducer,
    [System.name]: System.reducer,
})

// ============================================================================
// Layer Composition Helper
// ============================================================================

import { Layer } from 'effect'

/**
 * All repository layers combined
 */
export const AllRepositoriesLayer = Layer.mergeAll(
    Account.RepositoryLive,
    Dialog.RepositoryLive,
    System.RepositoryLive
)

// ============================================================================
// Type Exports
// ============================================================================

// Type exports use the actual schema types
import type { Account as AccountType } from './slices/accounts'
import type { Dialog as DialogType } from './slices/dialogs'
import type { SystemState as SystemType } from './slices/systemSlice'

export type AccountEntity = AccountType
export type DialogEntity = DialogType
export type SystemEntity = SystemType

// ============================================================================
// Mock Factories Export
// ============================================================================

export const mocks = {
    account: Account.mock,
    dialog: Dialog.mock,
    system: System.mock,
} as const
