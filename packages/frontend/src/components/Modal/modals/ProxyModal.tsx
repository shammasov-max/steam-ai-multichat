import React, { useState } from 'react'
import { ProxyServer } from '../../../types'
import { Wifi, WifiOff, Plus, Upload, Download, Trash2, RefreshCw } from 'lucide-react'

const ProxyModal: React.FC = () => {
  const [proxies] = useState<ProxyServer[]>([
    {
      id: '1',
      host: '192.168.1.100',
      port: 8080,
      username: 'proxyuser',
      password: '********',
      status: 'connected',
      accounts: ['steamuser123', 'botaccount456']
    },
    {
      id: '2',
      host: '10.0.0.50',
      port: 3128,
      status: 'disconnected',
      accounts: []
    },
    {
      id: '3',
      host: 'proxy.example.com',
      port: 8888,
      username: 'user',
      password: '********',
      status: 'error',
      accounts: ['testuser789']
    }
  ])

  const getStatusColor = (status: ProxyServer['status']) => {
    switch (status) {
      case 'connected': return 'text-green-400'
      case 'disconnected': return 'text-gray-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: ProxyServer['status']) => {
    switch (status) {
      case 'connected': return <Wifi size={16} className="text-green-400" />
      case 'disconnected': return <WifiOff size={16} className="text-gray-400" />
      case 'error': return <WifiOff size={16} className="text-red-400" />
      default: return <WifiOff size={16} className="text-gray-400" />
    }
  }

  const getStatusBadge = (status: ProxyServer['status']) => {
    switch (status) {
      case 'connected': return 'bg-green-600'
      case 'disconnected': return 'bg-gray-600'
      case 'error': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button className="btn-primary flex items-center space-x-2">
            <Plus size={16} />
            <span>Add Proxy</span>
          </button>
          <button className="btn-secondary flex items-center space-x-2">
            <Upload size={16} />
            <span>Import List</span>
          </button>
          <button className="btn-secondary flex items-center space-x-2">
            <Download size={16} />
            <span>Export</span>
          </button>
          <button className="btn-secondary flex items-center space-x-2">
            <RefreshCw size={16} />
            <span>Test All</span>
          </button>
        </div>
        
        <div className="text-sm text-gray-300">
          {proxies.length} proxy servers
        </div>
      </div>

      <div className="grid gap-4 max-h-96 overflow-y-auto">
        {proxies.map((proxy) => (
          <div
            key={proxy.id}
            className="p-4 rounded-lg border border-steam-lightblue bg-steam-lightblue/20 hover:border-steam-green/50 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getStatusIcon(proxy.status)}
                <div>
                  <div className="font-medium text-white">
                    {proxy.host}:{proxy.port}
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(proxy.status)} text-white`}>
                      {proxy.status.charAt(0).toUpperCase() + proxy.status.slice(1)}
                    </span>
                    {proxy.username && (
                      <span className="text-gray-400">• Auth: {proxy.username}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-green-400 transition-colors">
                  <RefreshCw size={16} />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            {proxy.accounts.length > 0 && (
              <div className="mb-3">
                <div className="text-sm text-gray-400 mb-2">
                  Assigned Accounts ({proxy.accounts.length}):
                </div>
                <div className="flex flex-wrap gap-1">
                  {proxy.accounts.map((account, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-steam-blue rounded text-xs text-gray-300"
                    >
                      {account}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Host:</span>
                <span className="text-white ml-2 font-mono">{proxy.host}</span>
              </div>
              <div>
                <span className="text-gray-400">Port:</span>
                <span className="text-white ml-2 font-mono">{proxy.port}</span>
              </div>
              {proxy.username && (
                <>
                  <div>
                    <span className="text-gray-400">Username:</span>
                    <span className="text-white ml-2">{proxy.username}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Password:</span>
                    <span className="text-white ml-2">{proxy.password}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-steam-lightblue/30">
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors">
                  Connect
                </button>
                <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors">
                  Test
                </button>
                <button className="px-3 py-1 bg-steam-lightblue hover:bg-steam-lightblue/80 rounded text-sm font-medium transition-colors">
                  Assign Accounts
                </button>
              </div>
              
              <div className="text-xs text-gray-400">
                Last tested: 2 minutes ago
              </div>
            </div>
          </div>
        ))}
      </div>

      {proxies.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Wifi size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No proxy servers configured</p>
          <p className="text-sm">Add proxy servers to route your bot traffic</p>
        </div>
      )}
    </div>
  )
}

export default ProxyModal
