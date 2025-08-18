// Central export of all domain event actions
import { botEvents } from '../slices/bots.js'
import { taskEvents } from '../slices/tasks.js'
import { chatEvents } from '../slices/chats.js'
import { systemEvents } from '../slices/system.js'

// Export domain-specific event actions
export const bot = botEvents
export const task = taskEvents
export const chat = chatEvents
export const system = systemEvents

// Legacy flat exports for backward compatibility (can be removed later)
export const botConnected = bot['bot.connected']
export const botDisconnected = bot['bot.disconnected']
export const botAuthenticationFailed = bot['bot.authenticationFailed']

export const taskCreated = task['task.created']
export const taskAssigned = task['task.assigned']
export const taskStatusUpdated = task['task.statusUpdated']

export const chatStarted = chat['chat.started']
export const chatMessageReceived = chat['chat.messageReceived']
export const chatMessageSent = chat['chat.messageSent']
export const agentToggled = chat['chat.agentToggled']
export const dialogScriptAdvanced = chat['dialogScript.advanced']
export const dialogScriptCompleted = chat['dialogScript.completed']

export const snapshot = system['snapshot']
export const friendInviteSent = system['friendInvite.sent']
export const friendInviteAccepted = system['friendInvite.accepted']
export const friendInviteFailed = system['friendInvite.failed']
export const errorLogged = system['error.logged']
export const proxyAssigned = system['proxy.assigned']
export const proxyReleased = system['proxy.released']
export const proxyFailed = system['proxy.failed']
export const proxyBanned = system['proxy.banned']
export const proxyRestored = system['proxy.restored']
export const maFileAssigned = system['maFile.assigned']
export const maFileReleased = system['maFile.released']
