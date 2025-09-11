import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Duration from 'effect/Duration'
import * as Ref from 'effect/Ref'
import * as Option from 'effect/Option'
import { pipe } from 'effect/Function'

// Circuit Breaker States
type CircuitState = 
  | { _tag: 'Closed'; failureCount: number }
  | { _tag: 'Open'; openedAt: number }
  | { _tag: 'HalfOpen' }

export interface CircuitBreakerConfig {
  readonly maxFailures: number
  readonly resetTimeout: Duration.Duration
  readonly halfOpenMaxAttempts: number
  readonly exponentialBackoffFactor: number
  readonly maxBackoffTime: Duration.Duration
}

export class CircuitBreakerError extends Error {
  readonly _tag = 'CircuitBreakerError'
  constructor(
    message: string,
    readonly state: CircuitState,
    readonly cause?: Error
  ) {
    super(message)
  }
}

export class CircuitOpenError extends CircuitBreakerError {
  override readonly _tag = 'CircuitOpenError' as const
  constructor(openedAt: number) {
    super('Circuit breaker is open', { _tag: 'Open', openedAt })
  }
}

interface CircuitBreakerOps {
  readonly execute: <A, E>(
    effect: Effect.Effect<A, E>
  ) => Effect.Effect<A, E | CircuitBreakerError>
  readonly getState: () => Effect.Effect<CircuitState>
  readonly reset: () => Effect.Effect<void>
  readonly getMetrics: () => Effect.Effect<{
    state: CircuitState
    totalCalls: number
    successfulCalls: number
    failedCalls: number
    lastFailureTime: Option.Option<number>
  }>
}

export class CircuitBreaker extends Context.Tag('CircuitBreaker')<CircuitBreaker, CircuitBreakerOps>() {}

interface CircuitBreakerState {
  state: CircuitState
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  lastFailureTime: Option.Option<number>
  consecutiveSuccesses: number
}

const makeCircuitBreaker = (
  config: CircuitBreakerConfig,
  stateRef: Ref.Ref<CircuitBreakerState>
): CircuitBreakerOps => {
  
  const shouldOpen = (failureCount: number): boolean =>
    failureCount >= config.maxFailures

  const isTimeoutExpired = (openedAt: number): boolean => {
    const now = Date.now()
    const timeout = Duration.toMillis(config.resetTimeout)
    return now - openedAt >= timeout
  }

  const transitionToOpen = (): Effect.Effect<void> =>
    pipe(
      Ref.update(stateRef, (current) => ({
        ...current,
        state: { _tag: 'Open', openedAt: Date.now() },
        lastFailureTime: Option.some(Date.now())
      }))
    )

  const transitionToHalfOpen = (): Effect.Effect<void> =>
    pipe(
      Ref.update(stateRef, (current) => ({
        ...current,
        state: { _tag: 'HalfOpen' },
        consecutiveSuccesses: 0
      }))
    )

  const transitionToClosed = (): Effect.Effect<void> =>
    pipe(
      Ref.update(stateRef, (current) => ({
        ...current,
        state: { _tag: 'Closed', failureCount: 0 },
        consecutiveSuccesses: 0
      }))
    )

  const onSuccess = (): Effect.Effect<void> =>
    pipe(
      Ref.modify(stateRef, (current) => {
        const newState = {
          ...current,
          totalCalls: current.totalCalls + 1,
          successfulCalls: current.successfulCalls + 1
        }

        switch (current.state._tag) {
          case 'HalfOpen':
            const newConsecutiveSuccesses = current.consecutiveSuccesses + 1
            if (newConsecutiveSuccesses >= config.halfOpenMaxAttempts) {
              return [
                transitionToClosed(),
                { ...newState, state: { _tag: 'Closed', failureCount: 0 } }
              ] as const
            }
            return [
              Effect.void,
              { ...newState, consecutiveSuccesses: newConsecutiveSuccesses }
            ] as const

          case 'Closed':
            return [
              Effect.void,
              {
                ...newState,
                state: { _tag: 'Closed', failureCount: 0 }
              }
            ] as const

          default:
            return [Effect.void, newState] as const
        }
      }),
      Effect.flatten
    )

  const onFailure = (): Effect.Effect<void> =>
    pipe(
      Ref.modify(stateRef, (current) => {
        const newState = {
          ...current,
          totalCalls: current.totalCalls + 1,
          failedCalls: current.failedCalls + 1,
          lastFailureTime: Option.some(Date.now())
        }

        switch (current.state._tag) {
          case 'Closed':
            const newFailureCount = current.state.failureCount + 1
            if (shouldOpen(newFailureCount)) {
              return [
                transitionToOpen(),
                { ...newState, state: { _tag: 'Open', openedAt: Date.now() } }
              ] as const
            }
            return [
              Effect.void,
              { ...newState, state: { _tag: 'Closed', failureCount: newFailureCount } }
            ] as const

          case 'HalfOpen':
            return [
              transitionToOpen(),
              { ...newState, state: { _tag: 'Open', openedAt: Date.now() } }
            ] as const

          default:
            return [Effect.void, newState] as const
        }
      }),
      Effect.flatten
    )

  return {
    execute: <A, E>(effect: Effect.Effect<A, E>) =>
      pipe(
        Ref.get(stateRef),
        Effect.flatMap((current) => {
          switch (current.state._tag) {
            case 'Open':
              if (isTimeoutExpired(current.state.openedAt)) {
                return pipe(
                  transitionToHalfOpen(),
                  Effect.zipRight(
                    pipe(
                      effect,
                      Effect.tap(() => onSuccess()),
                      Effect.tapError(() => onFailure())
                    )
                  )
                )
              }
              return Effect.fail(new CircuitOpenError(current.state.openedAt))

            case 'HalfOpen':
            case 'Closed':
              return pipe(
                effect,
                Effect.tap(() => onSuccess()),
                Effect.tapError(() => onFailure())
              )
          }
        })
      ),

    getState: () =>
      pipe(
        Ref.get(stateRef),
        Effect.map((s) => s.state)
      ),

    reset: () => transitionToClosed(),

    getMetrics: () => Ref.get(stateRef)
  }
}

// Factory function for creating circuit breaker
export const makeCircuitBreakerLayer = (config: CircuitBreakerConfig) =>
  Effect.gen(function* () {
    const initialState: CircuitBreakerState = {
      state: { _tag: 'Closed', failureCount: 0 },
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      lastFailureTime: Option.none(),
      consecutiveSuccesses: 0
    }
    
    const stateRef = yield* Ref.make(initialState)
    return makeCircuitBreaker(config, stateRef)
  }).pipe(
    Effect.map((service) => Context.make(CircuitBreaker, service))
  )

// Default configuration
export const defaultCircuitBreakerConfig: CircuitBreakerConfig = {
  maxFailures: 5,
  resetTimeout: Duration.seconds(60),
  halfOpenMaxAttempts: 3,
  exponentialBackoffFactor: 2,
  maxBackoffTime: Duration.minutes(5)
}