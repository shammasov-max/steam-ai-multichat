import { Context, Effect } from 'effect'
import { System } from '@packages/isomorphic'
import { GenericRepository } from './GenericRepository'
import { MongoError } from '../errors/MongoError'

/**
 * System-specific repository interface extending generic repository
 */
export interface SystemRepositoryService extends GenericRepository<System> {
    readonly getSystem: () => Effect.Effect<System, MongoError>
    readonly updateRoundRobin: (pointer: number, eligibleAccountIds: string[]) => Effect.Effect<void, MongoError>
    readonly updateRateLimit: (key: string, limit: number) => Effect.Effect<void, MongoError>
}

/**
 * Tag for SystemRepository service
 */
export class SystemRepository extends Context.Tag('SystemRepository')<SystemRepository, SystemRepositoryService>() {}