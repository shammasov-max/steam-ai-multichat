import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const chat = await prisma.chat.findUnique({
            where: { id },
            include: {
                bot: true,
                messages: {
                    orderBy: { ts: 'desc' },
                    take: 50,
                },
            },
        })
    
        if (!chat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
        }
    
        return NextResponse.json(chat)
    } catch (error) {
        console.error('Failed to fetch chat:', error)
        return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 })
    }
}