import { Layer } from 'effect'
import { MongoConnectionLive } from '../connection/MongoConnectionLive'
import { EventStoreLive } from '../event-store/EventStoreLive'
import { AccountRepositoryLive } from '../repository/implementations/AccountRepositoryLive'
import { DialogRepositoryLive } from '../repository/implementations/DialogRepositoryLive'
import { SystemRepositoryLive } from '../repository/implementations/SystemRepositoryLive'
import { RepositoryFacadeLive } from './RepositoryFacade'

/**
 * Individual repository layers that can be used independently
 */
export const AccountRepoLayer = AccountRepositoryLive.pipe(
    Layer.provide(MongoConnectionLive)
)

export const DialogRepoLayer = DialogRepositoryLive.pipe(
    Layer.provide(MongoConnectionLive)
)

export const SystemRepoLayer = SystemRepositoryLive.pipe(
    Layer.provide(MongoConnectionLive)
)

export const EventStoreLayer = EventStoreLive.pipe(
    Layer.provide(MongoConnectionLive)
)

/**
 * Complete application layer that includes all repositories and services
 * This can be used as a drop-in replacement for the old createCompleteMongoDB
 */
export const AppLayer = Layer.mergeAll(
    MongoConnectionLive,
    AccountRepoLayer,
    DialogRepoLayer,
    SystemRepoLayer,
    EventStoreLayer,
    RepositoryFacadeLive
)

/**
 * Convenience function to create the complete layer
 * Maintains backward compatibility with the old API
 */
export const createAppLayer = () => AppLayer