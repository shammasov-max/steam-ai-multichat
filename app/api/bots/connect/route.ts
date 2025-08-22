import { NextRequest, NextResponse } from 'next/server'
import { ConnectBotInput } from '@/lib/zod/bots'
import { steamSessionManager } from '@/lib/steam/sessionManager'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validated = ConnectBotInput.parse(body)
        
        await steamSessionManager.connectBot(validated.botId)
        
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to connect bot:', error)
        return NextResponse.json({ success: false, error: 'Failed to connect bot' }, { status: 500 })
    }
}