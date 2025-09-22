import * as S from 'effect/Schema'
import { Data } from 'effect'

/**
 * Creates an entity schema with common base fields (id, createdAt, updatedAt)
 * Reduces boilerplate for entity definitions throughout the codebase
 *
 * @example
 * const UserSchema = createEntitySchema('User', {
 *   name: S.String,
 *   email: S.String
 * })
 */
export const createEntitySchema = <Fields extends Record<string, S.Schema.Any>>(
    entityName: string,
    fields: Fields,
    options?: {
        idField?: string
        timestamps?: boolean
        annotations?: Record<string, any>
    }
) => {
    const {
        idField = `${entityName.charAt(0).toLowerCase()}${entityName.slice(1)}Id`,
        timestamps = true,
        annotations = {}
    } = options ?? {}

    const baseFields = {
        [idField]: S.String.annotations({
            title: `${entityName} ID`,
            description: `Unique identifier for ${entityName}`
        }),
        ...(timestamps ? {
            createdAt: S.Number.annotations({
                title: 'Created At',
                description: 'UTC epoch milliseconds'
            }),
            updatedAt: S.Number.annotations({
                title: 'Updated At',
                description: 'UTC epoch milliseconds'
            })
        } : {})
    }

    return S.Struct({
        ...baseFields,
        ...fields
    }).annotations({
        title: entityName,
        ...annotations
    })
}

/**
 * Creates a union schema from an array of literal values
 * Simplifies creation of status, type, and enum-like schemas
 *
 * @example
 * const StatusSchema = createUnionSchema('Status', ['active', 'inactive', 'pending'])
 */
export const createUnionSchema = <const Values extends readonly [string, ...string[]]>(
    name: string,
    values: Values,
    annotations?: Record<string, any>
) => {
    // Create the union directly without intermediate array
    const [first, ...rest] = values
    const schema = S.Union(S.Literal(first), ...rest.map(v => S.Literal(v)))

    return annotations ? schema.annotations({ title: name, ...annotations }) : schema.annotations({ title: name })
}

/**
 * Creates a tagged error class using Effect's Data.TaggedError
 * Reduces boilerplate for error definitions
 *
 * @example
 * const UserNotFoundError = createErrorClass('UserNotFound', { userId: S.String })
 */
export const createErrorClass = <Tag extends string>(tag: Tag) => {
    return <Fields extends Record<string, any> = {}>(fields?: Fields) => {
        // Direct return without extending to avoid type issues
        const ErrorClass = Data.TaggedError(tag)<Fields>
        // Add static tag property
        ;(ErrorClass as any).tag = tag
        return ErrorClass as typeof ErrorClass & { tag: Tag }
    }
}

/**
 * Helper to add consistent annotations to schemas
 * Reduces verbose annotation objects throughout the codebase
 *
 * @example
 * const schema = withAnnotations(S.String, 'Username', 'User login name')
 */
export const withAnnotations = <A, I, R>(
    schema: S.Schema<A, I, R>,
    title: string,
    description?: string,
    additional?: Record<string, any>
): S.Schema<A, I, R> => {
    const annotations: Record<string, any> = { title }
    if (description) annotations.description = description
    if (additional) Object.assign(annotations, additional)

    return schema.annotations(annotations)
}

/**
 * Creates a schema for API response envelopes
 * Standardizes API response structure
 *
 * @example
 * const UserResponseSchema = createResponseSchema(UserSchema)
 */
export const createResponseSchema = <T extends S.Schema.Any>(
    dataSchema: T,
    name?: string
) => S.Struct({
    success: S.Boolean,
    data: dataSchema,
    timestamp: S.Number.annotations({ description: 'Response timestamp' }),
    error: S.optional(S.Struct({
        code: S.String,
        message: S.String,
        details: S.optional(S.Unknown)
    }))
}).annotations({
    title: name ? `${name} Response` : 'API Response',
    description: 'Standard API response envelope'
})

/**
 * Creates a paginated list schema
 * Standardizes pagination structure across the application
 *
 * @example
 * const UserListSchema = createPaginatedSchema(UserSchema, 'UserList')
 */
export const createPaginatedSchema = <T extends S.Schema.Any>(
    itemSchema: T,
    name?: string
) => S.Struct({
    items: S.Array(itemSchema),
    total: S.Number.annotations({ description: 'Total number of items' }),
    page: S.Number.annotations({ description: 'Current page number' }),
    pageSize: S.Number.annotations({ description: 'Items per page' }),
    hasMore: S.Boolean.annotations({ description: 'More pages available' })
}).annotations({
    title: name ?? 'Paginated List',
    description: 'Paginated collection of items'
})

/**
 * Type helper to extract the type from a schema
 * Useful for avoiding explicit type exports
 *
 * @example
 * const UserSchema = S.Struct({ name: S.String })
 * type User = InferSchema<typeof UserSchema>
 */
export type InferSchema<T> = T extends S.Schema<infer A, any, any> ? A : never

/**
 * Creates a nullable version of a schema
 * Useful for optional fields that can be explicitly null
 *
 * @example
 * const NullableUserSchema = nullable(UserSchema)
 */
export const nullable = <A, I, R>(schema: S.Schema<A, I, R>) =>
    S.Union(schema, S.Null)

/**
 * Creates a schema with default value
 * Simplifies optional fields with defaults
 *
 * @example
 * const ConfigSchema = S.Struct({
 *   port: withDefault(S.Number, 3000)
 * })
 */
export const withDefault = <A, I, R>(
    schema: S.Schema<A, I, R>,
    defaultValue: A
) => S.propertySignature(schema).pipe(
    S.withConstructorDefault(() => defaultValue)
)