import React from 'react'
import { NavigationTab } from '../../types'
import { Activity, Users, Wifi, Settings, Zap, HelpCircle } from 'lucide-react'

interface HeaderProps {
  tabs: NavigationTab[]
  onNavClick: (pageId: string) => void
  accountsCount: number
  onlineAccountsCount: number
}

const Header: React.FC<HeaderProps> = ({ tabs, onNavClick, accountsCount, onlineAccountsCount }) => {
  const getNavIcon = (pageId: string) => {
    switch (pageId) {
      case 'console': return <Activity size={16} />
      case 'accounts': return <Users size={16} />
      case 'proxy': return <Wifi size={16} />
      case 'friends': return <Users size={16} />
      case 'settings': return <Settings size={16} />
      case 'actions': return <Zap size={16} />
      case 'faq': return <HelpCircle size={16} />
      default: return null
    }
  }

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
                <span className="text-green-400">{onlineAccountsCount} Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-gray-400">{accountsCount - onlineAccountsCount} Offline</span>
              </div>
              <div className="text-gray-300">
                Total: <span className="text-white font-medium">{accountsCount}</span>
              </div>
            </div>
          </div>
        </div>
        
        <nav className="border-t border-steam-lightblue/30">
          <div className="flex space-x-1 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onNavClick(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium text-sm transition-colors relative
                  ${tab.active
                    ? 'bg-steam-lightblue text-white border-b-2 border-steam-green'
                    : 'text-gray-300 hover:text-white hover:bg-steam-lightblue/30'
                  }
                `}
              >
                {getNavIcon(tab.id)}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="bg-steam-green text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header
