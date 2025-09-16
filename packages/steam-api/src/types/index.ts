import type SteamUser from 'steam-user'
import type SteamCommunity from 'steamcommunity'

export interface MaFile {
    shared_secret: string
    serial_number: string
    revocation_code: string
    uri: string
    server_time: string
    account_name: string
    token_gid: string
    identity_secret: string
    secret_1: string
    status: number
    device_id: string
    fully_enrolled: boolean
    Session: {
        SessionID: string
        SteamLogin: string
        SteamLoginSecure: string
        WebCookie: string
        OAuthToken: string
        SteamID: string
    }
}

export interface AccountConfig {
    username: string
    steamId: string
    maFile: MaFile | string
    proxy?: string
    autoReconnect?: boolean
}

export interface SteamSession {
    id: string
    accountId: string
    steamId: string
    username: string
    status: 'connecting' | 'online' | 'offline' | 'error' | 'reconnecting'
    client: SteamUser
    community?: SteamCommunity
    lastActivity?: Date
    error?: string
}

export interface MessageOptions {
    accountId: string
    steamId: string
    content: string
    priority?: 'high' | 'normal' | 'low'
}

export interface FriendRequest {
    accountId: string
    steamId: string
    timestamp: Date
}

export interface RateLimitConfig {
    messagesPerSecond?: number
    friendRequestsPerMinute?: number
    windowMs?: number
}

export type SessionStatus = SteamSession['status']

export interface SteamError extends Error {
    code?: string
    eresult?: number
    retryable?: boolean
}

// Missing types for compatibility
export interface SteamAgentConfig {
    accountName: string
    password?: string
    steamId: string
    maFile: MaFile | string
    proxy?: string
    autoReconnect?: boolean
    rateLimits?: RateLimitConfig
}

export interface Friend {
    steamId: string
    relationship: number
    blocked?: boolean
    personaName?: string
    personaState?: number
}

export interface ChatMessage {
    steamId: string
    message: string
    timestamp: Date
    incoming: boolean
}

export interface ChatHistory {
    steamId: string
    messages: ChatMessage[]
    lastActivity?: Date
}

export interface SteamAgentEvents {
    loggedOn: { steamId: string }
    disconnected: { code: number; message: string }
    friendMessage: { steamId: string; message: string }
    friendTyping: { steamId: string }
    friendRelationship: { steamId: string; relationship: number }
    error: { error: Error }
}
