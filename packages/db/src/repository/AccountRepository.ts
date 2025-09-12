import { Context, Effect, Option } from 'effect'
import { Account } from '@packages/isomorphic'
import { GenericRepository } from './GenericRepository'
import { MongoError } from '../errors/MongoError'

/**
 * Account-specific repository interface extending generic repository
 */
export interface AccountRepositoryService extends GenericRepository<Account> {
    readonly findByStatus: (status: string) => Effect.Effect<readonly Account[], MongoError>
    readonly findBySteamId: (steamId64: string) => Effect.Effect<Option.Option<Account>, MongoError>
    readonly updateStatus: (accountId: string, status: string) => Effect.Effect<void, MongoError>
}

/**
 * Tag for AccountRepository service
 */
export class AccountRepository extends Context.Tag('AccountRepository')<AccountRepository, AccountRepositoryService>() {}