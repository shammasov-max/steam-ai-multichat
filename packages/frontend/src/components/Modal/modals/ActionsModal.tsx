import React, { useState } from 'react'
import { Zap, MessageSquare, UserPlus, Award, Clock, Send, Play, Square } from 'lucide-react'

const ActionsModal: React.FC = () => {
  const [activeAction, setActiveAction] = useState<string | null>(null)

  const actions = [
    {
      id: 'mass-message',
      title: 'Mass Message',
      description: 'Send messages to multiple friends',
      icon: MessageSquare,
      color: 'bg-blue-600',
      category: 'messaging'
    },
    {
      id: 'friend-inviter',
      title: 'Friend Inviter',
      description: 'Automatically send friend requests',
      icon: UserPlus,
      color: 'bg-green-600',
      category: 'social'
    },
    {
      id: 'hour-boost',
      title: 'Hour Boost',
      description: 'Boost game hours for accounts',
      icon: Clock,
      color: 'bg-purple-600',
      category: 'gaming'
    },
    {
      id: 'spam-comments',
      title: 'Spam Comments',
      description: 'Post comments on profiles/groups',
      icon: MessageSquare,
      color: 'bg-orange-600',
      category: 'messaging'
    },
    {
      id: 'achievement-spam',
      title: 'Achievement Spam',
      description: 'Unlock achievements automatically',
      icon: Award,
      color: 'bg-yellow-600',
      category: 'gaming'
    },
    {
      id: 'wall-spam',
      title: 'Wall Spam',
      description: 'Post on Steam community walls',
      icon: Send,
      color: 'bg-red-600',
      category: 'messaging'
    }
  ]

  const categories = {
    messaging: 'Messaging',
    social: 'Social',
    gaming: 'Gaming'
  }

  return (
    <div className="p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Zap size={20} className="text-steam-green" />
        <h3 className="text-lg font-semibold text-white">Bot Actions</h3>
      </div>

      <div className="space-y-6">
        {Object.entries(categories).map(([categoryKey, categoryName]) => (
          <div key={categoryKey}>
            <h4 className="text-md font-medium text-steam-green mb-3">{categoryName}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {actions
                .filter(action => action.category === categoryKey)
                .map((action) => {
                  const IconComponent = action.icon
                  return (
                    <div
                      key={action.id}
                      className="p-4 rounded-lg border border-steam-lightblue bg-steam-lightblue/20 hover:border-steam-green/50 transition-all cursor-pointer"
                      onClick={() => setActiveAction(activeAction === action.id ? null : action.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${action.color} shrink-0`}>
                          <IconComponent size={20} className="text-white" />
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
                              
                              {action.id === 'friend-inviter' && (
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-white mb-2">Steam IDs (one per line)</label>
                                    <textarea
                                      placeholder="76561198000000001&#10;76561198000000002&#10;..."
                                      className="input-field w-full h-20 resize-none font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-white mb-2">Custom Message</label>
                                    <input
                                      type="text"
                                      placeholder="Hey! Want to be friends?"
                                      className="input-field w-full"
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {action.id === 'hour-boost' && (
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-white mb-2">Game App ID</label>
                                    <input
                                      type="text"
                                      placeholder="730 (CS2), 440 (TF2), etc."
                                      className="input-field w-full"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-white mb-2">Duration (hours)</label>
                                    <input
                                      type="number"
                                      defaultValue={1}
                                      className="input-field w-24"
                                      min="0.1"
                                      max="24"
                                      step="0.1"
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
          </div>
        ))}
      </div>
      
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

export default ActionsModal
