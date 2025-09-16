# Refactor Plan - Phase 4: Dynamic Service Reconfiguration
*Created: 2025-09-16*

## Initial State Analysis

### Current Architecture
- **Configuration**: Simplified to 2 env vars (MONGODB_URL, NODE_ENV) + SystemSlice for runtime config
- **SystemStateService**: Provides get/update/subscribe methods for SystemSlice access
- **Services**: Currently read config once at startup, no dynamic reconfiguration

### Problem Areas
1. **AIServiceEffect**: Still has `AIConfigEffect` Tag that should be removed
2. **Static Configuration**: Services don't react to SystemSlice changes
3. **Legacy Code**: MongoDatabaseEffect contains old ConfigService patterns
4. **No Reconfiguration Pattern**: Missing Effect patterns for runtime service updates

### Dependencies
- Effect 3.x for SubscriptionRef, Ref patterns
- Redux for SystemSlice state management
- MongoDB for persistence

## Refactoring Tasks

### Priority 1: Remove Legacy Config Patterns
- [ ] Remove AIConfigEffect Tag from AIServiceEffect
- [ ] Clean up makeAIService to not expect config parameter
- [ ] Update AIServiceLive to read directly from SystemStateService
- [ ] Remove/refactor MongoDatabaseEffect if still used

### Priority 2: Implement Dynamic Reconfiguration
- [ ] Add SubscriptionRef pattern for reactive config
- [ ] Create ConfigWatcher service for monitoring changes
- [ ] Implement service restart pattern on config change
- [ ] Add graceful shutdown/restart for services

### Priority 3: Service Updates
- [ ] Update AIService to react to OpenAI config changes
- [ ] Update MongoConnection poolSize on config change
- [ ] Add config change notifications to services
- [ ] Implement config versioning for safe updates

### Priority 4: Testing & Documentation
- [ ] Update test files to remove old config references
- [ ] Add tests for dynamic reconfiguration
- [ ] Document new reconfiguration patterns
- [ ] Create examples of reactive services

## Implementation Patterns

### Pattern 1: SubscriptionRef for Config
```typescript
const configRef = yield* SubscriptionRef.make(systemState.get())
yield* systemState.subscribe((newConfig) =>
  SubscriptionRef.set(configRef, newConfig)
)
```

### Pattern 2: Service Restart on Config Change
```typescript
const restartableService = yield* Stream.fromSubscriptionRef(configRef).pipe(
  Stream.map(config => createService(config)),
  Stream.runForEach(service => replaceService(service))
)
```

### Pattern 3: Graceful Service Update
```typescript
const updateService = (newConfig: SystemState) =>
  Effect.gen(function* () {
    yield* currentService.shutdown()
    const newService = yield* createService(newConfig)
    yield* setCurrentService(newService)
  })
```

## Validation Checklist
- [ ] All AIConfigEffect references removed
- [ ] No ConfigService imports remain
- [ ] Services react to config changes
- [ ] Tests pass with dynamic config
- [ ] No memory leaks from subscriptions
- [ ] Graceful handling of invalid config

## De-Para Mapping

| Before | After | Status |
|--------|-------|--------|
| AIConfigEffect Tag | Direct SystemStateService access | Pending |
| ConfigService.getOpenAI() | systemState.getOpenAI() | Completed |
| Static config at startup | SubscriptionRef pattern | Pending |
| MongoDatabaseEffect | Remove or refactor | Pending |
| Manual service restart | Automatic reconfiguration | Pending |

## Risk Assessment

### Low Risk
- Removing AIConfigEffect Tag
- Cleaning up imports

### Medium Risk
- Adding SubscriptionRef patterns
- Service restart logic

### High Risk
- Automatic service reconfiguration
- Config change during active operations

## Success Metrics
- Zero legacy config imports
- All services support hot reload
- Config changes apply within 1 second
- No service interruption during reconfiguration
- Memory usage stable during config changes

## Next Session Goals
1. Complete removal of AIConfigEffect
2. Implement SubscriptionRef for at least one service
3. Create working example of service reconfiguration
4. Document patterns for team adoption