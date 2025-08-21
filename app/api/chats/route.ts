import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const botId = searchParams.get('botId')
        const playerSteamId64 = searchParams.get('playerSteamId64')
    
        const where: { botId?: string; playerSteamId64?: string } = {}
        if (botId) where.botId = botId
        if (playerSteamId64) where.playerSteamId64 = playerSteamId64
    
        const chats = await prisma.chat.findMany({
            where,
            include: {
                bot: true,
                _count: {
                    select: { messages: true },
                },
            },
            orderBy: { updatedAt: 'desc' },
        })
    
        return NextResponse.json(chats)
    } catch (error) {
        console.error('Failed to fetch chats:', error)
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 })
    }
}