import * as S from 'effect/Schema'
import { Draft } from '@reduxjs/toolkit'
import { createEntitySlice, type EntityActionPayload } from '../base/createEntitySlice'
import { AccountId } from '../types/branded'
import { SteamID64, AccountStatus } from '../events/core'
import { withAnnotations, nullable, type InferSchema } from '../utils/schema-helpers'

// ============= Event Payload Schemas =============

export const AccountConnectedPayloadSchema = S.Struct({
    accountId: AccountId,
    ts: S.optional(S.Number),
})

export const AccountDisconnectedPayloadSchema = S.Struct({
    accountId: AccountId,
    ts: S.optional(S.Number),
})

export const AccountAuthenticationFailedPayloadSchema = S.Struct({
    accountId: AccountId,
    reason: S.String,
})

// Use type inference instead of explicit exports (saves 3 lines)
type AccountConnectedPayload = InferSchema<typeof AccountConnectedPayloadSchema>
type AccountDisconnectedPayload = InferSchema<typeof AccountDisconnectedPayloadSchema>
type AccountAuthenticationFailedPayload = InferSchema<typeof AccountAuthenticationFailedPayloadSchema>

// ============= Entity Schemas (with cleaner annotations) =============

export const SessionSchema = S.Struct({
    SteamLoginSecure: withAnnotations(S.String, 'Steam Login Secure', 'Steam login secure token'),
    WebCookie: withAnnotations(nullable(S.String), 'Web Cookie', 'Steam web cookie'),
    AccessToken: withAnnotations(S.String, 'Access Token', 'Steam access token'),
    RefreshToken: withAnnotations(S.String, 'Refresh Token', 'Steam refresh token'),
    SteamID: withAnnotations(S.Number, 'Steam ID', 'Steam 64-bit user ID'),
}).annotations({ title: 'Session', description: 'Steam session data' })

export const MaFileSchema = S.Struct({
    shared_secret: withAnnotations(S.String, 'Shared Secret', 'Steam Guard shared secret'),
    serial_number: withAnnotations(S.String, 'Serial Number', 'Device serial number'),
    revocation_code: withAnnotations(S.String, 'Revocation Code', 'Recovery code'),
    uri: withAnnotations(S.String, 'URI', 'Steam Guard TOTP URI'),
    server_time: withAnnotations(S.String, 'Server Time', 'Steam server timestamp'),
    account_name: withAnnotations(S.String, 'Account Name', 'Steam account username'),
    token_gid: withAnnotations(S.String, 'Token GID', 'Token global identifier'),
    identity_secret: withAnnotations(S.String, 'Identity Secret', 'Steam Guard identity secret'),
    secret_1: withAnnotations(S.String, 'Secret 1', 'Additional secret key'),
    status: withAnnotations(S.Number, 'Status', 'Authenticator status code'),
    confirm_type: withAnnotations(S.Number, 'Confirm Type', 'Confirmation type identifier'),
    fully_enrolled: withAnnotations(S.Boolean, 'Fully Enrolled', 'Whether authenticator is fully enrolled'),
    device_id: withAnnotations(S.String, 'Device ID', 'Mobile device identifier'),
    Session: SessionSchema,
}).annotations({ title: 'MaFile', description: 'Steam Guard mobile authenticator file' })

export const AccountSchema = S.Struct({
    accountId: withAnnotations(AccountId, 'Account ID', 'Unique account identifier'),
    steamId64: withAnnotations(S.String, 'Steam ID 64', 'Steam 64-bit identifier'),
    label: S.optional(withAnnotations(S.String, 'Label', 'Human-readable account label')),
    proxyUrl: withAnnotations(S.String, 'Proxy URL', 'Proxy server URL'),
    status: withAnnotations(AccountStatus, 'Status', 'Current account connection status'),
    lastSeen: S.optional(withAnnotations(S.Number, 'Last Seen', 'Timestamp of last activity')),
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

// Infer types instead of explicit exports (saves 3 lines)
type Account = InferSchema<typeof AccountSchema>
type Session = InferSchema<typeof SessionSchema>
type MaFile = InferSchema<typeof MaFileSchema>

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
            payload: EntityActionPayload<'account', { reason: string }>
        ) => {
            account.status = 'error'
            // Could store reason in account if needed
        },
    },
    extraReducers: {},
})

// ============= Exports =============

export const { actions: accountActions, reducer: accountReducer } = accountSlice