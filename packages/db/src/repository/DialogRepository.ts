import { Context, Effect, Option } from 'effect'
import { Dialog } from '@packages/isomorphic'
import { GenericRepository } from './GenericRepository'
import { MongoError } from '../errors/MongoError'

/**
 * Dialog-specific repository interface extending generic repository
 */
export interface DialogRepositoryService extends GenericRepository<Dialog> {
    readonly findByAccountId: (accountId: string) => Effect.Effect<readonly Dialog[], MongoError>
    readonly findByStatus: (status: string) => Effect.Effect<readonly Dialog[], MongoError>
    readonly findActive: () => Effect.Effect<readonly Dialog[], MongoError>
    readonly updateScore: (dialogId: string, score: number) => Effect.Effect<void, MongoError>
    readonly appendMessage: (dialogId: string, message: unknown) => Effect.Effect<void, MongoError>
}

/**
 * Tag for DialogRepository service
 */
export class DialogRepository extends Context.Tag('DialogRepository')<DialogRepository, DialogRepositoryService>() {}