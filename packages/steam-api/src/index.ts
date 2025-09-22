// Effect-based exports (legacy exports removed)
export {
    SteamEffectError,
    SteamAuthError,
    SteamConfig,
    SteamConnectionService,
    SteamConnectionPool,
    SteamConnectionLive,
    SteamConnectionPoolLive,
    SteamOperations,
    SteamOperationsLive,
    createSteamLayer,
    runWithSteam,
    runWithSteamPool,
    type SteamConnection,
    type SteamEvent,
} from './SteamAgentEffect'

// Legacy types still exported for compatibility
export type { SteamAgentConfig, Friend, ChatMessage, ChatHistory, SteamAgentEvents } from './types'
