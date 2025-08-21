import { NextResponse } from 'next/server'
import { scheduler } from '@/lib/worker/scheduler'
import { prisma } from '@/lib/db/client'

let initialized = false

export async function GET() {
    if (!initialized) {
        scheduler.start()
    
        const connectedBots = await prisma.bot.findMany({
            where: { status: 'connected' },
        })
    
        for (const bot of connectedBots) {
            await prisma.bot.update({
                where: { id: bot.id },
                data: { status: 'disconnected' },
            })
        }
    
        initialized = true
        console.log('System initialized')
    }
  
    return NextResponse.json({ initialized: true })
}