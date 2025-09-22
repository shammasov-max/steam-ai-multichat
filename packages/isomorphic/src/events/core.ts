import * as S from 'effect/Schema'

// Branded primitives
export const SteamID64 = S.String.pipe(S.pattern(/^\d{17}$/), S.brand('SteamID64'))
type SteamID64Type = S.Schema.Type<typeof SteamID64>

// Enums (fixed by PRD)
export const AccountStatus = S.Union(
    S.Literal('connecting'),
    S.Literal('connected'),
    S.Literal('disconnected'),
    S.Literal('authFailed')
)
type AccountStatusType = S.Schema.Type<typeof AccountStatus>
