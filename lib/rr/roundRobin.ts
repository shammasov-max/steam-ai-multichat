import { prisma } from '../db/client'
import { steamSessionManager } from '../steam/sessionManager'

export async function assignTaskToBot(taskId: string): Promise<boolean> {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
    })
  
    if (!task || task.status !== 'created') {
        return false
    }
  
    const nextBot = await steamSessionManager.getNextAvailableBot()
    if (!nextBot) {
        console.log('No available bots for task assignment')
        return false
    }
  
    await prisma.task.update({
        where: { id: taskId },
        data: {
            status: 'assigned',
            assignedBotId: nextBot.bot.id,
        },
    })
  
    console.log(`Task ${taskId} assigned to bot ${nextBot.bot.id}`)
    return true
}

export async function processNewTasks() {
    const newTasks = await prisma.task.findMany({
        where: { status: 'created' },
        orderBy: { createdAt: 'asc' },
    })
  
    for (const task of newTasks) {
        await assignTaskToBot(task.id)
    }
}