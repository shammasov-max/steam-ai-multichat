import * as S from 'effect/Schema'
import { Draft } from '@reduxjs/toolkit'
import { createEntitySlice, type EntityActionPayload } from '../base/createEntitySlice'
import { AccountId } from '../types/branded'
import { SteamID64, AccountStatus } from '../events/core'

// ============= Event Payload Schemas =============

export const AccountConnectedPayloadSchema = S.Struct({
    accountId: AccountId,
    ts: S.optional(S.Number),
})
// Internal type - use inference
type AccountConnectedPayload = S.Schema.Type<typeof AccountConnectedPayloadSchema>

export const AccountDisconnectedPayloadSchema = S.Struct({
    accountId: AccountId,
    ts: S.optional(S.Number),
})
// Internal type - use inference
type AccountDisconnectedPayload = S.Schema.Type<typeof AccountDisconnectedPayloadSchema>

export const AccountAuthenticationFailedPayloadSchema = S.Struct({
    accountId: AccountId,
    reason: S.String,
})
// Internal type - use inference
type AccountAuthenticationFailedPayload = S.Schema.Type<
    typeof AccountAuthenticationFailedPayloadSchema
>

// ============= Entity Schemas =============

export const SessionSchema = S.Struct({
    SteamLoginSecure: S.String.annotations({
        title: 'Steam Login Secure',
        description: 'Steam login secure token',
    }),
    WebCookie: S.NullOr(S.String).annotations({
        title: 'Web Cookie',
        description: 'Steam web cookie',
    }),
    AccessToken: S.String.annotations({ title: 'Access Token', description: 'Steam access token' }),
    RefreshToken: S.String.annotations({
        title: 'Refresh Token',
        description: 'Steam refresh token',
    }),
    SteamID: S.Number.annotations({ title: 'Steam ID', description: 'Steam 64-bit user ID' }),
}).annotations({ title: 'Session', description: 'Steam session data' })

export const MaFileSchema = S.Struct({
    shared_secret: S.String.annotations({
        title: 'Shared Secret',
        description: 'Steam Guard shared secret',
    }),
    serial_number: S.String.annotations({
        title: 'Serial Number',
        description: 'Device serial number',
    }),
    revocation_code: S.String.annotations({
        title: 'Revocation Code',
        description: 'Recovery code',
    }),
    uri: S.String.annotations({ title: 'URI', description: 'Steam Guard TOTP URI' }),
    server_time: S.String.annotations({
        title: 'Server Time',
        description: 'Steam server timestamp',
    }),
    account_name: S.String.annotations({
        title: 'Account Name',
        description: 'Steam account username',
    }),
    token_gid: S.String.annotations({ title: 'Token GID', description: 'Token global identifier' }),
    identity_secret: S.String.annotations({
        title: 'Identity Secret',
        description: 'Steam Guard identity secret',
    }),
    secret_1: S.String.annotations({ title: 'Secret 1', description: 'Additional secret key' }),
    status: S.Number.annotations({ title: 'Status', description: 'Authenticator status code' }),
    confirm_type: S.Number.annotations({
        title: 'Confirm Type',
        description: 'Confirmation type identifier',
    }),
    fully_enrolled: S.Boolean.annotations({
        title: 'Fully Enrolled',
        description: 'Whether authenticator is fully enrolled',
    }),
    device_id: S.String.annotations({
        title: 'Device ID',
        description: 'Mobile device identifier',
    }),
    Session: SessionSchema,
}).annotations({ title: 'MaFile', description: 'Steam Guard mobile authenticator file' })

export const AccountSchema = S.Struct({
    accountId: AccountId.annotations({
        title: 'Account ID',
        description: 'Unique account identifier',
    }),
    steamId64: S.String.annotations({
        title: 'Steam ID 64',
        description: 'Steam 64-bit identifier',
    }),
    label: S.optional(
        S.String.annotations({ title: 'Label', description: 'Human-readable account label' })
    ),
    proxyUrl: S.String.annotations({ title: 'Proxy URL', description: 'Proxy server URL' }),
    status: AccountStatus.annotations({
        title: 'Status',
        description: 'Current account connection status',
    }),
    lastSeen: S.optional(
        S.Number.annotations({ title: 'Last Seen', description: 'Timestamp of last activity' })
    ),
}).annotations({
    title: 'Account',
    description: 'Steam account entity',
    indexes: [
        { fields: { accountId: 1 }, options: { unique: true } },
        { fields: { steamId64: 1 } },
        { fields: { status: 1 } },
        { fields: { proxyUrl: 1 } },
        { fields: { lastSeen: -1 } },
    ],
})

// Derive type from schema
export type Account = S.Schema.Type<typeof AccountSchema>
export type Session = S.Schema.Type<typeof SessionSchema>
export type MaFile = S.Schema.Type<typeof MaFileSchema>

// ============= Create Slice =============

export const accountSlice = createEntitySlice({
    name: 'account',
    initialEntities: [] as Draft<Account>[],
    entitySchema: AccountSchema as S.Schema<any, unknown, never>,
    entityReducers: {
        // Event: accounts/connected
        connected: (
            account: Draft<Account>,
            payload: EntityActionPayload<'account', { ts?: number }>
        ) => {
            account.status = 'connected'
            if (payload.ts) account.lastSeen = payload.ts
        },
        // Event: accounts/disconnected
        disconnected: (
            account: Draft<Account>,
            payload: EntityActionPayload<'account', { ts?: number }>
        ) => {
            account.status = 'disconnected'
            if (payload.ts) account.lastSeen = payload.ts
        },

        // Event: accounts/authenticationFailed
        authenticationFailed: (
            account: Draft<Account>,
            _payload: EntityActionPayload<'account', { reason: string }>
        ) => {
            account.status = 'authFailed'
            // Note: reason is available in payload but not stored in entity per spec
        },
    },
})

// ============= Exports =============

export const { actions: accountActions, reducer: accountReducer } = accountSlice
export default accountSlice
