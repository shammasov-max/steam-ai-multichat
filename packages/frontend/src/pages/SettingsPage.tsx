import React, { useState } from 'react'
import SearchBox from '../components/UI/SearchBox'
import { Settings, Save, RotateCcw, Bell, Shield, Globe, Zap } from 'lucide-react'

const SettingsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
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

  // Filter settings based on search term
  const settingsCategories = [
    {
      key: 'general',
      title: 'General',
      icon: Globe,
      settings: [
        { key: 'autoStart', label: 'Auto-start on boot', description: 'Automatically start the application when system boots', type: 'checkbox' },
        { key: 'minimizeToTray', label: 'Minimize to tray', description: 'Hide to system tray instead of closing', type: 'checkbox' },
        { key: 'checkUpdates', label: 'Check for updates', description: 'Automatically check for application updates', type: 'checkbox' },
        { key: 'logLevel', label: 'Log Level', description: 'Verbosity of console output', type: 'select', options: ['error', 'warning', 'info', 'debug'] }
      ]
    },
    {
      key: 'messaging',
      title: 'Messaging',
      icon: Zap,
      settings: [
        { key: 'messageDelay', label: 'Message Delay (ms)', description: 'Delay between messages to avoid rate limiting', type: 'number', min: 100, max: 10000, step: 100 },
        { key: 'retryAttempts', label: 'Retry Attempts', description: 'Number of times to retry failed messages', type: 'number', min: 0, max: 10 },
        { key: 'maxConcurrentChats', label: 'Max Concurrent Chats', description: 'Maximum simultaneous conversations per account', type: 'number', min: 1, max: 20 },
        { key: 'enableSpamProtection', label: 'Enable Spam Protection', description: 'Prevent sending too many messages too quickly', type: 'checkbox' }
      ]
    },
    {
      key: 'notifications',
      title: 'Notifications',
      icon: Bell,
      settings: [
        { key: 'showNotifications', label: 'Show Notifications', description: 'Display desktop notifications', type: 'checkbox' },
        { key: 'playSound', label: 'Play Sound', description: 'Play notification sounds', type: 'checkbox' },
        { key: 'notifyOnError', label: 'Notify on Error', description: 'Show notifications for errors', type: 'checkbox' },
        { key: 'notifyOnFriendRequest', label: 'Notify on Friend Request', description: 'Show notifications for friend requests', type: 'checkbox' }
      ]
    },
    {
      key: 'security',
      title: 'Security',
      icon: Shield,
      settings: [
        { key: 'savePasswords', label: 'Save Passwords', description: 'Store account passwords locally', type: 'checkbox' },
        { key: 'enableEncryption', label: 'Enable Encryption', description: 'Encrypt stored data', type: 'checkbox' },
        { key: 'allowRemoteAccess', label: 'Allow Remote Access', description: 'Allow remote connections to this instance', type: 'checkbox' },
        { key: 'ipWhitelist', label: 'IP Whitelist', description: 'Comma-separated list of allowed IP addresses', type: 'text' }
      ]
    }
  ]

  const filteredCategories = settingsCategories.map(category => ({
    ...category,
    settings: category.settings.filter(setting => 
      searchTerm === '' ||
      setting.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.settings.length > 0)

  const renderSettingInput = (category: string, setting: any) => {
    const value = (settings as any)[category][setting.key]

    switch (setting.type) {
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => updateSetting(category as keyof typeof settings, setting.key, e.target.checked)}
            className="w-4 h-4 text-steam-green bg-steam-blue border-steam-lightblue rounded focus:ring-steam-green"
          />
        )
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => updateSetting(category as keyof typeof settings, setting.key, parseInt(e.target.value))}
            className="input-field w-24"
            min={setting.min}
            max={setting.max}
            step={setting.step}
          />
        )
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => updateSetting(category as keyof typeof settings, setting.key, e.target.value)}
            className="input-field"
          >
            {setting.options.map((option: string) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        )
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateSetting(category as keyof typeof settings, setting.key, e.target.value)}
            className="input-field w-64"
            placeholder={setting.description}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings size={24} className="text-steam-green" />
          <h1 className="text-2xl font-bold text-white">Settings</h1>
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

      <SearchBox
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search settings..."
        className="max-w-md"
      />

      <div className="space-y-8">
        {filteredCategories.map((category) => {
          const IconComponent = category.icon
          return (
            <div key={category.key}>
              <div className="flex items-center space-x-2 mb-4">
                <IconComponent size={18} className="text-steam-green" />
                <h4 className="text-md font-medium text-white">{category.title}</h4>
              </div>
              
              <div className="space-y-4 ml-6">
                {category.settings.map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <label className="text-white font-medium">{setting.label}</label>
                      <p className="text-sm text-gray-400">{setting.description}</p>
                    </div>
                    <div className="ml-4">
                      {renderSettingInput(category.key, setting)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {filteredCategories.length === 0 && searchTerm && (
        <div className="text-center py-12 text-gray-400">
          <Settings size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No settings found</p>
          <p className="text-sm">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
