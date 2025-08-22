'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, Users, Settings, Zap, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationTab {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

interface HeaderProps {
  botsCount?: number
  onlineBotsCount?: number
}

const Header: React.FC<HeaderProps> = ({ botsCount = 0, onlineBotsCount = 0 }) => {
  const pathname = usePathname()

  const tabs: NavigationTab[] = [
    { id: 'home', label: 'Dashboard', href: '/', icon: <Activity size={16} /> },
    { id: 'bots', label: 'Bots', href: '/bots', icon: <Users size={16} />, badge: botsCount },
    { id: 'tasks', label: 'Tasks', href: '/tasks', icon: <Zap size={16} /> },
    { id: 'chats', label: 'Chats', href: '/chats', icon: <MessageSquare size={16} /> },
    { id: 'settings', label: 'Settings', href: '/settings', icon: <Settings size={16} /> },
  ]

  return (
    <header className="bg-steam-blue border-b border-steam-lightblue">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-steam-green rounded flex items-center justify-center">
              <Activity size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Steam Bot Multichat</h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-steam-green rounded-full"></div>
                <span className="text-green-400">{onlineBotsCount} Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-gray-400">{botsCount - onlineBotsCount} Offline</span>
              </div>
              <div className="text-gray-300">
                Total: <span className="text-white font-medium">{botsCount}</span>
              </div>
            </div>
          </div>
        </div>
        
        <nav className="border-t border-steam-lightblue/30">
          <div className="flex space-x-1 py-2">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium text-sm transition-colors relative",
                  pathname === tab.href
                    ? "bg-steam-lightblue text-white border-b-2 border-steam-green"
                    : "text-gray-300 hover:text-white hover:bg-steam-lightblue/30"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="bg-steam-green text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {tab.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header