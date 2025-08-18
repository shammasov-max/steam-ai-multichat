import React, { useState } from 'react'
import { Friend } from '../../../types'
import { Users, MessageCircle, UserPlus, Search, Filter } from 'lucide-react'

interface FriendsModalProps {
  friends: Friend[]
}

const FriendsModal: React.FC<FriendsModalProps> = ({ friends }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'away' | 'busy'>('all')

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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
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
        
        <div className="text-sm text-gray-300">
          {filteredFriends.length} of {friends.length} friends
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search friends by name or Steam ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full pl-10"
          />
        </div>
        
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        {filteredFriends.map((friend) => (
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
                  <div className="text-xs text-gray-400">
                    Last seen: {friend.lastSeen.toLocaleString()}
                  </div>
                )}
                
                <div className="flex space-x-2 mt-3">
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

      {filteredFriends.length === 0 && searchTerm && (
        <div className="text-center py-12 text-gray-400">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No friends found</p>
          <p className="text-sm">Try adjusting your search terms or filters</p>
        </div>
      )}

      {friends.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No friends yet</p>
          <p className="text-sm">Add friends to start conversations</p>
        </div>
      )}
    </div>
  )
}

export default FriendsModal
