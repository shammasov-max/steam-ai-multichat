'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SearchBox from '@/components/ui/search-box'
import ViewSwitcher, { ViewType } from '@/components/ui/view-switcher'
import { MessageSquare, Bot, User, ToggleLeft, ToggleRight, Filter, Clock } from 'lucide-react'

interface Chat {
    id: string
    botId: string
    playerSteamId64: string
    agentEnabled: boolean
    createdAt: string
    updatedAt: string
    bot: {
        id: string
        steamId64: string
        label?: string
        status: string
    }
    _count: {
        messages: number
    }
}

export default function ChatsPage() {
    const [chats, setChats] = useState<Chat[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [agentFilter, setAgentFilter] = useState<'all' | 'enabled' | 'disabled'>('all')
    const [currentView, setCurrentView] = useState<ViewType>('list')

    useEffect(() => {
        fetchChats()
        const interval = setInterval(fetchChats, 2000)
        return () => clearInterval(interval)
    }, [])

    async function fetchChats() {
        try {
            const res = await fetch('/api/chats')
            const data = await res.json()
            setChats(data)
        } catch (error) {
            console.error('Failed to fetch chats:', error)
        }
    }

    const filteredChats = chats.filter(chat => {
        const matchesSearch = chat.playerSteamId64?.includes(searchTerm) || 
                             chat.bot?.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             chat.bot?.steamId64?.includes(searchTerm)
        const matchesAgent = agentFilter === 'all' || 
                           (agentFilter === 'enabled' && chat.agentEnabled) ||
                           (agentFilter === 'disabled' && !chat.agentEnabled)
        return matchesSearch && matchesAgent
    })

    const getBotStatusColor = (status: string) => {
        switch (status) {
            case 'connected': return 'text-green-400'
            case 'connecting': return 'text-yellow-400'
            case 'authFailed': return 'text-red-400'
            case 'disconnected': return 'text-gray-400'
            default: return 'text-gray-400'
        }
    }

    const getBotStatusDot = (status: string) => {
        switch (status) {
            case 'connected': return 'bg-green-400'
            case 'connecting': return 'bg-yellow-400'
            case 'authFailed': return 'bg-red-400'
            case 'disconnected': return 'bg-gray-400'
            default: return 'bg-gray-400'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Chat Management</h1>
                <div className="text-sm text-gray-300">
                    {filteredChats.length} of {chats.length} chats
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                    <SearchBox
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search chats by player or bot..."
                        className="flex-1 max-w-md"
                    />

                    <div className="flex items-center space-x-2">
                        <Filter size={16} className="text-gray-400" />
                        <select
                            value={agentFilter}
                            onChange={(e) => setAgentFilter(e.target.value as any)}
                            className="input-field"
                        >
                            <option value="all">All Chats</option>
                            <option value="enabled">Agent Enabled</option>
                            <option value="disabled">Agent Disabled</option>
                        </select>
                    </div>
                </div>

                <ViewSwitcher
                    currentView={currentView}
                    onViewChange={setCurrentView}
                />
            </div>

            {currentView === 'list' ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredChats.map((chat) => (
                        <Link
                            key={chat.id}
                            href={`/chats/${chat.id}`}
                            className="block"
                        >
                            <div className="p-4 rounded-lg border border-steam-lightblue hover:border-steam-green/50 bg-steam-lightblue/20 transition-all cursor-pointer">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-10 h-10 bg-steam-lightblue rounded-full flex items-center justify-center">
                                                <User size={20} className="text-gray-300" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white text-sm">
                                                    {chat.playerSteamId64}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Player ID
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            {chat.agentEnabled ? (
                                                <div className="flex items-center space-x-1 text-green-400">
                                                    <ToggleRight size={20} />
                                                    <span className="text-xs">Agent</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-1 text-gray-400">
                                                    <ToggleLeft size={20} />
                                                    <span className="text-xs">Manual</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center space-x-2">
                                                <Bot size={14} className="text-gray-400" />
                                                <span className="text-gray-300">
                                                    {chat.bot?.label || chat.bot?.steamId64?.slice(0, 10) + '...'}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <div className={`w-2 h-2 rounded-full ${getBotStatusDot(chat.bot?.status)}`}></div>
                                                <span className={`text-xs ${getBotStatusColor(chat.bot?.status)}`}>
                                                    {chat.bot?.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center space-x-2">
                                                <MessageSquare size={14} className="text-gray-400" />
                                                <span className="text-gray-300">
                                                    {chat._count.messages} messages
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-1 text-gray-400">
                                                <Clock size={12} />
                                                <span className="text-xs">
                                                    {new Date(chat.updatedAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-steam-lightblue/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-400">
                                                Started: {new Date(chat.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs text-steam-green hover:text-steam-green/80">
                                                View Chat →
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="bg-steam-blue border border-steam-lightblue rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-steam-lightblue/30">
                            <tr>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Player</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Bot</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Status</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Agent</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Messages</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Last Activity</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredChats.map((chat) => (
                                <tr key={chat.id} className="border-t border-steam-lightblue/30 hover:bg-steam-lightblue/10">
                                    <td className="p-3">
                                        <div className="flex items-center space-x-2">
                                            <User size={16} className="text-gray-400" />
                                            <span className="text-sm text-white">{chat.playerSteamId64}</span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center space-x-2">
                                            <Bot size={16} className="text-gray-400" />
                                            <span className="text-sm text-gray-300">
                                                {chat.bot?.label || chat.bot?.steamId64}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-2 h-2 rounded-full ${getBotStatusDot(chat.bot?.status)}`}></div>
                                            <span className={`text-sm ${getBotStatusColor(chat.bot?.status)}`}>
                                                {chat.bot?.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        {chat.agentEnabled ? (
                                            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                                                <ToggleRight size={14} />
                                                <span>Enabled</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
                                                <ToggleLeft size={14} />
                                                <span>Disabled</span>
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center space-x-1">
                                            <MessageSquare size={14} className="text-gray-400" />
                                            <span className="text-sm text-gray-300">{chat._count.messages}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm text-gray-300">
                                        {new Date(chat.updatedAt).toLocaleString()}
                                    </td>
                                    <td className="p-3">
                                        <Link
                                            href={`/chats/${chat.id}`}
                                            className="text-steam-green hover:text-steam-green/80 text-sm"
                                        >
                                            View →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredChats.length === 0 && searchTerm && (
                <div className="text-center py-12 text-gray-400">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No chats found</p>
                    <p className="text-sm">Try adjusting your search terms or filters</p>
                </div>
            )}

            {chats.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No active chats</p>
                    <p className="text-sm">Chats will appear here when bots interact with players</p>
                </div>
            )}
        </div>
    )
}