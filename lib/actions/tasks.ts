'use server'

import { prisma } from '../db/client'
import { CreateTaskInput, DisposeTaskInput } from '../zod/tasks'
import { revalidatePath } from 'next/cache'

export async function createTask(input: CreateTaskInput) {
    const validated = CreateTaskInput.parse(input)
  
    try {
        const task = await prisma.task.create({
            data: {
                playerSteamId64: validated.playerSteamId64,
                item: validated.item,
                priceMin: validated.priceMin,
                priceMax: validated.priceMax,
                status: 'created',
                target: validated.target ? {
                    create: {
                        targetType: validated.target.type,
                        targetPayload: JSON.stringify(validated.target.payload),
                        successCriteria: validated.target.successCriteria,
                    },
                } : undefined,
                preconditions: validated.preconditions ? {
                    create: {
                        requireFriendship: validated.preconditions.requireFriendship ?? true,
                        scriptId: validated.preconditions.scriptId || null,
                    },
                } : undefined,
            },
            include: {
                target: true,
                preconditions: true,
            },
        })
    
        revalidatePath('/tasks')
        return { success: true, task }
    } catch (error) {
        console.error('Failed to create task:', error)
        return { success: false, error: 'Failed to create task' }
    }
}

export async function disposeTask(input: DisposeTaskInput) {
    const validated = DisposeTaskInput.parse(input)
  
    try {
        const task = await prisma.task.update({
            where: { id: validated.taskId },
            data: { status: 'disposed' },
        })
    
        revalidatePath('/tasks')
        return { success: true, task }
    } catch (error) {
        console.error('Failed to dispose task:', error)
        return { success: false, error: 'Failed to dispose task' }
    }
}