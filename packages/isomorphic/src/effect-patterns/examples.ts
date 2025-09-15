import { Effect, pipe, Duration, Layer } from 'effect'
import { 
    tag, 
    serviceLayer, 
    mockService, 
    mockLayer,
    stateService,
    error,
    type Op
} from './type-utils'

// ============================================================================
// Example 1: Simple Service Definition
// ============================================================================

// Before: 15+ lines of boilerplate
// After: 5 lines
export interface CalculatorOps {
    add: (a: number, b: number) => Op<number>
    multiply: (a: number, b: number) => Op<number>
    divide: (a: number, b: number) => Op<number, InstanceType<typeof DivisionError>>
}

const DivisionError = error('DivisionError', 'Cannot divide by zero')
export const Calculator = tag<'Calculator', CalculatorOps>('Calculator')

export const CalculatorLive = serviceLayer(
    Calculator,
    () => Effect.succeed({
        add: (a, b) => Effect.succeed(a + b),
        multiply: (a, b) => Effect.succeed(a * b),
        divide: (a, b) => b === 0 
            ? Effect.fail(DivisionError.make())
            : Effect.succeed(a / b)
    })
)

// ============================================================================
// Example 2: Service with Dependencies
// ============================================================================

export interface ConfigOps {
    get: <T>(key: string) => Op<T>
    set: <T>(key: string, value: T) => Op<void>
}

export const Config = tag<'Config', ConfigOps>('Config')

export interface CacheOps {
    get: <T>(key: string) => Op<T | null>
    set: <T>(key: string, value: T, ttl?: number) => Op<void>
    clear: () => Op<void>
}

export const Cache = tag<'Cache', CacheOps>('Cache')

// Service that depends on Config
export const CacheLive = serviceLayer(
    Cache,
    () => Effect.gen(function* () {
        const config = yield* Config
        const defaultTTL = yield* config.get<number>('cache.defaultTTL')
        const store = new Map<string, { value: any, expires: number }>()
        
        return {
            get: (key) => Effect.sync(() => {
                const item = store.get(key)
                if (!item) return null
                if (Date.now() > item.expires) {
                    store.delete(key)
                    return null
                }
                return item.value
            }),
            
            set: (key, value, ttl = defaultTTL) => Effect.sync(() => {
                store.set(key, {
                    value,
                    expires: Date.now() + ttl
                })
            }),
            
            clear: () => Effect.sync(() => store.clear())
        }
    }),
    {
        cleanup: (cache) => 
            Effect.gen(function* () {
                yield* cache.clear()
                yield* Effect.log('Cache cleared on shutdown')
            })
    }
)

// ============================================================================
// Example 3: Testing with Mocks
// ============================================================================

// Create mock implementations easily
export const CalculatorTest = mockLayer(Calculator, {
    add: (a, b) => Effect.succeed(a + b),
    multiply: () => Effect.succeed(42), // Mock return
    // divide will default to Effect.void
})

export const ConfigTest = mockLayer(Config, {
    get: <T>() => Effect.succeed('test-value' as T),
    set: <T>() => Effect.void
} as ConfigOps)

// Complete test setup
export const TestLayers = Layer.mergeAll(CalculatorTest, ConfigTest)

// ============================================================================
// Example 4: State Management Service
// ============================================================================

export interface UserState {
    currentUser: { id: string; name: string } | null
    isAuthenticated: boolean
    permissions: string[]
}

export interface UserStateOps {
    readonly get: () => Op<UserState>
    readonly set: (state: UserState) => Op<void>
    readonly update: (f: (state: UserState) => UserState) => Op<void>
    readonly subscribe: (listener: (state: UserState) => void) => Op<() => void>
}

export const UserStateService = tag<'UserState', UserStateOps>('UserState')

export const UserStateLive = serviceLayer(
    UserStateService,
    () => Effect.gen(function* () {
        const state = yield* stateService<UserState>({
            currentUser: null,
            isAuthenticated: false,
            permissions: []
        })
        return state as UserStateOps
    })
)

// Usage
export const loginUser = (id: string, name: string) =>
    Effect.gen(function* () {
        const state = yield* UserStateService
        yield* state.update(s => ({
            ...s,
            currentUser: { id, name },
            isAuthenticated: true
        }))
    })

// ============================================================================
// Example 5: Composing Services
// ============================================================================

export interface AppServiceOps {
    initialize: () => Op<void>
    process: (data: string) => Op<string>
    shutdown: () => Op<void>
}

export const AppService = tag<'AppService', AppServiceOps>('AppService')

export const AppServiceLive = serviceLayer(
    AppService,
    () => Effect.gen(function* () {
        const calc = yield* Calculator
        const cache = yield* Cache
        const config = yield* Config
        
        return {
            initialize: () => 
                Effect.gen(function* () {
                    const version = yield* config.get<string>('app.version')
                    yield* Effect.log(`App initialized: v${version}`)
                }),
            
            process: (data) =>
                Effect.gen(function* () {
                    // Check cache first
                    const cached = yield* cache.get<string>(data)
                    if (cached) return cached
                    
                    // Process with calculator
                    const nums = data.split(',').map(Number)
                    const sum = yield* nums.reduce(
                        (acc, n) => Effect.flatMap(acc, a => calc.add(a, n)),
                        Effect.succeed(0)
                    )
                    
                    const result = `Sum: ${sum}`
                    yield* cache.set(data, result, 60000)
                    return result
                }),
            
            shutdown: () =>
                Effect.gen(function* () {
                    yield* cache.clear()
                    yield* Effect.log('App shutdown complete')
                })
        }
    }),
    {
        cleanup: (app) => app.shutdown()
    }
)

// Complete application layer
export const AppLayers = pipe(
    AppServiceLive,
    Layer.provide(CalculatorLive),
    Layer.provide(CacheLive),
    Layer.provide(mockLayer(Config, {
        get: (key) => {
            const values: Record<string, any> = {
                'cache.defaultTTL': 300000,
                'app.version': '1.0.0'
            }
            return Effect.succeed(values[key])
        },
        set: () => Effect.void
    }))
)

// ============================================================================
// Example 6: Before vs After Comparison
// ============================================================================

// BEFORE: Traditional Effect Service (40+ lines)
/*
export interface LoggerService {
    readonly info: (msg: string) => Effect.Effect<void>
}

export class Logger extends Context.Tag('Logger')<Logger, LoggerService>() {}

export const LoggerLive = Layer.scoped(
    Logger,
    Effect.gen(function* () {
        const service: LoggerService = {
            info: (msg) => Effect.log(msg)
        }
        
        yield* Effect.addFinalizer(() => 
            Effect.log('Logger shutdown')
        )
        
        return service
    })
)
*/

// AFTER: With utilities (8 lines)
export interface LogServiceOps {
    info: (msg: string) => Op<void>
}

export const LogService = tag<'LogService', LogServiceOps>('LogService')

export const LogServiceLive = serviceLayer(
    LogService,
    () => Effect.succeed({ info: Effect.log }),
    { cleanup: () => Effect.log('Logger shutdown') }
)