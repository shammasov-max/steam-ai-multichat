'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { addBot, removeBot, connectBot } from '@/lib/actions/bots'
import { Bot } from '@/lib/zod/bots'

// Mock data for development environment - using real fixture data

const mockProxy = process.env.NODE_ENV === 'development' ? '188.130.188.216:3000:vlQ0qd:1zsNuGOYS9' : ''
const mockLabel = process.env.NODE_ENV === 'development' ? 'Test Bot boodb7727' : ''

export default function BotsPage() {
    const [bots, setBots] = useState<Bot[]>([])
    const [maFileJSON, setMaFileJSON] = useState('')
    const [proxyUrl, setProxyUrl] = useState(mockProxy)
    const [label, setLabel] = useState(mockLabel)
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

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

    async function handleAddBot() {
        setLoading(true)
        try {
            const result = await addBot({ maFileJSON, proxyUrl, label, password })
            if (result.success) {
                setMaFileJSON('')
                setProxyUrl('')
                setLabel('')
                setPassword('')
                fetchBots()
            }
        } catch (error) {
            console.error('Failed to add bot:', error)
        }
        setLoading(false)
    }

    async function handleRemoveBot(botId: string) {
        await removeBot({ botId })
        fetchBots()
    }

    async function handleConnectBot(botId: string) {
        await connectBot({ botId })
        fetchBots()
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Bot Management</h1>
      
            <div className="border p-4 rounded space-y-4">
                <h2 className="text-lg font-semibold">Add New Bot</h2>
                <div className="space-y-2">
                    <textarea
                        className="w-full p-2 border rounded h-32"
                        placeholder="Paste maFile JSON content..."
                        value={maFileJSON}
                        onChange={(e) => setMaFileJSON(e.target.value)}
                    />
                    <input
                        className="w-full p-2 border rounded"
                        placeholder="Proxy URL (e.g., http://user:pass@proxy.com:8080)"
                        value={proxyUrl}
                        onChange={(e) => setProxyUrl(e.target.value)}
                    />
                    <input
                        className="w-full p-2 border rounded"
                        placeholder="Label (optional)"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                    />
                    <input
                        className="w-full p-2 border rounded"
                        type="password"
                        placeholder="Password (required)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Button 
                        onClick={handleAddBot} 
                        disabled={loading || !maFileJSON || !proxyUrl || !password}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                    >
            Add Bot
                    </Button>
                </div>
            </div>

            <div className="border p-4 rounded">
                <h2 className="text-lg font-semibold mb-4">Bots List</h2>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-2">ID</th>
                                <th className="text-left p-2">Steam ID</th>
                                <th className="text-left p-2">Label</th>
                                <th className="text-left p-2">Proxy</th>
                                <th className="text-left p-2">Status</th>
                                <th className="text-left p-2">Last Seen</th>
                                <th className="text-left p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bots.map((bot) => (
                                <tr key={bot.id} className="border-b">
                                    <td className="p-2 font-mono text-xs">{bot.id.slice(0, 8)}</td>
                                    <td className="p-2">{bot.steamId64}</td>
                                    <td className="p-2">{bot.label || '-'}</td>
                                    <td className="p-2 text-xs truncate max-w-xs">{bot.proxyUrl}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            bot.status === 'connected' ? 'bg-green-100 text-green-800' :
                                                bot.status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                                                    bot.status === 'authFailed' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                        }`}>
                                            {bot.status}
                                        </span>
                                    </td>
                                    <td className="p-2 text-xs">
                                        {bot.lastSeen ? new Date(bot.lastSeen).toLocaleString() : '-'}
                                    </td>
                                    <td className="p-2 space-x-2">
                                        {bot.status === 'disconnected' && (
                                            <Button
                                                onClick={() => handleConnectBot(bot.id)}
                                                className="bg-green-600 text-white hover:bg-green-700 text-xs px-2 py-1"
                                            >
                        Connect
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => handleRemoveBot(bot.id)}
                                            className="bg-red-600 text-white hover:bg-red-700 text-xs px-2 py-1"
                                        >
                      Remove
                                        </Button>
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