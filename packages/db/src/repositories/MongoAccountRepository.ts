import { Effect, Context, Option } from 'effect'
import { 
    AccountSchema, 
    MaFileSchema,
    type Account,
    type MaFile,
    type AccountStatus as AccountStatusType
} from '@packages/isomorphic/src/slices/accounts'
import { Database, validateEntity } from './base/BaseRepository'
import { MongoRepositoryBase, createMongoRepository } from './base/MongoRepositoryFactory'
import { accountEventFactory } from './base/EventFactory'
import type { MongoDatabase } from '../MongoDatabase'

// ============= AccountRepository Interface =============

export interface AccountRepository extends MongoRepositoryBase<Account, 'account'> {
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

// ============= MongoDB Implementation =============

class MongoAccountRepositoryImpl extends MongoRepositoryBase<Account, 'account'> implements AccountRepository {
    private maFiles: Map<string, MaFile> = new Map() // In production, store in secure collection
    
    constructor(db: MongoDatabase) {
        super(db, {
            collectionName: 'accounts',
            entityType: 'account',
            idField: 'accountId',
            schema: AccountSchema,
            eventFactory: accountEventFactory
        })
    }
    
    // Account-specific find operations
    findBySteamId64 = (steamId64: string): Effect.Effect<Option.Option<Account>> =>
        this.findOneByField('steamId64', steamId64)
    
    findByStatus = (status: AccountStatusType): Effect.Effect<readonly Account[]> =>
        this.findByField('status', status)
    
    findByProxy = (proxyUrl: string): Effect.Effect<readonly Account[]> =>
        this.findByField('proxyUrl', proxyUrl)
    
    findConnected = (): Effect.Effect<readonly Account[]> =>
        this.findByStatus('connected')
    
    findDisconnected = (): Effect.Effect<readonly Account[]> =>
        this.findByStatus('disconnected')
    
    findWithLabel = (label: string): Effect.Effect<readonly Account[]> =>
        Effect.tryPromise({
            try: () => this.collection.find({ 
                label: { $regex: label, $options: 'i' } 
            }).toArray(),
            catch: error => new RepositoryError({
                message: `Failed to find accounts with label: ${label}`,
                cause: error
            })
        })
    
    // Update operations
    updateStatus = (
        accountId: string, 
        status: AccountStatusType, 
        ts?: number
    ): Effect.Effect<Account> =>
        Effect.gen(function* () {
            const updates: Partial<Account> = {
                status,
                ...(ts && { lastSeen: ts })
            }
            
            const account = yield* this.update(accountId, updates)
            
            const eventType = status === 'connected' 
                ? 'accounts/connected'
                : status === 'disconnected'
                ? 'accounts/disconnected'
                : status === 'authFailed'
                ? 'accounts/authenticationFailed'
                : 'accounts/statusUpdated'
            
            yield* accountEventFactory.createAndSave(
                this.db,
                eventType,
                accountId,
                {
                    accountId,
                    ...(ts && { ts }),
                    ...(status === 'authFailed' && { reason: 'Authentication failed' })
                },
                'event'
            )
            
            return account
        })
    
    updateLastSeen = (accountId: string, ts: number): Effect.Effect<Account> =>
        this.update(accountId, { lastSeen: ts })
    
    setProxy = (accountId: string, proxyUrl: string): Effect.Effect<Account> =>
        this.update(accountId, { proxyUrl })
    
    setLabel = (accountId: string, label: string): Effect.Effect<Account> =>
        this.update(accountId, { label })
    
    // MaFile operations
    saveMaFile = (accountId: string, maFile: MaFile): Effect.Effect<void> =>
        Effect.gen(function* () {
            const validated = yield* validateEntity(MaFileSchema)(maFile)
            this.maFiles.set(accountId, validated)
            
            yield* accountEventFactory.createAndSave(
                this.db,
                'accounts/maFileStored',
                accountId,
                {
                    accountId,
                    accountName: validated.account_name
                },
                'event'
            )
        })
    
    getMaFile = (accountId: string): Effect.Effect<Option.Option<MaFile>> =>
        Effect.gen(function* () {
            const maFile = this.maFiles.get(accountId)
            if (!maFile) return Option.none()
            
            const validated = yield* Effect.option(validateEntity(MaFileSchema)(maFile))
            return validated
        })
    
    // Bulk operations
    connectAccounts = (accountIds: readonly string[]): Effect.Effect<readonly Account[]> =>
        Effect.all(accountIds.map(id => this.updateStatus(id, 'connecting', Date.now())))
    
    disconnectAccounts = (accountIds: readonly string[]): Effect.Effect<readonly Account[]> =>
        Effect.all(accountIds.map(id => this.updateStatus(id, 'disconnected', Date.now())))
    
    // Statistics
    getStatusCounts = (): Effect.Effect<Record<AccountStatusType, number>> =>
        Effect.gen(function* () {
            const results = yield* this.aggregate<{ _id: string; count: number }>([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ])
            
            const counts: Record<string, number> = {
                connecting: 0,
                connected: 0,
                disconnected: 0,
                authFailed: 0
            }
            
            for (const result of results) {
                counts[result._id] = result.count
            }
            
            return counts as Record<AccountStatusType, number>
        })
    
    getActiveCount = (): Effect.Effect<number> =>
        Effect.tryPromise({
            try: () => this.collection.countDocuments({ status: 'connected' }),
            catch: error => new RepositoryError({
                message: 'Failed to get active count',
                cause: error
            })
        })
}

// Import RepositoryError from BaseRepository for local use
import { RepositoryError } from './base/BaseRepository'
import { createRepositoryLayer } from './base/LayerUtils'

// ============= Layer =============

export const MongoAccountRepositoryLive = createRepositoryLayer(
    AccountRepository,
    db => new MongoAccountRepositoryImpl(db)
)