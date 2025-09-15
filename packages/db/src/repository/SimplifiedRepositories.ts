import { Effect, Option } from 'effect'
import { 
    repositoryTag, 
    serviceLayer, 
    error,
    type Repository,
    type Op
} from '@packages/isomorphic'
import { MongoConnection } from '../connection/MongoConnection'
import type { Account, Dialog, System } from '@packages/isomorphic'

// ============================================================================
// Error Definition (Before: 20+ lines, After: 1 line)
// ============================================================================

export const RepositoryError = error('RepositoryError', 'Repository operation failed')

// ============================================================================
// Repository Tags (Before: 15+ lines each, After: 1 line each)
// ============================================================================

export const AccountRepository = repositoryTag<Account>('Account')
export const DialogRepository = repositoryTag<Dialog>('Dialog')
export const SystemRepository = repositoryTag<System>('System')

// ============================================================================
// Enhanced Repository Interface
// ============================================================================

export interface EnhancedRepository<T> extends Repository<T> {
    readonly findByField: <K extends keyof T>(field: K, value: T[K]) => Op<readonly T[]>
    readonly updateField: <K extends keyof T>(id: string, field: K, value: T[K]) => Op<void>
    readonly count: () => Op<number>
    readonly findOne: (filter: Partial<T>) => Op<Option.Option<T>>
}

// ============================================================================
// MongoDB Repository Factory (Before: 100+ lines per entity, After: 30 lines)
// ============================================================================

const createMongoRepository = <T extends { id: string }>(
    collectionName: string
): Effect.Effect<EnhancedRepository<T>, never, MongoConnection> =>
    Effect.gen(function* () {
        const mongo = yield* MongoConnection
        const collection = yield* mongo.collection<T>(collectionName)
        
        return {
            // Basic Repository methods
            findById: (id) => 
                Effect.gen(function* () {
                    const result = yield* collection.findOne({ id } as any)
                    return result ?? null
                }),
            
            findAll: () =>
                collection.find({}).toArray(),
            
            save: (entity) =>
                Effect.gen(function* () {
                    yield* collection.replaceOne(
                        { id: entity.id } as any,
                        entity,
                        { upsert: true }
                    )
                }),
            
            delete: (id) =>
                Effect.gen(function* () {
                    yield* collection.deleteOne({ id } as any)
                }),
            
            exists: (id) =>
                Effect.map(
                    collection.countDocuments({ id } as any),
                    count => count > 0
                ),
            
            // Enhanced methods
            findByField: (field, value) =>
                collection.find({ [field]: value } as any).toArray(),
            
            updateField: (id, field, value) =>
                Effect.gen(function* () {
                    yield* collection.updateOne(
                        { id } as any,
                        { $set: { [field]: value } }
                    )
                }),
            
            count: () =>
                collection.countDocuments({}),
            
            findOne: (filter) =>
                Effect.map(
                    collection.findOne(filter as any),
                    Option.fromNullable
                )
        }
    })

// ============================================================================
// Layer Creation (Before: 50+ lines each, After: 3 lines each)
// ============================================================================

export const AccountRepositoryLive = serviceLayer(
    AccountRepository,
    () => createMongoRepository<Account>('accounts')
)

export const DialogRepositoryLive = serviceLayer(
    DialogRepository,
    () => createMongoRepository<Dialog>('dialogs')
)

export const SystemRepositoryLive = serviceLayer(
    SystemRepository,
    () => createMongoRepository<System>('system')
)

// ============================================================================
// Specialized Repository Extensions
// ============================================================================

// Account-specific operations
export const AccountOperations = {
    findActive: Effect.gen(function* () {
        const repo = yield* AccountRepository
        return yield* repo.findByField('status', 'active')
    }),
    
    findBySteamId: (steamId: string) =>
        Effect.gen(function* () {
            const repo = yield* AccountRepository
            return yield* repo.findOne({ steamId64: steamId } as any)
        })
}

// Dialog-specific operations
export const DialogOperations = {
    findByStatus: (status: string) =>
        Effect.gen(function* () {
            const repo = yield* DialogRepository
            return yield* repo.findByField('status', status)
        }),
    
    updateScore: (dialogId: string, score: number) =>
        Effect.gen(function* () {
            const repo = yield* DialogRepository
            return yield* repo.updateField(dialogId, 'continuationScore', score)
        })
}

// ============================================================================
// Usage Example
// ============================================================================

export const exampleUsage = Effect.gen(function* () {
    // Basic usage
    const accountRepo = yield* AccountRepository
    const account = yield* accountRepo.findById('account_123')
    
    // Using specialized operations
    const activeAccounts = yield* AccountOperations.findActive
    const steamAccount = yield* AccountOperations.findBySteamId('76561198000000000')
    
    // Dialog operations
    const activeDialogs = yield* DialogOperations.findByStatus('active')
    yield* DialogOperations.updateScore('dialog_456', 0.85)
})