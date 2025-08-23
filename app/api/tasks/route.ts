import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/client'
import { createPollingApiHandler } from '@/lib/api/createHandler'

export function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const assignedBotId = searchParams.get('assignedBotId')

    const where: { status?: string; assignedBotId?: string } = {}
    if (status) where.status = status
    if (assignedBotId) where.assignedBotId = assignedBotId

    return createPollingApiHandler({
        fetcher: () => prisma.task.findMany({
            where,
            include: {
                assignedBot: true,
                target: true,
                preconditions: true,
            },
            orderBy: { createdAt: 'desc' },
        })
    })(request)
}