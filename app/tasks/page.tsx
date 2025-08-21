'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { createTask, disposeTask } from '@/lib/actions/tasks'

interface Task {
  id: string
  playerSteamId64: string
  item: string
  priceMin: number
  priceMax: number
  status: string
  assignedBot?: {
    id: string
    steamId64: string
    label?: string
  }
  createdAt: string
  updatedAt: string
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [playerSteamId64, setPlayerSteamId64] = useState('')
    const [item, setItem] = useState('')
    const [priceMin, setPriceMin] = useState('')
    const [priceMax, setPriceMax] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchTasks()
        const interval = setInterval(fetchTasks, 2000)
        return () => clearInterval(interval)
    }, [])

    async function fetchTasks() {
        try {
            const res = await fetch('/api/tasks')
            const data = await res.json()
            setTasks(data)
        } catch (error) {
            console.error('Failed to fetch tasks:', error)
        }
    }

    async function handleCreateTask() {
        setLoading(true)
        try {
            const result = await createTask({
                playerSteamId64,
                item,
                priceMin: parseFloat(priceMin),
                priceMax: parseFloat(priceMax),
                target: {
                    type: 'buy_item',
                    payload: {
                        item,
                        priceMin: parseFloat(priceMin),
                        priceMax: parseFloat(priceMax),
                    },
                    successCriteria: 'Item purchased within price range',
                },
                preconditions: {
                    requireFriendship: true,
                },
            })
            if (result.success) {
                setPlayerSteamId64('')
                setItem('')
                setPriceMin('')
                setPriceMax('')
                fetchTasks()
            }
        } catch (error) {
            console.error('Failed to create task:', error)
        }
        setLoading(false)
    }

    async function handleDisposeTask(taskId: string) {
        await disposeTask({ taskId })
        fetchTasks()
    }

    const getStatusColor = (status: string) => {
        switch (status) {
        case 'created': return 'bg-blue-100 text-blue-800'
        case 'assigned': return 'bg-purple-100 text-purple-800'
        case 'invited': return 'bg-yellow-100 text-yellow-800'
        case 'accepted': return 'bg-green-100 text-green-800'
        case 'resolved': return 'bg-green-200 text-green-900'
        case 'failed': return 'bg-red-100 text-red-800'
        case 'disposed': return 'bg-gray-100 text-gray-800'
        default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Task Management</h1>
      
            <div className="border p-4 rounded space-y-4">
                <h2 className="text-lg font-semibold">Create New Task</h2>
                <div className="grid grid-cols-2 gap-4">
                    <input
                        className="p-2 border rounded"
                        placeholder="Player Steam ID64"
                        value={playerSteamId64}
                        onChange={(e) => setPlayerSteamId64(e.target.value)}
                    />
                    <input
                        className="p-2 border rounded"
                        placeholder="Item name"
                        value={item}
                        onChange={(e) => setItem(e.target.value)}
                    />
                    <input
                        className="p-2 border rounded"
                        type="number"
                        placeholder="Min price"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                    />
                    <input
                        className="p-2 border rounded"
                        type="number"
                        placeholder="Max price"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                    />
                </div>
                <Button
                    onClick={handleCreateTask}
                    disabled={loading || !playerSteamId64 || !item || !priceMin || !priceMax}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                >
          Create Task
                </Button>
            </div>

            <div className="border p-4 rounded">
                <h2 className="text-lg font-semibold mb-4">Tasks List</h2>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-2">ID</th>
                                <th className="text-left p-2">Player ID</th>
                                <th className="text-left p-2">Item</th>
                                <th className="text-left p-2">Price Range</th>
                                <th className="text-left p-2">Status</th>
                                <th className="text-left p-2">Assigned Bot</th>
                                <th className="text-left p-2">Created</th>
                                <th className="text-left p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map((task) => (
                                <tr key={task.id} className="border-b">
                                    <td className="p-2 font-mono text-xs">{task.id.slice(0, 8)}</td>
                                    <td className="p-2 text-xs">{task.playerSteamId64}</td>
                                    <td className="p-2">{task.item}</td>
                                    <td className="p-2">${task.priceMin} - ${task.priceMax}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="p-2 text-xs">
                                        {task.assignedBot ? (task.assignedBot.label || task.assignedBot.steamId64) : '-'}
                                    </td>
                                    <td className="p-2 text-xs">
                                        {new Date(task.createdAt).toLocaleString()}
                                    </td>
                                    <td className="p-2">
                                        {!['disposed', 'resolved'].includes(task.status) && (
                                            <Button
                                                onClick={() => handleDisposeTask(task.id)}
                                                className="bg-red-600 text-white hover:bg-red-700 text-xs px-2 py-1"
                                            >
                        Dispose
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}