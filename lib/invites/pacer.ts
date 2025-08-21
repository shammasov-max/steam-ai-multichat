import { prisma } from '../db/client'
import { steamSessionManager } from '../steam/sessionManager'

const INVITE_COOLDOWN_MS = 60000 // 1 minute

export async function processAssignedTasks() {
    const assignedTasks = await prisma.task.findMany({
        where: { status: 'assigned' },
        include: {
            assignedBot: true,
            preconditions: true,
        },
    })
  
    for (const task of assignedTasks) {
        if (!task.assignedBot || !task.preconditions?.requireFriendship) {
            continue
        }
    
        const session = steamSessionManager.getSession(task.assignedBotId!)
        if (!session) continue
    
        const now = Date.now()
        if (session.lastInviteAt && now - session.lastInviteAt < INVITE_COOLDOWN_MS) {
            continue
        }
    
        const existingRequest = await prisma.friendRequest.findFirst({
            where: {
                botId: task.assignedBotId!,
                playerSteamId64: task.playerSteamId64,
                status: { in: ['sent', 'accepted'] },
            },
        })
    
        if (!existingRequest) {
            const sent = await steamSessionManager.sendFriendRequest(
        task.assignedBotId!,
        task.playerSteamId64
            )
      
            if (sent) {
                await prisma.task.update({
                    where: { id: task.id },
                    data: { status: 'invited' },
                })
        
                console.log(`Sent friend request from bot ${task.assignedBotId} to ${task.playerSteamId64}`)
            }
        }
    }
}