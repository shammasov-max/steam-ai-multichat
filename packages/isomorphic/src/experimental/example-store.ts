// Experimental Effect-Redux integration examples
/**
 * Example Redux Store with Reducers for Effect-Saga Integration
 * This file demonstrates how to create a Redux store that handles
 * domain events and saga actions defined in effect-saga.ts
 */

import { configureStore, createSlice, PayloadAction, createSelector, UnknownAction } from '@reduxjs/toolkit'
import { Schema } from "@effect/schema"

// Re-use the branded types from effect-saga.ts
const AggregateId = Schema.String.pipe(Schema.brand("AggregateId"))
type AggregateId = Schema.Schema.Type<typeof AggregateId>

// ============================================
// Type Definitions
// ============================================

// User entity type
interface User {
  id: AggregateId
  email: string
  name: string
  active: boolean
  createdAt: Date
  lastModified: Date
}

// Notification type
interface Notification {
  id: string
  message: string
  type: 'info' | 'warning' | 'error'
  timestamp: Date
}

// Auth state
export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  user: {
    id: AggregateId
    email: string
    name: string
    permissions: string[]
  } | null
}

// Domain Event Types (matching effect-saga.ts)
interface UserCreatedEvent {
  _tag: 'UserCreated'
  id: AggregateId
  email: string
  name: string
  timestamp: Date
}

interface UserEmailChangedEvent {
  _tag: 'UserEmailChanged'
  id: AggregateId
  newEmail: string
  timestamp: Date
}

interface WelcomeEmailSentEvent {
  _tag: 'WelcomeEmailSent'
  id: AggregateId
  timestamp: Date
}

type DomainEvent = UserCreatedEvent | UserEmailChangedEvent | WelcomeEmailSentEvent

// Saga Action Types
interface LoginRequestedAction {
  email: string
  password: string
}

interface LoginSucceededAction {
  id: AggregateId
  email: string
  name: string
  permissions: string[]
}

interface LoginFailedAction {
  error: string
}

// ============================================
// Users Slice - Handles domain events
// ============================================

export interface UsersState {
  users: Record<AggregateId, User>
  userIds: AggregateId[]
  loading: boolean
  error: string | null
}

const initialUsersState: UsersState = {
  users: {},
  userIds: [],
  loading: false,
  error: null
}

const usersSlice = createSlice({
  name: 'users',
  initialState: initialUsersState,
  reducers: {
    // Handle domain events
    applyDomainEvent: (state, action: PayloadAction<DomainEvent>) => {
      const event = action.payload
      switch (event._tag) {
        case 'UserCreated':
          if (!state.users[event.id]) {
            state.users[event.id] = {
              id: event.id,
              email: event.email,
              name: event.name,
              active: true,
              createdAt: event.timestamp,
              lastModified: event.timestamp
            }
            state.userIds.push(event.id)
          }
          break

        case 'UserEmailChanged':
          const user = state.users[event.id]
          if (user) {
            user.email = event.newEmail
            user.lastModified = event.timestamp
          }
          break

        case 'WelcomeEmailSent':
          // Could track email sent status
          console.log(`Welcome email sent for user ${event.id}`)
          break
      }
    },

    // Regular CRUD actions
    addUser: (state, action: PayloadAction<User>) => {
      const user = action.payload
      state.users[user.id] = user
      if (!state.userIds.includes(user.id)) {
        state.userIds.push(user.id)
      }
    },

    updateUser: (state, action: PayloadAction<{ id: AggregateId; updates: Partial<User> }>) => {
      const { id, updates } = action.payload
      if (state.users[id]) {
        state.users[id] = {
          ...state.users[id],
          ...updates,
          lastModified: new Date()
        }
      }
    },

    removeUser: (state, action: PayloadAction<AggregateId>) => {
      const id = action.payload
      delete state.users[id]
      state.userIds = state.userIds.filter(userId => userId !== id)
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    }
  }
})

// ============================================
// Auth Slice - Handles authentication saga actions
// ============================================

const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  error: null,
  user: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    loginRequested: (state, action: PayloadAction<LoginRequestedAction>) => {
      state.isLoading = true
      state.error = null
    },

    loginSucceeded: (state, action: PayloadAction<LoginSucceededAction>) => {
      state.isLoading = false
      state.isAuthenticated = true
      state.user = {
        id: action.payload.id,
        email: action.payload.email,
        name: action.payload.name,
        permissions: action.payload.permissions
      }
      state.error = null
    },

    loginFailed: (state, action: PayloadAction<LoginFailedAction>) => {
      state.isLoading = false
      state.isAuthenticated = false
      state.user = null
      state.error = action.payload.error
    },

    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.error = null
    }
  }
})

// ============================================
// Notifications Slice
// ============================================

export interface NotificationsState {
  notifications: Notification[]
  maxNotifications: number
}

const initialNotificationsState: NotificationsState = {
  notifications: [],
  maxNotifications: 10
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: initialNotificationsState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date()
      }
      
      state.notifications.unshift(notification)
      
      // Keep only the most recent notifications
      if (state.notifications.length > state.maxNotifications) {
        state.notifications = state.notifications.slice(0, state.maxNotifications)
      }
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },

    clearNotifications: (state) => {
      state.notifications = []
    }
  },
  extraReducers: (builder) => {
    // Add notifications for auth events
    builder
      .addCase(authSlice.actions.loginSucceeded, (state, action) => {
        state.notifications.unshift({
          id: Math.random().toString(36).substr(2, 9),
          message: `Welcome back, ${action.payload.name}!`,
          type: 'info',
          timestamp: new Date()
        })
      })
      .addCase(authSlice.actions.loginFailed, (state, action) => {
        state.notifications.unshift({
          id: Math.random().toString(36).substr(2, 9),
          message: `Login failed: ${action.payload.error}`,
          type: 'error',
          timestamp: new Date()
        })
      })
  }
})

// ============================================
// Saga Tracking Slice - For debugging saga execution
// ============================================

export interface SagaState {
  lastAction: UnknownAction | null
  actionHistory: UnknownAction[]
  maxHistorySize: number
}

const initialSagaState: SagaState = {
  lastAction: null,
  actionHistory: [],
  maxHistorySize: 50
}

const sagaSlice = createSlice({
  name: 'saga',
  initialState: initialSagaState,
  reducers: {
    trackAction: (state, action: PayloadAction<any>) => {
      state.lastAction = action.payload
      state.actionHistory.unshift({
        ...action.payload,
        timestamp: new Date().toISOString()
      })
      
      if (state.actionHistory.length > state.maxHistorySize) {
        state.actionHistory = state.actionHistory.slice(0, state.maxHistorySize)
      }
    },
    
    clearHistory: (state) => {
      state.actionHistory = []
      state.lastAction = null
    }
  }
})

// ============================================
// Store Configuration
// ============================================

export const createExampleStore = () => {
  const store = configureStore({
    reducer: {
      users: usersSlice.reducer,
      auth: authSlice.reducer,
      notifications: notificationsSlice.reducer,
      saga: sagaSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore these action types
          ignoredActions: ['saga/trackAction'],
          // Ignore these field paths in all actions
          ignoredActionPaths: ['payload.timestamp', 'payload.createdAt', 'payload.lastModified'],
          // Ignore these paths in the state
          ignoredPaths: ['users.users', 'notifications.notifications'],
        },
      }),
  })

  // Add a middleware to track all actions for saga
  const originalDispatch = store.dispatch
  store.dispatch = ((action: any) => {
    // Don't track the tracking action itself
    if (action.type !== 'saga/trackAction') {
      originalDispatch(sagaSlice.actions.trackAction(action))
    }
    return originalDispatch(action)
  }) as typeof store.dispatch

  return store
}

// ============================================
// Selectors
// ============================================

// Type the store
export type ExampleStore = ReturnType<typeof createExampleStore>
export type RootState = ReturnType<ExampleStore['getState']>
export type AppDispatch = ExampleStore['dispatch']

// User selectors
export const selectAllUsers = (state: RootState) => 
  state.users.userIds.map(id => state.users.users[id])

export const selectUserById = (state: RootState, userId: AggregateId) =>
  state.users.users[userId]

export const selectActiveUsers = createSelector(
  [selectAllUsers],
  (users) => users.filter(user => user.active)
)

export const selectUsersCount = (state: RootState) => 
  state.users.userIds.length

// Auth selectors
export const selectCurrentUser = (state: RootState) => 
  state.auth.user

export const selectIsAuthenticated = (state: RootState) => 
  state.auth.isAuthenticated

export const selectAuthLoading = (state: RootState) => 
  state.auth.isLoading

export const selectUserPermissions = createSelector(
  [selectCurrentUser],
  (user) => user?.permissions || []
)

// Notification selectors
export const selectNotifications = (state: RootState) => 
  state.notifications.notifications

export const selectUnreadNotificationsCount = createSelector(
  [selectNotifications],
  (notifications) => notifications.filter(n => n.type === 'error' || n.type === 'warning').length
)

// Saga selectors
export const selectLastAction = (state: RootState) => 
  state.saga.lastAction

export const selectActionHistory = (state: RootState) => 
  state.saga.actionHistory

// ============================================
// Action Creators Export
// ============================================

export const usersActions = usersSlice.actions
export const authActions = authSlice.actions
export const notificationsActions = notificationsSlice.actions
export const sagaActions = sagaSlice.actions

// ============================================
// Helper function to connect to Effect sagas
// ============================================

export const connectStoreToEffectSaga = (store: ExampleStore) => {
  // This function would be called from your Effect saga setup
  // to connect the Redux store to Effect world
  
  return {
    // Dispatch a domain event to the store
    dispatchDomainEvent: (event: DomainEvent) => {
      store.dispatch(usersActions.applyDomainEvent(event))
    },

    // Dispatch auth actions
    dispatchAuthAction: (action: 
      | { type: 'loginRequested'; payload: LoginRequestedAction }
      | { type: 'loginSucceeded'; payload: LoginSucceededAction }
      | { type: 'loginFailed'; payload: LoginFailedAction }
    ) => {
      switch (action.type) {
        case 'loginRequested':
          store.dispatch(authActions.loginRequested(action.payload))
          break
        case 'loginSucceeded':
          store.dispatch(authActions.loginSucceeded(action.payload))
          break
        case 'loginFailed':
          store.dispatch(authActions.loginFailed(action.payload))
          break
      }
    },

    // Get current state
    getState: () => store.getState(),

    // Subscribe to state changes
    subscribe: (listener: () => void) => store.subscribe(listener)
  }
}

// ============================================
// Example Usage
// ============================================

export const exampleUsage = () => {
  const store = createExampleStore()

  // Dispatch a domain event
  store.dispatch(usersActions.applyDomainEvent({
    _tag: 'UserCreated',
    id: 'user-123' as AggregateId,
    email: 'john@example.com',
    name: 'John Doe',
    timestamp: new Date()
  }))

  // Dispatch auth actions (as would be done from saga)
  store.dispatch(authActions.loginRequested({
    email: 'john@example.com',
    password: 'secret'
  }))

  store.dispatch(authActions.loginSucceeded({
    id: 'user-123' as AggregateId,
    email: 'john@example.com',
    name: 'John Doe',
    permissions: ['read', 'write']
  }))

  // Add a notification
  store.dispatch(notificationsActions.addNotification({
    message: 'User created successfully',
    type: 'info'
  }))

  // Get state
  const state = store.getState()
  console.log('Current users:', selectAllUsers(state))
  console.log('Is authenticated:', selectIsAuthenticated(state))
  console.log('Action history:', selectActionHistory(state))

  return store
}

exampleUsage()
