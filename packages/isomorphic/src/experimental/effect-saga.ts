// Experimental Effect-Redux integration examples
/**
 * Redux for Frontend State Evolution on Backend
 * Your idea about using Redux on the backend to maintain a "shadow" of frontend state is actually quite clever! This pattern is sometimes called "Backend for Frontend State" or "State Synchronization Pattern". Let me explain why this can work well and show you how to implement it properly.
 * The key insight here is that you're not using Redux for event sourcing or durability, but rather as a projection engine that maintains the exact state shape your frontend expects. This eliminates the impedance mismatch between your event-sourced domain and your UI requirements. Think of it as maintaining a "view model" on the backend that's always ready to be sent to newly connecting clients.
 *
 *
 *
 * This approach gives you several advantages. You get Redux's excellent DevTools integration and time-travel debugging for your UI state, while Effect provides robust error handling, proper dependency injection, and composable concurrency primitives. The sagas become much more testable because Effect's design makes it easy to provide mock implementations of the context.
 * The Architecture I'd Actually Recommend
 * Based on all of this, here's the architecture pattern I'd suggest: use Redux Toolkit on the frontend for UI state and client-side projections, use Effect-TS for all backend concerns and complex async flows, and create a thin bridge between them using SSE or WebSockets for real-time updates. When you need saga-like patterns on the frontend, implement them using Effect-TS with a Redux bridge like I showed above.
 * This gives you the best of both worlds without trying to force either tool into a role it wasn't designed for. Redux stays in the UI layer where it excels, Effect handles all the complex domain logic and side effects, and you get a clean, maintainable architecture that plays to each tool's strengths.
 * The key insight is recognizing that different parts of your system have different requirements, and it's perfectly fine - even preferable - to use different tools for different jobs. The art is in creating clean boundaries and bridges between these different worlds.
 */


import {Context, Effect, Fiber, PubSub, Layer, Queue, Ref, Stream, Option} from "effect"
import {configureStore, createSlice} from '@reduxjs/toolkit'

// First, let's define our domain events with proper Effect 3.0 patterns
// Notice how we use the new Schema API which is more integrated
import {Schema} from "@effect/schema"

// Create branded types using the new Schema API
const AggregateId = Schema.String.pipe(Schema.brand("AggregateId"))
type AggregateId = Schema.Schema.Type<typeof AggregateId>

const EventId = Schema.String.pipe(Schema.brand("EventId"))
type EventId = Schema.Schema.Type<typeof EventId>

// Domain events using discriminated unions
const UserCreated = Schema.Struct({
  _tag: Schema.Literal("UserCreated"),
  id: AggregateId,
  email: Schema.String,
  name: Schema.String,
  timestamp: Schema.Date
})

const UserEmailChanged = Schema.Struct({
  _tag: Schema.Literal("UserEmailChanged"),
  id: AggregateId,
  newEmail: Schema.String,
  timestamp: Schema.Date
})

const DomainEvent = Schema.Union(UserCreated, UserEmailChanged)
type DomainEvent = Schema.Schema.Type<typeof DomainEvent>

// Now let's create the saga context using Effect 3.0's Context API
// This is cleaner than the old service pattern
class SagaContext extends Context.Tag("SagaContext")<
  SagaContext,
  {
    readonly dispatch: (action: any) => Effect.Effect<void, never, never>;
    readonly select: <T>(selector: (state: any) => T) => Effect.Effect<T, never, never>;
    readonly take: (pattern: string | ((action: any) => boolean)) => Effect.Effect<any, never, never>;
    readonly takeEvery: (pattern: string, handler: (action: any) => Effect.Effect<void, never, never>) => Effect.Effect<void, never, never>;
    readonly fork: <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<Fiber.RuntimeFiber<A, E>, never, R>;
  }
>() {}

// Create the saga runtime with Effect 3.0 patterns
const createSagaRuntime = (store: ReturnType<typeof configureStore>) =>
  Effect.gen(function* () {
    // Create an action queue for the take effect
    const actionQueue = yield* Queue.unbounded<any>()
    const takeRegistrations = yield* Ref.make<Map<string, Queue.Queue<any>>>(new Map())

    // Create a fiber that forwards Redux actions to Effect world
    yield* Effect.forkDaemon(
      Effect.async<never, never, never>((cb) => {
        const unsubscribe = store.subscribe(() => {
          // In a real implementation, you'd track the last action
          const state = store.getState() as any
          if (state.lastAction) {
            Effect.runPromise(Queue.offer(actionQueue, state.lastAction))
          }
        })

        // Cleanup function
        return Effect.sync(() => unsubscribe())
      })
    )

    // Return the context implementation
    return {
      dispatch: (action: any) =>
        Effect.sync(() => { store.dispatch(action) }),

      select: <T>(selector: (state: any) => T) =>
        Effect.sync(() => selector(store.getState())),

      take: (pattern: string | ((action: any) => boolean)) =>
        Effect.gen(function* () {
          while (true) {
            const action = yield* Queue.take(actionQueue)
            if (typeof pattern === 'string'
              ? action.type === pattern
              : pattern(action)) {
              return action
            }
            // Put it back if it doesn't match
            yield* Queue.offer(actionQueue, action)
          }
        }),

      takeEvery: (pattern: string, handler: (action: any) => Effect.Effect<void, never, never>) =>
        Effect.gen(function* () {
          while (true) {
            const action = yield* Queue.take(actionQueue)
            if (action.type === pattern) {
              yield* Effect.fork(handler(action))
            }
          }
        }),

      fork: <A, E, R>(effect: Effect.Effect<A, E, R>) =>
        Effect.fork(effect)
    } as const
  })

// Example saga using Effect 3.0
const loginSaga = Effect.gen(function* () {
  const saga = yield* SagaContext

  while (true) {
    const loginAction = yield* saga.take('user/loginRequested')

    yield* saga.fork(
      Effect.gen(function* () {
        // Use Effect 3.0's improved error handling
        yield* Effect.tryPromise({
          try: () => fetch('/api/login', {
            method: 'POST',
            body: JSON.stringify(loginAction.payload)
          }).then(r => r.json()),
          catch: (error) => new Error(String(error))
        }).pipe(
          Effect.tap((user) => 
            saga.dispatch({ type: 'user/loginSucceeded', payload: user })
          ),
          Effect.catchAll((error) => 
            saga.dispatch({ type: 'user/loginFailed', payload: error.message })
          )
        )
      }) as Effect.Effect<void, never, never>
    )
  }
})

// Creating and running the saga with Effect 3.0's Layer system
const SagaLive = Layer.effect(
  SagaContext,
  Effect.gen(function* () {
    const store = configureStore({ 
      reducer: {
        // Track the last action for saga processing
        lastAction: (state = null, action) => 
          action.type.startsWith('@@') ? state : action,
        // Add any other reducers needed for your application
        app: (state = {}, action) => state
      }
    })
    return yield* createSagaRuntime(store)
  })
)

// Run the saga
const program = Effect.gen(function* () {
  yield* Effect.forkDaemon(loginSaga)
  // Your other sagas here
})

// Execute with proper resource management
Effect.runPromise(
  program.pipe(Effect.provide(SagaLive))
)


// Define the frontend state shape
const FrontendStateSchema = Schema.Struct({
  users: Schema.Array(Schema.Struct({
    id: AggregateId,
    email: Schema.String,
    name: Schema.String,
    active: Schema.Boolean
  })),
  currentUser: Schema.NullOr(Schema.Struct({
    id: AggregateId,
    permissions: Schema.Array(Schema.String)
  })),
  notifications: Schema.Array(Schema.Struct({
    id: Schema.String,
    message: Schema.String,
    type: Schema.Literal("info", "warning", "error"),
    timestamp: Schema.Date
  }))
})

type FrontendState = Schema.Schema.Type<typeof FrontendStateSchema>

// Create a Redux store on the backend that mirrors frontend structure
const createBackendReduxProjection = () => {
  // This slice maintains the exact shape the frontend expects
  const projectionSlice = createSlice({
    name: 'frontendProjection',
    initialState: {
      users: [],
      currentUser: null,
      notifications: []
    } as FrontendState,
    reducers: {
      // These reducers transform domain events into UI state
      applyDomainEvent: (state, action: { payload: DomainEvent }) => {
        const event = action.payload
        switch (event._tag) {
          case "UserCreated":
            state.users.push({
              id: event.id,
              email: event.email,
              name: event.name,
              active: true
            })
            break
          case "UserEmailChanged":
            const user = state.users.find(u => u.id === event.id)
            if (user) {
              user.email = event.newEmail
            }
            break
        }
      }
    }
  })

  return configureStore({
    reducer: {
      projection: projectionSlice.reducer
    }
  })
}

// Now let's create a proper event bus architecture for the backend
// This replaces Redux as an event bus with something more appropriate
class EventBus extends Context.Tag("EventBus")<
  EventBus,
  {
    readonly publish: (event: DomainEvent) => Effect.Effect<void>;
    readonly subscribe: (
      handler: (event: DomainEvent) => Effect.Effect<void>
    ) => Effect.Effect<void>;
    readonly subscribeToType: <T extends DomainEvent['_tag']>(
      type: T,
      handler: (event: Extract<DomainEvent, { _tag: T }>) => Effect.Effect<void>
    ) => Effect.Effect<void>;
  }
>() {}

// Implement the event bus using Effect's PubSub (pub-sub primitive)
const EventBusLive = Layer.effect(
  EventBus,
  Effect.gen(function* () {
    // PubSub is Effect's built-in pub-sub mechanism
    const pubSub = yield* PubSub.unbounded<DomainEvent>()

    return {
      publish: (event) => PubSub.publish(pubSub, event),

      subscribe: (handler) =>
        Stream.fromPubSub(pubSub).pipe(
          Stream.runForEach(handler)
        ),

      subscribeToType: (type, handler) =>
        Stream.fromPubSub(pubSub).pipe(
          Stream.filter((event): event is any => event._tag === type),
          Stream.runForEach(handler)
        )
    }
  })
)

// Create a projection service that updates Redux state from events
class ProjectionService extends Context.Tag("ProjectionService")<
  ProjectionService,
  {
    readonly getState: () => Effect.Effect<FrontendState>;
    readonly subscribeToChanges: (
      handler: (state: FrontendState) => Effect.Effect<void>
    ) => Effect.Effect<void>;
  }
>() {}

const ProjectionServiceLive = Layer.effect(
  ProjectionService,
  Effect.gen(function* () {
    const eventBus = yield* EventBus
    const store = createBackendReduxProjection()
    const stateChangePubSub = yield* PubSub.unbounded<FrontendState>()

    // Subscribe to domain events and update Redux store
    yield* Effect.forkDaemon(
      eventBus.subscribe((event) =>
        Effect.gen(function* () {
          // Use the correct action type for the slice
          store.dispatch({ 
            type: 'frontendProjection/applyDomainEvent', 
            payload: event 
          })
          const newState = store.getState().projection
          yield* PubSub.publish(stateChangePubSub, newState)
        })
      )
    )

    return {
      getState: () => Effect.sync(() => store.getState().projection),

      subscribeToChanges: (handler) =>
        Stream.fromPubSub(stateChangePubSub).pipe(
          Stream.runForEach(handler)
        )
    }
  })
).pipe(Layer.provide(EventBusLive))

// Backend saga pattern using Effect instead of Redux-saga
const createBackendSaga = <A>(
  saga: Effect.Effect<A, never, EventBus>
) => saga

// Example backend saga that processes commands
const commandProcessingSaga = createBackendSaga(
  Effect.gen(function* () {
    const eventBus = yield* EventBus

    // This would actually come from a command queue
    yield* eventBus.subscribeToType("UserCreated", (event) =>
      Effect.gen(function* () {
        // Send welcome email
        yield* Effect.tryPromise({
          try: () =>
            fetch('/api/email/send', {
              method: 'POST',
              body: JSON.stringify({
                to: event.email,
                template: 'welcome',
                data: { name: event.name }
              })
            }),
          catch: (error) => new Error(String(error))
        })

        // Publish a follow-up event
        yield* eventBus.publish({
          _tag: "WelcomeEmailSent",
          id: event.id,
          timestamp: new Date()
        } as any)
      }).pipe(
        Effect.catchAll((error) => 
          Effect.logError(`Failed to process UserCreated event: ${error}`)
        )
      )
    )
  })
)

// WebSocket connection handler that sends initial state
declare global {
  interface WebSocket {
    send(data: string): void;
    close(): void;
    on(event: string, handler: Function): void;
  }
}

const handleWebSocketConnection = (ws: WebSocket) =>
  Effect.gen(function* () {
    const projection = yield* ProjectionService

    // Send initial state to the client
    const initialState = yield* projection.getState()
    ws.send(JSON.stringify({
      type: 'INITIAL_STATE',
      payload: initialState
    }))

    // Subscribe to state changes and send updates
    yield* projection.subscribeToChanges((state) =>
      Effect.sync(() => {
        ws.send(JSON.stringify({
          type: 'STATE_UPDATE',
          payload: state
        }))
      })
    )
  })
