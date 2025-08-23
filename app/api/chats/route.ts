import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/client'
import { createPollingApiHandler } from '@/lib/api/createHandler'

export function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const botId = searchParams.get('botId')
    const playerSteamId64 = searchParams.get('playerSteamId64')

    const where: { botId?: string; playerSteamId64?: string } = {}
    if (botId) where.botId = botId
    if (playerSteamId64) where.playerSteamId64 = playerSteamId64

    return createPollingApiHandler({
        fetcher: () => prisma.chat.findMany({
            where,
            include: {
                bot: true,
                _count: {
                    select: { messages: true },
                },
            },
            orderBy: { updatedAt: 'desc' },
        })
    })(request)
}