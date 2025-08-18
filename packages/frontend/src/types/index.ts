export interface Account {
  id: string
  username: string
  status: 'online' | 'offline' | 'idle' | 'busy'
  isLoggedIn: boolean
  avatar?: string
  lastActivity?: Date
}

export interface Friend {
  id: string
  steamId: string
  name: string
  avatar?: string
  status: 'online' | 'offline' | 'away' | 'busy'
  lastMessage?: string
  lastSeen?: Date
}

export interface ChatMessage {
  id: string
  sender: string
  recipient: string
  content: string
  timestamp: Date
  type: 'sent' | 'received'
}

export interface Console {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  account?: string
}

export interface ProxyServer {
  id: string
  host: string
  port: number
  username?: string
  password?: string
  status: 'connected' | 'disconnected' | 'error'
  accounts: string[]
}

export interface NavigationTab {
  id: string
  label: string
  icon?: string
  active: boolean
  badge?: number
}

export interface ModalState {
  isOpen: boolean
  type: 'accounts' | 'proxy' | 'friends' | 'settings' | 'actions' | 'spam' | 'boost' | 'states' | 'invites' | 'wall-spam'
}
