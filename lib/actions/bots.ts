'use server'

import { prisma } from '../db/client'
import { steamSessionManager } from '../steam/sessionManager'
import { AddBotInput, RemoveBotInput, ConnectBotInput } from '../zod/bots'
import { ActionResult } from '../types/common'
import { revalidatePath } from 'next/cache'

export async function addBot(input: AddBotInput): Promise<ActionResult> {
    const validated = AddBotInput.parse(input)
  
    try {
        const maFile = JSON.parse(validated.maFileJSON)
        const steamId64 = maFile.Session.SteamID = String(maFile.Session?.SteamID)// || maFile.account_name
    
        const bot = await prisma.bot.create({
            data: {
                steamId64,
                label: validated.label || null,
                proxyUrl: validated.proxyUrl,
                password: validated.password,
                mafileJson: validated.maFileJSON,
                status: 'disconnected',
            },
        })
    
        revalidatePath('/bots')
        return { success: true, data: bot }
    } catch (error) {
        console.error('Failed to add bot:', error)
        return { success: false, error: 'Failed to add bot' }
    }
}

export async function removeBot(input: RemoveBotInput): Promise<ActionResult> {
    const validated = RemoveBotInput.parse(input)
  
    try {
        await steamSessionManager.disconnectBot(validated.botId)
    
        await prisma.bot.delete({
            where: { id: validated.botId },
        })
    
        revalidatePath('/bots')
        return { success: true }
    } catch (error) {
        console.error('Failed to remove bot:', error)
        return { success: false, error: 'Failed to remove bot' }
    }
}

export async function connectBot(input: ConnectBotInput): Promise<ActionResult> {
    const validated = ConnectBotInput.parse(input)
  
    try {
        await steamSessionManager.connectBot(validated.botId)
    
        revalidatePath('/bots')
        return { success: true }
    } catch (error) {
        console.error('Failed to connect bot:', error)
        return { success: false, error: 'Failed to connect bot' }
    }
}