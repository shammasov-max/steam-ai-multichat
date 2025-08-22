'use client'

import { useState, useEffect } from 'react'
import { removeBot, connectBot } from '@/lib/actions/bots'
import { Bot } from '@/lib/zod/bots'
import SearchBox from '@/components/ui/search-box'
import ViewSwitcher, { ViewType } from '@/components/ui/view-switcher'
import { AddBotModal } from '@/components/modals/add-bot-modal'
import { Users, UserPlus, Upload, Download, Trash2, Play, Square, RefreshCw, Filter, Wifi, WifiOff } from 'lucide-react'

export default function BotsPage() {
    const [bots, setBots] = useState<Bot[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected' | 'connecting' | 'authFailed'>('all')
    const [selectedBots, setSelectedBots] = useState<string[]>([])
    const [currentView, setCurrentView] = useState<ViewType>('list')
    const [showAddModal, setShowAddModal] = useState(false)

    useEffect(() => {
        fetchBots()
        const interval = setInterval(fetchBots, 2000)
        return () => clearInterval(interval)
    }, [])

    async function fetchBots() {
        try {
            const res = await fetch('/api/bots')
            const data = await res.json()
            setBots(data)
        } catch (error) {
            console.error('Failed to fetch bots:', error)
        }
    }


    async function handleRemoveBot(botId: string) {
        await removeBot({ botId })
        fetchBots()
    }

    async function handleConnectBot(botId: string) {
        await connectBot({ botId })
        fetchBots()
    }

    const filteredBots = bots.filter(bot => {
        const matchesSearch = bot.label?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             bot.steamId64?.includes(searchTerm)
        const matchesStatus = statusFilter === 'all' || bot.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusColor = (status: Bot['status']) => {
        switch (status) {
            case 'connected': return 'text-green-400'
            case 'connecting': return 'text-yellow-400'
            case 'authFailed': return 'text-red-400'
            case 'disconnected': return 'text-gray-400'
            default: return 'text-gray-400'
        }
    }

    const getStatusDot = (status: Bot['status']) => {
        switch (status) {
            case 'connected': return 'bg-green-400'
            case 'connecting': return 'bg-yellow-400'
            case 'authFailed': return 'bg-red-400'
            case 'disconnected': return 'bg-gray-400'
            default: return 'bg-gray-400'
        }
    }

    const toggleBot = (botId: string) => {
        setSelectedBots(prev => 
            prev.includes(botId) 
                ? prev.filter(id => id !== botId)
                : [...prev, botId]
        )
    }

    const selectAll = () => {
        setSelectedBots(filteredBots.map(bot => bot.id))
    }

    const selectNone = () => {
        setSelectedBots([])
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Bot Management</h1>
                <div className="text-sm text-gray-300">
                    {filteredBots.length} of {bots.length} bots
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                    <SearchBox
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search bots by label or Steam ID..."
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
                            <option value="connected">Connected</option>
                            <option value="connecting">Connecting</option>
                            <option value="authFailed">Auth Failed</option>
                            <option value="disconnected">Disconnected</option>
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
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <UserPlus size={16} />
                        <span>Add Bot</span>
                    </button>
                    <button className="btn-secondary flex items-center space-x-2">
                        <Upload size={16} />
                        <span>Import</span>
                    </button>
                    <button className="btn-secondary flex items-center space-x-2">
                        <Download size={16} />
                        <span>Export</span>
                    </button>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-300">
                        {selectedBots.length} selected
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

            <AddBotModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
            />

            {selectedBots.length > 0 && (
                <div className="p-4 bg-steam-lightblue/30 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Bulk Actions:</span>
                        <div className="flex items-center space-x-2">
                            <button className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm">
                                <Play size={14} />
                                <span>Connect</span>
                            </button>
                            <button className="flex items-center space-x-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm">
                                <Square size={14} />
                                <span>Disconnect</span>
                            </button>
                            <button className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                                <RefreshCw size={14} />
                                <span>Reconnect</span>
                            </button>
                            <button className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm">
                                <Trash2 size={14} />
                                <span>Remove</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {currentView === 'list' ? (
                <div className="grid gap-4">
                    {filteredBots.map((bot) => (
                        <div
                            key={bot.id}
                            className={`
                                p-4 rounded-lg border cursor-pointer transition-all
                                ${selectedBots.includes(bot.id)
                                    ? 'border-steam-green bg-steam-green/10'
                                    : 'border-steam-lightblue hover:border-steam-green/50 bg-steam-lightblue/20'
                                }
                            `}
                            onClick={() => toggleBot(bot.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedBots.includes(bot.id)}
                                        onChange={() => toggleBot(bot.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 text-steam-green bg-steam-blue border-steam-lightblue rounded focus:ring-steam-green"
                                    />

                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-steam-lightblue rounded-full flex items-center justify-center">
                                            {bot.status === 'connected' ? (
                                                <Wifi size={20} className="text-green-400" />
                                            ) : (
                                                <WifiOff size={20} className="text-gray-400" />
                                            )}
                                        </div>

                                        <div>
                                            <div className="font-medium text-white">
                                                {bot.label || bot.steamId64 || 'Unknown Bot'}
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm">
                                                <div className={`w-2 h-2 rounded-full ${getStatusDot(bot.status)}`}></div>
                                                <span className={getStatusColor(bot.status)}>
                                                    {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
                                                </span>
                                                {bot.steamId64 && (
                                                    <span className="text-gray-400">• {bot.steamId64}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    {bot.lastSeen && (
                                        <span className="text-xs text-gray-400">
                                            Last: {new Date(bot.lastSeen).toLocaleTimeString()}
                                        </span>
                                    )}
                                    <div className="flex space-x-1">
                                        {bot.status === 'disconnected' && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleConnectBot(bot.id)
                                                }}
                                                className="p-1 text-gray-400 hover:text-green-400"
                                            >
                                                <Play size={14} />
                                            </button>
                                        )}
                                        {bot.status === 'connected' && (
                                            <button 
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-1 text-gray-400 hover:text-yellow-400"
                                            >
                                                <Square size={14} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleRemoveBot(bot.id)
                                            }}
                                            className="p-1 text-gray-400 hover:text-red-400"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
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
                                        checked={selectedBots.length === filteredBots.length && filteredBots.length > 0}
                                        onChange={() => selectedBots.length === filteredBots.length ? selectNone() : selectAll()}
                                        className="w-4 h-4"
                                    />
                                </th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Bot</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Steam ID</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Status</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Proxy</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Last Seen</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBots.map((bot) => (
                                <tr key={bot.id} className="border-t border-steam-lightblue/30 hover:bg-steam-lightblue/10">
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedBots.includes(bot.id)}
                                            onChange={() => toggleBot(bot.id)}
                                            className="w-4 h-4"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-steam-lightblue rounded-full flex items-center justify-center">
                                                {bot.status === 'connected' ? (
                                                    <Wifi size={16} className="text-green-400" />
                                                ) : (
                                                    <WifiOff size={16} className="text-gray-400" />
                                                )}
                                            </div>
                                            <span className="font-medium">{bot.label || 'Unnamed'}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm text-gray-300">{bot.steamId64 || '-'}</td>
                                    <td className="p-3">
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-2 h-2 rounded-full ${getStatusDot(bot.status)}`}></div>
                                            <span className={`text-sm ${getStatusColor(bot.status)}`}>
                                                {bot.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm text-gray-300">
                                        <span className="truncate max-w-xs block" title={bot.proxyUrl}>
                                            {bot.proxyUrl?.split('@')[1] || bot.proxyUrl || '-'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm text-gray-300">
                                        {bot.lastSeen ? new Date(bot.lastSeen).toLocaleString() : '-'}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex space-x-1">
                                            {bot.status === 'disconnected' && (
                                                <button 
                                                    onClick={() => handleConnectBot(bot.id)}
                                                    className="p-1 text-gray-400 hover:text-green-400"
                                                    title="Connect"
                                                >
                                                    <Play size={14} />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleRemoveBot(bot.id)}
                                                className="p-1 text-gray-400 hover:text-red-400"
                                                title="Remove"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredBots.length === 0 && searchTerm && (
                <div className="text-center py-12 text-gray-400">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No bots found</p>
                    <p className="text-sm">Try adjusting your search terms or filters</p>
                </div>
            )}

            {bots.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No bots configured</p>
                    <p className="text-sm">Add Steam bots to get started</p>
                </div>
            )}
        </div>
    )
}