import { Effect, Layer, Context, pipe, Option } from 'effect'
import * as S from 'effect/Schema'
import { 
    AccountSchema, 
    AccountStatus,
    MaFileSchema,
    type Account,
    type MaFile,
    type AccountStatus as AccountStatusType
} from '@packages/isomorphic/src/slices/accounts.js'
import { 
    AbstractRepository,
    Database,
    EntityNotFoundError,
    RepositoryError,
    validateEntity,
    saveEvent,
    type BaseRepository
} from './base/Repository.js'
import type { EventRecord } from '../types.js'

// ============= AccountRepository Interface =============

export interface AccountRepository extends BaseRepository<Account, string> {
    // Find operations
    readonly findBySteamId64: (steamId64: string) => Effect.Effect<Option.Option<Account>>
    readonly findByStatus: (status: AccountStatusType) => Effect.Effect<readonly Account[]>
    readonly findByProxy: (proxyUrl: string) => Effect.Effect<readonly Account[]>
    readonly findConnected: () => Effect.Effect<readonly Account[]>
    readonly findDisconnected: () => Effect.Effect<readonly Account[]>
    readonly findWithLabel: (label: string) => Effect.Effect<readonly Account[]>
    
    // Update operations
    readonly updateStatus: (accountId: string, status: AccountStatusType, ts?: number) => Effect.Effect<Account>
    readonly updateLastSeen: (accountId: string, ts: number) => Effect.Effect<Account>
    readonly setProxy: (accountId: string, proxyUrl: string) => Effect.Effect<Account>
    readonly setLabel: (accountId: string, label: string) => Effect.Effect<Account>
    
    // MaFile operations
    readonly saveMaFile: (accountId: string, maFile: MaFile) => Effect.Effect<void>
    readonly getMaFile: (accountId: string) => Effect.Effect<Option.Option<MaFile>>
    
    // Bulk operations
    readonly connectAccounts: (accountIds: readonly string[]) => Effect.Effect<readonly Account[]>
    readonly disconnectAccounts: (accountIds: readonly string[]) => Effect.Effect<readonly Account[]>
    
    // Statistics
    readonly getStatusCounts: () => Effect.Effect<Record<AccountStatusType, number>>
    readonly getActiveCount: () => Effect.Effect<number>
}

// ============= Context Tag =============

export class AccountRepository extends Context.Tag("AccountRepository")<
    AccountRepository,
    AccountRepository
>() {}

// ============= Implementation =============

class AccountRepositoryImpl extends AbstractRepository<Account, string> {
    protected readonly entityName = 'account'
    protected readonly idField = 'accountId' as const
    protected readonly schema = AccountSchema
    
    private maFiles: Map<string, MaFile> = new Map()
    
    findBySteamId64 = (steamId64: string): Effect.Effect<Option.Option<Account>> =>
        Effect.gen(function* () {
            const all = yield* this.findAll()
            const account = all.find(a => a.steamId64 === steamId64)
            return account ? Option.some(account) : Option.none()
        })
    
    findByStatus = (status: AccountStatusType): Effect.Effect<readonly Account[]> =>
        Effect.gen(function* () {
            const all = yield* this.findAll()
            return all.filter(a => a.status === status)
        })
    
    findByProxy = (proxyUrl: string): Effect.Effect<readonly Account[]> =>
        Effect.gen(function* () {
            const all = yield* this.findAll()
            return all.filter(a => a.proxyUrl === proxyUrl)
        })
    
    findConnected = (): Effect.Effect<readonly Account[]> =>
        this.findByStatus('connected')
    
    findDisconnected = (): Effect.Effect<readonly Account[]> =>
        this.findByStatus('disconnected')
    
    findWithLabel = (label: string): Effect.Effect<readonly Account[]> =>
        Effect.gen(function* () {
            const all = yield* this.findAll()
            return all.filter(a => a.label?.toLowerCase().includes(label.toLowerCase()))
        })
    
    updateStatus = (
        accountId: string, 
        status: AccountStatusType, 
        ts?: number
    ): Effect.Effect<Account> =>
        Effect.gen(function* () {
            const accountOpt = yield* this.findById(accountId)
            const account = yield* pipe(
                accountOpt,
                Option.match({
                    onNone: () => Effect.fail(new EntityNotFoundError({
                        entityType: 'account',
                        id: accountId
                    })),
                    onSome: Effect.succeed
                })
            )
            
            const updated = {
                ...account,
                status,
                ...(ts && { lastSeen: ts })
            }
            
            // Emit status change event
            const eventType = status === 'connected' 
                ? 'accounts/connected'
                : status === 'disconnected'
                ? 'accounts/disconnected'
                : status === 'authFailed'
                ? 'accounts/authenticationFailed'
                : 'accounts/statusUpdated'
            
            const event: EventRecord = {
                id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: eventType,
                payload: {
                    accountId,
                    ...(ts && { ts }),
                    ...(status === 'authFailed' && { reason: 'Authentication failed' })
                },
                meta: {
                    schemaVersion: '1.0.0',
                    id: accountId,
                    ts: ts || Date.now(),
                    aggregate: 'account',
                    kind: 'event'
                },
                timestamp: Date.now()
            }
            
            yield* saveEvent(this.db, event)
            return yield* this.save(updated)
        })
    
    updateLastSeen = (accountId: string, ts: number): Effect.Effect<Account> =>
        Effect.gen(function* () {
            return yield* this.update(accountId, { lastSeen: ts })
        })
    
    setProxy = (accountId: string, proxyUrl: string): Effect.Effect<Account> =>
        Effect.gen(function* () {
            return yield* this.update(accountId, { proxyUrl })
        })
    
    setLabel = (accountId: string, label: string): Effect.Effect<Account> =>
        Effect.gen(function* () {
            return yield* this.update(accountId, { label })
        })
    
    saveMaFile = (accountId: string, maFile: MaFile): Effect.Effect<void> =>
        Effect.gen(function* () {
            // Validate MaFile
            const validated = yield* validateEntity(MaFileSchema)(maFile)
            
            // Store in memory (in production, this would be encrypted storage)
            this.maFiles.set(accountId, validated)
            
            // Emit event
            const event: EventRecord = {
                id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'accounts/maFileStored',
                payload: {
                    accountId,
                    accountName: validated.account_name
                },
                meta: {
                    schemaVersion: '1.0.0',
                    id: accountId,
                    ts: Date.now(),
                    aggregate: 'account',
                    kind: 'event'
                },
                timestamp: Date.now()
            }
            
            yield* saveEvent(this.db, event)
        })
    
    getMaFile = (accountId: string): Effect.Effect<Option.Option<MaFile>> =>
        Effect.gen(function* () {
            const maFile = this.maFiles.get(accountId)
            if (!maFile) return Option.none()
            
            const validated = yield* pipe(
                validateEntity(MaFileSchema)(maFile),
                Effect.option
            )
            return validated
        })
    
    connectAccounts = (accountIds: readonly string[]): Effect.Effect<readonly Account[]> =>
        Effect.all(
            accountIds.map(id => this.updateStatus(id, 'connecting', Date.now()))
        )
    
    disconnectAccounts = (accountIds: readonly string[]): Effect.Effect<readonly Account[]> =>
        Effect.all(
            accountIds.map(id => this.updateStatus(id, 'disconnected', Date.now()))
        )
    
    getStatusCounts = (): Effect.Effect<Record<AccountStatusType, number>> =>
        Effect.gen(function* () {
            const all = yield* this.findAll()
            const counts: Record<string, number> = {
                connecting: 0,
                connected: 0,
                disconnected: 0,
                authFailed: 0
            }
            
            for (const account of all) {
                counts[account.status] = (counts[account.status] || 0) + 1
            }
            
            return counts as Record<AccountStatusType, number>
        })
    
    getActiveCount = (): Effect.Effect<number> =>
        Effect.gen(function* () {
            const connected = yield* this.findConnected()
            return connected.length
        })
}

// ============= Layer =============

export const AccountRepositoryLive = Layer.effect(
    AccountRepository,
    Effect.gen(function* () {
        const db = yield* Database
        return new AccountRepositoryImpl(db)
    })
)