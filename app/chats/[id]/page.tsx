'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toggleAgent, sendMessage } from '@/lib/actions/chats'
import { ArrowLeft, Bot, User } from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: string
  from: 'bot' | 'player'
  text: string
  ts: string
}

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
  messages: Message[]
}

export default function ChatPage() {
    const params = useParams()
    const chatId = params.id as string
    const [chat, setChat] = useState<Chat | null>(null)
    const [messageText, setMessageText] = useState('')
    const [sending, setSending] = useState(false)
    const lastMessageTime = useRef<string | null>(null)

    useEffect(() => {
        fetchChat()
        const interval = setInterval(fetchNewMessages, 1500)
        return () => clearInterval(interval)
    }, [chatId])

    async function fetchChat() {
        try {
            const res = await fetch(`/api/chats/${chatId}`)
            const data = await res.json()
            setChat(data)
            if (data.messages.length > 0) {
                lastMessageTime.current = data.messages[0].ts
            }
        } catch (error) {
            console.error('Failed to fetch chat:', error)
        }
    }

    async function fetchNewMessages() {
        if (!lastMessageTime.current) return
    
        try {
            const res = await fetch(`/api/chats/${chatId}/messages?since=${lastMessageTime.current}`)
            const newMessages = await res.json()
      
            if (newMessages.length > 0) {
                setChat(prev => {
                    if (!prev) return prev
                    const allMessages = [...newMessages, ...prev.messages]
                        .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
                        .slice(0, 50)
          
                    lastMessageTime.current = allMessages[0].ts
                    return { ...prev, messages: allMessages }
                })
            }
        } catch (error) {
            console.error('Failed to fetch new messages:', error)
        }
    }

    async function handleToggleAgent() {
        if (!chat) return
        await toggleAgent({ chatId, enabled: !chat.agentEnabled })
        fetchChat()
    }

    async function handleSendMessage() {
        if (!messageText.trim()) return
    
        setSending(true)
        try {
            const result = await sendMessage({ chatId, text: messageText })
            if (result.success) {
                setMessageText('')
                fetchChat()
            }
        } catch (error) {
            console.error('Failed to send message:', error)
        }
        setSending(false)
    }

    if (!chat) {
        return <div>Loading...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/chats">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">Chat with {chat.playerSteamId64}</h1>
                        <p className="text-sm text-gray-600">Bot: {chat.bot.label || chat.bot.steamId64}</p>
                    </div>
                </div>
                <Button
                    onClick={handleToggleAgent}
                    className={chat.agentEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}
                >
          Agent {chat.agentEnabled ? 'ON' : 'OFF'}
                </Button>
            </div>

            <div className="border rounded-lg h-[500px] flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {chat.messages.slice().reverse().map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-2 ${message.from === 'bot' ? 'justify-start' : 'justify-end'}`}
                        >
                            {message.from === 'bot' && <Bot className="h-5 w-5 text-blue-500 mt-1" />}
                            <div
                                className={`max-w-[70%] rounded-lg px-3 py-2 ${
                                    message.from === 'bot'
                                        ? 'bg-blue-100 text-blue-900'
                                        : 'bg-gray-100 text-gray-900'
                                }`}
                            >
                                <div className="text-sm">{message.text}</div>
                                <div className="text-xs opacity-60 mt-1">
                                    {new Date(message.ts).toLocaleTimeString()}
                                </div>
                            </div>
                            {message.from === 'player' && <User className="h-5 w-5 text-gray-500 mt-1" />}
                        </div>
                    ))}
                </div>
        
                <div className="border-t p-4">
                    <div className="flex gap-2">
                        <input
                            className="flex-1 p-2 border rounded"
                            placeholder="Type a message..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                            disabled={sending}
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={sending || !messageText.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
              Send
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}