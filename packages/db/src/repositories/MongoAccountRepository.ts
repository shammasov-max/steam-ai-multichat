import { Effect, Layer, Context, pipe, Option } from 'effect'
import * as S from 'effect/Schema'
import { Collection, Filter } from 'mongodb'
import { 
    AccountSchema, 
    AccountStatus,
    MaFileSchema,
    type Account,
    type MaFile,
    type AccountStatus as AccountStatusType
} from '@packages/isomorphic/src/slices/accounts.js'
import { 
    Database,
    EntityNotFoundError,
    RepositoryError,
    validateEntity,
    saveEvent,
    createEvent,
    type BaseRepository
} from './base/BaseRepository.js'
import { MongoDatabase } from '../MongoDatabase.js'
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

// ============= MongoDB Implementation =============

class MongoAccountRepositoryImpl implements AccountRepository {
    private collection: Collection<Account>
    private maFiles: Map<string, MaFile> = new Map() // In production, store in secure collection
    
    constructor(private readonly db: MongoDatabase) {
        if (!db.accounts) {
            throw new Error('Accounts collection not initialized')
        }
        this.collection = db.accounts
    }
    
    // ============= Base Repository Methods =============
    
    findById = (id: string): Effect.Effect<Option.Option<Account>> =>
        Effect.gen(function* () {
            try {
                const account = yield* Effect.tryPromise({
                    try: () => this.collection.findOne({ accountId: id }),
                    catch: error => new RepositoryError({
                        message: `Failed to find account by ID: ${id}`,
                        cause: error
                    })
                })
                
                if (!account) return Option.none()
                
                const validated = yield* validateEntity(AccountSchema)(account)
                return Option.some(validated)
            } catch (error) {
                return Option.none()
            }
        })
    
    findAll = (options?: { limit?: number; offset?: number }): Effect.Effect<readonly Account[]> =>
        Effect.gen(function* () {
            const limit = options?.limit || 1000
            const skip = options?.offset || 0
            
            const accounts = yield* Effect.tryPromise({
                try: () => this.collection
                    .find({})
                    .skip(skip)
                    .limit(limit)
                    .toArray(),
                catch: error => new RepositoryError({
                    message: 'Failed to find all accounts',
                    cause: error
                })
            })
            
            return accounts
        })
    
    findMany = (ids: readonly string[]): Effect.Effect<readonly Account[]> =>
        Effect.gen(function* () {
            const accounts = yield* Effect.tryPromise({
                try: () => this.collection
                    .find({ accountId: { $in: ids as string[] } })
                    .toArray(),
                catch: error => new RepositoryError({
                    message: 'Failed to find multiple accounts',
                    cause: error
                })
            })
            
            return accounts
        })
    
    save = (account: Account): Effect.Effect<Account> =>
        Effect.gen(function* () {
            // Validate account
            const validated = yield* validateEntity(AccountSchema)(account)
            
            // Save to MongoDB
            yield* Effect.tryPromise({
                try: () => this.collection.replaceOne(
                    { accountId: validated.accountId },
                    validated,
                    { upsert: true }
                ),
                catch: error => new RepositoryError({
                    message: `Failed to save account: ${validated.accountId}`,
                    cause: error
                })
            })
            
            // Emit event
            const event = createEvent(
                'accounts/saved',
                'account',
                validated.accountId,
                validated
            )
            
            yield* saveEvent(this.db, event)
            return validated
        })
    
    saveMany = (accounts: readonly Account[]): Effect.Effect<readonly Account[]> =>
        Effect.all(accounts.map(account => this.save(account)))
    
    update = (id: string, updates: Partial<Account>): Effect.Effect<Account> =>
        Effect.gen(function* () {
            const result = yield* Effect.tryPromise({
                try: () => this.collection.findOneAndUpdate(
                    { accountId: id },
                    { $set: updates },
                    { returnDocument: 'after' }
                ),
                catch: error => new RepositoryError({
                    message: `Failed to update account: ${id}`,
                    cause: error
                })
            })
            
            if (!result) {
                yield* Effect.fail(new EntityNotFoundError({
                    entityType: 'account',
                    id
                }))
            }
            
            return result as Account
        })
    
    delete = (id: string): Effect.Effect<void> =>
        Effect.gen(function* () {
            yield* Effect.tryPromise({
                try: () => this.collection.deleteOne({ accountId: id }),
                catch: error => new RepositoryError({
                    message: `Failed to delete account: ${id}`,
                    cause: error
                })
            })
            
            // Emit deletion event
            const event = createEvent(
                'accounts/deleted',
                'account',
                id,
                { accountId: id }
            )
            
            yield* saveEvent(this.db, event)
        })
    
    deleteMany = (ids: readonly string[]): Effect.Effect<void> =>
        Effect.all(ids.map(id => this.delete(id)), { discard: true })
    
    exists = (id: string): Effect.Effect<boolean> =>
        Effect.gen(function* () {
            const count = yield* Effect.tryPromise({
                try: () => this.collection.countDocuments({ accountId: id }),
                catch: error => new RepositoryError({
                    message: `Failed to check account existence: ${id}`,
                    cause: error
                })
            })
            
            return count > 0
        })
    
    count = (): Effect.Effect<number> =>
        Effect.tryPromise({
            try: () => this.collection.countDocuments({}),
            catch: error => new RepositoryError({
                message: 'Failed to count accounts',
                cause: error
            })
        })
    
    // ============= Account-Specific Methods =============
    
    findBySteamId64 = (steamId64: string): Effect.Effect<Option.Option<Account>> =>
        Effect.gen(function* () {
            const account = yield* Effect.tryPromise({
                try: () => this.collection.findOne({ steamId64 }),
                catch: error => new RepositoryError({
                    message: `Failed to find account by Steam ID: ${steamId64}`,
                    cause: error
                })
            })
            
            return account ? Option.some(account) : Option.none()
        })
    
    findByStatus = (status: AccountStatusType): Effect.Effect<readonly Account[]> =>
        Effect.tryPromise({
            try: () => this.collection.find({ status }).toArray(),
            catch: error => new RepositoryError({
                message: `Failed to find accounts by status: ${status}`,
                cause: error
            })
        })
    
    findByProxy = (proxyUrl: string): Effect.Effect<readonly Account[]> =>
        Effect.tryPromise({
            try: () => this.collection.find({ proxyUrl }).toArray(),
            catch: error => new RepositoryError({
                message: `Failed to find accounts by proxy: ${proxyUrl}`,
                cause: error
            })
        })
    
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
            
            // Emit status change event
            const eventType = status === 'connected' 
                ? 'accounts/connected'
                : status === 'disconnected'
                ? 'accounts/disconnected'
                : status === 'authFailed'
                ? 'accounts/authenticationFailed'
                : 'accounts/statusUpdated'
            
            const event = createEvent(
                eventType,
                'account',
                accountId,
                {
                    accountId,
                    ...(ts && { ts }),
                    ...(status === 'authFailed' && { reason: 'Authentication failed' })
                },
                'event'
            )
            
            yield* saveEvent(this.db, event)
            return account
        })
    
    updateLastSeen = (accountId: string, ts: number): Effect.Effect<Account> =>
        this.update(accountId, { lastSeen: ts })
    
    setProxy = (accountId: string, proxyUrl: string): Effect.Effect<Account> =>
        this.update(accountId, { proxyUrl })
    
    setLabel = (accountId: string, label: string): Effect.Effect<Account> =>
        this.update(accountId, { label })
    
    saveMaFile = (accountId: string, maFile: MaFile): Effect.Effect<void> =>
        Effect.gen(function* () {
            // Validate MaFile
            const validated = yield* validateEntity(MaFileSchema)(maFile)
            
            // Store in memory (in production, use secure storage)
            this.maFiles.set(accountId, validated)
            
            // Emit event
            const event = createEvent(
                'accounts/maFileStored',
                'account',
                accountId,
                {
                    accountId,
                    accountName: validated.account_name
                },
                'event'
            )
            
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
            const pipeline = [
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]
            
            const results = yield* Effect.tryPromise({
                try: () => this.collection.aggregate(pipeline).toArray(),
                catch: error => new RepositoryError({
                    message: 'Failed to get status counts',
                    cause: error
                })
            })
            
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

// ============= Layer =============

export const MongoAccountRepositoryLive = Layer.effect(
    AccountRepository,
    Effect.gen(function* () {
        const db = yield* Database
        return new MongoAccountRepositoryImpl(db)
    })
)