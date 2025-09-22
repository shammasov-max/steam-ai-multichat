import { assert, describe, it } from '@effect/vitest'
import { Effect } from 'effect'

describe('Minimal Test', () => {
    it.effect('should verify basic Effect functionality', () =>
        Effect.gen(function* () {
            const result = yield* Effect.succeed(42)
            assert.strictEqual(result, 42)
        })
    )

    it('should verify basic vitest functionality', () => {
        const result = 1 + 1
        assert.strictEqual(result, 2)
    })
})