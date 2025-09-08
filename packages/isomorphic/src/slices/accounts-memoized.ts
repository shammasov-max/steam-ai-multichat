import * as S from 'effect/Schema'
import { Draft } from '@reduxjs/toolkit'
import { createEntitySliceWithMemoization } from '../base/createEntitySliceWithMemoization'
import { type EntityActionPayload } from '../base/createEntitySlice'
import { AccountId } from '../types/branded'
import { createSelector } from 'reselect'

// Re-export types from original accounts.ts (schemas are already exported via slices/index)
export type {
    Account,
    Session,
    MaFile,
    AccountConnectedPayload,
    AccountDisconnectedPayload,
    AccountAuthenticationFailedPayload,
    AccountStatus as AccountStatusType
} from './accounts'

// Import the original types we need
import type { Account, AccountStatus as AccountStatusType } from './accounts'
import { AccountSchema } from './accounts'

// ============= Create Memoized Slice =============

export const accountSliceMemoized = createEntitySliceWithMemoization({
    name: 'account',
    initialEntities: [] as Draft<Account>[],
    entitySchema: AccountSchema as any,
    entityReducers: {
        // Event: accounts/connected
        connected: (account: Draft<Account>, payload: EntityActionPayload<'account', { ts?: number }>) => {
            account.status = 'connected'
            if (payload.ts) {
                account.lastSeen = payload.ts
            }
        },
        
        // Event: accounts/disconnected
        disconnected: (account: Draft<Account>, payload: EntityActionPayload<'account', { ts?: number }>) => {
            account.status = 'disconnected'
            if (payload.ts) {
                account.lastSeen = payload.ts
            }
        },
        
        // Event: accounts/authenticationFailed
        authenticationFailed: (account: Draft<Account>, payload: EntityActionPayload<'account', { reason: string }>) => {
            account.status = 'authFailed'
        }
    }
})

// ============= Additional Memoized Selectors =============

// Get accounts by status
export const selectAccountsByStatus = createSelector(
    [accountSliceMemoized.selectAllEntities, (_state: any, status: AccountStatusType) => status],
    (accounts, status) => accounts.filter(account => account.status === status)
)

// Get connected accounts
export const selectConnectedAccounts = createSelector(
    [accountSliceMemoized.selectAllEntities],
    accounts => accounts.filter(account => account.status === 'connected')
)

// Get disconnected accounts
export const selectDisconnectedAccounts = createSelector(
    [accountSliceMemoized.selectAllEntities],
    accounts => accounts.filter(account => account.status === 'disconnected')
)

// Get accounts needing reconnection (disconnected or authFailed)
export const selectAccountsNeedingReconnection = createSelector(
    [accountSliceMemoized.selectAllEntities],
    accounts => accounts.filter(account => 
        account.status === 'disconnected' || account.status === 'authFailed'
    )
)

// Get account by Steam ID
export const selectAccountBySteamId = createSelector(
    [accountSliceMemoized.selectAllEntities, (_state: any, steamId64: string) => steamId64],
    (accounts, steamId64) => accounts.find(account => account.steamId64 === steamId64)
)

// Get accounts using a specific proxy
export const selectAccountsByProxy = createSelector(
    [accountSliceMemoized.selectAllEntities, (_state: any, proxyUrl: string) => proxyUrl],
    (accounts, proxyUrl) => accounts.filter(account => account.proxyUrl === proxyUrl)
)

// Get recently active accounts (last seen within specified milliseconds)
export const selectRecentlyActiveAccounts = createSelector(
    [accountSliceMemoized.selectAllEntities, (_state: any, withinMs: number = 3600000) => withinMs],
    (accounts, withinMs) => {
        const now = Date.now()
        return accounts.filter(account => 
            account.lastSeen && (now - account.lastSeen) <= withinMs
        )
    }
)

// ============= Exports =============

export const { 
    actions: accountActionsMemoized, 
    reducer: accountReducerMemoized 
} = accountSliceMemoized

export default accountSliceMemoized