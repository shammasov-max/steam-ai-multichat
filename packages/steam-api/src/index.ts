// Main Client
export { SteamClient } from './client/steam-client'
export type { SteamClientConfig } from './client/steam-client'

// Session Management
export { SessionManager } from './session/session-manager'

// Authentication
export { MaFileHandler } from './auth/mafile-handler'

// Rate Limiting
export { RateLimiter } from './rate-limiter/rate-limiter'

// Message Queue
export { MessageQueue } from './queues/message-queue'
export type { QueueConfig } from './queues/message-queue'

// Types
export type {
    MaFile,
    AccountConfig,
    SteamSession,
    SessionStatus,
    MessageOptions,
    FriendRequest,
    RateLimitConfig,
    SteamError
} from './types'

// Legacy exports for backward compatibility (will be removed)
export { SteamAgent, createSteamAgent } from './SteamAgent'
export type {
    SteamAgentConfig,
    Friend,
    ChatMessage,
    ChatHistory,
    SteamAgentEvents,
} from './types'

// Re-export default
import { SteamClient } from './client/steam-client'
export default SteamClient
