import { Context } from 'effect'
import { MongoClient, Db } from 'mongodb'

export interface MongoConnectionService {
    readonly client: MongoClient
    readonly db: Db
}

export class MongoConnection extends Context.Tag('MongoConnection')<
    MongoConnection,
    MongoConnectionService
>() {}
