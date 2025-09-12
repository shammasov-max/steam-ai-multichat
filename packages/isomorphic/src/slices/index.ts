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
export { type AccountStatus, SteamID64 } from '../events/core'

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

// ============= System Slice =============
export {
    systemSlice,
    systemActions,
    systemReducer,
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
import { systemSlice } from './system'

/**
 * All slice reducers ready to be mounted in the store
 * Keys are pluralized as per createEntitySlice convention
 */
export const sliceReducers = {
    accounts: accountSlice.reducer,
    dialogs: dialogSlice.reducer,
    systems: systemSlice.reducer, // Note: 'systems' plural even though it's singleton
} as const

/**
 * All slice actions for convenient access
 */
export const sliceActions = {
    accounts: accountSlice.actions,
    dialogs: dialogSlice.actions,
    systems: systemSlice.actions,
} as const

/**
 * All slice selectors for convenient access
 */
export const sliceSelectors = {
    accounts: {
        selectEntity: accountSlice.selectEntity,
        selectAllEntities: accountSlice.selectAllEntities,
        selectEntityIds: accountSlice.selectEntityIds,
    },
    dialogs: {
        selectEntity: dialogSlice.selectEntity,
        selectAllEntities: dialogSlice.selectAllEntities,
        selectEntityIds: dialogSlice.selectEntityIds,
    },
    systems: {
        selectEntity: systemSlice.selectEntity,
        selectAllEntities: systemSlice.selectAllEntities,
        selectEntityIds: systemSlice.selectEntityIds,
        // Helper selector for the singleton system entity
        selectSystem: (state: ReturnType<typeof systemSlice.reducer>) =>
            systemSlice.selectEntity(state, 'system'),
    },
} as const

// ============= Type exports for store setup =============

export type RootState = {
    accounts: ReturnType<typeof accountSlice.reducer>
    dialogs: ReturnType<typeof dialogSlice.reducer>
    systems: ReturnType<typeof systemSlice.reducer>
}
