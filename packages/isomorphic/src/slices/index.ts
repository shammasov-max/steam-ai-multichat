// ============= Accounts Slice =============
export {
    accountSlice,
    accountActions,
    accountReducer,
    type Account,
    AccountSchema,
    type AccountConnectedPayload,
    type AccountDisconnectedPayload,
    type AccountAuthenticationFailedPayload,
} from './accounts'

// ============= Core Types =============
export { type AccountStatusType as AccountStatus, SteamID64 } from '../events/core'

// ============= Dialogs Slice =============
export {
    dialogSlice,
    dialogActions,
    dialogReducer,
    type Dialog,
    type DialogMsg,
    type DialogMsgFrom,
    type DialogStatus,
    type UserInfo,
    type ScoringFactors,
    type Issue,
    DialogSchema,
    DialogMsgSchema,
    UserInfoSchema,
    ScoringFactorsSchema,
    IssueSchema,
    type DialogCreatedPayload,
    type MessageReceivedPayload,
    type MessageSentPayload,
    type DialogAssessedPayload,
    type DialogStatusUpdatedPayload,
    type OperatorAlertPayload,
    type DialogProgressUpdatedPayload,
} from './dialogs'

// ============= System Config Slice =============
export {
    systemSlice,
    systemPatched,
    systemReducer,
    selectSystem,
    type SystemState,
    SystemStateSchema,
    SYSTEM_CONFIG_ID,
    DEFAULT_SYSTEM_CONFIG,
    initializeSystemConfig,
} from './systemSlice'

// ============= Legacy System Slice (to be removed) =============
export {
    systemSlice as legacySystemSlice,
    systemActions as legacySystemActions,
    systemReducer as legacySystemReducer,
    type System,
    type RoundRobinState,
    type RateLimitEntry,
    SystemSchema,
    RoundRobinSchema,
    RateLimitEntrySchema,
    type SnapshotPayload,
    type FriendInviteSentPayload,
    type FriendInviteAcceptedPayload,
    type FriendInviteFailedPayload,
    type MaFileAssignedPayload,
    type MaFileReleasedPayload,
    type ErrorLoggedPayload,
} from './system'

// ============= Re-export all slices for convenient store setup =============

import { accountSlice } from './accounts'
import { dialogSlice } from './dialogs'
import { systemSlice } from './systemSlice'
import { systemSlice as legacySystemSlice } from './system'

/**
 * All slice reducers ready to be mounted in the store
 * Keys are pluralized as per createEntitySlice convention
 */
export const sliceReducers = {
    accounts: accountSlice.reducer,
    dialogs: dialogSlice.reducer,
    system: systemSlice.reducer, // Singleton system config
    systems: legacySystemSlice.reducer, // Legacy - to be removed
} as const

/**
 * All slice actions for convenient access
 */
export const sliceActions = {
    accounts: accountSlice.actions,
    dialogs: dialogSlice.actions,
    system: systemSlice.actions,
    systems: legacySystemSlice.actions, // Legacy - to be removed
} as const

/**
 * All slice selectors for convenient access
 */
export const sliceSelectors = {
    accounts: {
        selectEntity: accountSlice.selectors.selectEntity,
        selectAllEntities: accountSlice.selectors.selectAllEntities,
        selectEntityIds: accountSlice.selectors.selectEntityIds,
    },
    dialogs: {
        selectEntity: dialogSlice.selectors.selectEntity,
        selectAllEntities: dialogSlice.selectors.selectAllEntities,
        selectEntityIds: dialogSlice.selectors.selectEntityIds,
    },
    system: selectSystem, // New system config selector
    systems: {
        // Legacy selectors - to be removed
        selectEntity: legacySystemSlice.selectors.selectEntity,
        selectAllEntities: legacySystemSlice.selectors.selectAllEntities,
        selectEntityIds: legacySystemSlice.selectors.selectEntityIds,
        selectSystem: (state: ReturnType<typeof legacySystemSlice.reducer>) =>
            legacySystemSlice.selectors.selectEntity(state, 'system'),
    },
} as const

// ============= Type exports for store setup =============

export type RootState = {
    accounts: ReturnType<typeof accountSlice.reducer>
    dialogs: ReturnType<typeof dialogSlice.reducer>
    system: ReturnType<typeof systemSlice.reducer>
    systems: ReturnType<typeof legacySystemSlice.reducer> // Legacy - to be removed
}

// ============= Root Reducer =============

import { combineReducers } from '@reduxjs/toolkit'

/**
 * Root reducer combining all entity slices
 * This is used to create the Redux store
 */
export const rootReducer = combineReducers({
    accounts: accountSlice.reducer,
    dialogs: dialogSlice.reducer,
    systems: systemSlice.reducer,
})
