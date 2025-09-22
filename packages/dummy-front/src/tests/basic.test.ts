import { describe, it, expect } from 'vitest'

describe('Basic Vitest Setup', () => {
    it('should run basic assertions', () => {
        expect(1 + 1).toBe(2)
        expect('hello').toBe('hello')
        expect([1, 2, 3]).toHaveLength(3)
    })

    it('should handle async operations', async () => {
        const promise = Promise.resolve(42)
        await expect(promise).resolves.toBe(42)
    })

    it('should verify TypeScript compilation', () => {
        interface TestInterface {
            name: string
            value: number
        }

        const testObj: TestInterface = {
            name: 'test',
            value: 123
        }

        expect(testObj.name).toBe('test')
        expect(testObj.value).toBe(123)
    })
})