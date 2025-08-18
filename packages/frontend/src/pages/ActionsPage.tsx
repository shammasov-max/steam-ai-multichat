import React, { useState } from 'react'
import SearchBox from '../components/UI/SearchBox'
import ViewSwitcher, { ViewType } from '../components/UI/ViewSwitcher'
import ActionsTable from '../components/Tables/ActionsTable'
import { Zap, MessageSquare, UserPlus, Award, Clock, Send, Play, Square, Filter } from 'lucide-react'

const ActionsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'messaging' | 'social' | 'gaming'>('all')
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<ViewType>('list')

  const actions = [
    {
      id: 'mass-message',
      title: 'Mass Message',
      description: 'Send messages to multiple friends',
      icon: 'MessageSquare',
      color: 'bg-blue-600',
      category: 'messaging' as const
    },
    {
      id: 'friend-inviter',
      title: 'Friend Inviter',
      description: 'Automatically send friend requests',
      icon: 'UserPlus',
      color: 'bg-green-600',
      category: 'social' as const
    },
    {
      id: 'hour-boost',
      title: 'Hour Boost',
      description: 'Boost game hours for accounts',
      icon: 'Clock',
      color: 'bg-purple-600',
      category: 'gaming' as const
    },
    {
      id: 'spam-comments',
      title: 'Spam Comments',
      description: 'Post comments on profiles/groups',
      icon: 'MessageSquare',
      color: 'bg-orange-600',
      category: 'messaging' as const
    },
    {
      id: 'achievement-spam',
      title: 'Achievement Spam',
      description: 'Unlock achievements automatically',
      icon: 'Award',
      color: 'bg-yellow-600',
      category: 'gaming' as const
    },
    {
      id: 'wall-spam',
      title: 'Wall Spam',
      description: 'Post on Steam community walls',
      icon: 'Send',
      color: 'bg-red-600',
      category: 'messaging' as const
    },
    {
      id: 'group-joiner',
      title: 'Group Joiner',
      description: 'Automatically join Steam groups',
      icon: 'UserPlus',
      color: 'bg-indigo-600',
      category: 'social' as const
    },
    {
      id: 'profile-visitor',
      title: 'Profile Visitor',
      description: 'Visit random profiles to increase visibility',
      icon: 'UserPlus',
      color: 'bg-pink-600',
      category: 'social' as const
    },
    {
      id: 'game-idler',
      title: 'Game Idler',
      description: 'Idle in games to increase playtime',
      icon: 'Clock',
      color: 'bg-teal-600',
      category: 'gaming' as const
    }
  ]

  const categories = {
    messaging: 'Messaging',
    social: 'Social',
    gaming: 'Gaming'
  }

  const filteredActions = actions.filter(action => {
    const matchesSearch = action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || action.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap size={24} className="text-steam-green" />
          <h1 className="text-2xl font-bold text-white">Bot Actions</h1>
        </div>
        <div className="text-sm text-gray-300">
          {filteredActions.length} of {actions.length} actions
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <SearchBox
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search actions by name or description..."
            className="flex-1 max-w-md"
          />

          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="input-field"
            >
              <option value="all">All Categories</option>
              <option value="messaging">Messaging</option>
              <option value="social">Social</option>
              <option value="gaming">Gaming</option>
            </select>
          </div>
        </div>

        <ViewSwitcher
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      </div>

      {currentView === 'list' ? (
        <div className="space-y-6">
          {Object.entries(categories).map(([categoryKey, categoryName]) => {
            const categoryActions = filteredActions.filter(action => action.category === categoryKey)

            if (categoryActions.length === 0 && categoryFilter !== 'all') return null

            return (
              <div key={categoryKey}>
                {(categoryFilter === 'all' || categoryFilter === categoryKey) && categoryActions.length > 0 && (
                  <>
                    <h4 className="text-lg font-medium text-steam-green mb-3">{categoryName}</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryActions.map((action) => {
                        const getIcon = (iconName: string) => {
                          switch (iconName) {
                            case 'MessageSquare': return <MessageSquare size={20} className="text-white" />
                            case 'UserPlus': return <UserPlus size={20} className="text-white" />
                            case 'Award': return <Award size={20} className="text-white" />
                            case 'Clock': return <Clock size={20} className="text-white" />
                            case 'Send': return <Send size={20} className="text-white" />
                            default: return <Zap size={20} className="text-white" />
                          }
                        }

                        return (
                          <div
                            key={action.id}
                            className="p-4 rounded-lg border border-steam-lightblue bg-steam-lightblue/20 hover:border-steam-green/50 transition-all cursor-pointer"
                            onClick={() => setActiveAction(activeAction === action.id ? null : action.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${action.color} shrink-0`}>
                                {getIcon(action.icon)}
                              </div>

                              <div className="flex-1">
                                <h5 className="font-medium text-white mb-1">{action.title}</h5>
                                <p className="text-sm text-gray-400 mb-3">{action.description}</p>

                                {activeAction === action.id && (
                                  <div className="space-y-3 mt-4 pt-3 border-t border-steam-lightblue/30">
                                    {action.id === 'mass-message' && (
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-sm font-medium text-white mb-2">Message Content</label>
                                          <textarea
                                            placeholder="Enter your message..."
                                            className="input-field w-full h-20 resize-none"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-white mb-2">Delay between messages (seconds)</label>
                                          <input
                                            type="number"
                                            defaultValue={5}
                                            className="input-field w-24"
                                            min="1"
                                            max="60"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex space-x-2 pt-2">
                                      <button className="btn-primary flex items-center space-x-1">
                                        <Play size={14} />
                                        <span>Start</span>
                                      </button>
                                      <button className="btn-secondary flex items-center space-x-1">
                                        <Square size={14} />
                                        <span>Stop</span>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {activeAction !== action.id && (
                                  <button className="btn-secondary text-sm px-3 py-1">
                                    Configure
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <ActionsTable actions={filteredActions} />
      )}

      {filteredActions.length === 0 && searchTerm && (
        <div className="text-center py-12 text-gray-400">
          <Zap size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No actions found</p>
          <p className="text-sm">Try adjusting your search terms or filters</p>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 bg-yellow-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div>
            <h5 className="font-medium text-yellow-400 mb-1">Important Notice</h5>
            <p className="text-sm text-yellow-200">
              Use these actions responsibly and in accordance with Steam's Terms of Service. 
              Excessive automation may result in account restrictions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActionsPage
