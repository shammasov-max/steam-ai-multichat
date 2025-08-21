'use server'

import { prisma } from '../db/client'
import { steamSessionManager } from '../steam/sessionManager'
import { ToggleAgentInput, SendMessageInput } from '../zod/chats'
import { revalidatePath } from 'next/cache'

export async function toggleAgent(input: ToggleAgentInput) {
    const validated = ToggleAgentInput.parse(input)
  
    try {
        const chat = await prisma.chat.update({
            where: { id: validated.chatId },
            data: { agentEnabled: validated.enabled },
        })
    
        revalidatePath('/chats')
        revalidatePath(`/chats/${validated.chatId}`)
        return { success: true, chat }
    } catch (error) {
        console.error('Failed to toggle agent:', error)
        return { success: false, error: 'Failed to toggle agent' }
    }
}

export async function sendMessage(input: SendMessageInput) {
    const validated = SendMessageInput.parse(input)
  
    try {
        const chat = await prisma.chat.findUnique({
            where: { id: validated.chatId },
            include: { bot: true },
        })
    
        if (!chat) {
            return { success: false, error: 'Chat not found' }
        }
    
        const message = await prisma.message.create({
            data: {
                chatId: validated.chatId,
                from: 'bot',
                text: validated.text,
            },
        })
    
        await steamSessionManager.sendMessage(
            chat.botId,
            chat.playerSteamId64,
            validated.text
        )
    
        revalidatePath(`/chats/${validated.chatId}`)
        return { success: true, message }
    } catch (error) {
        console.error('Failed to send message:', error)
        return { success: false, error: 'Failed to send message' }
    }
}