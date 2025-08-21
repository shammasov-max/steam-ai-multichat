import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET() {
    try {
        const bots = await prisma.bot.findMany({
            orderBy: { createdAt: 'desc' },
        })
    
        return NextResponse.json(bots)
    } catch (error) {
        console.error('Failed to fetch bots:', error)
        return NextResponse.json({ error: 'Failed to fetch bots' }, { status: 500 })
    }
}