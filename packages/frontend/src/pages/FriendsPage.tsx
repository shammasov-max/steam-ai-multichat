import React, { useState } from 'react'
import { Friend } from '../types'
import SearchBox from '../components/UI/SearchBox'
import ViewSwitcher, { ViewType } from '../components/UI/ViewSwitcher'
import FriendsTable from '../components/Tables/FriendsTable'
import { Users, MessageCircle, UserPlus, Filter } from 'lucide-react'

interface FriendsPageProps {
  friends: Friend[]
}

const FriendsPage: React.FC<FriendsPageProps> = ({ friends }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'away' | 'busy'>('all')
  const [currentView, setCurrentView] = useState<ViewType>('list')

  const filteredFriends = friends.filter(friend => {
    const matchesSearch = friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         friend.steamId.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || friend.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'online': return 'text-green-400'
      case 'away': return 'text-yellow-400'
      case 'busy': return 'text-red-400'
      case 'offline': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusDot = (status: Friend['status']) => {
    switch (status) {
      case 'online': return 'bg-green-400'
      case 'away': return 'bg-yellow-400'
      case 'busy': return 'bg-red-400'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  // Generate more mock friends for demonstration
  const mockFriends: Friend[] = [
    ...friends,
    {
      id: '3',
      steamId: '76561198000000003',
      name: 'Alex Johnson',
      status: 'online',
      lastMessage: 'Ready for the game?',
      lastSeen: new Date(Date.now() - 300000)
    },
    {
      id: '4',
      steamId: '76561198000000004',
      name: 'Sarah Connor',
      status: 'busy',
      lastMessage: 'In a meeting, talk later',
      lastSeen: new Date(Date.now() - 3600000)
    },
    {
      id: '5',
      steamId: '76561198000000005',
      name: 'Mike Wilson',
      status: 'away',
      lastMessage: 'AFK for lunch',
      lastSeen: new Date(Date.now() - 1800000)
    },
    {
      id: '6',
      steamId: '76561198000000006',
      name: 'Emily Davis',
      status: 'offline',
      lastMessage: 'Thanks for the trade!',
      lastSeen: new Date(Date.now() - 86400000)
    },
    {
      id: '7',
      steamId: '76561198000000007',
      name: 'Chris Brown',
      status: 'online',
      lastMessage: 'Want to play CS2?',
      lastSeen: new Date()
    },
    {
      id: '8',
      steamId: '76561198000000008',
      name: 'Jessica Lee',
      status: 'away',
      lastMessage: 'Good game!',
      lastSeen: new Date(Date.now() - 900000)
    }
  ]

  const filteredMockFriends = mockFriends.filter(friend => {
    const matchesSearch = friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         friend.steamId.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || friend.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Friends</h1>
        <div className="text-sm text-gray-300">
          {filteredMockFriends.length} of {mockFriends.length} friends
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <SearchBox
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search friends by name or Steam ID..."
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
              <option value="online">Online</option>
              <option value="away">Away</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>

        <ViewSwitcher
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      </div>

      <div className="flex items-center space-x-4">
        <button className="btn-primary flex items-center space-x-2">
          <UserPlus size={16} />
          <span>Add Friend</span>
        </button>
        <button className="btn-secondary flex items-center space-x-2">
          <MessageCircle size={16} />
          <span>Mass Message</span>
        </button>
      </div>

      {currentView === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMockFriends.map((friend) => (
            <div
              key={friend.id}
              className="p-4 rounded-lg border border-steam-lightblue bg-steam-lightblue/20 hover:border-steam-green/50 transition-all"
            >
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-steam-lightblue rounded-full flex items-center justify-center shrink-0">
                  <Users size={24} className="text-gray-300" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-white truncate">{friend.name}</h3>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusDot(friend.status)}`}></div>
                      <span className={`text-xs ${getStatusColor(friend.status)}`}>
                        {friend.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 mb-2 font-mono">
                    {friend.steamId}
                  </div>

                  {friend.lastMessage && (
                    <div className="text-sm text-gray-300 mb-2 bg-steam-blue/50 p-2 rounded">
                      <div className="text-xs text-gray-400 mb-1">Last message:</div>
                      <div className="truncate">"{friend.lastMessage}"</div>
                    </div>
                  )}

                  {friend.lastSeen && (
                    <div className="text-xs text-gray-400 mb-3">
                      Last seen: {friend.lastSeen.toLocaleString()}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button className="flex-1 px-3 py-1 bg-steam-green hover:bg-steam-green/80 rounded text-sm font-medium transition-colors">
                      Message
                    </button>
                    <button className="px-3 py-1 bg-steam-lightblue hover:bg-steam-lightblue/80 rounded text-sm font-medium transition-colors">
                      Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <FriendsTable friends={filteredMockFriends} />
      )}

      {filteredMockFriends.length === 0 && searchTerm && (
        <div className="text-center py-12 text-gray-400">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No friends found</p>
          <p className="text-sm">Try adjusting your search terms or filters</p>
        </div>
      )}

      {mockFriends.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No friends yet</p>
          <p className="text-sm">Add friends to start conversations</p>
        </div>
      )}
    </div>
  )
}

export default FriendsPage
