import { Schema } from 'effect'

export class MongoError extends Schema.TaggedError<MongoError>()('MongoError', {
    operation: Schema.String,
    message: Schema.String,
    code: Schema.optional(Schema.Number),
    details: Schema.optional(Schema.Unknown),
}) {
    static readonly connectionFailed = (message: string, details?: unknown) =>
        new MongoError({
            operation: 'connection',
            message,
            code: 500,
            details,
        })

    static readonly queryFailed = (operation: string, message: string, details?: unknown) =>
        new MongoError({
            operation,
            message,
            code: 400,
            details,
        })

    static readonly notFound = (operation: string, id: string) =>
        new MongoError({
            operation,
            message: `Entity with id ${id} not found`,
            code: 404,
        })
}
