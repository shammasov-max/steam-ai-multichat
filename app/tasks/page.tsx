'use client'

import { useState, useEffect } from 'react'
import { disposeTask } from '@/lib/actions/tasks'
import { Task } from '@/lib/zod/tasks'
import SearchBox from '@/components/ui/search-box'
import ViewSwitcher, { ViewType } from '@/components/ui/view-switcher'
import { AddTaskModal } from '@/components/modals/add-task-modal'
import { Zap, Plus, Filter, Clock, CheckCircle, XCircle, AlertCircle, Trash2, Archive } from 'lucide-react'

// Extended task type that includes relations returned by API
interface TaskWithRelations extends Task {
  assignedBot?: {
    id: string
    steamId64: string
    label?: string
    status: string
  } | null
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<TaskWithRelations[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'created' | 'assigned' | 'invited' | 'accepted' | 'resolved' | 'failed' | 'disposed'>('all')
    const [selectedTasks, setSelectedTasks] = useState<string[]>([])
    const [currentView, setCurrentView] = useState<ViewType>('list')
    const [showCreateModal, setShowCreateModal] = useState(false)

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


    async function handleDisposeTask(taskId: string) {
        await disposeTask({ taskId })
        fetchTasks()
    }

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.playerSteamId64?.includes(searchTerm) || 
                             task.item?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             task.assignedBot?.label?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusColor = (status: Task['status']) => {
        switch (status) {
            case 'created': return 'text-blue-400'
            case 'assigned': return 'text-yellow-400'
            case 'invited': return 'text-purple-400'
            case 'accepted': return 'text-green-400'
            case 'resolved': return 'text-green-500'
            case 'failed': return 'text-red-400'
            case 'disposed': return 'text-gray-400'
            default: return 'text-gray-400'
        }
    }

    const getStatusIcon = (status: Task['status']) => {
        switch (status) {
            case 'created': return <Clock size={16} />
            case 'assigned': return <Zap size={16} />
            case 'invited': return <AlertCircle size={16} />
            case 'accepted': return <CheckCircle size={16} />
            case 'resolved': return <CheckCircle size={16} />
            case 'failed': return <XCircle size={16} />
            case 'disposed': return <Archive size={16} />
            default: return <Clock size={16} />
        }
    }

    const getStatusDot = (status: Task['status']) => {
        switch (status) {
            case 'created': return 'bg-blue-400'
            case 'assigned': return 'bg-yellow-400'
            case 'invited': return 'bg-purple-400'
            case 'accepted': return 'bg-green-400'
            case 'resolved': return 'bg-green-500'
            case 'failed': return 'bg-red-400'
            case 'disposed': return 'bg-gray-400'
            default: return 'bg-gray-400'
        }
    }

    const toggleTask = (taskId: string) => {
        setSelectedTasks(prev => 
            prev.includes(taskId) 
                ? prev.filter(id => id !== taskId)
                : [...prev, taskId]
        )
    }

    const selectAll = () => {
        setSelectedTasks(filteredTasks.map(task => task.id))
    }

    const selectNone = () => {
        setSelectedTasks([])
    }

    const canDispose = (status: Task['status']) => {
        return !['resolved', 'disposed'].includes(status)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Task Management</h1>
                <div className="text-sm text-gray-300">
                    {filteredTasks.length} of {tasks.length} tasks
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                    <SearchBox
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search tasks by player, item or bot..."
                        className="flex-1 max-w-md"
                    />

                    <div className="flex items-center space-x-2">
                        <Filter size={16} className="text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="input-field"
                        >
                            <option value="all">All Status</option>
                            <option value="created">Created</option>
                            <option value="assigned">Assigned</option>
                            <option value="invited">Invited</option>
                            <option value="accepted">Accepted</option>
                            <option value="resolved">Resolved</option>
                            <option value="failed">Failed</option>
                            <option value="disposed">Disposed</option>
                        </select>
                    </div>
                </div>

                <ViewSwitcher
                    currentView={currentView}
                    onViewChange={setCurrentView}
                />
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus size={16} />
                        <span>Create Task</span>
                    </button>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-300">
                        {selectedTasks.length} selected
                    </span>
                    <button onClick={selectAll} className="text-steam-green hover:text-steam-green/80">
                        Select All
                    </button>
                    <span className="text-gray-500">|</span>
                    <button onClick={selectNone} className="text-steam-green hover:text-steam-green/80">
                        Select None
                    </button>
                </div>
            </div>

            <AddTaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />

            {selectedTasks.length > 0 && (
                <div className="p-4 bg-steam-lightblue/30 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Bulk Actions:</span>
                        <div className="flex items-center space-x-2">
                            <button className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm">
                                <Archive size={14} />
                                <span>Dispose Selected</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {currentView === 'list' ? (
                <div className="space-y-3">
                    {filteredTasks.map((task) => (
                        <div
                            key={task.id}
                            className={`
                                p-4 rounded-lg border cursor-pointer transition-all
                                ${selectedTasks.includes(task.id)
                                    ? 'border-steam-green bg-steam-green/10'
                                    : 'border-steam-lightblue hover:border-steam-green/50 bg-steam-lightblue/20'
                                }
                            `}
                            onClick={() => toggleTask(task.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedTasks.includes(task.id)}
                                        onChange={() => toggleTask(task.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4"
                                    />
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className="flex-1">
                                            <div className="font-medium text-white">{task.item}</div>
                                            <div className="text-xs text-gray-400">ID: {task.id.slice(0, 8)}...</div>
                                        </div>
                                        <div className="text-sm text-gray-300 min-w-0 flex-shrink-0">
                                            Player: <span className="text-gray-400">{task.playerSteamId64?.slice(0, 12)}...</span>
                                        </div>
                                        <div className="text-sm text-gray-300 flex-shrink-0">
                                            ${task.priceMin} - ${task.priceMax}
                                        </div>
                                        {task.assignedBot && (
                                            <div className="text-sm text-gray-300 flex-shrink-0">
                                                Bot: <span className="text-gray-400">{task.assignedBot.label || task.assignedBot.steamId64?.slice(0, 8) + '...'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className={`flex items-center space-x-1 ${getStatusColor(task.status)}`}>
                                        {getStatusIcon(task.status)}
                                        <span className="text-sm capitalize">{task.status}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(task.createdAt).toLocaleDateString()}
                                    </span>
                                    {canDispose(task.status) && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDisposeTask(task.id)
                                            }}
                                            className="p-1 text-gray-400 hover:text-red-400"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-steam-blue border border-steam-lightblue rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-steam-lightblue/30">
                            <tr>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                                        onChange={() => selectedTasks.length === filteredTasks.length ? selectNone() : selectAll()}
                                        className="w-4 h-4"
                                    />
                                </th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">ID</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Player ID</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Item</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Price Range</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Status</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Assigned Bot</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Created</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.map((task) => (
                                <tr key={task.id} className="border-t border-steam-lightblue/30 hover:bg-steam-lightblue/10">
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedTasks.includes(task.id)}
                                            onChange={() => toggleTask(task.id)}
                                            className="w-4 h-4"
                                        />
                                    </td>
                                    <td className="p-3 text-sm text-gray-300">{task.id.slice(0, 8)}...</td>
                                    <td className="p-3 text-sm text-gray-300">{task.playerSteamId64}</td>
                                    <td className="p-3 text-sm text-white font-medium">{task.item}</td>
                                    <td className="p-3 text-sm text-gray-300">
                                        ${task.priceMin} - ${task.priceMax}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-2 h-2 rounded-full ${getStatusDot(task.status)}`}></div>
                                            <span className={`text-sm ${getStatusColor(task.status)}`}>
                                                {task.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm text-gray-300">
                                        {task.assignedBot ? (task.assignedBot.label || task.assignedBot.steamId64) : '-'}
                                    </td>
                                    <td className="p-3 text-sm text-gray-300">
                                        {new Date(task.createdAt).toLocaleString()}
                                    </td>
                                    <td className="p-3">
                                        {canDispose(task.status) && (
                                            <button 
                                                onClick={() => handleDisposeTask(task.id)}
                                                className="p-1 text-gray-400 hover:text-red-400"
                                                title="Dispose"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredTasks.length === 0 && searchTerm && (
                <div className="text-center py-12 text-gray-400">
                    <Zap size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No tasks found</p>
                    <p className="text-sm">Try adjusting your search terms or filters</p>
                </div>
            )}

            {tasks.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <Zap size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No tasks created</p>
                    <p className="text-sm">Create tasks to automate bot operations</p>
                </div>
            )}
        </div>
    )
}