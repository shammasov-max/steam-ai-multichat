import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const status = searchParams.get('status')
        const assignedBotId = searchParams.get('assignedBotId')
    
        const where: { status?: string; assignedBotId?: string } = {}
        if (status) where.status = status
        if (assignedBotId) where.assignedBotId = assignedBotId
    
        const tasks = await prisma.task.findMany({
            where,
            include: {
                assignedBot: true,
                target: true,
                preconditions: true,
            },
            orderBy: { createdAt: 'desc' },
        })
    
        return NextResponse.json(tasks)
    } catch (error) {
        console.error('Failed to fetch tasks:', error)
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }
}