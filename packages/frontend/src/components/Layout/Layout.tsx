import React, { useState } from 'react'
import Header from '../Header/Header'
import ConsolePage from '../../pages/ConsolePage'
import AccountsPage from '../../pages/AccountsPage'
import ProxyPage from '../../pages/ProxyPage'
import FriendsPage from '../../pages/FriendsPage'
import SettingsPage from '../../pages/SettingsPage'
import ActionsPage from '../../pages/ActionsPage'
import FAQPage from '../../pages/FAQPage'
import { NavigationTab, Console as ConsoleEntry, Account, Friend } from '../../types'

const Layout: React.FC = () => {
  const [activePage, setActivePage] = useState('console')

  // Mock data for demonstration
  const mockTabs: NavigationTab[] = [
    { id: 'console', label: 'Console', active: activePage === 'console' },
    { id: 'accounts', label: 'Import accounts', active: activePage === 'accounts', badge: 5 },
    { id: 'proxy', label: 'Import proxy', active: activePage === 'proxy' },
    { id: 'friends', label: 'Friends', active: activePage === 'friends', badge: 12 },
    { id: 'settings', label: 'Settings', active: activePage === 'settings' },
    { id: 'actions', label: 'Actions', active: activePage === 'actions' },
    { id: 'faq', label: 'FAQ', active: activePage === 'faq' },
  ]

  const mockConsoleEntries: ConsoleEntry[] = [
    {
      id: '1',
      timestamp: new Date(),
      level: 'info',
      message: 'Steam Bot Multichat started successfully',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 60000),
      level: 'success',
      message: 'Account [user123] logged in successfully',
      account: 'user123'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 120000),
      level: 'warning',
      message: 'Proxy connection unstable for account [user456]',
      account: 'user456'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 180000),
      level: 'error',
      message: 'Failed to send message to friend [friend789]',
    }
  ]

  const mockAccounts: Account[] = [
    {
      id: '1',
      username: 'steamuser123',
      status: 'online',
      isLoggedIn: true,
      lastActivity: new Date()
    },
    {
      id: '2',
      username: 'botaccount456',
      status: 'idle',
      isLoggedIn: true,
      lastActivity: new Date(Date.now() - 300000)
    },
    {
      id: '3',
      username: 'testuser789',
      status: 'offline',
      isLoggedIn: false,
    }
  ]

  const mockFriends: Friend[] = [
    {
      id: '1',
      steamId: '76561198000000001',
      name: 'John Doe',
      status: 'online',
      lastMessage: 'Hey, how are you?',
      lastSeen: new Date()
    },
    {
      id: '2',
      steamId: '76561198000000002',
      name: 'Jane Smith',
      status: 'away',
      lastMessage: 'Thanks for the game!',
      lastSeen: new Date(Date.now() - 1800000)
    }
  ]

  const handleNavClick = (pageId: string) => {
    setActivePage(pageId)
  }

  return (
    <div className="min-h-screen bg-steam-darkblue text-white">
      <Header
        tabs={mockTabs}
        onNavClick={handleNavClick}
        accountsCount={mockAccounts.length}
        onlineAccountsCount={mockAccounts.filter(a => a.status === 'online').length}
      />
      
      <main className="container mx-auto px-4 py-6">
        {activePage === 'console' && <ConsolePage entries={mockConsoleEntries} />}
        {activePage === 'accounts' && <AccountsPage accounts={mockAccounts} />}
        {activePage === 'proxy' && <ProxyPage />}
        {activePage === 'friends' && <FriendsPage friends={mockFriends} />}
        {activePage === 'settings' && <SettingsPage />}
        {activePage === 'actions' && <ActionsPage />}
        {activePage === 'faq' && <FAQPage />}
      </main>
    </div>
  )
}

export default Layout
