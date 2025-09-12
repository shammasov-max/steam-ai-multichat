import * as S from 'effect/Schema'

// Branded primitives
export const SteamID64 = S.String.pipe(S.pattern(/^\d{17}$/), S.brand('SteamID64'))
export type SteamID64 = S.Schema.Type<typeof SteamID64>

// Enums (fixed by PRD)
export const AccountStatus = S.Union(
    S.Literal('connecting'),
    S.Literal('connected'),
    S.Literal('disconnected'),
    S.Literal('authFailed')
)
export type AccountStatus = S.Schema.Type<typeof AccountStatus>
