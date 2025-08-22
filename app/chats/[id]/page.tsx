'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toggleAgent, sendMessage } from '@/lib/actions/chats'
import { ArrowLeft, Bot, User, Send, ToggleLeft, ToggleRight, Clock } from 'lucide-react'

interface Message {
    id: string
    chatId: string
    from: 'bot' | 'player'
    text: string
    timestamp: string
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
        status: string
    }
    messages: Message[]
}

export default function ChatDetailPage() {
    const params = useParams()
    const router = useRouter()
    const chatId = params.id as string
    
    const [chat, setChat] = useState<Chat | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [messageText, setMessageText] = useState('')
    const [sending, setSending] = useState(false)
    const [lastMessageTime, setLastMessageTime] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (chatId) {
            fetchChat()
            const interval = setInterval(pollNewMessages, 1500)
            return () => clearInterval(interval)
        }
        return () => {} // Return empty cleanup function for non-chatId case
    }, [chatId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    async function fetchChat() {
        try {
            const res = await fetch(`/api/chats/${chatId}`)
            const data = await res.json()
            setChat(data)
            setMessages(data.messages || [])
            if (data.messages?.length > 0) {
                setLastMessageTime(data.messages[data.messages.length - 1].timestamp)
            }
        } catch (error) {
            console.error('Failed to fetch chat:', error)
        }
    }

    async function pollNewMessages() {
        if (!lastMessageTime) return
        
        try {
            const res = await fetch(`/api/chats/${chatId}/messages?since=${lastMessageTime}`)
            const newMessages = await res.json()
            
            if (newMessages.length > 0) {
                setMessages(prev => [...prev, ...newMessages])
                setLastMessageTime(newMessages[newMessages.length - 1].timestamp)
            }
        } catch (error) {
            console.error('Failed to poll messages:', error)
        }
    }

    async function handleToggleAgent() {
        if (!chat) return
        
        try {
            await toggleAgent({ chatId: chat.id, enabled: !chat.agentEnabled })
            setChat(prev => prev ? { ...prev, agentEnabled: !prev.agentEnabled } : null)
        } catch (error) {
            console.error('Failed to toggle agent:', error)
        }
    }

    async function handleSendMessage() {
        if (!messageText.trim() || !chat) return
        
        setSending(true)
        try {
            await sendMessage({ 
                chatId: chat.id, 
                text: messageText.trim() 
            })
            setMessageText('')
            
            // Add optimistic update
            const newMessage: Message = {
                id: `temp-${Date.now()}`,
                chatId: chat.id,
                from: 'bot',
                text: messageText.trim(),
                timestamp: new Date().toISOString()
            }
            setMessages(prev => [...prev, newMessage])
            setLastMessageTime(newMessage.timestamp)
            
            // Fetch updated messages
            setTimeout(fetchChat, 500)
        } catch (error) {
            console.error('Failed to send message:', error)
        }
        setSending(false)
    }

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

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

    if (!chat) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-gray-400">Loading chat...</div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-steam-blue border border-steam-lightblue rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push('/chats')}
                            className="p-2 hover:bg-steam-lightblue/30 rounded transition-colors"
                        >
                            <ArrowLeft size={20} className="text-gray-300" />
                        </button>
                        
                        <div>
                            <div className="flex items-center space-x-2">
                                <h1 className="text-xl font-bold text-white">
                                    {chat.playerSteamId64}
                                </h1>
                                <span className="text-xs text-gray-400">Player</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                                <Bot size={14} className="text-gray-400" />
                                <span className="text-gray-300">
                                    {chat.bot.label || chat.bot.steamId64}
                                </span>
                                <div className="flex items-center space-x-1">
                                    <div className={`w-2 h-2 rounded-full ${getBotStatusDot(chat.bot.status)}`}></div>
                                    <span className={`text-xs ${getBotStatusColor(chat.bot.status)}`}>
                                        {chat.bot.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleToggleAgent}
                        className={`flex items-center space-x-2 px-4 py-2 rounded transition-colors ${
                            chat.agentEnabled 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'bg-gray-600 hover:bg-gray-700 text-white'
                        }`}
                    >
                        {chat.agentEnabled ? (
                            <>
                                <ToggleRight size={20} />
                                <span>Agent Enabled</span>
                            </>
                        ) : (
                            <>
                                <ToggleLeft size={20} />
                                <span>Agent Disabled</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="bg-steam-blue border border-steam-lightblue rounded-lg p-4">
                <div 
                    className="h-[500px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-steam-lightblue scrollbar-track-steam-darkblue"
                >
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            No messages yet. Start a conversation!
                        </div>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.from === 'bot' ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div className={`max-w-[70%] ${message.from === 'bot' ? 'order-2' : 'order-1'}`}>
                                        <div className="flex items-end space-x-2">
                                            {message.from === 'bot' && (
                                                <div className="w-8 h-8 bg-steam-green rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Bot size={16} className="text-white" />
                                                </div>
                                            )}
                                            
                                            <div className={`p-3 rounded-lg ${
                                                message.from === 'bot' 
                                                    ? 'bg-steam-lightblue/30 text-white' 
                                                    : 'bg-steam-green/20 text-white'
                                            }`}>
                                                <p className="text-sm">{message.text}</p>
                                                <div className="flex items-center space-x-1 mt-1">
                                                    <Clock size={10} className="text-gray-400" />
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(message.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {message.from === 'player' && (
                                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User size={16} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-steam-blue border border-steam-lightblue rounded-lg p-4">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                        placeholder="Type a message..."
                        disabled={sending || chat.bot.status !== 'connected'}
                        className="flex-1 input-field"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={sending || !messageText.trim() || chat.bot.status !== 'connected'}
                        className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                        <Send size={16} />
                        <span>{sending ? 'Sending...' : 'Send'}</span>
                    </button>
                </div>
                {chat.bot.status !== 'connected' && (
                    <p className="text-xs text-red-400 mt-2">
                        Bot is not connected. Messages cannot be sent.
                    </p>
                )}
            </div>
        </div>
    )
}