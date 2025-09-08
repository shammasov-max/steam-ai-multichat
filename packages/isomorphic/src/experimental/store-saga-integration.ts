// Experimental Effect-Redux integration examples
/**
 * Store-Saga Integration Example
 * This file demonstrates how to integrate the Redux store with Effect sagas
 * bridging the gap between Redux state management and Effect's functional programming
 */

import { Effect, Layer, Context, PubSub, Queue, Stream } from "effect"
import { Schema } from "@effect/schema"
import { 
  createExampleStore, 
  connectStoreToEffectSaga,
  usersActions,
  authActions,
  notificationsActions,
  type ExampleStore,
  type RootState,
  type AppDispatch
} from './example-store'
import type { PayloadAction, UnknownAction } from '@reduxjs/toolkit'

// Re-use types from example-store.ts
const AggregateId = Schema.String.pipe(Schema.brand("AggregateId"))
type AggregateId = Schema.Schema.Type<typeof AggregateId>

// ============================================
// Redux Store Service for Effect
// ============================================

class ReduxStoreService extends Context.Tag("ReduxStoreService")<
  ReduxStoreService,
  {
    readonly dispatch: (action: UnknownAction) => Effect.Effect<void>
    readonly getState: () => Effect.Effect<RootState>
    readonly select: <T>(selector: (state: RootState) => T) => Effect.Effect<T>
    readonly subscribe: (listener: () => Effect.Effect<void>) => Effect.Effect<void>
  }
>() {}

// Create the Redux Store Layer
const ReduxStoreLive = Layer.effect(
  ReduxStoreService,
  Effect.gen(function* () {
    const store = createExampleStore()
    const storeConnector = connectStoreToEffectSaga(store)
    
    return {
      dispatch: (action: UnknownAction) => 
        Effect.sync(() => {
          store.dispatch(action)
        }),
        
      getState: () => 
        Effect.sync(() => store.getState()),
        
      select: <T>(selector: (state: RootState) => T) =>
        Effect.sync(() => selector(store.getState())),
        
      subscribe: (listener: () => Effect.Effect<void>) =>
        Effect.sync(() => {
          const unsubscribe = store.subscribe(() => {
            Effect.runPromise(listener()).catch(console.error)
          })
          
          // Store the unsubscribe function for potential cleanup
          // Note: In a real implementation, you'd want to track these properly
          return unsubscribe
        }).pipe(Effect.asVoid)
    }
  })
)

// ============================================
// Enhanced Saga Context with Redux Integration
// ============================================

// Define proper action types
type SagaAction = UnknownAction | PayloadAction

// Import domain and auth action types from example-store for type safety
type DomainEvent = Parameters<typeof usersActions.applyDomainEvent>[0]
type AuthAction = Parameters<typeof authActions.loginRequested>[0] | 
                  Parameters<typeof authActions.loginSucceeded>[0] |
                  Parameters<typeof authActions.loginFailed>[0]

class EnhancedSagaContext extends Context.Tag("EnhancedSagaContext")<
  EnhancedSagaContext,
  {
    // Redux integration
    readonly dispatch: (action: UnknownAction) => Effect.Effect<void, never, never>
    readonly select: <T>(selector: (state: RootState) => T) => Effect.Effect<T, never, never>
    
    // Saga patterns
    readonly take: (pattern: string | ((action: SagaAction) => boolean)) => Effect.Effect<SagaAction, never, never>
    readonly takeEvery: (pattern: string, handler: (action: SagaAction) => Effect.Effect<void, never, never>) => Effect.Effect<void, never, never>
    readonly put: (action: UnknownAction) => Effect.Effect<void, never, never>
    readonly call: <A>(fn: () => Promise<A>) => Effect.Effect<A, Error, never>
    
    // Domain event helpers
    readonly dispatchDomainEvent: (event: DomainEvent) => Effect.Effect<void, never, never>
    readonly dispatchAuthAction: (action: UnknownAction) => Effect.Effect<void, never, never>
  }
>() {}

// Create the Enhanced Saga Context Layer
const EnhancedSagaLive = Layer.effect(
  EnhancedSagaContext,
  Effect.gen(function* () {
    const reduxStore = yield* ReduxStoreService
    const actionQueue = yield* Queue.unbounded<SagaAction>()
    
    // Subscribe to store changes and forward actions to queue
    yield* Effect.forkDaemon(
      reduxStore.subscribe(() =>
        Effect.gen(function* () {
          const state = yield* reduxStore.getState()
          if (state.saga.lastAction) {
            yield* Queue.offer(actionQueue, state.saga.lastAction)
          }
        })
      )
    )
    
    return {
      dispatch: reduxStore.dispatch,
      select: reduxStore.select,
      
      take: (pattern) =>
        Effect.gen(function* () {
          while (true) {
            const action = yield* Queue.take(actionQueue)
            if (typeof pattern === 'string' ? 
                action.type === pattern : 
                pattern(action)) {
              return action
            }
            // Put it back if it doesn't match
            yield* Queue.offer(actionQueue, action)
          }
        }),
        
      takeEvery: (pattern, handler) =>
        Effect.gen(function* () {
          while (true) {
            const action = yield* Queue.take(actionQueue)
            if (action.type === pattern) {
              yield* Effect.fork(handler(action))
            } else {
              // Put it back if it doesn't match
              yield* Queue.offer(actionQueue, action)
            }
          }
        }),
        
      put: (action) => reduxStore.dispatch(action),
      
      call: (fn) => 
        Effect.tryPromise({
          try: fn,
          catch: (error) => new Error(String(error))
        }),
        
      dispatchDomainEvent: (event) =>
        reduxStore.dispatch(usersActions.applyDomainEvent(event)),
        
      dispatchAuthAction: (action) => {
        // Actions are already properly typed, just dispatch them
        return reduxStore.dispatch(action)
      }
    } as const
  })
).pipe(Layer.provide(ReduxStoreLive))

// ============================================
// Example Sagas using the integrated system
// ============================================

// User registration saga
const userRegistrationSaga = Effect.gen(function* () {
  const saga = yield* EnhancedSagaContext
  
  while (true) {
    const action = yield* saga.take('users/registerRequested')
    
    yield* Effect.fork(
      Effect.gen(function* () {
        try {
          // Call API to register user
          const user = yield* saga.call(() =>
            fetch('/api/users/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(action.payload)
            }).then(r => r.json())
          )
          
          // Dispatch domain event
          yield* saga.dispatchDomainEvent({
            _tag: 'UserCreated',
            id: user.id as AggregateId,
            email: user.email,
            name: user.name,
            timestamp: new Date()
          })
          
          // Dispatch success notification
          yield* saga.put(notificationsActions.addNotification({
            message: 'User registered successfully!',
            type: 'info'
          }))
          
        } catch (error) {
          yield* saga.put(notificationsActions.addNotification({
            message: `Registration failed: ${error}`,
            type: 'error'
          }))
        }
      })
    )
  }
})

// Enhanced login saga with Redux integration
const enhancedLoginSaga = Effect.gen(function* () {
  const saga = yield* EnhancedSagaContext
  
  while (true) {
    const action = yield* saga.take('auth/loginRequested')
    
    yield* Effect.fork(
      Effect.gen(function* () {
        try {
          // Get current state
          const currentUsers = yield* saga.select(state => state.users.userIds)
          console.log(`Current users in system: ${currentUsers.length}`)
          
          // Call login API
          const response = yield* saga.call(() =>
            fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(action.payload)
            }).then(r => r.json())
          )
          
          // Dispatch success action
          yield* saga.dispatchAuthAction({
            type: 'auth/loginSucceeded',
            payload: {
              id: response.id as AggregateId,
              email: response.email,
              name: response.name,
              permissions: response.permissions
            }
          })
          
          // Check if this is a new user
          const isNewUser = !currentUsers.includes(response.id)
          if (isNewUser) {
            yield* saga.dispatchDomainEvent({
              _tag: 'UserCreated',
              id: response.id as AggregateId,
              email: response.email,
              name: response.name,
              timestamp: new Date()
            })
          }
          
        } catch (error) {
          yield* saga.dispatchAuthAction({
            type: 'auth/loginFailed',
            payload: { error: String(error) }
          })
        }
      })
    )
  }
})

// Email change saga
const emailChangeSaga = Effect.gen(function* () {
  const saga = yield* EnhancedSagaContext
  
  yield* saga.takeEvery('users/emailChangeRequested', (action) =>
    Effect.gen(function* () {
      // Type assertion for the specific action type
      const payload = (action as PayloadAction<{ userId: string; newEmail: string }>).payload
      const { userId, newEmail } = payload
      
      try {
        // Verify email is not already taken
        const users = yield* saga.select(state => Object.values(state.users.users))
        const emailTaken = users.some(u => u.email === newEmail && u.id !== userId)
        
        if (emailTaken) {
          yield* saga.put(notificationsActions.addNotification({
            message: 'Email already in use',
            type: 'error'
          }))
          return
        }
        
        // Call API to update email
        yield* saga.call(() =>
          fetch(`/api/users/${userId}/email`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newEmail })
          })
        )
        
        // Dispatch domain event
        yield* saga.dispatchDomainEvent({
          _tag: 'UserEmailChanged',
          id: userId as AggregateId,
          newEmail,
          timestamp: new Date()
        })
        
        yield* saga.put(notificationsActions.addNotification({
          message: 'Email updated successfully',
          type: 'info'
        }))
        
      } catch (error) {
        yield* saga.put(notificationsActions.addNotification({
          message: `Failed to update email: ${error}`,
          type: 'error'
        }))
      }
    }) as Effect.Effect<void, never, never>
  )
})

// ============================================
// Root Saga combining all sagas
// ============================================

const rootSaga = Effect.gen(function* () {
  // Fork all sagas
  yield* Effect.all([
    Effect.forkDaemon(userRegistrationSaga),
    Effect.forkDaemon(enhancedLoginSaga),
    Effect.forkDaemon(emailChangeSaga)
  ])
  
  // Keep the program running
  yield* Effect.never
})

// ============================================
// Running the integrated system
// ============================================

export const runIntegratedSystem = () => {
  const program = Effect.gen(function* () {
    console.log('Starting Redux-Effect Saga Integration...')
    
    // Get the saga context to dispatch initial actions
    const saga = yield* EnhancedSagaContext
    
    // Dispatch some test actions
    yield* Effect.sleep("1 second")
    
    yield* saga.dispatch(authActions.loginRequested({
      email: 'test@example.com',
      password: 'password123'
    }))
    
    yield* Effect.sleep("2 seconds")
    
    yield* saga.dispatch({
      type: 'users/emailChangeRequested',
      payload: {
        userId: 'user-123' as AggregateId,
        newEmail: 'newemail@example.com'
      }
    })
    
    // Run the root saga
    yield* rootSaga
  })
  
  // Run with all layers
  return Effect.runPromise(
    program.pipe(
      Effect.provide(EnhancedSagaLive)
    ) as Effect.Effect<void, never, never>
  ).catch(console.error)
}

// ============================================
// Testing utilities
// ============================================

export const createTestSagaEnvironment = () => {
  const testStore = createExampleStore()
  
  return {
    store: testStore,
    
    runSaga: <A, E>(saga: Effect.Effect<A, E, EnhancedSagaContext>) =>
      Effect.runPromise(
        saga.pipe(Effect.provide(EnhancedSagaLive)) as Effect.Effect<A, never, never>
      ),
      
    dispatchAndWait: async (action: UnknownAction, waitMs = 100) => {
      testStore.dispatch(action)
      await new Promise(resolve => setTimeout(resolve, waitMs))
      return testStore.getState()
    },
    
    getState: () => testStore.getState()
  }
}

// Example test
export const exampleTest = async () => {
  const env = createTestSagaEnvironment()
  
  // Test login flow
  const stateAfterLogin = await env.dispatchAndWait(
    authActions.loginRequested({
      email: 'test@example.com',
      password: 'test'
    })
  )
  
  console.log('Auth state after login:', stateAfterLogin.auth)
  console.log('Notifications:', stateAfterLogin.notifications.notifications)
}
