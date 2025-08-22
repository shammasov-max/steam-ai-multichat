// import SteamUser from 'steam-user'
// import SteamTotp from 'steam-totp'
import { prisma } from '../db/client'
import type { Bot } from '@prisma/client'
import { SteamAgent } from '../../packages/steam-agent/src/SteamAgent'

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

class SteamSessionManager {
    private sessions: Map<string, SteamAgent> = new Map()
    private bots: Map<string, Bot> = new Map()
    private lastInviteAt: Map<string, number> = new Map()
    private roundRobinIndex = 0

    async initBot(bot: Bot): Promise<SteamAgent> {
        const existing = this.sessions.get(bot.id)
        if (existing) {
            return existing
        }

        const maFile: MaFile = JSON.parse(bot.mafileJson)
        
        const agent = new SteamAgent({
            userName: maFile.account_name,
            password: bot.password,
            maFile: bot.mafileJson,
            proxy: bot.proxyUrl || undefined
        })

        this.setupAgentHandlers(agent, bot)
        this.sessions.set(bot.id, agent)
        this.bots.set(bot.id, bot)
        this.lastInviteAt.set(bot.id, 0)
    
        return agent
    }

    private setupAgentHandlers(agent: SteamAgent, bot: Bot) {
        agent.on('loggedOn', async () => {
            console.log(`Bot ${bot.steamId64} logged on`)
            await prisma.bot.update({
                where: { id: bot.id },
                data: { 
                    status: 'connected',
                    lastSeen: new Date(),
                },
            })
      
            agent.setPersonaState(1)
        })

        agent.on('error', async (err: Error) => {
            console.error(`Bot ${bot.steamId64} error:`, err)
            await prisma.bot.update({
                where: { id: bot.id },
                data: { status: 'authFailed' },
            })
        })

        agent.on('disconnected', async () => {
            console.log(`Bot ${bot.steamId64} disconnected`)
            await prisma.bot.update({
                where: { id: bot.id },
                data: { status: 'disconnected' },
            })
        })

        agent.on('friendRelationship', async (steamID: string, relationship: number) => {
            if (relationship === 2) {
                await agent.addFriend(steamID)
                console.log(`Bot ${bot.steamId64} accepted friend request from ${steamID}`)
        
                await prisma.friendRequest.updateMany({
                    where: {
                        botId: bot.id,
                        playerSteamId64: steamID,
                        status: 'sent',
                    },
                    data: { status: 'accepted' },
                })

                const existingChat = await prisma.chat.findFirst({
                    where: {
                        botId: bot.id,
                        playerSteamId64: steamID,
                    },
                })

                if (!existingChat) {
                    await prisma.chat.create({
                        data: {
                            botId: bot.id,
                            playerSteamId64: steamID,
                            agentEnabled: true,
                        },
                    })
                }

                await prisma.task.updateMany({
                    where: {
                        assignedBotId: bot.id,
                        playerSteamId64: steamID,
                        status: 'invited',
                    },
                    data: { status: 'accepted' },
                })
            }
        })

        agent.on('friendMessage', async (steamID: string, message: string) => {
            const chat = await prisma.chat.findFirst({
                where: {
                    botId: bot.id,
                    playerSteamId64: steamID,
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

        const agent = await this.initBot(bot)
        await agent.login()
    }

    async disconnectBot(botId: string) {
        const agent = this.sessions.get(botId)
        if (agent) {
            agent.logout()
            this.sessions.delete(botId)
            this.bots.delete(botId)
            this.lastInviteAt.delete(botId)
        }
    }

    async sendMessage(botId: string, playerSteamId64: string, message: string) {
        const agent = this.sessions.get(botId)
        if (!agent) throw new Error('Bot session not found')
    
        await agent.sendMessage(playerSteamId64, message)
    }

    async sendFriendRequest(botId: string, playerSteamId64: string): Promise<boolean> {
        const agent = this.sessions.get(botId)
        if (!agent) return false

        const now = Date.now()
        const lastInvite = this.lastInviteAt.get(botId) || 0
        if (lastInvite && now - lastInvite < 60000) {
            return false
        }

        try {
            await agent.addFriend(playerSteamId64)
            this.lastInviteAt.set(botId, now)
      
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

    async getNextAvailableBot(): Promise<{ agent: SteamAgent; bot: Bot } | null> {
        const activeBotIds: string[] = []
        
        for (const [botId, agent] of this.sessions) {
            const bot = this.bots.get(botId)
            if (bot && agent && bot.status === 'connected' && agent.getIsLoggedIn()) {
                activeBotIds.push(botId)
            }
        }
    
        if (activeBotIds.length === 0) return null

        const botId = activeBotIds[this.roundRobinIndex % activeBotIds.length]!
        this.roundRobinIndex++
        
        const agent = this.sessions.get(botId)
        const bot = this.bots.get(botId)
        
        if (!agent || !bot) return null
    
        return { agent, bot }
    }

    getSession(botId: string): SteamAgent | undefined {
        return this.sessions.get(botId)
    }

    getBot(botId: string): Bot | undefined {
        return this.bots.get(botId)
    }

    getAllSessions(): Array<{ agent: SteamAgent; bot: Bot }> {
        const result: Array<{ agent: SteamAgent; bot: Bot }> = []
        for (const [botId, agent] of this.sessions) {
            const bot = this.bots.get(botId)
            if (bot) {
                result.push({ agent, bot })
            }
        }
        return result
    }
}

export const steamSessionManager = new SteamSessionManager()