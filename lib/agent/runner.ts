import { prisma } from '../db/client'
import { steamSessionManager } from '../steam/sessionManager'

const AGENT_MESSAGES = [
    'Hi! I\'m here to help you with your request.',
    'I understand you\'re looking for {item}.',
    'The price range we\'re working with is ${priceMin} - ${priceMax}.',
    'Let me check what options are available for you.',
    'I\'ll process this for you right away.',
]

const MESSAGE_DELAY_MS = 4000 // 4 seconds between messages

export async function runAgentForChat(chatId: string) {
    const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { bot: true },
    })
  
    if (!chat || !chat.agentEnabled) {
        return
    }
  
    const task = await prisma.task.findFirst({
        where: {
            assignedBotId: chat.botId,
            playerSteamId64: chat.playerSteamId64,
            status: 'accepted',
        },
        include: { target: true },
    })
  
    if (!task) {
        return
    }
  
    const session = steamSessionManager.getSession(chat.botId)
    if (!session) {
        return
    }
  
    const messageCount = Math.floor(Math.random() * 3) + 3 // 3-5 messages
  
    for (let i = 0; i < messageCount && i < AGENT_MESSAGES.length; i++) {
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, MESSAGE_DELAY_MS))
        }
    
        const updatedChat = await prisma.chat.findUnique({
            where: { id: chatId },
        })
    
        if (!updatedChat?.agentEnabled) {
            console.log(`Agent disabled for chat ${chatId}, stopping`)
            break
        }
    
        let message = AGENT_MESSAGES[i]
        if (message) {
            message = message
                .replace('{item}', task.item)
                .replace('{priceMin}', task.priceMin.toString())
                .replace('{priceMax}', task.priceMax.toString())
        } else {
            continue
        }
    
        await prisma.message.create({
            data: {
                chatId,
                from: 'bot',
                text: message,
            },
        })
    
        await steamSessionManager.sendMessage(
            chat.botId,
            chat.playerSteamId64,
            message
        )
    
        console.log(`Agent sent message ${i + 1}/${messageCount} to chat ${chatId}`)
    }
  
    await prisma.task.update({
        where: { id: task.id },
        data: { status: 'resolved' },
    })
  
    console.log(`Task ${task.id} marked as resolved after agent script`)
}

export async function processAcceptedChats() {
    const acceptedTasks = await prisma.task.findMany({
        where: { status: 'accepted' },
        include: { assignedBot: true },
    })
  
    for (const task of acceptedTasks) {
        if (!task.assignedBot) continue
    
        const chat = await prisma.chat.findFirst({
            where: {
                botId: task.assignedBotId!,
                playerSteamId64: task.playerSteamId64,
                agentEnabled: true,
            },
        })
    
        if (chat) {
            runAgentForChat(chat.id).catch(console.error)
        }
    }
}