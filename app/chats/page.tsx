'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

interface Chat {
  id: string
  botId: string
  playerSteamId64: string
  agentEnabled: boolean
  bot: {
    id: string
    steamId64: string
    label?: string
  }
  _count: {
    messages: number
  }
  updatedAt: string
}

export default function ChatsPage() {
    const [chats, setChats] = useState<Chat[]>([])

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

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Chats</h1>
      
            <div className="grid gap-4">
                {chats.map((chat) => (
                    <Link
                        key={chat.id}
                        href={`/chats/${chat.id}`}
                        className="border p-4 rounded hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MessageCircle className="h-5 w-5 text-gray-500" />
                                <div>
                                    <div className="font-semibold">
                    Player: {chat.playerSteamId64}
                                    </div>
                                    <div className="text-sm text-gray-600">
                    Bot: {chat.bot.label || chat.bot.steamId64}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        chat.agentEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                    Agent {chat.agentEnabled ? 'ON' : 'OFF'}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {chat._count.messages} messages
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {new Date(chat.updatedAt).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
        
                {chats.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
            No chats available yet
                    </div>
                )}
            </div>
        </div>
    )
}