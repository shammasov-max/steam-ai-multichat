import SteamUser from 'steam-user'
import SteamCommunity from 'steamcommunity'
import SteamTotp from 'steam-totp'
import { prisma } from '../db/client'
import type { Bot } from '@prisma/client'

interface MaFile {
  account_name: string
  shared_secret: string
  identity_secret: string
  revocation_code?: string
  uri?: string
  server_time?: number
  secret_1?: string
  status?: number
  device_id?: string
  fully_enrolled?: boolean
  Session?: {
    SessionID?: string
    SteamLogin?: string
    SteamLoginSecure?: string
    WebCookie?: string
    OAuthToken?: string
    SteamID?: string
  }
}

export interface BotSession {
  bot: Bot
  client: SteamUser
  community: SteamCommunity
  maFile: MaFile
  lastInviteAt?: number
}

class SteamSessionManager {
    private sessions: Map<string, BotSession> = new Map()
    private roundRobinIndex = 0

    async initBot(bot: Bot): Promise<BotSession> {
        const existing = this.sessions.get(bot.id)
        if (existing) {
            return existing
        }

        const maFile: MaFile = JSON.parse(bot.mafileJson)
        const client = new SteamUser()
        const community = new SteamCommunity()

        const session: BotSession = {
            bot,
            client,
            community,
            maFile,
            lastInviteAt: 0,
        }

        this.setupClientHandlers(session)
        this.sessions.set(bot.id, session)
    
        return session
    }

    private setupClientHandlers(session: BotSession) {
        const { client, community, bot } = session

        client.on('loggedOn', async () => {
            console.log(`Bot ${bot.steamId64} logged on`)
            await prisma.bot.update({
                where: { id: bot.id },
                data: { 
                    status: 'connected',
                    lastSeen: new Date(),
                },
            })
      
            client.setPersona(SteamUser.EPersonaState.Online)
        })

        client.on('webSession', (sessionID, cookies) => {
            community.setCookies(cookies)
            console.log(`Bot ${bot.steamId64} web session established`)
        })

        client.on('error', async (err) => {
            console.error(`Bot ${bot.steamId64} error:`, err)
            await prisma.bot.update({
                where: { id: bot.id },
                data: { status: 'authFailed' },
            })
        })

        client.on('disconnected', async () => {
            console.log(`Bot ${bot.steamId64} disconnected`)
            await prisma.bot.update({
                where: { id: bot.id },
                data: { status: 'disconnected' },
            })
        })

        client.on('friendRelationship', async (steamID, relationship) => {
            if (relationship === SteamUser.EFriendRelationship.RequestRecipient) {
                client.addFriend(steamID)
                console.log(`Bot ${bot.steamId64} accepted friend request from ${steamID}`)
        
                await prisma.friendRequest.updateMany({
                    where: {
                        botId: bot.id,
                        playerSteamId64: steamID.toString(),
                        status: 'sent',
                    },
                    data: { status: 'accepted' },
                })

                const existingChat = await prisma.chat.findFirst({
                    where: {
                        botId: bot.id,
                        playerSteamId64: steamID.toString(),
                    },
                })

                if (!existingChat) {
                    await prisma.chat.create({
                        data: {
                            botId: bot.id,
                            playerSteamId64: steamID.toString(),
                            agentEnabled: true,
                        },
                    })
                }

                await prisma.task.updateMany({
                    where: {
                        assignedBotId: bot.id,
                        playerSteamId64: steamID.toString(),
                        status: 'invited',
                    },
                    data: { status: 'accepted' },
                })
            }
        })

        client.on('friendMessage' as any, async (steamID: any, message: string) => {
            const chat = await prisma.chat.findFirst({
                where: {
                    botId: bot.id,
                    playerSteamId64: steamID.toString(),
                },
            })

            if (chat) {
                await prisma.message.create({
                    data: {
                        chatId: chat.id,
                        from: 'player',
                        text: message,
                    },
                })
            }
        })
    }

    async connectBot(botId: string) {
        const bot = await prisma.bot.findUnique({ where: { id: botId } })
        if (!bot) throw new Error('Bot not found')

        await prisma.bot.update({
            where: { id: botId },
            data: { status: 'connecting' },
        })

        const session = await this.initBot(bot)
        const { client, maFile } = session

        const logOnOptions: {
            accountName: string;
            twoFactorCode: string;
            rememberPassword: boolean;
            httpProxy?: string;
        } = {
            accountName: maFile.account_name,
            twoFactorCode: SteamTotp.generateAuthCode(maFile.shared_secret),
            rememberPassword: true,
        }

        if (bot.proxyUrl) {
            logOnOptions.httpProxy = bot.proxyUrl
        }

        client.logOn(logOnOptions)
    }

    async disconnectBot(botId: string) {
        const session = this.sessions.get(botId)
        if (session) {
            session.client.logOff()
            this.sessions.delete(botId)
        }
    }

    async sendMessage(botId: string, playerSteamId64: string, message: string) {
        const session = this.sessions.get(botId)
        if (!session) throw new Error('Bot session not found')
    
        ;(session.client as any).chatMessage(playerSteamId64, message)
    }

    async sendFriendRequest(botId: string, playerSteamId64: string): Promise<boolean> {
        const session = this.sessions.get(botId)
        if (!session) return false

        const now = Date.now()
        if (session.lastInviteAt && now - session.lastInviteAt < 60000) {
            return false
        }

        try {
            session.client.addFriend(playerSteamId64)
            session.lastInviteAt = now
      
            await prisma.friendRequest.create({
                data: {
                    botId,
                    playerSteamId64,
                    status: 'sent',
                },
            })
      
            return true
        } catch (error) {
            console.error(`Failed to send friend request from ${botId} to ${playerSteamId64}:`, error)
            return false
        }
    }

    getNextAvailableBot(): BotSession | null {
        const activeSessions = Array.from(this.sessions.values()).filter(
            s => s.bot.status === 'connected'
        )
    
        if (activeSessions.length === 0) return null

        const bot = activeSessions[this.roundRobinIndex % activeSessions.length]
        this.roundRobinIndex++
    
        return bot || null
    }

    getSession(botId: string): BotSession | undefined {
        return this.sessions.get(botId)
    }

    getAllSessions(): BotSession[] {
        return Array.from(this.sessions.values())
    }
}

export const steamSessionManager = new SteamSessionManager()