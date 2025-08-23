import { prisma } from '@/lib/db/client'
import { createPollingApiHandler } from '@/lib/api/createHandler'

export const GET = createPollingApiHandler({
    fetcher: () => prisma.bot.findMany({
        orderBy: { createdAt: 'desc' },
    })
})