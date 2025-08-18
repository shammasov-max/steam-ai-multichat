import React, { useState } from 'react'
import { Settings, Save, RotateCcw, Bell, Shield, Globe, Zap } from 'lucide-react'

const SettingsModal: React.FC = () => {
  const [settings, setSettings] = useState({
    general: {
      autoStart: true,
      minimizeToTray: false,
      checkUpdates: true,
      logLevel: 'info'
    },
    messaging: {
      messageDelay: 2000,
      retryAttempts: 3,
      maxConcurrentChats: 5,
      enableSpamProtection: true
    },
    notifications: {
      showNotifications: true,
      playSound: false,
      notifyOnError: true,
      notifyOnFriendRequest: true
    },
    security: {
      savePasswords: false,
      enableEncryption: true,
      allowRemoteAccess: false,
      ipWhitelist: ''
    }
  })

  const updateSetting = (category: keyof typeof settings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const resetToDefaults = () => {
    setSettings({
      general: {
        autoStart: true,
        minimizeToTray: false,
        checkUpdates: true,
        logLevel: 'info'
      },
      messaging: {
        messageDelay: 2000,
        retryAttempts: 3,
        maxConcurrentChats: 5,
        enableSpamProtection: true
      },
      notifications: {
        showNotifications: true,
        playSound: false,
        notifyOnError: true,
        notifyOnFriendRequest: true
      },
      security: {
        savePasswords: false,
        enableEncryption: true,
        allowRemoteAccess: false,
        ipWhitelist: ''
      }
    })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings size={20} className="text-steam-green" />
          <h3 className="text-lg font-semibold text-white">Application Settings</h3>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={resetToDefaults}
            className="btn-secondary flex items-center space-x-2"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <Save size={16} />
            <span>Save</span>
          </button>
        </div>
      </div>

      <div className="space-y-8 max-h-96 overflow-y-auto">
        {/* General Settings */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Globe size={18} className="text-steam-green" />
            <h4 className="text-md font-medium text-white">General</h4>
          </div>
          
          <div className="space-y-4 ml-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Auto-start on boot</label>
                <p className="text-sm text-gray-400">Automatically start the application when system boots</p>
              </div>
              <input
                type="checkbox"
                checked={settings.general.autoStart}
                onChange={(e) => updateSetting('general', 'autoStart', e.target.checked)}
                className="w-4 h-4 text-steam-green bg-steam-blue border-steam-lightblue rounded focus:ring-steam-green"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Minimize to tray</label>
                <p className="text-sm text-gray-400">Hide to system tray instead of closing</p>
              </div>
              <input
                type="checkbox"
                checked={settings.general.minimizeToTray}
                onChange={(e) => updateSetting('general', 'minimizeToTray', e.target.checked)}
                className="w-4 h-4 text-steam-green bg-steam-blue border-steam-lightblue rounded focus:ring-steam-green"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Log Level</label>
                <p className="text-sm text-gray-400">Verbosity of console output</p>
              </div>
              <select
                value={settings.general.logLevel}
                onChange={(e) => updateSetting('general', 'logLevel', e.target.value)}
                className="input-field"
              >
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messaging Settings */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Zap size={18} className="text-steam-green" />
            <h4 className="text-md font-medium text-white">Messaging</h4>
          </div>
          
          <div className="space-y-4 ml-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Message Delay (ms)</label>
                <p className="text-sm text-gray-400">Delay between messages to avoid rate limiting</p>
              </div>
              <input
                type="number"
                value={settings.messaging.messageDelay}
                onChange={(e) => updateSetting('messaging', 'messageDelay', parseInt(e.target.value))}
                className="input-field w-24"
                min="100"
                max="10000"
                step="100"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Retry Attempts</label>
                <p className="text-sm text-gray-400">Number of times to retry failed messages</p>
              </div>
              <input
                type="number"
                value={settings.messaging.retryAttempts}
                onChange={(e) => updateSetting('messaging', 'retryAttempts', parseInt(e.target.value))}
                className="input-field w-24"
                min="0"
                max="10"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Max Concurrent Chats</label>
                <p className="text-sm text-gray-400">Maximum simultaneous conversations per account</p>
              </div>
              <input
                type="number"
                value={settings.messaging.maxConcurrentChats}
                onChange={(e) => updateSetting('messaging', 'maxConcurrentChats', parseInt(e.target.value))}
                className="input-field w-24"
                min="1"
                max="20"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Bell size={18} className="text-steam-green" />
            <h4 className="text-md font-medium text-white">Notifications</h4>
          </div>
          
          <div className="space-y-4 ml-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Show Notifications</label>
                <p className="text-sm text-gray-400">Display desktop notifications</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.showNotifications}
                onChange={(e) => updateSetting('notifications', 'showNotifications', e.target.checked)}
                className="w-4 h-4 text-steam-green bg-steam-blue border-steam-lightblue rounded focus:ring-steam-green"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Play Sound</label>
                <p className="text-sm text-gray-400">Play notification sounds</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.playSound}
                onChange={(e) => updateSetting('notifications', 'playSound', e.target.checked)}
                className="w-4 h-4 text-steam-green bg-steam-blue border-steam-lightblue rounded focus:ring-steam-green"
              />
            </div>
          </div>
        </div>

        {/* Security */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Shield size={18} className="text-steam-green" />
            <h4 className="text-md font-medium text-white">Security</h4>
          </div>
          
          <div className="space-y-4 ml-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Save Passwords</label>
                <p className="text-sm text-gray-400">Store account passwords locally</p>
              </div>
              <input
                type="checkbox"
                checked={settings.security.savePasswords}
                onChange={(e) => updateSetting('security', 'savePasswords', e.target.checked)}
                className="w-4 h-4 text-steam-green bg-steam-blue border-steam-lightblue rounded focus:ring-steam-green"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Enable Encryption</label>
                <p className="text-sm text-gray-400">Encrypt stored data</p>
              </div>
              <input
                type="checkbox"
                checked={settings.security.enableEncryption}
                onChange={(e) => updateSetting('security', 'enableEncryption', e.target.checked)}
                className="w-4 h-4 text-steam-green bg-steam-blue border-steam-lightblue rounded focus:ring-steam-green"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
