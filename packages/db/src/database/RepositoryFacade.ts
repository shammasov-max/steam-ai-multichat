import { Context, Effect, Layer } from 'effect'
import { AccountRepository, AccountRepositoryService } from '../repository/AccountRepository'
import { DialogRepository, DialogRepositoryService } from '../repository/DialogRepository'
import { SystemRepository, SystemRepositoryService } from '../repository/SystemRepository'
import { EventStore, EventStoreService } from '../event-store/EventStore'
import { MongoError } from '../errors/MongoError'

/**
 * Facade that aggregates all repositories for convenient access
 * This maintains backward compatibility with the old MongoDB service
 */
export interface RepositoryFacadeService {
    readonly repos: {
        readonly account: AccountRepositoryService
        readonly dialog: DialogRepositoryService
        readonly system: SystemRepositoryService
    }
    readonly eventStore: EventStoreService
    readonly clearAll: () => Effect.Effect<void, MongoError>
}

/**
 * Tag for RepositoryFacade service
 */
export class RepositoryFacade extends Context.Tag('RepositoryFacade')<
    RepositoryFacade,
    RepositoryFacadeService
>() {}

/**
 * Live implementation that composes all repository services
 */
export const RepositoryFacadeLive = Layer.effect(
    RepositoryFacade,
    Effect.gen(function* () {
        const accountRepo = yield* AccountRepository
        const dialogRepo = yield* DialogRepository
        const systemRepo = yield* SystemRepository
        const eventStore = yield* EventStore

        return {
            repos: {
                account: accountRepo,
                dialog: dialogRepo,
                system: systemRepo,
            },
            eventStore,
            clearAll: () =>
                Effect.gen(function* () {
                    // Clear event store
                    yield* eventStore.clearEvents()

                    // Clear all repositories
                    const allAccounts = yield* accountRepo.findAll()
                    yield* Effect.forEach(
                        allAccounts,
                        account => accountRepo.delete(account.accountId),
                        { concurrency: 'unbounded' }
                    )

                    const allDialogs = yield* dialogRepo.findAll()
                    yield* Effect.forEach(
                        allDialogs,
                        dialog => dialogRepo.delete(dialog.dialogId),
                        { concurrency: 'unbounded' }
                    )

                    // Re-initialize system
                    const system = yield* systemRepo.getSystem()
                    yield* systemRepo.save({
                        ...system,
                        roundRobin: {
                            pointer: 0,
                            eligibleAccountIds: [],
                        },
                        rateLimits: {},
                    })
                }),
        }
    })
)
