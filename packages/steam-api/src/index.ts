// Legacy exports for backward compatibility (will be removed)
export { SteamAgent, createSteamAgent } from './SteamAgent'
export type {
    SteamAgentConfig,
    Friend,
    ChatMessage,
    ChatHistory,
    SteamAgentEvents,
} from './types'

// Effect-based exports
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
    type SteamEvent
} from './SteamAgentEffect'

export {
    SteamAgentEffectWrapper,
    createSteamAgentEffect
} from './SteamAgentEffectWrapper'

// Re-export default
export { SteamAgent as default } from './SteamAgent'
