import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const searchParams = request.nextUrl.searchParams
        const since = searchParams.get('since')
    
        const where: { chatId: string; ts?: { gt: Date } } = { chatId: id }
        if (since) {
            where.ts = { gt: new Date(since) }
        }
    
        const messages = await prisma.message.findMany({
            where,
            orderBy: { ts: 'asc' },
            take: 100,
        })
    
        return NextResponse.json(messages)
    } catch (error) {
        console.error('Failed to fetch messages:', error)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
}