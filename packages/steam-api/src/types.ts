// Re-export new types
export * from './types/index'

// Legacy types for backward compatibility
export interface SteamAgentConfig {
    maFile: string
    password: string
    userName: string
    proxy?: string
}

export interface Friend {
    steamID: string
    personaName: string
    avatarHash: string
    relationship: number
    personaState: number
}

export interface ChatMessage {
    steamID: string
    message: string
    timestamp: number
    direction: 'incoming' | 'outgoing'
}

export interface ChatHistory {
    steamID: string
    messages: ChatMessage[]
}

export interface SteamAgentEvents {
    loggedOn: () => void
    disconnected: (eresult: number, msg: string) => void
    error: (err: Error) => void
    friendMessage: (steamID: string, message: string) => void
    friendTyping: (steamID: string) => void
    friendRelationship: (steamID: string, relationship: number) => void
    friendsList: () => void
    user: (steamID: string, user: unknown) => void
}
