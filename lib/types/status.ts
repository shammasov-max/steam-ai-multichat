import { z } from 'zod'

export const createStatusEnum = <T extends readonly string[]>(statuses: T) => z.enum(statuses)

export const BOT_STATUSES = ['connecting', 'connected', 'disconnected', 'authFailed'] as const
export const TASK_STATUSES = ['created', 'assigned', 'invited', 'accepted', 'failed', 'disposed', 'resolved'] as const
export const FRIEND_REQUEST_STATUSES = ['sent', 'accepted', 'rejected', 'failed'] as const
export const MESSAGE_SOURCES = ['bot', 'player'] as const

export const BotStatus = createStatusEnum(BOT_STATUSES)
export const TaskStatus = createStatusEnum(TASK_STATUSES)
export const FriendRequestStatus = createStatusEnum(FRIEND_REQUEST_STATUSES)
export const MessageSource = createStatusEnum(MESSAGE_SOURCES)

export type BotStatus = z.infer<typeof BotStatus>
export type TaskStatus = z.infer<typeof TaskStatus>
export type FriendRequestStatus = z.infer<typeof FriendRequestStatus>
export type MessageSource = z.infer<typeof MessageSource>