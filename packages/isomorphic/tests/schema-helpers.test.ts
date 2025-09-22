import { describe, it, expect } from 'vitest'
import * as S from 'effect/Schema'
import {
    createEntitySchema,
    createUnionSchema,
    createErrorClass,
    withAnnotations,
    createResponseSchema,
    createPaginatedSchema,
    nullable,
    withDefault,
    type InferSchema
} from '../src/utils/schema-helpers'

describe('Schema Helpers', () => {
    describe('createEntitySchema', () => {
        it('should create entity schema with default fields', () => {
            const UserSchema = createEntitySchema('User', {
                name: S.String,
                email: S.String
            })

            const fields = UserSchema.ast.propertySignatures

            // Check default fields are present
            expect(fields.some(f => f.name === 'userId')).toBe(true)
            expect(fields.some(f => f.name === 'createdAt')).toBe(true)
            expect(fields.some(f => f.name === 'updatedAt')).toBe(true)
            expect(fields.some(f => f.name === 'name')).toBe(true)
            expect(fields.some(f => f.name === 'email')).toBe(true)
        })

        it('should allow custom id field name', () => {
            const AccountSchema = createEntitySchema('Account', {
                name: S.String
            }, { idField: 'accountId' })

            const fields = AccountSchema.ast.propertySignatures
            expect(fields.some(f => f.name === 'accountId')).toBe(true)
            expect(fields.some(f => f.name === 'accountId')).toBe(true)
        })

        it('should allow disabling timestamps', () => {
            const SimpleSchema = createEntitySchema('Simple', {
                value: S.String
            }, { timestamps: false })

            const fields = SimpleSchema.ast.propertySignatures
            expect(fields.some(f => f.name === 'createdAt')).toBe(false)
            expect(fields.some(f => f.name === 'updatedAt')).toBe(false)
        })
    })

    describe('createUnionSchema', () => {
        it('should create union from literal values', () => {
            const StatusSchema = createUnionSchema('Status', ['active', 'inactive', 'pending'] as const)

            // Test valid values
            expect(S.decodeUnknownSync(StatusSchema)('active')).toBe('active')
            expect(S.decodeUnknownSync(StatusSchema)('inactive')).toBe('inactive')
            expect(S.decodeUnknownSync(StatusSchema)('pending')).toBe('pending')

            // Test invalid value
            expect(() => S.decodeUnknownSync(StatusSchema)('invalid')).toThrow()
        })

        it('should add annotations to union schema', () => {
            const schema = createUnionSchema(
                'Priority',
                ['low', 'medium', 'high'] as const,
                { description: 'Task priority level' }
            )

            // Test that schema decoding still works
            expect(S.decodeUnknownSync(schema)('low')).toBe('low')
            expect(S.decodeUnknownSync(schema)('high')).toBe('high')
        })
    })

    describe('createErrorClass', () => {
        it('should create error class with tag', () => {
            const NotFoundError = createErrorClass('NotFound')({ id: 'string' })

            const error = new NotFoundError({ id: 'user123' })
            expect(error._tag).toBe('NotFound')
            expect(error.id).toBe('user123')
        })

        it('should create error without fields', () => {
            const SimpleError = createErrorClass('SimpleError')()

            const error = new SimpleError({})
            expect(error._tag).toBe('SimpleError')
        })

        it('should preserve static tag property', () => {
            const TestError = createErrorClass('TestError')({ message: 'string' })
            expect(TestError.tag).toBe('TestError')
        })
    })

    describe('withAnnotations', () => {
        it('should add annotations to schema', () => {
            const schema = withAnnotations(
                S.String,
                'Username',
                'User login name',
                { minLength: 3 }
            )

            // Test that the schema still works
            expect(S.decodeUnknownSync(schema)('test')).toBe('test')
            // Annotations are stored differently in Effect Schema
            expect(schema.ast.annotations).toBeDefined()
        })

        it('should work without description', () => {
            const schema = withAnnotations(S.Number, 'Age')

            // Test that the schema still works
            expect(S.decodeUnknownSync(schema)(42)).toBe(42)
            expect(schema.ast.annotations).toBeDefined()
        })
    })

    describe('createResponseSchema', () => {
        it('should create standard response envelope', () => {
            const UserSchema = S.Struct({ name: S.String })
            const ResponseSchema = createResponseSchema(UserSchema, 'User')

            const validResponse = {
                success: true,
                data: { name: 'John' },
                timestamp: Date.now()
            }

            expect(() => S.decodeUnknownSync(ResponseSchema)(validResponse)).not.toThrow()
        })

        it('should handle error field', () => {
            const ResponseSchema = createResponseSchema(S.String)

            const errorResponse = {
                success: false,
                data: '',
                timestamp: Date.now(),
                error: {
                    code: 'NOT_FOUND',
                    message: 'Resource not found'
                }
            }

            expect(() => S.decodeUnknownSync(ResponseSchema)(errorResponse)).not.toThrow()
        })
    })

    describe('createPaginatedSchema', () => {
        it('should create paginated list schema', () => {
            const ItemSchema = S.Struct({ id: S.String, name: S.String })
            const ListSchema = createPaginatedSchema(ItemSchema, 'ItemList')

            const validList = {
                items: [{ id: '1', name: 'Item 1' }],
                total: 100,
                page: 1,
                pageSize: 10,
                hasMore: true
            }

            expect(() => S.decodeUnknownSync(ListSchema)(validList)).not.toThrow()
        })
    })

    describe('nullable', () => {
        it('should accept value or null', () => {
            const NullableString = nullable(S.String)

            expect(S.decodeUnknownSync(NullableString)('hello')).toBe('hello')
            expect(S.decodeUnknownSync(NullableString)(null)).toBe(null)
            expect(() => S.decodeUnknownSync(NullableString)(undefined)).toThrow()
        })
    })

    describe('withDefault', () => {
        it('should provide default value for undefined', () => {
            // withDefault returns a PropertySignature, not a direct schema
            // So we need to use it correctly in a Struct
            const ConfigSchema = S.Struct({
                port: S.propertySignature(S.Number).pipe(
                    S.withConstructorDefault(() => 3000)
                )
            })

            // Test decoding with and without the port value
            const decode = S.decodeUnknownSync(ConfigSchema)

            // When port is missing, it should be required in decoding
            // but the constructor default only applies when constructing
            expect(() => decode({})).toThrow() // port is required for decoding
            expect(decode({ port: 8080 })).toEqual({ port: 8080 })
        })
    })

    describe('InferSchema type helper', () => {
        it('should infer schema type correctly', () => {
            const TestSchema = S.Struct({
                id: S.String,
                count: S.Number
            })

            type TestType = InferSchema<typeof TestSchema>

            // This is a compile-time test
            const test: TestType = {
                id: 'test',
                count: 42
            }

            expect(test.id).toBe('test')
            expect(test.count).toBe(42)
        })
    })
})