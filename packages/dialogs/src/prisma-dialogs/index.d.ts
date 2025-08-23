
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Dialog
 * 
 */
export type Dialog = $Result.DefaultSelection<Prisma.$DialogPayload>
/**
 * Model Message
 * 
 */
export type Message = $Result.DefaultSelection<Prisma.$MessagePayload>
/**
 * Model DialogState
 * 
 */
export type DialogState = $Result.DefaultSelection<Prisma.$DialogStatePayload>
/**
 * Model Log
 * 
 */
export type Log = $Result.DefaultSelection<Prisma.$LogPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const DialogStatus: {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  ESCALATED: 'ESCALATED'
};

export type DialogStatus = (typeof DialogStatus)[keyof typeof DialogStatus]


export const Role: {
  USER: 'USER',
  ASSISTANT: 'ASSISTANT'
};

export type Role = (typeof Role)[keyof typeof Role]


export const LogLevel: {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  ERROR: 'ERROR'
};

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel]

}

export type DialogStatus = $Enums.DialogStatus

export const DialogStatus: typeof $Enums.DialogStatus

export type Role = $Enums.Role

export const Role: typeof $Enums.Role

export type LogLevel = $Enums.LogLevel

export const LogLevel: typeof $Enums.LogLevel

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Dialogs
 * const dialogs = await prisma.dialog.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Dialogs
   * const dialogs = await prisma.dialog.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.dialog`: Exposes CRUD operations for the **Dialog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Dialogs
    * const dialogs = await prisma.dialog.findMany()
    * ```
    */
  get dialog(): Prisma.DialogDelegate<ExtArgs>;

  /**
   * `prisma.message`: Exposes CRUD operations for the **Message** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Messages
    * const messages = await prisma.message.findMany()
    * ```
    */
  get message(): Prisma.MessageDelegate<ExtArgs>;

  /**
   * `prisma.dialogState`: Exposes CRUD operations for the **DialogState** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more DialogStates
    * const dialogStates = await prisma.dialogState.findMany()
    * ```
    */
  get dialogState(): Prisma.DialogStateDelegate<ExtArgs>;

  /**
   * `prisma.log`: Exposes CRUD operations for the **Log** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Logs
    * const logs = await prisma.log.findMany()
    * ```
    */
  get log(): Prisma.LogDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Dialog: 'Dialog',
    Message: 'Message',
    DialogState: 'DialogState',
    Log: 'Log'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "dialog" | "message" | "dialogState" | "log"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Dialog: {
        payload: Prisma.$DialogPayload<ExtArgs>
        fields: Prisma.DialogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DialogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DialogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogPayload>
          }
          findFirst: {
            args: Prisma.DialogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DialogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogPayload>
          }
          findMany: {
            args: Prisma.DialogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogPayload>[]
          }
          create: {
            args: Prisma.DialogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogPayload>
          }
          createMany: {
            args: Prisma.DialogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DialogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogPayload>[]
          }
          delete: {
            args: Prisma.DialogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogPayload>
          }
          update: {
            args: Prisma.DialogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogPayload>
          }
          deleteMany: {
            args: Prisma.DialogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DialogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.DialogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogPayload>
          }
          aggregate: {
            args: Prisma.DialogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDialog>
          }
          groupBy: {
            args: Prisma.DialogGroupByArgs<ExtArgs>
            result: $Utils.Optional<DialogGroupByOutputType>[]
          }
          count: {
            args: Prisma.DialogCountArgs<ExtArgs>
            result: $Utils.Optional<DialogCountAggregateOutputType> | number
          }
        }
      }
      Message: {
        payload: Prisma.$MessagePayload<ExtArgs>
        fields: Prisma.MessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findFirst: {
            args: Prisma.MessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findMany: {
            args: Prisma.MessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          create: {
            args: Prisma.MessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          createMany: {
            args: Prisma.MessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          delete: {
            args: Prisma.MessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          update: {
            args: Prisma.MessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          deleteMany: {
            args: Prisma.MessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.MessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          aggregate: {
            args: Prisma.MessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMessage>
          }
          groupBy: {
            args: Prisma.MessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<MessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.MessageCountArgs<ExtArgs>
            result: $Utils.Optional<MessageCountAggregateOutputType> | number
          }
        }
      }
      DialogState: {
        payload: Prisma.$DialogStatePayload<ExtArgs>
        fields: Prisma.DialogStateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DialogStateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogStatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DialogStateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogStatePayload>
          }
          findFirst: {
            args: Prisma.DialogStateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogStatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DialogStateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogStatePayload>
          }
          findMany: {
            args: Prisma.DialogStateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogStatePayload>[]
          }
          create: {
            args: Prisma.DialogStateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogStatePayload>
          }
          createMany: {
            args: Prisma.DialogStateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DialogStateCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogStatePayload>[]
          }
          delete: {
            args: Prisma.DialogStateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogStatePayload>
          }
          update: {
            args: Prisma.DialogStateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogStatePayload>
          }
          deleteMany: {
            args: Prisma.DialogStateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DialogStateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.DialogStateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DialogStatePayload>
          }
          aggregate: {
            args: Prisma.DialogStateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDialogState>
          }
          groupBy: {
            args: Prisma.DialogStateGroupByArgs<ExtArgs>
            result: $Utils.Optional<DialogStateGroupByOutputType>[]
          }
          count: {
            args: Prisma.DialogStateCountArgs<ExtArgs>
            result: $Utils.Optional<DialogStateCountAggregateOutputType> | number
          }
        }
      }
      Log: {
        payload: Prisma.$LogPayload<ExtArgs>
        fields: Prisma.LogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload>
          }
          findFirst: {
            args: Prisma.LogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload>
          }
          findMany: {
            args: Prisma.LogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload>[]
          }
          create: {
            args: Prisma.LogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload>
          }
          createMany: {
            args: Prisma.LogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload>[]
          }
          delete: {
            args: Prisma.LogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload>
          }
          update: {
            args: Prisma.LogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload>
          }
          deleteMany: {
            args: Prisma.LogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.LogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload>
          }
          aggregate: {
            args: Prisma.LogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLog>
          }
          groupBy: {
            args: Prisma.LogGroupByArgs<ExtArgs>
            result: $Utils.Optional<LogGroupByOutputType>[]
          }
          count: {
            args: Prisma.LogCountArgs<ExtArgs>
            result: $Utils.Optional<LogCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type DialogCountOutputType
   */

  export type DialogCountOutputType = {
    messages: number
    states: number
    logs: number
  }

  export type DialogCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    messages?: boolean | DialogCountOutputTypeCountMessagesArgs
    states?: boolean | DialogCountOutputTypeCountStatesArgs
    logs?: boolean | DialogCountOutputTypeCountLogsArgs
  }

  // Custom InputTypes
  /**
   * DialogCountOutputType without action
   */
  export type DialogCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DialogCountOutputType
     */
    select?: DialogCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * DialogCountOutputType without action
   */
  export type DialogCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
  }

  /**
   * DialogCountOutputType without action
   */
  export type DialogCountOutputTypeCountStatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DialogStateWhereInput
  }

  /**
   * DialogCountOutputType without action
   */
  export type DialogCountOutputTypeCountLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LogWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Dialog
   */

  export type AggregateDialog = {
    _count: DialogCountAggregateOutputType | null
    _min: DialogMinAggregateOutputType | null
    _max: DialogMaxAggregateOutputType | null
  }

  export type DialogMinAggregateOutputType = {
    id: string | null
    externalId: string | null
    status: $Enums.DialogStatus | null
    language: string | null
    goal: string | null
    referenceContext: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DialogMaxAggregateOutputType = {
    id: string | null
    externalId: string | null
    status: $Enums.DialogStatus | null
    language: string | null
    goal: string | null
    referenceContext: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DialogCountAggregateOutputType = {
    id: number
    externalId: number
    status: number
    language: number
    userInfo: number
    goal: number
    completionCriteria: number
    negotiationSettings: number
    referenceContext: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type DialogMinAggregateInputType = {
    id?: true
    externalId?: true
    status?: true
    language?: true
    goal?: true
    referenceContext?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DialogMaxAggregateInputType = {
    id?: true
    externalId?: true
    status?: true
    language?: true
    goal?: true
    referenceContext?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DialogCountAggregateInputType = {
    id?: true
    externalId?: true
    status?: true
    language?: true
    userInfo?: true
    goal?: true
    completionCriteria?: true
    negotiationSettings?: true
    referenceContext?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type DialogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Dialog to aggregate.
     */
    where?: DialogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Dialogs to fetch.
     */
    orderBy?: DialogOrderByWithRelationInput | DialogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DialogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Dialogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Dialogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Dialogs
    **/
    _count?: true | DialogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DialogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DialogMaxAggregateInputType
  }

  export type GetDialogAggregateType<T extends DialogAggregateArgs> = {
        [P in keyof T & keyof AggregateDialog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDialog[P]>
      : GetScalarType<T[P], AggregateDialog[P]>
  }




  export type DialogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DialogWhereInput
    orderBy?: DialogOrderByWithAggregationInput | DialogOrderByWithAggregationInput[]
    by: DialogScalarFieldEnum[] | DialogScalarFieldEnum
    having?: DialogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DialogCountAggregateInputType | true
    _min?: DialogMinAggregateInputType
    _max?: DialogMaxAggregateInputType
  }

  export type DialogGroupByOutputType = {
    id: string
    externalId: string
    status: $Enums.DialogStatus
    language: string
    userInfo: JsonValue | null
    goal: string
    completionCriteria: JsonValue
    negotiationSettings: JsonValue | null
    referenceContext: string | null
    createdAt: Date
    updatedAt: Date
    _count: DialogCountAggregateOutputType | null
    _min: DialogMinAggregateOutputType | null
    _max: DialogMaxAggregateOutputType | null
  }

  type GetDialogGroupByPayload<T extends DialogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DialogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DialogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DialogGroupByOutputType[P]>
            : GetScalarType<T[P], DialogGroupByOutputType[P]>
        }
      >
    >


  export type DialogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    externalId?: boolean
    status?: boolean
    language?: boolean
    userInfo?: boolean
    goal?: boolean
    completionCriteria?: boolean
    negotiationSettings?: boolean
    referenceContext?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    messages?: boolean | Dialog$messagesArgs<ExtArgs>
    states?: boolean | Dialog$statesArgs<ExtArgs>
    logs?: boolean | Dialog$logsArgs<ExtArgs>
    _count?: boolean | DialogCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["dialog"]>

  export type DialogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    externalId?: boolean
    status?: boolean
    language?: boolean
    userInfo?: boolean
    goal?: boolean
    completionCriteria?: boolean
    negotiationSettings?: boolean
    referenceContext?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["dialog"]>

  export type DialogSelectScalar = {
    id?: boolean
    externalId?: boolean
    status?: boolean
    language?: boolean
    userInfo?: boolean
    goal?: boolean
    completionCriteria?: boolean
    negotiationSettings?: boolean
    referenceContext?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type DialogInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    messages?: boolean | Dialog$messagesArgs<ExtArgs>
    states?: boolean | Dialog$statesArgs<ExtArgs>
    logs?: boolean | Dialog$logsArgs<ExtArgs>
    _count?: boolean | DialogCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type DialogIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $DialogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Dialog"
    objects: {
      messages: Prisma.$MessagePayload<ExtArgs>[]
      states: Prisma.$DialogStatePayload<ExtArgs>[]
      logs: Prisma.$LogPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      externalId: string
      status: $Enums.DialogStatus
      language: string
      userInfo: Prisma.JsonValue | null
      goal: string
      completionCriteria: Prisma.JsonValue
      negotiationSettings: Prisma.JsonValue | null
      referenceContext: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["dialog"]>
    composites: {}
  }

  type DialogGetPayload<S extends boolean | null | undefined | DialogDefaultArgs> = $Result.GetResult<Prisma.$DialogPayload, S>

  type DialogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<DialogFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: DialogCountAggregateInputType | true
    }

  export interface DialogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Dialog'], meta: { name: 'Dialog' } }
    /**
     * Find zero or one Dialog that matches the filter.
     * @param {DialogFindUniqueArgs} args - Arguments to find a Dialog
     * @example
     * // Get one Dialog
     * const dialog = await prisma.dialog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DialogFindUniqueArgs>(args: SelectSubset<T, DialogFindUniqueArgs<ExtArgs>>): Prisma__DialogClient<$Result.GetResult<Prisma.$DialogPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Dialog that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {DialogFindUniqueOrThrowArgs} args - Arguments to find a Dialog
     * @example
     * // Get one Dialog
     * const dialog = await prisma.dialog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DialogFindUniqueOrThrowArgs>(args: SelectSubset<T, DialogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DialogClient<$Result.GetResult<Prisma.$DialogPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Dialog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DialogFindFirstArgs} args - Arguments to find a Dialog
     * @example
     * // Get one Dialog
     * const dialog = await prisma.dialog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DialogFindFirstArgs>(args?: SelectSubset<T, DialogFindFirstArgs<ExtArgs>>): Prisma__DialogClient<$Result.GetResult<Prisma.$DialogPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Dialog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DialogFindFirstOrThrowArgs} args - Arguments to find a Dialog
     * @example
     * // Get one Dialog
     * const dialog = await prisma.dialog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DialogFindFirstOrThrowArgs>(args?: SelectSubset<T, DialogFindFirstOrThrowArgs<ExtArgs>>): Prisma__DialogClient<$Result.GetResult<Prisma.$DialogPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Dialogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DialogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Dialogs
     * const dialogs = await prisma.dialog.findMany()
     * 
     * // Get first 10 Dialogs
     * const dialogs = await prisma.dialog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const dialogWithIdOnly = await prisma.dialog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DialogFindManyArgs>(args?: SelectSubset<T, DialogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DialogPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Dialog.
     * @param {DialogCreateArgs} args - Arguments to create a Dialog.
     * @example
     * // Create one Dialog
     * const Dialog = await prisma.dialog.create({
     *   data: {
     *     // ... data to create a Dialog
     *   }
     * })
     * 
     */
    create<T extends DialogCreateArgs>(args: SelectSubset<T, DialogCreateArgs<ExtArgs>>): Prisma__DialogClient<$Result.GetResult<Prisma.$DialogPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Dialogs.
     * @param {DialogCreateManyArgs} args - Arguments to create many Dialogs.
     * @example
     * // Create many Dialogs
     * const dialog = await prisma.dialog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DialogCreateManyArgs>(args?: SelectSubset<T, DialogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Dialogs and returns the data saved in the database.
     * @param {DialogCreateManyAndReturnArgs} args - Arguments to create many Dialogs.
     * @example
     * // Create many Dialogs
     * const dialog = await prisma.dialog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Dialogs and only return the `id`
     * const dialogWithIdOnly = await prisma.dialog.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DialogCreateManyAndReturnArgs>(args?: SelectSubset<T, DialogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DialogPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Dialog.
     * @param {DialogDeleteArgs} args - Arguments to delete one Dialog.
     * @example
     * // Delete one Dialog
     * const Dialog = await prisma.dialog.delete({
     *   where: {
     *     // ... filter to delete one Dialog
     *   }
     * })
     * 
     */
    delete<T extends DialogDeleteArgs>(args: SelectSubset<T, DialogDeleteArgs<ExtArgs>>): Prisma__DialogClient<$Result.GetResult<Prisma.$DialogPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Dialog.
     * @param {DialogUpdateArgs} args - Arguments to update one Dialog.
     * @example
     * // Update one Dialog
     * const dialog = await prisma.dialog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DialogUpdateArgs>(args: SelectSubset<T, DialogUpdateArgs<ExtArgs>>): Prisma__DialogClient<$Result.GetResult<Prisma.$DialogPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Dialogs.
     * @param {DialogDeleteManyArgs} args - Arguments to filter Dialogs to delete.
     * @example
     * // Delete a few Dialogs
     * const { count } = await prisma.dialog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DialogDeleteManyArgs>(args?: SelectSubset<T, DialogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Dialogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DialogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Dialogs
     * const dialog = await prisma.dialog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DialogUpdateManyArgs>(args: SelectSubset<T, DialogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Dialog.
     * @param {DialogUpsertArgs} args - Arguments to update or create a Dialog.
     * @example
     * // Update or create a Dialog
     * const dialog = await prisma.dialog.upsert({
     *   create: {
     *     // ... data to create a Dialog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Dialog we want to update
     *   }
     * })
     */
    upsert<T extends DialogUpsertArgs>(args: SelectSubset<T, DialogUpsertArgs<ExtArgs>>): Prisma__DialogClient<$Result.GetResult<Prisma.$DialogPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Dialogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DialogCountArgs} args - Arguments to filter Dialogs to count.
     * @example
     * // Count the number of Dialogs
     * const count = await prisma.dialog.count({
     *   where: {
     *     // ... the filter for the Dialogs we want to count
     *   }
     * })
    **/
    count<T extends DialogCountArgs>(
      args?: Subset<T, DialogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DialogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Dialog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DialogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DialogAggregateArgs>(args: Subset<T, DialogAggregateArgs>): Prisma.PrismaPromise<GetDialogAggregateType<T>>

    /**
     * Group by Dialog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DialogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DialogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DialogGroupByArgs['orderBy'] }
        : { orderBy?: DialogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DialogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDialogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Dialog model
   */
  readonly fields: DialogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Dialog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DialogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    messages<T extends Dialog$messagesArgs<ExtArgs> = {}>(args?: Subset<T, Dialog$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany"> | Null>
    states<T extends Dialog$statesArgs<ExtArgs> = {}>(args?: Subset<T, Dialog$statesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DialogStatePayload<ExtArgs>, T, "findMany"> | Null>
    logs<T extends Dialog$logsArgs<ExtArgs> = {}>(args?: Subset<T, Dialog$logsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Dialog model
   */ 
  interface DialogFieldRefs {
    readonly id: FieldRef<"Dialog", 'String'>
    readonly externalId: FieldRef<"Dialog", 'String'>
    readonly status: FieldRef<"Dialog", 'DialogStatus'>
    readonly language: FieldRef<"Dialog", 'String'>
    readonly userInfo: FieldRef<"Dialog", 'Json'>
    readonly goal: FieldRef<"Dialog", 'String'>
    readonly completionCriteria: FieldRef<"Dialog", 'Json'>
    readonly negotiationSettings: FieldRef<"Dialog", 'Json'>
    readonly referenceContext: FieldRef<"Dialog", 'String'>
    readonly createdAt: FieldRef<"Dialog", 'DateTime'>
    readonly updatedAt: FieldRef<"Dialog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Dialog findUnique
   */
  export type DialogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dialog
     */
    select?: DialogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogInclude<ExtArgs> | null
    /**
     * Filter, which Dialog to fetch.
     */
    where: DialogWhereUniqueInput
  }

  /**
   * Dialog findUniqueOrThrow
   */
  export type DialogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dialog
     */
    select?: DialogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogInclude<ExtArgs> | null
    /**
     * Filter, which Dialog to fetch.
     */
    where: DialogWhereUniqueInput
  }

  /**
   * Dialog findFirst
   */
  export type DialogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dialog
     */
    select?: DialogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogInclude<ExtArgs> | null
    /**
     * Filter, which Dialog to fetch.
     */
    where?: DialogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Dialogs to fetch.
     */
    orderBy?: DialogOrderByWithRelationInput | DialogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Dialogs.
     */
    cursor?: DialogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Dialogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Dialogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Dialogs.
     */
    distinct?: DialogScalarFieldEnum | DialogScalarFieldEnum[]
  }

  /**
   * Dialog findFirstOrThrow
   */
  export type DialogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dialog
     */
    select?: DialogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogInclude<ExtArgs> | null
    /**
     * Filter, which Dialog to fetch.
     */
    where?: DialogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Dialogs to fetch.
     */
    orderBy?: DialogOrderByWithRelationInput | DialogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Dialogs.
     */
    cursor?: DialogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Dialogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Dialogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Dialogs.
     */
    distinct?: DialogScalarFieldEnum | DialogScalarFieldEnum[]
  }

  /**
   * Dialog findMany
   */
  export type DialogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dialog
     */
    select?: DialogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogInclude<ExtArgs> | null
    /**
     * Filter, which Dialogs to fetch.
     */
    where?: DialogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Dialogs to fetch.
     */
    orderBy?: DialogOrderByWithRelationInput | DialogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Dialogs.
     */
    cursor?: DialogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Dialogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Dialogs.
     */
    skip?: number
    distinct?: DialogScalarFieldEnum | DialogScalarFieldEnum[]
  }

  /**
   * Dialog create
   */
  export type DialogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dialog
     */
    select?: DialogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogInclude<ExtArgs> | null
    /**
     * The data needed to create a Dialog.
     */
    data: XOR<DialogCreateInput, DialogUncheckedCreateInput>
  }

  /**
   * Dialog createMany
   */
  export type DialogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Dialogs.
     */
    data: DialogCreateManyInput | DialogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Dialog createManyAndReturn
   */
  export type DialogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dialog
     */
    select?: DialogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Dialogs.
     */
    data: DialogCreateManyInput | DialogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Dialog update
   */
  export type DialogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dialog
     */
    select?: DialogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogInclude<ExtArgs> | null
    /**
     * The data needed to update a Dialog.
     */
    data: XOR<DialogUpdateInput, DialogUncheckedUpdateInput>
    /**
     * Choose, which Dialog to update.
     */
    where: DialogWhereUniqueInput
  }

  /**
   * Dialog updateMany
   */
  export type DialogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Dialogs.
     */
    data: XOR<DialogUpdateManyMutationInput, DialogUncheckedUpdateManyInput>
    /**
     * Filter which Dialogs to update
     */
    where?: DialogWhereInput
  }

  /**
   * Dialog upsert
   */
  export type DialogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dialog
     */
    select?: DialogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogInclude<ExtArgs> | null
    /**
     * The filter to search for the Dialog to update in case it exists.
     */
    where: DialogWhereUniqueInput
    /**
     * In case the Dialog found by the `where` argument doesn't exist, create a new Dialog with this data.
     */
    create: XOR<DialogCreateInput, DialogUncheckedCreateInput>
    /**
     * In case the Dialog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DialogUpdateInput, DialogUncheckedUpdateInput>
  }

  /**
   * Dialog delete
   */
  export type DialogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dialog
     */
    select?: DialogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogInclude<ExtArgs> | null
    /**
     * Filter which Dialog to delete.
     */
    where: DialogWhereUniqueInput
  }

  /**
   * Dialog deleteMany
   */
  export type DialogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Dialogs to delete
     */
    where?: DialogWhereInput
  }

  /**
   * Dialog.messages
   */
  export type Dialog$messagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    cursor?: MessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Dialog.states
   */
  export type Dialog$statesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DialogState
     */
    select?: DialogStateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogStateInclude<ExtArgs> | null
    where?: DialogStateWhereInput
    orderBy?: DialogStateOrderByWithRelationInput | DialogStateOrderByWithRelationInput[]
    cursor?: DialogStateWhereUniqueInput
    take?: number
    skip?: number
    distinct?: DialogStateScalarFieldEnum | DialogStateScalarFieldEnum[]
  }

  /**
   * Dialog.logs
   */
  export type Dialog$logsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    where?: LogWhereInput
    orderBy?: LogOrderByWithRelationInput | LogOrderByWithRelationInput[]
    cursor?: LogWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LogScalarFieldEnum | LogScalarFieldEnum[]
  }

  /**
   * Dialog without action
   */
  export type DialogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dialog
     */
    select?: DialogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogInclude<ExtArgs> | null
  }


  /**
   * Model Message
   */

  export type AggregateMessage = {
    _count: MessageCountAggregateOutputType | null
    _avg: MessageAvgAggregateOutputType | null
    _sum: MessageSumAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  export type MessageAvgAggregateOutputType = {
    sequenceNumber: number | null
  }

  export type MessageSumAggregateOutputType = {
    sequenceNumber: number | null
  }

  export type MessageMinAggregateOutputType = {
    id: string | null
    dialogId: string | null
    role: $Enums.Role | null
    content: string | null
    sequenceNumber: number | null
    createdAt: Date | null
  }

  export type MessageMaxAggregateOutputType = {
    id: string | null
    dialogId: string | null
    role: $Enums.Role | null
    content: string | null
    sequenceNumber: number | null
    createdAt: Date | null
  }

  export type MessageCountAggregateOutputType = {
    id: number
    dialogId: number
    role: number
    content: number
    sequenceNumber: number
    metadata: number
    createdAt: number
    _all: number
  }


  export type MessageAvgAggregateInputType = {
    sequenceNumber?: true
  }

  export type MessageSumAggregateInputType = {
    sequenceNumber?: true
  }

  export type MessageMinAggregateInputType = {
    id?: true
    dialogId?: true
    role?: true
    content?: true
    sequenceNumber?: true
    createdAt?: true
  }

  export type MessageMaxAggregateInputType = {
    id?: true
    dialogId?: true
    role?: true
    content?: true
    sequenceNumber?: true
    createdAt?: true
  }

  export type MessageCountAggregateInputType = {
    id?: true
    dialogId?: true
    role?: true
    content?: true
    sequenceNumber?: true
    metadata?: true
    createdAt?: true
    _all?: true
  }

  export type MessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Message to aggregate.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Messages
    **/
    _count?: true | MessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MessageAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MessageSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MessageMaxAggregateInputType
  }

  export type GetMessageAggregateType<T extends MessageAggregateArgs> = {
        [P in keyof T & keyof AggregateMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMessage[P]>
      : GetScalarType<T[P], AggregateMessage[P]>
  }




  export type MessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithAggregationInput | MessageOrderByWithAggregationInput[]
    by: MessageScalarFieldEnum[] | MessageScalarFieldEnum
    having?: MessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MessageCountAggregateInputType | true
    _avg?: MessageAvgAggregateInputType
    _sum?: MessageSumAggregateInputType
    _min?: MessageMinAggregateInputType
    _max?: MessageMaxAggregateInputType
  }

  export type MessageGroupByOutputType = {
    id: string
    dialogId: string
    role: $Enums.Role
    content: string
    sequenceNumber: number
    metadata: JsonValue | null
    createdAt: Date
    _count: MessageCountAggregateOutputType | null
    _avg: MessageAvgAggregateOutputType | null
    _sum: MessageSumAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  type GetMessageGroupByPayload<T extends MessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MessageGroupByOutputType[P]>
            : GetScalarType<T[P], MessageGroupByOutputType[P]>
        }
      >
    >


  export type MessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dialogId?: boolean
    role?: boolean
    content?: boolean
    sequenceNumber?: boolean
    metadata?: boolean
    createdAt?: boolean
    dialog?: boolean | DialogDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dialogId?: boolean
    role?: boolean
    content?: boolean
    sequenceNumber?: boolean
    metadata?: boolean
    createdAt?: boolean
    dialog?: boolean | DialogDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectScalar = {
    id?: boolean
    dialogId?: boolean
    role?: boolean
    content?: boolean
    sequenceNumber?: boolean
    metadata?: boolean
    createdAt?: boolean
  }

  export type MessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    dialog?: boolean | DialogDefaultArgs<ExtArgs>
  }
  export type MessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    dialog?: boolean | DialogDefaultArgs<ExtArgs>
  }

  export type $MessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Message"
    objects: {
      dialog: Prisma.$DialogPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      dialogId: string
      role: $Enums.Role
      content: string
      sequenceNumber: number
      metadata: Prisma.JsonValue | null
      createdAt: Date
    }, ExtArgs["result"]["message"]>
    composites: {}
  }

  type MessageGetPayload<S extends boolean | null | undefined | MessageDefaultArgs> = $Result.GetResult<Prisma.$MessagePayload, S>

  type MessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<MessageFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: MessageCountAggregateInputType | true
    }

  export interface MessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Message'], meta: { name: 'Message' } }
    /**
     * Find zero or one Message that matches the filter.
     * @param {MessageFindUniqueArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MessageFindUniqueArgs>(args: SelectSubset<T, MessageFindUniqueArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Message that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {MessageFindUniqueOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MessageFindUniqueOrThrowArgs>(args: SelectSubset<T, MessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Message that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MessageFindFirstArgs>(args?: SelectSubset<T, MessageFindFirstArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Message that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MessageFindFirstOrThrowArgs>(args?: SelectSubset<T, MessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Messages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Messages
     * const messages = await prisma.message.findMany()
     * 
     * // Get first 10 Messages
     * const messages = await prisma.message.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const messageWithIdOnly = await prisma.message.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MessageFindManyArgs>(args?: SelectSubset<T, MessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Message.
     * @param {MessageCreateArgs} args - Arguments to create a Message.
     * @example
     * // Create one Message
     * const Message = await prisma.message.create({
     *   data: {
     *     // ... data to create a Message
     *   }
     * })
     * 
     */
    create<T extends MessageCreateArgs>(args: SelectSubset<T, MessageCreateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Messages.
     * @param {MessageCreateManyArgs} args - Arguments to create many Messages.
     * @example
     * // Create many Messages
     * const message = await prisma.message.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MessageCreateManyArgs>(args?: SelectSubset<T, MessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Messages and returns the data saved in the database.
     * @param {MessageCreateManyAndReturnArgs} args - Arguments to create many Messages.
     * @example
     * // Create many Messages
     * const message = await prisma.message.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Messages and only return the `id`
     * const messageWithIdOnly = await prisma.message.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MessageCreateManyAndReturnArgs>(args?: SelectSubset<T, MessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Message.
     * @param {MessageDeleteArgs} args - Arguments to delete one Message.
     * @example
     * // Delete one Message
     * const Message = await prisma.message.delete({
     *   where: {
     *     // ... filter to delete one Message
     *   }
     * })
     * 
     */
    delete<T extends MessageDeleteArgs>(args: SelectSubset<T, MessageDeleteArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Message.
     * @param {MessageUpdateArgs} args - Arguments to update one Message.
     * @example
     * // Update one Message
     * const message = await prisma.message.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MessageUpdateArgs>(args: SelectSubset<T, MessageUpdateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Messages.
     * @param {MessageDeleteManyArgs} args - Arguments to filter Messages to delete.
     * @example
     * // Delete a few Messages
     * const { count } = await prisma.message.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MessageDeleteManyArgs>(args?: SelectSubset<T, MessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Messages
     * const message = await prisma.message.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MessageUpdateManyArgs>(args: SelectSubset<T, MessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Message.
     * @param {MessageUpsertArgs} args - Arguments to update or create a Message.
     * @example
     * // Update or create a Message
     * const message = await prisma.message.upsert({
     *   create: {
     *     // ... data to create a Message
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Message we want to update
     *   }
     * })
     */
    upsert<T extends MessageUpsertArgs>(args: SelectSubset<T, MessageUpsertArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageCountArgs} args - Arguments to filter Messages to count.
     * @example
     * // Count the number of Messages
     * const count = await prisma.message.count({
     *   where: {
     *     // ... the filter for the Messages we want to count
     *   }
     * })
    **/
    count<T extends MessageCountArgs>(
      args?: Subset<T, MessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MessageAggregateArgs>(args: Subset<T, MessageAggregateArgs>): Prisma.PrismaPromise<GetMessageAggregateType<T>>

    /**
     * Group by Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MessageGroupByArgs['orderBy'] }
        : { orderBy?: MessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Message model
   */
  readonly fields: MessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Message.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    dialog<T extends DialogDefaultArgs<ExtArgs> = {}>(args?: Subset<T, DialogDefaultArgs<ExtArgs>>): Prisma__DialogClient<$Result.GetResult<Prisma.$DialogPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Message model
   */ 
  interface MessageFieldRefs {
    readonly id: FieldRef<"Message", 'String'>
    readonly dialogId: FieldRef<"Message", 'String'>
    readonly role: FieldRef<"Message", 'Role'>
    readonly content: FieldRef<"Message", 'String'>
    readonly sequenceNumber: FieldRef<"Message", 'Int'>
    readonly metadata: FieldRef<"Message", 'Json'>
    readonly createdAt: FieldRef<"Message", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Message findUnique
   */
  export type MessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findUniqueOrThrow
   */
  export type MessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findFirst
   */
  export type MessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findFirstOrThrow
   */
  export type MessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findMany
   */
  export type MessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Messages to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message create
   */
  export type MessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to create a Message.
     */
    data: XOR<MessageCreateInput, MessageUncheckedCreateInput>
  }

  /**
   * Message createMany
   */
  export type MessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Messages.
     */
    data: MessageCreateManyInput | MessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Message createManyAndReturn
   */
  export type MessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Messages.
     */
    data: MessageCreateManyInput | MessageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Message update
   */
  export type MessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to update a Message.
     */
    data: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
    /**
     * Choose, which Message to update.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message updateMany
   */
  export type MessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Messages.
     */
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyInput>
    /**
     * Filter which Messages to update
     */
    where?: MessageWhereInput
  }

  /**
   * Message upsert
   */
  export type MessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The filter to search for the Message to update in case it exists.
     */
    where: MessageWhereUniqueInput
    /**
     * In case the Message found by the `where` argument doesn't exist, create a new Message with this data.
     */
    create: XOR<MessageCreateInput, MessageUncheckedCreateInput>
    /**
     * In case the Message was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
  }

  /**
   * Message delete
   */
  export type MessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter which Message to delete.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message deleteMany
   */
  export type MessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Messages to delete
     */
    where?: MessageWhereInput
  }

  /**
   * Message without action
   */
  export type MessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
  }


  /**
   * Model DialogState
   */

  export type AggregateDialogState = {
    _count: DialogStateCountAggregateOutputType | null
    _avg: DialogStateAvgAggregateOutputType | null
    _sum: DialogStateSumAggregateOutputType | null
    _min: DialogStateMinAggregateOutputType | null
    _max: DialogStateMaxAggregateOutputType | null
  }

  export type DialogStateAvgAggregateOutputType = {
    continuationScore: number | null
    tokensUsed: number | null
    goalProgress: number | null
  }

  export type DialogStateSumAggregateOutputType = {
    continuationScore: number | null
    tokensUsed: number | null
    goalProgress: number | null
  }

  export type DialogStateMinAggregateOutputType = {
    id: string | null
    dialogId: string | null
    continuationScore: number | null
    compressedContext: string | null
    currentStrategy: string | null
    tokensUsed: number | null
    goalProgress: number | null
    createdAt: Date | null
  }

  export type DialogStateMaxAggregateOutputType = {
    id: string | null
    dialogId: string | null
    continuationScore: number | null
    compressedContext: string | null
    currentStrategy: string | null
    tokensUsed: number | null
    goalProgress: number | null
    createdAt: Date | null
  }

  export type DialogStateCountAggregateOutputType = {
    id: number
    dialogId: number
    continuationScore: number
    compressedContext: number
    currentStrategy: number
    tokensUsed: number
    goalProgress: number
    issuesDetected: number
    createdAt: number
    _all: number
  }


  export type DialogStateAvgAggregateInputType = {
    continuationScore?: true
    tokensUsed?: true
    goalProgress?: true
  }

  export type DialogStateSumAggregateInputType = {
    continuationScore?: true
    tokensUsed?: true
    goalProgress?: true
  }

  export type DialogStateMinAggregateInputType = {
    id?: true
    dialogId?: true
    continuationScore?: true
    compressedContext?: true
    currentStrategy?: true
    tokensUsed?: true
    goalProgress?: true
    createdAt?: true
  }

  export type DialogStateMaxAggregateInputType = {
    id?: true
    dialogId?: true
    continuationScore?: true
    compressedContext?: true
    currentStrategy?: true
    tokensUsed?: true
    goalProgress?: true
    createdAt?: true
  }

  export type DialogStateCountAggregateInputType = {
    id?: true
    dialogId?: true
    continuationScore?: true
    compressedContext?: true
    currentStrategy?: true
    tokensUsed?: true
    goalProgress?: true
    issuesDetected?: true
    createdAt?: true
    _all?: true
  }

  export type DialogStateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DialogState to aggregate.
     */
    where?: DialogStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DialogStates to fetch.
     */
    orderBy?: DialogStateOrderByWithRelationInput | DialogStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DialogStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DialogStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DialogStates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned DialogStates
    **/
    _count?: true | DialogStateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DialogStateAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DialogStateSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DialogStateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DialogStateMaxAggregateInputType
  }

  export type GetDialogStateAggregateType<T extends DialogStateAggregateArgs> = {
        [P in keyof T & keyof AggregateDialogState]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDialogState[P]>
      : GetScalarType<T[P], AggregateDialogState[P]>
  }




  export type DialogStateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DialogStateWhereInput
    orderBy?: DialogStateOrderByWithAggregationInput | DialogStateOrderByWithAggregationInput[]
    by: DialogStateScalarFieldEnum[] | DialogStateScalarFieldEnum
    having?: DialogStateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DialogStateCountAggregateInputType | true
    _avg?: DialogStateAvgAggregateInputType
    _sum?: DialogStateSumAggregateInputType
    _min?: DialogStateMinAggregateInputType
    _max?: DialogStateMaxAggregateInputType
  }

  export type DialogStateGroupByOutputType = {
    id: string
    dialogId: string
    continuationScore: number
    compressedContext: string | null
    currentStrategy: string
    tokensUsed: number
    goalProgress: number
    issuesDetected: JsonValue | null
    createdAt: Date
    _count: DialogStateCountAggregateOutputType | null
    _avg: DialogStateAvgAggregateOutputType | null
    _sum: DialogStateSumAggregateOutputType | null
    _min: DialogStateMinAggregateOutputType | null
    _max: DialogStateMaxAggregateOutputType | null
  }

  type GetDialogStateGroupByPayload<T extends DialogStateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DialogStateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DialogStateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DialogStateGroupByOutputType[P]>
            : GetScalarType<T[P], DialogStateGroupByOutputType[P]>
        }
      >
    >


  export type DialogStateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dialogId?: boolean
    continuationScore?: boolean
    compressedContext?: boolean
    currentStrategy?: boolean
    tokensUsed?: boolean
    goalProgress?: boolean
    issuesDetected?: boolean
    createdAt?: boolean
    dialog?: boolean | DialogDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["dialogState"]>

  export type DialogStateSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dialogId?: boolean
    continuationScore?: boolean
    compressedContext?: boolean
    currentStrategy?: boolean
    tokensUsed?: boolean
    goalProgress?: boolean
    issuesDetected?: boolean
    createdAt?: boolean
    dialog?: boolean | DialogDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["dialogState"]>

  export type DialogStateSelectScalar = {
    id?: boolean
    dialogId?: boolean
    continuationScore?: boolean
    compressedContext?: boolean
    currentStrategy?: boolean
    tokensUsed?: boolean
    goalProgress?: boolean
    issuesDetected?: boolean
    createdAt?: boolean
  }

  export type DialogStateInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    dialog?: boolean | DialogDefaultArgs<ExtArgs>
  }
  export type DialogStateIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    dialog?: boolean | DialogDefaultArgs<ExtArgs>
  }

  export type $DialogStatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "DialogState"
    objects: {
      dialog: Prisma.$DialogPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      dialogId: string
      continuationScore: number
      compressedContext: string | null
      currentStrategy: string
      tokensUsed: number
      goalProgress: number
      issuesDetected: Prisma.JsonValue | null
      createdAt: Date
    }, ExtArgs["result"]["dialogState"]>
    composites: {}
  }

  type DialogStateGetPayload<S extends boolean | null | undefined | DialogStateDefaultArgs> = $Result.GetResult<Prisma.$DialogStatePayload, S>

  type DialogStateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<DialogStateFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: DialogStateCountAggregateInputType | true
    }

  export interface DialogStateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['DialogState'], meta: { name: 'DialogState' } }
    /**
     * Find zero or one DialogState that matches the filter.
     * @param {DialogStateFindUniqueArgs} args - Arguments to find a DialogState
     * @example
     * // Get one DialogState
     * const dialogState = await prisma.dialogState.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DialogStateFindUniqueArgs>(args: SelectSubset<T, DialogStateFindUniqueArgs<ExtArgs>>): Prisma__DialogStateClient<$Result.GetResult<Prisma.$DialogStatePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one DialogState that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {DialogStateFindUniqueOrThrowArgs} args - Arguments to find a DialogState
     * @example
     * // Get one DialogState
     * const dialogState = await prisma.dialogState.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DialogStateFindUniqueOrThrowArgs>(args: SelectSubset<T, DialogStateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DialogStateClient<$Result.GetResult<Prisma.$DialogStatePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first DialogState that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DialogStateFindFirstArgs} args - Arguments to find a DialogState
     * @example
     * // Get one DialogState
     * const dialogState = await prisma.dialogState.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DialogStateFindFirstArgs>(args?: SelectSubset<T, DialogStateFindFirstArgs<ExtArgs>>): Prisma__DialogStateClient<$Result.GetResult<Prisma.$DialogStatePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first DialogState that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DialogStateFindFirstOrThrowArgs} args - Arguments to find a DialogState
     * @example
     * // Get one DialogState
     * const dialogState = await prisma.dialogState.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DialogStateFindFirstOrThrowArgs>(args?: SelectSubset<T, DialogStateFindFirstOrThrowArgs<ExtArgs>>): Prisma__DialogStateClient<$Result.GetResult<Prisma.$DialogStatePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more DialogStates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DialogStateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all DialogStates
     * const dialogStates = await prisma.dialogState.findMany()
     * 
     * // Get first 10 DialogStates
     * const dialogStates = await prisma.dialogState.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const dialogStateWithIdOnly = await prisma.dialogState.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DialogStateFindManyArgs>(args?: SelectSubset<T, DialogStateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DialogStatePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a DialogState.
     * @param {DialogStateCreateArgs} args - Arguments to create a DialogState.
     * @example
     * // Create one DialogState
     * const DialogState = await prisma.dialogState.create({
     *   data: {
     *     // ... data to create a DialogState
     *   }
     * })
     * 
     */
    create<T extends DialogStateCreateArgs>(args: SelectSubset<T, DialogStateCreateArgs<ExtArgs>>): Prisma__DialogStateClient<$Result.GetResult<Prisma.$DialogStatePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many DialogStates.
     * @param {DialogStateCreateManyArgs} args - Arguments to create many DialogStates.
     * @example
     * // Create many DialogStates
     * const dialogState = await prisma.dialogState.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DialogStateCreateManyArgs>(args?: SelectSubset<T, DialogStateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many DialogStates and returns the data saved in the database.
     * @param {DialogStateCreateManyAndReturnArgs} args - Arguments to create many DialogStates.
     * @example
     * // Create many DialogStates
     * const dialogState = await prisma.dialogState.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many DialogStates and only return the `id`
     * const dialogStateWithIdOnly = await prisma.dialogState.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DialogStateCreateManyAndReturnArgs>(args?: SelectSubset<T, DialogStateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DialogStatePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a DialogState.
     * @param {DialogStateDeleteArgs} args - Arguments to delete one DialogState.
     * @example
     * // Delete one DialogState
     * const DialogState = await prisma.dialogState.delete({
     *   where: {
     *     // ... filter to delete one DialogState
     *   }
     * })
     * 
     */
    delete<T extends DialogStateDeleteArgs>(args: SelectSubset<T, DialogStateDeleteArgs<ExtArgs>>): Prisma__DialogStateClient<$Result.GetResult<Prisma.$DialogStatePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one DialogState.
     * @param {DialogStateUpdateArgs} args - Arguments to update one DialogState.
     * @example
     * // Update one DialogState
     * const dialogState = await prisma.dialogState.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DialogStateUpdateArgs>(args: SelectSubset<T, DialogStateUpdateArgs<ExtArgs>>): Prisma__DialogStateClient<$Result.GetResult<Prisma.$DialogStatePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more DialogStates.
     * @param {DialogStateDeleteManyArgs} args - Arguments to filter DialogStates to delete.
     * @example
     * // Delete a few DialogStates
     * const { count } = await prisma.dialogState.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DialogStateDeleteManyArgs>(args?: SelectSubset<T, DialogStateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DialogStates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DialogStateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many DialogStates
     * const dialogState = await prisma.dialogState.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DialogStateUpdateManyArgs>(args: SelectSubset<T, DialogStateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one DialogState.
     * @param {DialogStateUpsertArgs} args - Arguments to update or create a DialogState.
     * @example
     * // Update or create a DialogState
     * const dialogState = await prisma.dialogState.upsert({
     *   create: {
     *     // ... data to create a DialogState
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the DialogState we want to update
     *   }
     * })
     */
    upsert<T extends DialogStateUpsertArgs>(args: SelectSubset<T, DialogStateUpsertArgs<ExtArgs>>): Prisma__DialogStateClient<$Result.GetResult<Prisma.$DialogStatePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of DialogStates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DialogStateCountArgs} args - Arguments to filter DialogStates to count.
     * @example
     * // Count the number of DialogStates
     * const count = await prisma.dialogState.count({
     *   where: {
     *     // ... the filter for the DialogStates we want to count
     *   }
     * })
    **/
    count<T extends DialogStateCountArgs>(
      args?: Subset<T, DialogStateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DialogStateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a DialogState.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DialogStateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DialogStateAggregateArgs>(args: Subset<T, DialogStateAggregateArgs>): Prisma.PrismaPromise<GetDialogStateAggregateType<T>>

    /**
     * Group by DialogState.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DialogStateGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DialogStateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DialogStateGroupByArgs['orderBy'] }
        : { orderBy?: DialogStateGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DialogStateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDialogStateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the DialogState model
   */
  readonly fields: DialogStateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for DialogState.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DialogStateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    dialog<T extends DialogDefaultArgs<ExtArgs> = {}>(args?: Subset<T, DialogDefaultArgs<ExtArgs>>): Prisma__DialogClient<$Result.GetResult<Prisma.$DialogPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the DialogState model
   */ 
  interface DialogStateFieldRefs {
    readonly id: FieldRef<"DialogState", 'String'>
    readonly dialogId: FieldRef<"DialogState", 'String'>
    readonly continuationScore: FieldRef<"DialogState", 'Float'>
    readonly compressedContext: FieldRef<"DialogState", 'String'>
    readonly currentStrategy: FieldRef<"DialogState", 'String'>
    readonly tokensUsed: FieldRef<"DialogState", 'Int'>
    readonly goalProgress: FieldRef<"DialogState", 'Float'>
    readonly issuesDetected: FieldRef<"DialogState", 'Json'>
    readonly createdAt: FieldRef<"DialogState", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * DialogState findUnique
   */
  export type DialogStateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DialogState
     */
    select?: DialogStateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogStateInclude<ExtArgs> | null
    /**
     * Filter, which DialogState to fetch.
     */
    where: DialogStateWhereUniqueInput
  }

  /**
   * DialogState findUniqueOrThrow
   */
  export type DialogStateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DialogState
     */
    select?: DialogStateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogStateInclude<ExtArgs> | null
    /**
     * Filter, which DialogState to fetch.
     */
    where: DialogStateWhereUniqueInput
  }

  /**
   * DialogState findFirst
   */
  export type DialogStateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DialogState
     */
    select?: DialogStateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogStateInclude<ExtArgs> | null
    /**
     * Filter, which DialogState to fetch.
     */
    where?: DialogStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DialogStates to fetch.
     */
    orderBy?: DialogStateOrderByWithRelationInput | DialogStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DialogStates.
     */
    cursor?: DialogStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DialogStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DialogStates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DialogStates.
     */
    distinct?: DialogStateScalarFieldEnum | DialogStateScalarFieldEnum[]
  }

  /**
   * DialogState findFirstOrThrow
   */
  export type DialogStateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DialogState
     */
    select?: DialogStateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogStateInclude<ExtArgs> | null
    /**
     * Filter, which DialogState to fetch.
     */
    where?: DialogStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DialogStates to fetch.
     */
    orderBy?: DialogStateOrderByWithRelationInput | DialogStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DialogStates.
     */
    cursor?: DialogStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DialogStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DialogStates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DialogStates.
     */
    distinct?: DialogStateScalarFieldEnum | DialogStateScalarFieldEnum[]
  }

  /**
   * DialogState findMany
   */
  export type DialogStateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DialogState
     */
    select?: DialogStateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogStateInclude<ExtArgs> | null
    /**
     * Filter, which DialogStates to fetch.
     */
    where?: DialogStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DialogStates to fetch.
     */
    orderBy?: DialogStateOrderByWithRelationInput | DialogStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing DialogStates.
     */
    cursor?: DialogStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DialogStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DialogStates.
     */
    skip?: number
    distinct?: DialogStateScalarFieldEnum | DialogStateScalarFieldEnum[]
  }

  /**
   * DialogState create
   */
  export type DialogStateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DialogState
     */
    select?: DialogStateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogStateInclude<ExtArgs> | null
    /**
     * The data needed to create a DialogState.
     */
    data: XOR<DialogStateCreateInput, DialogStateUncheckedCreateInput>
  }

  /**
   * DialogState createMany
   */
  export type DialogStateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many DialogStates.
     */
    data: DialogStateCreateManyInput | DialogStateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * DialogState createManyAndReturn
   */
  export type DialogStateCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DialogState
     */
    select?: DialogStateSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many DialogStates.
     */
    data: DialogStateCreateManyInput | DialogStateCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogStateIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * DialogState update
   */
  export type DialogStateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DialogState
     */
    select?: DialogStateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogStateInclude<ExtArgs> | null
    /**
     * The data needed to update a DialogState.
     */
    data: XOR<DialogStateUpdateInput, DialogStateUncheckedUpdateInput>
    /**
     * Choose, which DialogState to update.
     */
    where: DialogStateWhereUniqueInput
  }

  /**
   * DialogState updateMany
   */
  export type DialogStateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update DialogStates.
     */
    data: XOR<DialogStateUpdateManyMutationInput, DialogStateUncheckedUpdateManyInput>
    /**
     * Filter which DialogStates to update
     */
    where?: DialogStateWhereInput
  }

  /**
   * DialogState upsert
   */
  export type DialogStateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DialogState
     */
    select?: DialogStateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogStateInclude<ExtArgs> | null
    /**
     * The filter to search for the DialogState to update in case it exists.
     */
    where: DialogStateWhereUniqueInput
    /**
     * In case the DialogState found by the `where` argument doesn't exist, create a new DialogState with this data.
     */
    create: XOR<DialogStateCreateInput, DialogStateUncheckedCreateInput>
    /**
     * In case the DialogState was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DialogStateUpdateInput, DialogStateUncheckedUpdateInput>
  }

  /**
   * DialogState delete
   */
  export type DialogStateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DialogState
     */
    select?: DialogStateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogStateInclude<ExtArgs> | null
    /**
     * Filter which DialogState to delete.
     */
    where: DialogStateWhereUniqueInput
  }

  /**
   * DialogState deleteMany
   */
  export type DialogStateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DialogStates to delete
     */
    where?: DialogStateWhereInput
  }

  /**
   * DialogState without action
   */
  export type DialogStateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DialogState
     */
    select?: DialogStateSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogStateInclude<ExtArgs> | null
  }


  /**
   * Model Log
   */

  export type AggregateLog = {
    _count: LogCountAggregateOutputType | null
    _avg: LogAvgAggregateOutputType | null
    _sum: LogSumAggregateOutputType | null
    _min: LogMinAggregateOutputType | null
    _max: LogMaxAggregateOutputType | null
  }

  export type LogAvgAggregateOutputType = {
    id: number | null
  }

  export type LogSumAggregateOutputType = {
    id: number | null
  }

  export type LogMinAggregateOutputType = {
    id: number | null
    dialogId: string | null
    messageId: string | null
    botId: string | null
    userId: string | null
    level: $Enums.LogLevel | null
    text: string | null
    datetime: Date | null
  }

  export type LogMaxAggregateOutputType = {
    id: number | null
    dialogId: string | null
    messageId: string | null
    botId: string | null
    userId: string | null
    level: $Enums.LogLevel | null
    text: string | null
    datetime: Date | null
  }

  export type LogCountAggregateOutputType = {
    id: number
    dialogId: number
    messageId: number
    botId: number
    userId: number
    level: number
    data: number
    text: number
    fullJson: number
    datetime: number
    _all: number
  }


  export type LogAvgAggregateInputType = {
    id?: true
  }

  export type LogSumAggregateInputType = {
    id?: true
  }

  export type LogMinAggregateInputType = {
    id?: true
    dialogId?: true
    messageId?: true
    botId?: true
    userId?: true
    level?: true
    text?: true
    datetime?: true
  }

  export type LogMaxAggregateInputType = {
    id?: true
    dialogId?: true
    messageId?: true
    botId?: true
    userId?: true
    level?: true
    text?: true
    datetime?: true
  }

  export type LogCountAggregateInputType = {
    id?: true
    dialogId?: true
    messageId?: true
    botId?: true
    userId?: true
    level?: true
    data?: true
    text?: true
    fullJson?: true
    datetime?: true
    _all?: true
  }

  export type LogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Log to aggregate.
     */
    where?: LogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Logs to fetch.
     */
    orderBy?: LogOrderByWithRelationInput | LogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Logs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Logs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Logs
    **/
    _count?: true | LogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LogMaxAggregateInputType
  }

  export type GetLogAggregateType<T extends LogAggregateArgs> = {
        [P in keyof T & keyof AggregateLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLog[P]>
      : GetScalarType<T[P], AggregateLog[P]>
  }




  export type LogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LogWhereInput
    orderBy?: LogOrderByWithAggregationInput | LogOrderByWithAggregationInput[]
    by: LogScalarFieldEnum[] | LogScalarFieldEnum
    having?: LogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LogCountAggregateInputType | true
    _avg?: LogAvgAggregateInputType
    _sum?: LogSumAggregateInputType
    _min?: LogMinAggregateInputType
    _max?: LogMaxAggregateInputType
  }

  export type LogGroupByOutputType = {
    id: number
    dialogId: string | null
    messageId: string | null
    botId: string | null
    userId: string | null
    level: $Enums.LogLevel
    data: JsonValue | null
    text: string | null
    fullJson: JsonValue | null
    datetime: Date
    _count: LogCountAggregateOutputType | null
    _avg: LogAvgAggregateOutputType | null
    _sum: LogSumAggregateOutputType | null
    _min: LogMinAggregateOutputType | null
    _max: LogMaxAggregateOutputType | null
  }

  type GetLogGroupByPayload<T extends LogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LogGroupByOutputType[P]>
            : GetScalarType<T[P], LogGroupByOutputType[P]>
        }
      >
    >


  export type LogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dialogId?: boolean
    messageId?: boolean
    botId?: boolean
    userId?: boolean
    level?: boolean
    data?: boolean
    text?: boolean
    fullJson?: boolean
    datetime?: boolean
    dialog?: boolean | Log$dialogArgs<ExtArgs>
  }, ExtArgs["result"]["log"]>

  export type LogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dialogId?: boolean
    messageId?: boolean
    botId?: boolean
    userId?: boolean
    level?: boolean
    data?: boolean
    text?: boolean
    fullJson?: boolean
    datetime?: boolean
    dialog?: boolean | Log$dialogArgs<ExtArgs>
  }, ExtArgs["result"]["log"]>

  export type LogSelectScalar = {
    id?: boolean
    dialogId?: boolean
    messageId?: boolean
    botId?: boolean
    userId?: boolean
    level?: boolean
    data?: boolean
    text?: boolean
    fullJson?: boolean
    datetime?: boolean
  }

  export type LogInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    dialog?: boolean | Log$dialogArgs<ExtArgs>
  }
  export type LogIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    dialog?: boolean | Log$dialogArgs<ExtArgs>
  }

  export type $LogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Log"
    objects: {
      dialog: Prisma.$DialogPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      dialogId: string | null
      messageId: string | null
      botId: string | null
      userId: string | null
      level: $Enums.LogLevel
      data: Prisma.JsonValue | null
      text: string | null
      fullJson: Prisma.JsonValue | null
      datetime: Date
    }, ExtArgs["result"]["log"]>
    composites: {}
  }

  type LogGetPayload<S extends boolean | null | undefined | LogDefaultArgs> = $Result.GetResult<Prisma.$LogPayload, S>

  type LogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<LogFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: LogCountAggregateInputType | true
    }

  export interface LogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Log'], meta: { name: 'Log' } }
    /**
     * Find zero or one Log that matches the filter.
     * @param {LogFindUniqueArgs} args - Arguments to find a Log
     * @example
     * // Get one Log
     * const log = await prisma.log.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LogFindUniqueArgs>(args: SelectSubset<T, LogFindUniqueArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Log that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {LogFindUniqueOrThrowArgs} args - Arguments to find a Log
     * @example
     * // Get one Log
     * const log = await prisma.log.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LogFindUniqueOrThrowArgs>(args: SelectSubset<T, LogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Log that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogFindFirstArgs} args - Arguments to find a Log
     * @example
     * // Get one Log
     * const log = await prisma.log.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LogFindFirstArgs>(args?: SelectSubset<T, LogFindFirstArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Log that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogFindFirstOrThrowArgs} args - Arguments to find a Log
     * @example
     * // Get one Log
     * const log = await prisma.log.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LogFindFirstOrThrowArgs>(args?: SelectSubset<T, LogFindFirstOrThrowArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Logs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Logs
     * const logs = await prisma.log.findMany()
     * 
     * // Get first 10 Logs
     * const logs = await prisma.log.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const logWithIdOnly = await prisma.log.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LogFindManyArgs>(args?: SelectSubset<T, LogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Log.
     * @param {LogCreateArgs} args - Arguments to create a Log.
     * @example
     * // Create one Log
     * const Log = await prisma.log.create({
     *   data: {
     *     // ... data to create a Log
     *   }
     * })
     * 
     */
    create<T extends LogCreateArgs>(args: SelectSubset<T, LogCreateArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Logs.
     * @param {LogCreateManyArgs} args - Arguments to create many Logs.
     * @example
     * // Create many Logs
     * const log = await prisma.log.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LogCreateManyArgs>(args?: SelectSubset<T, LogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Logs and returns the data saved in the database.
     * @param {LogCreateManyAndReturnArgs} args - Arguments to create many Logs.
     * @example
     * // Create many Logs
     * const log = await prisma.log.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Logs and only return the `id`
     * const logWithIdOnly = await prisma.log.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LogCreateManyAndReturnArgs>(args?: SelectSubset<T, LogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Log.
     * @param {LogDeleteArgs} args - Arguments to delete one Log.
     * @example
     * // Delete one Log
     * const Log = await prisma.log.delete({
     *   where: {
     *     // ... filter to delete one Log
     *   }
     * })
     * 
     */
    delete<T extends LogDeleteArgs>(args: SelectSubset<T, LogDeleteArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Log.
     * @param {LogUpdateArgs} args - Arguments to update one Log.
     * @example
     * // Update one Log
     * const log = await prisma.log.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LogUpdateArgs>(args: SelectSubset<T, LogUpdateArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Logs.
     * @param {LogDeleteManyArgs} args - Arguments to filter Logs to delete.
     * @example
     * // Delete a few Logs
     * const { count } = await prisma.log.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LogDeleteManyArgs>(args?: SelectSubset<T, LogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Logs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Logs
     * const log = await prisma.log.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LogUpdateManyArgs>(args: SelectSubset<T, LogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Log.
     * @param {LogUpsertArgs} args - Arguments to update or create a Log.
     * @example
     * // Update or create a Log
     * const log = await prisma.log.upsert({
     *   create: {
     *     // ... data to create a Log
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Log we want to update
     *   }
     * })
     */
    upsert<T extends LogUpsertArgs>(args: SelectSubset<T, LogUpsertArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Logs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogCountArgs} args - Arguments to filter Logs to count.
     * @example
     * // Count the number of Logs
     * const count = await prisma.log.count({
     *   where: {
     *     // ... the filter for the Logs we want to count
     *   }
     * })
    **/
    count<T extends LogCountArgs>(
      args?: Subset<T, LogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Log.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LogAggregateArgs>(args: Subset<T, LogAggregateArgs>): Prisma.PrismaPromise<GetLogAggregateType<T>>

    /**
     * Group by Log.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LogGroupByArgs['orderBy'] }
        : { orderBy?: LogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Log model
   */
  readonly fields: LogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Log.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    dialog<T extends Log$dialogArgs<ExtArgs> = {}>(args?: Subset<T, Log$dialogArgs<ExtArgs>>): Prisma__DialogClient<$Result.GetResult<Prisma.$DialogPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Log model
   */ 
  interface LogFieldRefs {
    readonly id: FieldRef<"Log", 'Int'>
    readonly dialogId: FieldRef<"Log", 'String'>
    readonly messageId: FieldRef<"Log", 'String'>
    readonly botId: FieldRef<"Log", 'String'>
    readonly userId: FieldRef<"Log", 'String'>
    readonly level: FieldRef<"Log", 'LogLevel'>
    readonly data: FieldRef<"Log", 'Json'>
    readonly text: FieldRef<"Log", 'String'>
    readonly fullJson: FieldRef<"Log", 'Json'>
    readonly datetime: FieldRef<"Log", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Log findUnique
   */
  export type LogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * Filter, which Log to fetch.
     */
    where: LogWhereUniqueInput
  }

  /**
   * Log findUniqueOrThrow
   */
  export type LogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * Filter, which Log to fetch.
     */
    where: LogWhereUniqueInput
  }

  /**
   * Log findFirst
   */
  export type LogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * Filter, which Log to fetch.
     */
    where?: LogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Logs to fetch.
     */
    orderBy?: LogOrderByWithRelationInput | LogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Logs.
     */
    cursor?: LogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Logs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Logs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Logs.
     */
    distinct?: LogScalarFieldEnum | LogScalarFieldEnum[]
  }

  /**
   * Log findFirstOrThrow
   */
  export type LogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * Filter, which Log to fetch.
     */
    where?: LogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Logs to fetch.
     */
    orderBy?: LogOrderByWithRelationInput | LogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Logs.
     */
    cursor?: LogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Logs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Logs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Logs.
     */
    distinct?: LogScalarFieldEnum | LogScalarFieldEnum[]
  }

  /**
   * Log findMany
   */
  export type LogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * Filter, which Logs to fetch.
     */
    where?: LogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Logs to fetch.
     */
    orderBy?: LogOrderByWithRelationInput | LogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Logs.
     */
    cursor?: LogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Logs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Logs.
     */
    skip?: number
    distinct?: LogScalarFieldEnum | LogScalarFieldEnum[]
  }

  /**
   * Log create
   */
  export type LogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * The data needed to create a Log.
     */
    data: XOR<LogCreateInput, LogUncheckedCreateInput>
  }

  /**
   * Log createMany
   */
  export type LogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Logs.
     */
    data: LogCreateManyInput | LogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Log createManyAndReturn
   */
  export type LogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Logs.
     */
    data: LogCreateManyInput | LogCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Log update
   */
  export type LogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * The data needed to update a Log.
     */
    data: XOR<LogUpdateInput, LogUncheckedUpdateInput>
    /**
     * Choose, which Log to update.
     */
    where: LogWhereUniqueInput
  }

  /**
   * Log updateMany
   */
  export type LogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Logs.
     */
    data: XOR<LogUpdateManyMutationInput, LogUncheckedUpdateManyInput>
    /**
     * Filter which Logs to update
     */
    where?: LogWhereInput
  }

  /**
   * Log upsert
   */
  export type LogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * The filter to search for the Log to update in case it exists.
     */
    where: LogWhereUniqueInput
    /**
     * In case the Log found by the `where` argument doesn't exist, create a new Log with this data.
     */
    create: XOR<LogCreateInput, LogUncheckedCreateInput>
    /**
     * In case the Log was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LogUpdateInput, LogUncheckedUpdateInput>
  }

  /**
   * Log delete
   */
  export type LogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * Filter which Log to delete.
     */
    where: LogWhereUniqueInput
  }

  /**
   * Log deleteMany
   */
  export type LogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Logs to delete
     */
    where?: LogWhereInput
  }

  /**
   * Log.dialog
   */
  export type Log$dialogArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dialog
     */
    select?: DialogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DialogInclude<ExtArgs> | null
    where?: DialogWhereInput
  }

  /**
   * Log without action
   */
  export type LogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const DialogScalarFieldEnum: {
    id: 'id',
    externalId: 'externalId',
    status: 'status',
    language: 'language',
    userInfo: 'userInfo',
    goal: 'goal',
    completionCriteria: 'completionCriteria',
    negotiationSettings: 'negotiationSettings',
    referenceContext: 'referenceContext',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type DialogScalarFieldEnum = (typeof DialogScalarFieldEnum)[keyof typeof DialogScalarFieldEnum]


  export const MessageScalarFieldEnum: {
    id: 'id',
    dialogId: 'dialogId',
    role: 'role',
    content: 'content',
    sequenceNumber: 'sequenceNumber',
    metadata: 'metadata',
    createdAt: 'createdAt'
  };

  export type MessageScalarFieldEnum = (typeof MessageScalarFieldEnum)[keyof typeof MessageScalarFieldEnum]


  export const DialogStateScalarFieldEnum: {
    id: 'id',
    dialogId: 'dialogId',
    continuationScore: 'continuationScore',
    compressedContext: 'compressedContext',
    currentStrategy: 'currentStrategy',
    tokensUsed: 'tokensUsed',
    goalProgress: 'goalProgress',
    issuesDetected: 'issuesDetected',
    createdAt: 'createdAt'
  };

  export type DialogStateScalarFieldEnum = (typeof DialogStateScalarFieldEnum)[keyof typeof DialogStateScalarFieldEnum]


  export const LogScalarFieldEnum: {
    id: 'id',
    dialogId: 'dialogId',
    messageId: 'messageId',
    botId: 'botId',
    userId: 'userId',
    level: 'level',
    data: 'data',
    text: 'text',
    fullJson: 'fullJson',
    datetime: 'datetime'
  };

  export type LogScalarFieldEnum = (typeof LogScalarFieldEnum)[keyof typeof LogScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DialogStatus'
   */
  export type EnumDialogStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DialogStatus'>
    


  /**
   * Reference to a field of type 'DialogStatus[]'
   */
  export type ListEnumDialogStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DialogStatus[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Role'
   */
  export type EnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role'>
    


  /**
   * Reference to a field of type 'Role[]'
   */
  export type ListEnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'LogLevel'
   */
  export type EnumLogLevelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LogLevel'>
    


  /**
   * Reference to a field of type 'LogLevel[]'
   */
  export type ListEnumLogLevelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LogLevel[]'>
    
  /**
   * Deep Input Types
   */


  export type DialogWhereInput = {
    AND?: DialogWhereInput | DialogWhereInput[]
    OR?: DialogWhereInput[]
    NOT?: DialogWhereInput | DialogWhereInput[]
    id?: StringFilter<"Dialog"> | string
    externalId?: StringFilter<"Dialog"> | string
    status?: EnumDialogStatusFilter<"Dialog"> | $Enums.DialogStatus
    language?: StringFilter<"Dialog"> | string
    userInfo?: JsonNullableFilter<"Dialog">
    goal?: StringFilter<"Dialog"> | string
    completionCriteria?: JsonFilter<"Dialog">
    negotiationSettings?: JsonNullableFilter<"Dialog">
    referenceContext?: StringNullableFilter<"Dialog"> | string | null
    createdAt?: DateTimeFilter<"Dialog"> | Date | string
    updatedAt?: DateTimeFilter<"Dialog"> | Date | string
    messages?: MessageListRelationFilter
    states?: DialogStateListRelationFilter
    logs?: LogListRelationFilter
  }

  export type DialogOrderByWithRelationInput = {
    id?: SortOrder
    externalId?: SortOrder
    status?: SortOrder
    language?: SortOrder
    userInfo?: SortOrderInput | SortOrder
    goal?: SortOrder
    completionCriteria?: SortOrder
    negotiationSettings?: SortOrderInput | SortOrder
    referenceContext?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    messages?: MessageOrderByRelationAggregateInput
    states?: DialogStateOrderByRelationAggregateInput
    logs?: LogOrderByRelationAggregateInput
  }

  export type DialogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    externalId?: string
    AND?: DialogWhereInput | DialogWhereInput[]
    OR?: DialogWhereInput[]
    NOT?: DialogWhereInput | DialogWhereInput[]
    status?: EnumDialogStatusFilter<"Dialog"> | $Enums.DialogStatus
    language?: StringFilter<"Dialog"> | string
    userInfo?: JsonNullableFilter<"Dialog">
    goal?: StringFilter<"Dialog"> | string
    completionCriteria?: JsonFilter<"Dialog">
    negotiationSettings?: JsonNullableFilter<"Dialog">
    referenceContext?: StringNullableFilter<"Dialog"> | string | null
    createdAt?: DateTimeFilter<"Dialog"> | Date | string
    updatedAt?: DateTimeFilter<"Dialog"> | Date | string
    messages?: MessageListRelationFilter
    states?: DialogStateListRelationFilter
    logs?: LogListRelationFilter
  }, "id" | "externalId">

  export type DialogOrderByWithAggregationInput = {
    id?: SortOrder
    externalId?: SortOrder
    status?: SortOrder
    language?: SortOrder
    userInfo?: SortOrderInput | SortOrder
    goal?: SortOrder
    completionCriteria?: SortOrder
    negotiationSettings?: SortOrderInput | SortOrder
    referenceContext?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: DialogCountOrderByAggregateInput
    _max?: DialogMaxOrderByAggregateInput
    _min?: DialogMinOrderByAggregateInput
  }

  export type DialogScalarWhereWithAggregatesInput = {
    AND?: DialogScalarWhereWithAggregatesInput | DialogScalarWhereWithAggregatesInput[]
    OR?: DialogScalarWhereWithAggregatesInput[]
    NOT?: DialogScalarWhereWithAggregatesInput | DialogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Dialog"> | string
    externalId?: StringWithAggregatesFilter<"Dialog"> | string
    status?: EnumDialogStatusWithAggregatesFilter<"Dialog"> | $Enums.DialogStatus
    language?: StringWithAggregatesFilter<"Dialog"> | string
    userInfo?: JsonNullableWithAggregatesFilter<"Dialog">
    goal?: StringWithAggregatesFilter<"Dialog"> | string
    completionCriteria?: JsonWithAggregatesFilter<"Dialog">
    negotiationSettings?: JsonNullableWithAggregatesFilter<"Dialog">
    referenceContext?: StringNullableWithAggregatesFilter<"Dialog"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Dialog"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Dialog"> | Date | string
  }

  export type MessageWhereInput = {
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    id?: StringFilter<"Message"> | string
    dialogId?: StringFilter<"Message"> | string
    role?: EnumRoleFilter<"Message"> | $Enums.Role
    content?: StringFilter<"Message"> | string
    sequenceNumber?: IntFilter<"Message"> | number
    metadata?: JsonNullableFilter<"Message">
    createdAt?: DateTimeFilter<"Message"> | Date | string
    dialog?: XOR<DialogRelationFilter, DialogWhereInput>
  }

  export type MessageOrderByWithRelationInput = {
    id?: SortOrder
    dialogId?: SortOrder
    role?: SortOrder
    content?: SortOrder
    sequenceNumber?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    dialog?: DialogOrderByWithRelationInput
  }

  export type MessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    dialogId?: StringFilter<"Message"> | string
    role?: EnumRoleFilter<"Message"> | $Enums.Role
    content?: StringFilter<"Message"> | string
    sequenceNumber?: IntFilter<"Message"> | number
    metadata?: JsonNullableFilter<"Message">
    createdAt?: DateTimeFilter<"Message"> | Date | string
    dialog?: XOR<DialogRelationFilter, DialogWhereInput>
  }, "id">

  export type MessageOrderByWithAggregationInput = {
    id?: SortOrder
    dialogId?: SortOrder
    role?: SortOrder
    content?: SortOrder
    sequenceNumber?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: MessageCountOrderByAggregateInput
    _avg?: MessageAvgOrderByAggregateInput
    _max?: MessageMaxOrderByAggregateInput
    _min?: MessageMinOrderByAggregateInput
    _sum?: MessageSumOrderByAggregateInput
  }

  export type MessageScalarWhereWithAggregatesInput = {
    AND?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    OR?: MessageScalarWhereWithAggregatesInput[]
    NOT?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Message"> | string
    dialogId?: StringWithAggregatesFilter<"Message"> | string
    role?: EnumRoleWithAggregatesFilter<"Message"> | $Enums.Role
    content?: StringWithAggregatesFilter<"Message"> | string
    sequenceNumber?: IntWithAggregatesFilter<"Message"> | number
    metadata?: JsonNullableWithAggregatesFilter<"Message">
    createdAt?: DateTimeWithAggregatesFilter<"Message"> | Date | string
  }

  export type DialogStateWhereInput = {
    AND?: DialogStateWhereInput | DialogStateWhereInput[]
    OR?: DialogStateWhereInput[]
    NOT?: DialogStateWhereInput | DialogStateWhereInput[]
    id?: StringFilter<"DialogState"> | string
    dialogId?: StringFilter<"DialogState"> | string
    continuationScore?: FloatFilter<"DialogState"> | number
    compressedContext?: StringNullableFilter<"DialogState"> | string | null
    currentStrategy?: StringFilter<"DialogState"> | string
    tokensUsed?: IntFilter<"DialogState"> | number
    goalProgress?: FloatFilter<"DialogState"> | number
    issuesDetected?: JsonNullableFilter<"DialogState">
    createdAt?: DateTimeFilter<"DialogState"> | Date | string
    dialog?: XOR<DialogRelationFilter, DialogWhereInput>
  }

  export type DialogStateOrderByWithRelationInput = {
    id?: SortOrder
    dialogId?: SortOrder
    continuationScore?: SortOrder
    compressedContext?: SortOrderInput | SortOrder
    currentStrategy?: SortOrder
    tokensUsed?: SortOrder
    goalProgress?: SortOrder
    issuesDetected?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    dialog?: DialogOrderByWithRelationInput
  }

  export type DialogStateWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: DialogStateWhereInput | DialogStateWhereInput[]
    OR?: DialogStateWhereInput[]
    NOT?: DialogStateWhereInput | DialogStateWhereInput[]
    dialogId?: StringFilter<"DialogState"> | string
    continuationScore?: FloatFilter<"DialogState"> | number
    compressedContext?: StringNullableFilter<"DialogState"> | string | null
    currentStrategy?: StringFilter<"DialogState"> | string
    tokensUsed?: IntFilter<"DialogState"> | number
    goalProgress?: FloatFilter<"DialogState"> | number
    issuesDetected?: JsonNullableFilter<"DialogState">
    createdAt?: DateTimeFilter<"DialogState"> | Date | string
    dialog?: XOR<DialogRelationFilter, DialogWhereInput>
  }, "id">

  export type DialogStateOrderByWithAggregationInput = {
    id?: SortOrder
    dialogId?: SortOrder
    continuationScore?: SortOrder
    compressedContext?: SortOrderInput | SortOrder
    currentStrategy?: SortOrder
    tokensUsed?: SortOrder
    goalProgress?: SortOrder
    issuesDetected?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: DialogStateCountOrderByAggregateInput
    _avg?: DialogStateAvgOrderByAggregateInput
    _max?: DialogStateMaxOrderByAggregateInput
    _min?: DialogStateMinOrderByAggregateInput
    _sum?: DialogStateSumOrderByAggregateInput
  }

  export type DialogStateScalarWhereWithAggregatesInput = {
    AND?: DialogStateScalarWhereWithAggregatesInput | DialogStateScalarWhereWithAggregatesInput[]
    OR?: DialogStateScalarWhereWithAggregatesInput[]
    NOT?: DialogStateScalarWhereWithAggregatesInput | DialogStateScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"DialogState"> | string
    dialogId?: StringWithAggregatesFilter<"DialogState"> | string
    continuationScore?: FloatWithAggregatesFilter<"DialogState"> | number
    compressedContext?: StringNullableWithAggregatesFilter<"DialogState"> | string | null
    currentStrategy?: StringWithAggregatesFilter<"DialogState"> | string
    tokensUsed?: IntWithAggregatesFilter<"DialogState"> | number
    goalProgress?: FloatWithAggregatesFilter<"DialogState"> | number
    issuesDetected?: JsonNullableWithAggregatesFilter<"DialogState">
    createdAt?: DateTimeWithAggregatesFilter<"DialogState"> | Date | string
  }

  export type LogWhereInput = {
    AND?: LogWhereInput | LogWhereInput[]
    OR?: LogWhereInput[]
    NOT?: LogWhereInput | LogWhereInput[]
    id?: IntFilter<"Log"> | number
    dialogId?: StringNullableFilter<"Log"> | string | null
    messageId?: StringNullableFilter<"Log"> | string | null
    botId?: StringNullableFilter<"Log"> | string | null
    userId?: StringNullableFilter<"Log"> | string | null
    level?: EnumLogLevelFilter<"Log"> | $Enums.LogLevel
    data?: JsonNullableFilter<"Log">
    text?: StringNullableFilter<"Log"> | string | null
    fullJson?: JsonNullableFilter<"Log">
    datetime?: DateTimeFilter<"Log"> | Date | string
    dialog?: XOR<DialogNullableRelationFilter, DialogWhereInput> | null
  }

  export type LogOrderByWithRelationInput = {
    id?: SortOrder
    dialogId?: SortOrderInput | SortOrder
    messageId?: SortOrderInput | SortOrder
    botId?: SortOrderInput | SortOrder
    userId?: SortOrderInput | SortOrder
    level?: SortOrder
    data?: SortOrderInput | SortOrder
    text?: SortOrderInput | SortOrder
    fullJson?: SortOrderInput | SortOrder
    datetime?: SortOrder
    dialog?: DialogOrderByWithRelationInput
  }

  export type LogWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: LogWhereInput | LogWhereInput[]
    OR?: LogWhereInput[]
    NOT?: LogWhereInput | LogWhereInput[]
    dialogId?: StringNullableFilter<"Log"> | string | null
    messageId?: StringNullableFilter<"Log"> | string | null
    botId?: StringNullableFilter<"Log"> | string | null
    userId?: StringNullableFilter<"Log"> | string | null
    level?: EnumLogLevelFilter<"Log"> | $Enums.LogLevel
    data?: JsonNullableFilter<"Log">
    text?: StringNullableFilter<"Log"> | string | null
    fullJson?: JsonNullableFilter<"Log">
    datetime?: DateTimeFilter<"Log"> | Date | string
    dialog?: XOR<DialogNullableRelationFilter, DialogWhereInput> | null
  }, "id">

  export type LogOrderByWithAggregationInput = {
    id?: SortOrder
    dialogId?: SortOrderInput | SortOrder
    messageId?: SortOrderInput | SortOrder
    botId?: SortOrderInput | SortOrder
    userId?: SortOrderInput | SortOrder
    level?: SortOrder
    data?: SortOrderInput | SortOrder
    text?: SortOrderInput | SortOrder
    fullJson?: SortOrderInput | SortOrder
    datetime?: SortOrder
    _count?: LogCountOrderByAggregateInput
    _avg?: LogAvgOrderByAggregateInput
    _max?: LogMaxOrderByAggregateInput
    _min?: LogMinOrderByAggregateInput
    _sum?: LogSumOrderByAggregateInput
  }

  export type LogScalarWhereWithAggregatesInput = {
    AND?: LogScalarWhereWithAggregatesInput | LogScalarWhereWithAggregatesInput[]
    OR?: LogScalarWhereWithAggregatesInput[]
    NOT?: LogScalarWhereWithAggregatesInput | LogScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Log"> | number
    dialogId?: StringNullableWithAggregatesFilter<"Log"> | string | null
    messageId?: StringNullableWithAggregatesFilter<"Log"> | string | null
    botId?: StringNullableWithAggregatesFilter<"Log"> | string | null
    userId?: StringNullableWithAggregatesFilter<"Log"> | string | null
    level?: EnumLogLevelWithAggregatesFilter<"Log"> | $Enums.LogLevel
    data?: JsonNullableWithAggregatesFilter<"Log">
    text?: StringNullableWithAggregatesFilter<"Log"> | string | null
    fullJson?: JsonNullableWithAggregatesFilter<"Log">
    datetime?: DateTimeWithAggregatesFilter<"Log"> | Date | string
  }

  export type DialogCreateInput = {
    id?: string
    externalId: string
    status?: $Enums.DialogStatus
    language: string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal: string
    completionCriteria: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: MessageCreateNestedManyWithoutDialogInput
    states?: DialogStateCreateNestedManyWithoutDialogInput
    logs?: LogCreateNestedManyWithoutDialogInput
  }

  export type DialogUncheckedCreateInput = {
    id?: string
    externalId: string
    status?: $Enums.DialogStatus
    language: string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal: string
    completionCriteria: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: MessageUncheckedCreateNestedManyWithoutDialogInput
    states?: DialogStateUncheckedCreateNestedManyWithoutDialogInput
    logs?: LogUncheckedCreateNestedManyWithoutDialogInput
  }

  export type DialogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    externalId?: StringFieldUpdateOperationsInput | string
    status?: EnumDialogStatusFieldUpdateOperationsInput | $Enums.DialogStatus
    language?: StringFieldUpdateOperationsInput | string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal?: StringFieldUpdateOperationsInput | string
    completionCriteria?: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: MessageUpdateManyWithoutDialogNestedInput
    states?: DialogStateUpdateManyWithoutDialogNestedInput
    logs?: LogUpdateManyWithoutDialogNestedInput
  }

  export type DialogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    externalId?: StringFieldUpdateOperationsInput | string
    status?: EnumDialogStatusFieldUpdateOperationsInput | $Enums.DialogStatus
    language?: StringFieldUpdateOperationsInput | string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal?: StringFieldUpdateOperationsInput | string
    completionCriteria?: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: MessageUncheckedUpdateManyWithoutDialogNestedInput
    states?: DialogStateUncheckedUpdateManyWithoutDialogNestedInput
    logs?: LogUncheckedUpdateManyWithoutDialogNestedInput
  }

  export type DialogCreateManyInput = {
    id?: string
    externalId: string
    status?: $Enums.DialogStatus
    language: string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal: string
    completionCriteria: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DialogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    externalId?: StringFieldUpdateOperationsInput | string
    status?: EnumDialogStatusFieldUpdateOperationsInput | $Enums.DialogStatus
    language?: StringFieldUpdateOperationsInput | string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal?: StringFieldUpdateOperationsInput | string
    completionCriteria?: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DialogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    externalId?: StringFieldUpdateOperationsInput | string
    status?: EnumDialogStatusFieldUpdateOperationsInput | $Enums.DialogStatus
    language?: StringFieldUpdateOperationsInput | string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal?: StringFieldUpdateOperationsInput | string
    completionCriteria?: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageCreateInput = {
    id?: string
    role: $Enums.Role
    content: string
    sequenceNumber: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    dialog: DialogCreateNestedOneWithoutMessagesInput
  }

  export type MessageUncheckedCreateInput = {
    id?: string
    dialogId: string
    role: $Enums.Role
    content: string
    sequenceNumber: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type MessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    content?: StringFieldUpdateOperationsInput | string
    sequenceNumber?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dialog?: DialogUpdateOneRequiredWithoutMessagesNestedInput
  }

  export type MessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    dialogId?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    content?: StringFieldUpdateOperationsInput | string
    sequenceNumber?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageCreateManyInput = {
    id?: string
    dialogId: string
    role: $Enums.Role
    content: string
    sequenceNumber: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type MessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    content?: StringFieldUpdateOperationsInput | string
    sequenceNumber?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    dialogId?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    content?: StringFieldUpdateOperationsInput | string
    sequenceNumber?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DialogStateCreateInput = {
    id?: string
    continuationScore: number
    compressedContext?: string | null
    currentStrategy: string
    tokensUsed: number
    goalProgress: number
    issuesDetected?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    dialog: DialogCreateNestedOneWithoutStatesInput
  }

  export type DialogStateUncheckedCreateInput = {
    id?: string
    dialogId: string
    continuationScore: number
    compressedContext?: string | null
    currentStrategy: string
    tokensUsed: number
    goalProgress: number
    issuesDetected?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type DialogStateUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    continuationScore?: FloatFieldUpdateOperationsInput | number
    compressedContext?: NullableStringFieldUpdateOperationsInput | string | null
    currentStrategy?: StringFieldUpdateOperationsInput | string
    tokensUsed?: IntFieldUpdateOperationsInput | number
    goalProgress?: FloatFieldUpdateOperationsInput | number
    issuesDetected?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dialog?: DialogUpdateOneRequiredWithoutStatesNestedInput
  }

  export type DialogStateUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    dialogId?: StringFieldUpdateOperationsInput | string
    continuationScore?: FloatFieldUpdateOperationsInput | number
    compressedContext?: NullableStringFieldUpdateOperationsInput | string | null
    currentStrategy?: StringFieldUpdateOperationsInput | string
    tokensUsed?: IntFieldUpdateOperationsInput | number
    goalProgress?: FloatFieldUpdateOperationsInput | number
    issuesDetected?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DialogStateCreateManyInput = {
    id?: string
    dialogId: string
    continuationScore: number
    compressedContext?: string | null
    currentStrategy: string
    tokensUsed: number
    goalProgress: number
    issuesDetected?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type DialogStateUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    continuationScore?: FloatFieldUpdateOperationsInput | number
    compressedContext?: NullableStringFieldUpdateOperationsInput | string | null
    currentStrategy?: StringFieldUpdateOperationsInput | string
    tokensUsed?: IntFieldUpdateOperationsInput | number
    goalProgress?: FloatFieldUpdateOperationsInput | number
    issuesDetected?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DialogStateUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    dialogId?: StringFieldUpdateOperationsInput | string
    continuationScore?: FloatFieldUpdateOperationsInput | number
    compressedContext?: NullableStringFieldUpdateOperationsInput | string | null
    currentStrategy?: StringFieldUpdateOperationsInput | string
    tokensUsed?: IntFieldUpdateOperationsInput | number
    goalProgress?: FloatFieldUpdateOperationsInput | number
    issuesDetected?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LogCreateInput = {
    messageId?: string | null
    botId?: string | null
    userId?: string | null
    level: $Enums.LogLevel
    data?: NullableJsonNullValueInput | InputJsonValue
    text?: string | null
    fullJson?: NullableJsonNullValueInput | InputJsonValue
    datetime?: Date | string
    dialog?: DialogCreateNestedOneWithoutLogsInput
  }

  export type LogUncheckedCreateInput = {
    id?: number
    dialogId?: string | null
    messageId?: string | null
    botId?: string | null
    userId?: string | null
    level: $Enums.LogLevel
    data?: NullableJsonNullValueInput | InputJsonValue
    text?: string | null
    fullJson?: NullableJsonNullValueInput | InputJsonValue
    datetime?: Date | string
  }

  export type LogUpdateInput = {
    messageId?: NullableStringFieldUpdateOperationsInput | string | null
    botId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    level?: EnumLogLevelFieldUpdateOperationsInput | $Enums.LogLevel
    data?: NullableJsonNullValueInput | InputJsonValue
    text?: NullableStringFieldUpdateOperationsInput | string | null
    fullJson?: NullableJsonNullValueInput | InputJsonValue
    datetime?: DateTimeFieldUpdateOperationsInput | Date | string
    dialog?: DialogUpdateOneWithoutLogsNestedInput
  }

  export type LogUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    dialogId?: NullableStringFieldUpdateOperationsInput | string | null
    messageId?: NullableStringFieldUpdateOperationsInput | string | null
    botId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    level?: EnumLogLevelFieldUpdateOperationsInput | $Enums.LogLevel
    data?: NullableJsonNullValueInput | InputJsonValue
    text?: NullableStringFieldUpdateOperationsInput | string | null
    fullJson?: NullableJsonNullValueInput | InputJsonValue
    datetime?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LogCreateManyInput = {
    id?: number
    dialogId?: string | null
    messageId?: string | null
    botId?: string | null
    userId?: string | null
    level: $Enums.LogLevel
    data?: NullableJsonNullValueInput | InputJsonValue
    text?: string | null
    fullJson?: NullableJsonNullValueInput | InputJsonValue
    datetime?: Date | string
  }

  export type LogUpdateManyMutationInput = {
    messageId?: NullableStringFieldUpdateOperationsInput | string | null
    botId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    level?: EnumLogLevelFieldUpdateOperationsInput | $Enums.LogLevel
    data?: NullableJsonNullValueInput | InputJsonValue
    text?: NullableStringFieldUpdateOperationsInput | string | null
    fullJson?: NullableJsonNullValueInput | InputJsonValue
    datetime?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LogUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    dialogId?: NullableStringFieldUpdateOperationsInput | string | null
    messageId?: NullableStringFieldUpdateOperationsInput | string | null
    botId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    level?: EnumLogLevelFieldUpdateOperationsInput | $Enums.LogLevel
    data?: NullableJsonNullValueInput | InputJsonValue
    text?: NullableStringFieldUpdateOperationsInput | string | null
    fullJson?: NullableJsonNullValueInput | InputJsonValue
    datetime?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type EnumDialogStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.DialogStatus | EnumDialogStatusFieldRefInput<$PrismaModel>
    in?: $Enums.DialogStatus[] | ListEnumDialogStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.DialogStatus[] | ListEnumDialogStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumDialogStatusFilter<$PrismaModel> | $Enums.DialogStatus
  }
  export type JsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }
  export type JsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type MessageListRelationFilter = {
    every?: MessageWhereInput
    some?: MessageWhereInput
    none?: MessageWhereInput
  }

  export type DialogStateListRelationFilter = {
    every?: DialogStateWhereInput
    some?: DialogStateWhereInput
    none?: DialogStateWhereInput
  }

  export type LogListRelationFilter = {
    every?: LogWhereInput
    some?: LogWhereInput
    none?: LogWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type MessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type DialogStateOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LogOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type DialogCountOrderByAggregateInput = {
    id?: SortOrder
    externalId?: SortOrder
    status?: SortOrder
    language?: SortOrder
    userInfo?: SortOrder
    goal?: SortOrder
    completionCriteria?: SortOrder
    negotiationSettings?: SortOrder
    referenceContext?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DialogMaxOrderByAggregateInput = {
    id?: SortOrder
    externalId?: SortOrder
    status?: SortOrder
    language?: SortOrder
    goal?: SortOrder
    referenceContext?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DialogMinOrderByAggregateInput = {
    id?: SortOrder
    externalId?: SortOrder
    status?: SortOrder
    language?: SortOrder
    goal?: SortOrder
    referenceContext?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type EnumDialogStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DialogStatus | EnumDialogStatusFieldRefInput<$PrismaModel>
    in?: $Enums.DialogStatus[] | ListEnumDialogStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.DialogStatus[] | ListEnumDialogStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumDialogStatusWithAggregatesFilter<$PrismaModel> | $Enums.DialogStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumDialogStatusFilter<$PrismaModel>
    _max?: NestedEnumDialogStatusFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DialogRelationFilter = {
    is?: DialogWhereInput
    isNot?: DialogWhereInput
  }

  export type MessageCountOrderByAggregateInput = {
    id?: SortOrder
    dialogId?: SortOrder
    role?: SortOrder
    content?: SortOrder
    sequenceNumber?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
  }

  export type MessageAvgOrderByAggregateInput = {
    sequenceNumber?: SortOrder
  }

  export type MessageMaxOrderByAggregateInput = {
    id?: SortOrder
    dialogId?: SortOrder
    role?: SortOrder
    content?: SortOrder
    sequenceNumber?: SortOrder
    createdAt?: SortOrder
  }

  export type MessageMinOrderByAggregateInput = {
    id?: SortOrder
    dialogId?: SortOrder
    role?: SortOrder
    content?: SortOrder
    sequenceNumber?: SortOrder
    createdAt?: SortOrder
  }

  export type MessageSumOrderByAggregateInput = {
    sequenceNumber?: SortOrder
  }

  export type EnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type DialogStateCountOrderByAggregateInput = {
    id?: SortOrder
    dialogId?: SortOrder
    continuationScore?: SortOrder
    compressedContext?: SortOrder
    currentStrategy?: SortOrder
    tokensUsed?: SortOrder
    goalProgress?: SortOrder
    issuesDetected?: SortOrder
    createdAt?: SortOrder
  }

  export type DialogStateAvgOrderByAggregateInput = {
    continuationScore?: SortOrder
    tokensUsed?: SortOrder
    goalProgress?: SortOrder
  }

  export type DialogStateMaxOrderByAggregateInput = {
    id?: SortOrder
    dialogId?: SortOrder
    continuationScore?: SortOrder
    compressedContext?: SortOrder
    currentStrategy?: SortOrder
    tokensUsed?: SortOrder
    goalProgress?: SortOrder
    createdAt?: SortOrder
  }

  export type DialogStateMinOrderByAggregateInput = {
    id?: SortOrder
    dialogId?: SortOrder
    continuationScore?: SortOrder
    compressedContext?: SortOrder
    currentStrategy?: SortOrder
    tokensUsed?: SortOrder
    goalProgress?: SortOrder
    createdAt?: SortOrder
  }

  export type DialogStateSumOrderByAggregateInput = {
    continuationScore?: SortOrder
    tokensUsed?: SortOrder
    goalProgress?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type EnumLogLevelFilter<$PrismaModel = never> = {
    equals?: $Enums.LogLevel | EnumLogLevelFieldRefInput<$PrismaModel>
    in?: $Enums.LogLevel[] | ListEnumLogLevelFieldRefInput<$PrismaModel>
    notIn?: $Enums.LogLevel[] | ListEnumLogLevelFieldRefInput<$PrismaModel>
    not?: NestedEnumLogLevelFilter<$PrismaModel> | $Enums.LogLevel
  }

  export type DialogNullableRelationFilter = {
    is?: DialogWhereInput | null
    isNot?: DialogWhereInput | null
  }

  export type LogCountOrderByAggregateInput = {
    id?: SortOrder
    dialogId?: SortOrder
    messageId?: SortOrder
    botId?: SortOrder
    userId?: SortOrder
    level?: SortOrder
    data?: SortOrder
    text?: SortOrder
    fullJson?: SortOrder
    datetime?: SortOrder
  }

  export type LogAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type LogMaxOrderByAggregateInput = {
    id?: SortOrder
    dialogId?: SortOrder
    messageId?: SortOrder
    botId?: SortOrder
    userId?: SortOrder
    level?: SortOrder
    text?: SortOrder
    datetime?: SortOrder
  }

  export type LogMinOrderByAggregateInput = {
    id?: SortOrder
    dialogId?: SortOrder
    messageId?: SortOrder
    botId?: SortOrder
    userId?: SortOrder
    level?: SortOrder
    text?: SortOrder
    datetime?: SortOrder
  }

  export type LogSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type EnumLogLevelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LogLevel | EnumLogLevelFieldRefInput<$PrismaModel>
    in?: $Enums.LogLevel[] | ListEnumLogLevelFieldRefInput<$PrismaModel>
    notIn?: $Enums.LogLevel[] | ListEnumLogLevelFieldRefInput<$PrismaModel>
    not?: NestedEnumLogLevelWithAggregatesFilter<$PrismaModel> | $Enums.LogLevel
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLogLevelFilter<$PrismaModel>
    _max?: NestedEnumLogLevelFilter<$PrismaModel>
  }

  export type MessageCreateNestedManyWithoutDialogInput = {
    create?: XOR<MessageCreateWithoutDialogInput, MessageUncheckedCreateWithoutDialogInput> | MessageCreateWithoutDialogInput[] | MessageUncheckedCreateWithoutDialogInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutDialogInput | MessageCreateOrConnectWithoutDialogInput[]
    createMany?: MessageCreateManyDialogInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type DialogStateCreateNestedManyWithoutDialogInput = {
    create?: XOR<DialogStateCreateWithoutDialogInput, DialogStateUncheckedCreateWithoutDialogInput> | DialogStateCreateWithoutDialogInput[] | DialogStateUncheckedCreateWithoutDialogInput[]
    connectOrCreate?: DialogStateCreateOrConnectWithoutDialogInput | DialogStateCreateOrConnectWithoutDialogInput[]
    createMany?: DialogStateCreateManyDialogInputEnvelope
    connect?: DialogStateWhereUniqueInput | DialogStateWhereUniqueInput[]
  }

  export type LogCreateNestedManyWithoutDialogInput = {
    create?: XOR<LogCreateWithoutDialogInput, LogUncheckedCreateWithoutDialogInput> | LogCreateWithoutDialogInput[] | LogUncheckedCreateWithoutDialogInput[]
    connectOrCreate?: LogCreateOrConnectWithoutDialogInput | LogCreateOrConnectWithoutDialogInput[]
    createMany?: LogCreateManyDialogInputEnvelope
    connect?: LogWhereUniqueInput | LogWhereUniqueInput[]
  }

  export type MessageUncheckedCreateNestedManyWithoutDialogInput = {
    create?: XOR<MessageCreateWithoutDialogInput, MessageUncheckedCreateWithoutDialogInput> | MessageCreateWithoutDialogInput[] | MessageUncheckedCreateWithoutDialogInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutDialogInput | MessageCreateOrConnectWithoutDialogInput[]
    createMany?: MessageCreateManyDialogInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type DialogStateUncheckedCreateNestedManyWithoutDialogInput = {
    create?: XOR<DialogStateCreateWithoutDialogInput, DialogStateUncheckedCreateWithoutDialogInput> | DialogStateCreateWithoutDialogInput[] | DialogStateUncheckedCreateWithoutDialogInput[]
    connectOrCreate?: DialogStateCreateOrConnectWithoutDialogInput | DialogStateCreateOrConnectWithoutDialogInput[]
    createMany?: DialogStateCreateManyDialogInputEnvelope
    connect?: DialogStateWhereUniqueInput | DialogStateWhereUniqueInput[]
  }

  export type LogUncheckedCreateNestedManyWithoutDialogInput = {
    create?: XOR<LogCreateWithoutDialogInput, LogUncheckedCreateWithoutDialogInput> | LogCreateWithoutDialogInput[] | LogUncheckedCreateWithoutDialogInput[]
    connectOrCreate?: LogCreateOrConnectWithoutDialogInput | LogCreateOrConnectWithoutDialogInput[]
    createMany?: LogCreateManyDialogInputEnvelope
    connect?: LogWhereUniqueInput | LogWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumDialogStatusFieldUpdateOperationsInput = {
    set?: $Enums.DialogStatus
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type MessageUpdateManyWithoutDialogNestedInput = {
    create?: XOR<MessageCreateWithoutDialogInput, MessageUncheckedCreateWithoutDialogInput> | MessageCreateWithoutDialogInput[] | MessageUncheckedCreateWithoutDialogInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutDialogInput | MessageCreateOrConnectWithoutDialogInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutDialogInput | MessageUpsertWithWhereUniqueWithoutDialogInput[]
    createMany?: MessageCreateManyDialogInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutDialogInput | MessageUpdateWithWhereUniqueWithoutDialogInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutDialogInput | MessageUpdateManyWithWhereWithoutDialogInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type DialogStateUpdateManyWithoutDialogNestedInput = {
    create?: XOR<DialogStateCreateWithoutDialogInput, DialogStateUncheckedCreateWithoutDialogInput> | DialogStateCreateWithoutDialogInput[] | DialogStateUncheckedCreateWithoutDialogInput[]
    connectOrCreate?: DialogStateCreateOrConnectWithoutDialogInput | DialogStateCreateOrConnectWithoutDialogInput[]
    upsert?: DialogStateUpsertWithWhereUniqueWithoutDialogInput | DialogStateUpsertWithWhereUniqueWithoutDialogInput[]
    createMany?: DialogStateCreateManyDialogInputEnvelope
    set?: DialogStateWhereUniqueInput | DialogStateWhereUniqueInput[]
    disconnect?: DialogStateWhereUniqueInput | DialogStateWhereUniqueInput[]
    delete?: DialogStateWhereUniqueInput | DialogStateWhereUniqueInput[]
    connect?: DialogStateWhereUniqueInput | DialogStateWhereUniqueInput[]
    update?: DialogStateUpdateWithWhereUniqueWithoutDialogInput | DialogStateUpdateWithWhereUniqueWithoutDialogInput[]
    updateMany?: DialogStateUpdateManyWithWhereWithoutDialogInput | DialogStateUpdateManyWithWhereWithoutDialogInput[]
    deleteMany?: DialogStateScalarWhereInput | DialogStateScalarWhereInput[]
  }

  export type LogUpdateManyWithoutDialogNestedInput = {
    create?: XOR<LogCreateWithoutDialogInput, LogUncheckedCreateWithoutDialogInput> | LogCreateWithoutDialogInput[] | LogUncheckedCreateWithoutDialogInput[]
    connectOrCreate?: LogCreateOrConnectWithoutDialogInput | LogCreateOrConnectWithoutDialogInput[]
    upsert?: LogUpsertWithWhereUniqueWithoutDialogInput | LogUpsertWithWhereUniqueWithoutDialogInput[]
    createMany?: LogCreateManyDialogInputEnvelope
    set?: LogWhereUniqueInput | LogWhereUniqueInput[]
    disconnect?: LogWhereUniqueInput | LogWhereUniqueInput[]
    delete?: LogWhereUniqueInput | LogWhereUniqueInput[]
    connect?: LogWhereUniqueInput | LogWhereUniqueInput[]
    update?: LogUpdateWithWhereUniqueWithoutDialogInput | LogUpdateWithWhereUniqueWithoutDialogInput[]
    updateMany?: LogUpdateManyWithWhereWithoutDialogInput | LogUpdateManyWithWhereWithoutDialogInput[]
    deleteMany?: LogScalarWhereInput | LogScalarWhereInput[]
  }

  export type MessageUncheckedUpdateManyWithoutDialogNestedInput = {
    create?: XOR<MessageCreateWithoutDialogInput, MessageUncheckedCreateWithoutDialogInput> | MessageCreateWithoutDialogInput[] | MessageUncheckedCreateWithoutDialogInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutDialogInput | MessageCreateOrConnectWithoutDialogInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutDialogInput | MessageUpsertWithWhereUniqueWithoutDialogInput[]
    createMany?: MessageCreateManyDialogInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutDialogInput | MessageUpdateWithWhereUniqueWithoutDialogInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutDialogInput | MessageUpdateManyWithWhereWithoutDialogInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type DialogStateUncheckedUpdateManyWithoutDialogNestedInput = {
    create?: XOR<DialogStateCreateWithoutDialogInput, DialogStateUncheckedCreateWithoutDialogInput> | DialogStateCreateWithoutDialogInput[] | DialogStateUncheckedCreateWithoutDialogInput[]
    connectOrCreate?: DialogStateCreateOrConnectWithoutDialogInput | DialogStateCreateOrConnectWithoutDialogInput[]
    upsert?: DialogStateUpsertWithWhereUniqueWithoutDialogInput | DialogStateUpsertWithWhereUniqueWithoutDialogInput[]
    createMany?: DialogStateCreateManyDialogInputEnvelope
    set?: DialogStateWhereUniqueInput | DialogStateWhereUniqueInput[]
    disconnect?: DialogStateWhereUniqueInput | DialogStateWhereUniqueInput[]
    delete?: DialogStateWhereUniqueInput | DialogStateWhereUniqueInput[]
    connect?: DialogStateWhereUniqueInput | DialogStateWhereUniqueInput[]
    update?: DialogStateUpdateWithWhereUniqueWithoutDialogInput | DialogStateUpdateWithWhereUniqueWithoutDialogInput[]
    updateMany?: DialogStateUpdateManyWithWhereWithoutDialogInput | DialogStateUpdateManyWithWhereWithoutDialogInput[]
    deleteMany?: DialogStateScalarWhereInput | DialogStateScalarWhereInput[]
  }

  export type LogUncheckedUpdateManyWithoutDialogNestedInput = {
    create?: XOR<LogCreateWithoutDialogInput, LogUncheckedCreateWithoutDialogInput> | LogCreateWithoutDialogInput[] | LogUncheckedCreateWithoutDialogInput[]
    connectOrCreate?: LogCreateOrConnectWithoutDialogInput | LogCreateOrConnectWithoutDialogInput[]
    upsert?: LogUpsertWithWhereUniqueWithoutDialogInput | LogUpsertWithWhereUniqueWithoutDialogInput[]
    createMany?: LogCreateManyDialogInputEnvelope
    set?: LogWhereUniqueInput | LogWhereUniqueInput[]
    disconnect?: LogWhereUniqueInput | LogWhereUniqueInput[]
    delete?: LogWhereUniqueInput | LogWhereUniqueInput[]
    connect?: LogWhereUniqueInput | LogWhereUniqueInput[]
    update?: LogUpdateWithWhereUniqueWithoutDialogInput | LogUpdateWithWhereUniqueWithoutDialogInput[]
    updateMany?: LogUpdateManyWithWhereWithoutDialogInput | LogUpdateManyWithWhereWithoutDialogInput[]
    deleteMany?: LogScalarWhereInput | LogScalarWhereInput[]
  }

  export type DialogCreateNestedOneWithoutMessagesInput = {
    create?: XOR<DialogCreateWithoutMessagesInput, DialogUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: DialogCreateOrConnectWithoutMessagesInput
    connect?: DialogWhereUniqueInput
  }

  export type EnumRoleFieldUpdateOperationsInput = {
    set?: $Enums.Role
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DialogUpdateOneRequiredWithoutMessagesNestedInput = {
    create?: XOR<DialogCreateWithoutMessagesInput, DialogUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: DialogCreateOrConnectWithoutMessagesInput
    upsert?: DialogUpsertWithoutMessagesInput
    connect?: DialogWhereUniqueInput
    update?: XOR<XOR<DialogUpdateToOneWithWhereWithoutMessagesInput, DialogUpdateWithoutMessagesInput>, DialogUncheckedUpdateWithoutMessagesInput>
  }

  export type DialogCreateNestedOneWithoutStatesInput = {
    create?: XOR<DialogCreateWithoutStatesInput, DialogUncheckedCreateWithoutStatesInput>
    connectOrCreate?: DialogCreateOrConnectWithoutStatesInput
    connect?: DialogWhereUniqueInput
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DialogUpdateOneRequiredWithoutStatesNestedInput = {
    create?: XOR<DialogCreateWithoutStatesInput, DialogUncheckedCreateWithoutStatesInput>
    connectOrCreate?: DialogCreateOrConnectWithoutStatesInput
    upsert?: DialogUpsertWithoutStatesInput
    connect?: DialogWhereUniqueInput
    update?: XOR<XOR<DialogUpdateToOneWithWhereWithoutStatesInput, DialogUpdateWithoutStatesInput>, DialogUncheckedUpdateWithoutStatesInput>
  }

  export type DialogCreateNestedOneWithoutLogsInput = {
    create?: XOR<DialogCreateWithoutLogsInput, DialogUncheckedCreateWithoutLogsInput>
    connectOrCreate?: DialogCreateOrConnectWithoutLogsInput
    connect?: DialogWhereUniqueInput
  }

  export type EnumLogLevelFieldUpdateOperationsInput = {
    set?: $Enums.LogLevel
  }

  export type DialogUpdateOneWithoutLogsNestedInput = {
    create?: XOR<DialogCreateWithoutLogsInput, DialogUncheckedCreateWithoutLogsInput>
    connectOrCreate?: DialogCreateOrConnectWithoutLogsInput
    upsert?: DialogUpsertWithoutLogsInput
    disconnect?: DialogWhereInput | boolean
    delete?: DialogWhereInput | boolean
    connect?: DialogWhereUniqueInput
    update?: XOR<XOR<DialogUpdateToOneWithWhereWithoutLogsInput, DialogUpdateWithoutLogsInput>, DialogUncheckedUpdateWithoutLogsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedEnumDialogStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.DialogStatus | EnumDialogStatusFieldRefInput<$PrismaModel>
    in?: $Enums.DialogStatus[] | ListEnumDialogStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.DialogStatus[] | ListEnumDialogStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumDialogStatusFilter<$PrismaModel> | $Enums.DialogStatus
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedEnumDialogStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DialogStatus | EnumDialogStatusFieldRefInput<$PrismaModel>
    in?: $Enums.DialogStatus[] | ListEnumDialogStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.DialogStatus[] | ListEnumDialogStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumDialogStatusWithAggregatesFilter<$PrismaModel> | $Enums.DialogStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumDialogStatusFilter<$PrismaModel>
    _max?: NestedEnumDialogStatusFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }
  export type NestedJsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type NestedEnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedEnumLogLevelFilter<$PrismaModel = never> = {
    equals?: $Enums.LogLevel | EnumLogLevelFieldRefInput<$PrismaModel>
    in?: $Enums.LogLevel[] | ListEnumLogLevelFieldRefInput<$PrismaModel>
    notIn?: $Enums.LogLevel[] | ListEnumLogLevelFieldRefInput<$PrismaModel>
    not?: NestedEnumLogLevelFilter<$PrismaModel> | $Enums.LogLevel
  }

  export type NestedEnumLogLevelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LogLevel | EnumLogLevelFieldRefInput<$PrismaModel>
    in?: $Enums.LogLevel[] | ListEnumLogLevelFieldRefInput<$PrismaModel>
    notIn?: $Enums.LogLevel[] | ListEnumLogLevelFieldRefInput<$PrismaModel>
    not?: NestedEnumLogLevelWithAggregatesFilter<$PrismaModel> | $Enums.LogLevel
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLogLevelFilter<$PrismaModel>
    _max?: NestedEnumLogLevelFilter<$PrismaModel>
  }

  export type MessageCreateWithoutDialogInput = {
    id?: string
    role: $Enums.Role
    content: string
    sequenceNumber: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type MessageUncheckedCreateWithoutDialogInput = {
    id?: string
    role: $Enums.Role
    content: string
    sequenceNumber: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type MessageCreateOrConnectWithoutDialogInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutDialogInput, MessageUncheckedCreateWithoutDialogInput>
  }

  export type MessageCreateManyDialogInputEnvelope = {
    data: MessageCreateManyDialogInput | MessageCreateManyDialogInput[]
    skipDuplicates?: boolean
  }

  export type DialogStateCreateWithoutDialogInput = {
    id?: string
    continuationScore: number
    compressedContext?: string | null
    currentStrategy: string
    tokensUsed: number
    goalProgress: number
    issuesDetected?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type DialogStateUncheckedCreateWithoutDialogInput = {
    id?: string
    continuationScore: number
    compressedContext?: string | null
    currentStrategy: string
    tokensUsed: number
    goalProgress: number
    issuesDetected?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type DialogStateCreateOrConnectWithoutDialogInput = {
    where: DialogStateWhereUniqueInput
    create: XOR<DialogStateCreateWithoutDialogInput, DialogStateUncheckedCreateWithoutDialogInput>
  }

  export type DialogStateCreateManyDialogInputEnvelope = {
    data: DialogStateCreateManyDialogInput | DialogStateCreateManyDialogInput[]
    skipDuplicates?: boolean
  }

  export type LogCreateWithoutDialogInput = {
    messageId?: string | null
    botId?: string | null
    userId?: string | null
    level: $Enums.LogLevel
    data?: NullableJsonNullValueInput | InputJsonValue
    text?: string | null
    fullJson?: NullableJsonNullValueInput | InputJsonValue
    datetime?: Date | string
  }

  export type LogUncheckedCreateWithoutDialogInput = {
    id?: number
    messageId?: string | null
    botId?: string | null
    userId?: string | null
    level: $Enums.LogLevel
    data?: NullableJsonNullValueInput | InputJsonValue
    text?: string | null
    fullJson?: NullableJsonNullValueInput | InputJsonValue
    datetime?: Date | string
  }

  export type LogCreateOrConnectWithoutDialogInput = {
    where: LogWhereUniqueInput
    create: XOR<LogCreateWithoutDialogInput, LogUncheckedCreateWithoutDialogInput>
  }

  export type LogCreateManyDialogInputEnvelope = {
    data: LogCreateManyDialogInput | LogCreateManyDialogInput[]
    skipDuplicates?: boolean
  }

  export type MessageUpsertWithWhereUniqueWithoutDialogInput = {
    where: MessageWhereUniqueInput
    update: XOR<MessageUpdateWithoutDialogInput, MessageUncheckedUpdateWithoutDialogInput>
    create: XOR<MessageCreateWithoutDialogInput, MessageUncheckedCreateWithoutDialogInput>
  }

  export type MessageUpdateWithWhereUniqueWithoutDialogInput = {
    where: MessageWhereUniqueInput
    data: XOR<MessageUpdateWithoutDialogInput, MessageUncheckedUpdateWithoutDialogInput>
  }

  export type MessageUpdateManyWithWhereWithoutDialogInput = {
    where: MessageScalarWhereInput
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyWithoutDialogInput>
  }

  export type MessageScalarWhereInput = {
    AND?: MessageScalarWhereInput | MessageScalarWhereInput[]
    OR?: MessageScalarWhereInput[]
    NOT?: MessageScalarWhereInput | MessageScalarWhereInput[]
    id?: StringFilter<"Message"> | string
    dialogId?: StringFilter<"Message"> | string
    role?: EnumRoleFilter<"Message"> | $Enums.Role
    content?: StringFilter<"Message"> | string
    sequenceNumber?: IntFilter<"Message"> | number
    metadata?: JsonNullableFilter<"Message">
    createdAt?: DateTimeFilter<"Message"> | Date | string
  }

  export type DialogStateUpsertWithWhereUniqueWithoutDialogInput = {
    where: DialogStateWhereUniqueInput
    update: XOR<DialogStateUpdateWithoutDialogInput, DialogStateUncheckedUpdateWithoutDialogInput>
    create: XOR<DialogStateCreateWithoutDialogInput, DialogStateUncheckedCreateWithoutDialogInput>
  }

  export type DialogStateUpdateWithWhereUniqueWithoutDialogInput = {
    where: DialogStateWhereUniqueInput
    data: XOR<DialogStateUpdateWithoutDialogInput, DialogStateUncheckedUpdateWithoutDialogInput>
  }

  export type DialogStateUpdateManyWithWhereWithoutDialogInput = {
    where: DialogStateScalarWhereInput
    data: XOR<DialogStateUpdateManyMutationInput, DialogStateUncheckedUpdateManyWithoutDialogInput>
  }

  export type DialogStateScalarWhereInput = {
    AND?: DialogStateScalarWhereInput | DialogStateScalarWhereInput[]
    OR?: DialogStateScalarWhereInput[]
    NOT?: DialogStateScalarWhereInput | DialogStateScalarWhereInput[]
    id?: StringFilter<"DialogState"> | string
    dialogId?: StringFilter<"DialogState"> | string
    continuationScore?: FloatFilter<"DialogState"> | number
    compressedContext?: StringNullableFilter<"DialogState"> | string | null
    currentStrategy?: StringFilter<"DialogState"> | string
    tokensUsed?: IntFilter<"DialogState"> | number
    goalProgress?: FloatFilter<"DialogState"> | number
    issuesDetected?: JsonNullableFilter<"DialogState">
    createdAt?: DateTimeFilter<"DialogState"> | Date | string
  }

  export type LogUpsertWithWhereUniqueWithoutDialogInput = {
    where: LogWhereUniqueInput
    update: XOR<LogUpdateWithoutDialogInput, LogUncheckedUpdateWithoutDialogInput>
    create: XOR<LogCreateWithoutDialogInput, LogUncheckedCreateWithoutDialogInput>
  }

  export type LogUpdateWithWhereUniqueWithoutDialogInput = {
    where: LogWhereUniqueInput
    data: XOR<LogUpdateWithoutDialogInput, LogUncheckedUpdateWithoutDialogInput>
  }

  export type LogUpdateManyWithWhereWithoutDialogInput = {
    where: LogScalarWhereInput
    data: XOR<LogUpdateManyMutationInput, LogUncheckedUpdateManyWithoutDialogInput>
  }

  export type LogScalarWhereInput = {
    AND?: LogScalarWhereInput | LogScalarWhereInput[]
    OR?: LogScalarWhereInput[]
    NOT?: LogScalarWhereInput | LogScalarWhereInput[]
    id?: IntFilter<"Log"> | number
    dialogId?: StringNullableFilter<"Log"> | string | null
    messageId?: StringNullableFilter<"Log"> | string | null
    botId?: StringNullableFilter<"Log"> | string | null
    userId?: StringNullableFilter<"Log"> | string | null
    level?: EnumLogLevelFilter<"Log"> | $Enums.LogLevel
    data?: JsonNullableFilter<"Log">
    text?: StringNullableFilter<"Log"> | string | null
    fullJson?: JsonNullableFilter<"Log">
    datetime?: DateTimeFilter<"Log"> | Date | string
  }

  export type DialogCreateWithoutMessagesInput = {
    id?: string
    externalId: string
    status?: $Enums.DialogStatus
    language: string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal: string
    completionCriteria: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    states?: DialogStateCreateNestedManyWithoutDialogInput
    logs?: LogCreateNestedManyWithoutDialogInput
  }

  export type DialogUncheckedCreateWithoutMessagesInput = {
    id?: string
    externalId: string
    status?: $Enums.DialogStatus
    language: string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal: string
    completionCriteria: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    states?: DialogStateUncheckedCreateNestedManyWithoutDialogInput
    logs?: LogUncheckedCreateNestedManyWithoutDialogInput
  }

  export type DialogCreateOrConnectWithoutMessagesInput = {
    where: DialogWhereUniqueInput
    create: XOR<DialogCreateWithoutMessagesInput, DialogUncheckedCreateWithoutMessagesInput>
  }

  export type DialogUpsertWithoutMessagesInput = {
    update: XOR<DialogUpdateWithoutMessagesInput, DialogUncheckedUpdateWithoutMessagesInput>
    create: XOR<DialogCreateWithoutMessagesInput, DialogUncheckedCreateWithoutMessagesInput>
    where?: DialogWhereInput
  }

  export type DialogUpdateToOneWithWhereWithoutMessagesInput = {
    where?: DialogWhereInput
    data: XOR<DialogUpdateWithoutMessagesInput, DialogUncheckedUpdateWithoutMessagesInput>
  }

  export type DialogUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    externalId?: StringFieldUpdateOperationsInput | string
    status?: EnumDialogStatusFieldUpdateOperationsInput | $Enums.DialogStatus
    language?: StringFieldUpdateOperationsInput | string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal?: StringFieldUpdateOperationsInput | string
    completionCriteria?: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    states?: DialogStateUpdateManyWithoutDialogNestedInput
    logs?: LogUpdateManyWithoutDialogNestedInput
  }

  export type DialogUncheckedUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    externalId?: StringFieldUpdateOperationsInput | string
    status?: EnumDialogStatusFieldUpdateOperationsInput | $Enums.DialogStatus
    language?: StringFieldUpdateOperationsInput | string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal?: StringFieldUpdateOperationsInput | string
    completionCriteria?: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    states?: DialogStateUncheckedUpdateManyWithoutDialogNestedInput
    logs?: LogUncheckedUpdateManyWithoutDialogNestedInput
  }

  export type DialogCreateWithoutStatesInput = {
    id?: string
    externalId: string
    status?: $Enums.DialogStatus
    language: string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal: string
    completionCriteria: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: MessageCreateNestedManyWithoutDialogInput
    logs?: LogCreateNestedManyWithoutDialogInput
  }

  export type DialogUncheckedCreateWithoutStatesInput = {
    id?: string
    externalId: string
    status?: $Enums.DialogStatus
    language: string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal: string
    completionCriteria: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: MessageUncheckedCreateNestedManyWithoutDialogInput
    logs?: LogUncheckedCreateNestedManyWithoutDialogInput
  }

  export type DialogCreateOrConnectWithoutStatesInput = {
    where: DialogWhereUniqueInput
    create: XOR<DialogCreateWithoutStatesInput, DialogUncheckedCreateWithoutStatesInput>
  }

  export type DialogUpsertWithoutStatesInput = {
    update: XOR<DialogUpdateWithoutStatesInput, DialogUncheckedUpdateWithoutStatesInput>
    create: XOR<DialogCreateWithoutStatesInput, DialogUncheckedCreateWithoutStatesInput>
    where?: DialogWhereInput
  }

  export type DialogUpdateToOneWithWhereWithoutStatesInput = {
    where?: DialogWhereInput
    data: XOR<DialogUpdateWithoutStatesInput, DialogUncheckedUpdateWithoutStatesInput>
  }

  export type DialogUpdateWithoutStatesInput = {
    id?: StringFieldUpdateOperationsInput | string
    externalId?: StringFieldUpdateOperationsInput | string
    status?: EnumDialogStatusFieldUpdateOperationsInput | $Enums.DialogStatus
    language?: StringFieldUpdateOperationsInput | string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal?: StringFieldUpdateOperationsInput | string
    completionCriteria?: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: MessageUpdateManyWithoutDialogNestedInput
    logs?: LogUpdateManyWithoutDialogNestedInput
  }

  export type DialogUncheckedUpdateWithoutStatesInput = {
    id?: StringFieldUpdateOperationsInput | string
    externalId?: StringFieldUpdateOperationsInput | string
    status?: EnumDialogStatusFieldUpdateOperationsInput | $Enums.DialogStatus
    language?: StringFieldUpdateOperationsInput | string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal?: StringFieldUpdateOperationsInput | string
    completionCriteria?: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: MessageUncheckedUpdateManyWithoutDialogNestedInput
    logs?: LogUncheckedUpdateManyWithoutDialogNestedInput
  }

  export type DialogCreateWithoutLogsInput = {
    id?: string
    externalId: string
    status?: $Enums.DialogStatus
    language: string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal: string
    completionCriteria: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: MessageCreateNestedManyWithoutDialogInput
    states?: DialogStateCreateNestedManyWithoutDialogInput
  }

  export type DialogUncheckedCreateWithoutLogsInput = {
    id?: string
    externalId: string
    status?: $Enums.DialogStatus
    language: string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal: string
    completionCriteria: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: MessageUncheckedCreateNestedManyWithoutDialogInput
    states?: DialogStateUncheckedCreateNestedManyWithoutDialogInput
  }

  export type DialogCreateOrConnectWithoutLogsInput = {
    where: DialogWhereUniqueInput
    create: XOR<DialogCreateWithoutLogsInput, DialogUncheckedCreateWithoutLogsInput>
  }

  export type DialogUpsertWithoutLogsInput = {
    update: XOR<DialogUpdateWithoutLogsInput, DialogUncheckedUpdateWithoutLogsInput>
    create: XOR<DialogCreateWithoutLogsInput, DialogUncheckedCreateWithoutLogsInput>
    where?: DialogWhereInput
  }

  export type DialogUpdateToOneWithWhereWithoutLogsInput = {
    where?: DialogWhereInput
    data: XOR<DialogUpdateWithoutLogsInput, DialogUncheckedUpdateWithoutLogsInput>
  }

  export type DialogUpdateWithoutLogsInput = {
    id?: StringFieldUpdateOperationsInput | string
    externalId?: StringFieldUpdateOperationsInput | string
    status?: EnumDialogStatusFieldUpdateOperationsInput | $Enums.DialogStatus
    language?: StringFieldUpdateOperationsInput | string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal?: StringFieldUpdateOperationsInput | string
    completionCriteria?: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: MessageUpdateManyWithoutDialogNestedInput
    states?: DialogStateUpdateManyWithoutDialogNestedInput
  }

  export type DialogUncheckedUpdateWithoutLogsInput = {
    id?: StringFieldUpdateOperationsInput | string
    externalId?: StringFieldUpdateOperationsInput | string
    status?: EnumDialogStatusFieldUpdateOperationsInput | $Enums.DialogStatus
    language?: StringFieldUpdateOperationsInput | string
    userInfo?: NullableJsonNullValueInput | InputJsonValue
    goal?: StringFieldUpdateOperationsInput | string
    completionCriteria?: JsonNullValueInput | InputJsonValue
    negotiationSettings?: NullableJsonNullValueInput | InputJsonValue
    referenceContext?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: MessageUncheckedUpdateManyWithoutDialogNestedInput
    states?: DialogStateUncheckedUpdateManyWithoutDialogNestedInput
  }

  export type MessageCreateManyDialogInput = {
    id?: string
    role: $Enums.Role
    content: string
    sequenceNumber: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type DialogStateCreateManyDialogInput = {
    id?: string
    continuationScore: number
    compressedContext?: string | null
    currentStrategy: string
    tokensUsed: number
    goalProgress: number
    issuesDetected?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type LogCreateManyDialogInput = {
    id?: number
    messageId?: string | null
    botId?: string | null
    userId?: string | null
    level: $Enums.LogLevel
    data?: NullableJsonNullValueInput | InputJsonValue
    text?: string | null
    fullJson?: NullableJsonNullValueInput | InputJsonValue
    datetime?: Date | string
  }

  export type MessageUpdateWithoutDialogInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    content?: StringFieldUpdateOperationsInput | string
    sequenceNumber?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUncheckedUpdateWithoutDialogInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    content?: StringFieldUpdateOperationsInput | string
    sequenceNumber?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUncheckedUpdateManyWithoutDialogInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    content?: StringFieldUpdateOperationsInput | string
    sequenceNumber?: IntFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DialogStateUpdateWithoutDialogInput = {
    id?: StringFieldUpdateOperationsInput | string
    continuationScore?: FloatFieldUpdateOperationsInput | number
    compressedContext?: NullableStringFieldUpdateOperationsInput | string | null
    currentStrategy?: StringFieldUpdateOperationsInput | string
    tokensUsed?: IntFieldUpdateOperationsInput | number
    goalProgress?: FloatFieldUpdateOperationsInput | number
    issuesDetected?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DialogStateUncheckedUpdateWithoutDialogInput = {
    id?: StringFieldUpdateOperationsInput | string
    continuationScore?: FloatFieldUpdateOperationsInput | number
    compressedContext?: NullableStringFieldUpdateOperationsInput | string | null
    currentStrategy?: StringFieldUpdateOperationsInput | string
    tokensUsed?: IntFieldUpdateOperationsInput | number
    goalProgress?: FloatFieldUpdateOperationsInput | number
    issuesDetected?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DialogStateUncheckedUpdateManyWithoutDialogInput = {
    id?: StringFieldUpdateOperationsInput | string
    continuationScore?: FloatFieldUpdateOperationsInput | number
    compressedContext?: NullableStringFieldUpdateOperationsInput | string | null
    currentStrategy?: StringFieldUpdateOperationsInput | string
    tokensUsed?: IntFieldUpdateOperationsInput | number
    goalProgress?: FloatFieldUpdateOperationsInput | number
    issuesDetected?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LogUpdateWithoutDialogInput = {
    messageId?: NullableStringFieldUpdateOperationsInput | string | null
    botId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    level?: EnumLogLevelFieldUpdateOperationsInput | $Enums.LogLevel
    data?: NullableJsonNullValueInput | InputJsonValue
    text?: NullableStringFieldUpdateOperationsInput | string | null
    fullJson?: NullableJsonNullValueInput | InputJsonValue
    datetime?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LogUncheckedUpdateWithoutDialogInput = {
    id?: IntFieldUpdateOperationsInput | number
    messageId?: NullableStringFieldUpdateOperationsInput | string | null
    botId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    level?: EnumLogLevelFieldUpdateOperationsInput | $Enums.LogLevel
    data?: NullableJsonNullValueInput | InputJsonValue
    text?: NullableStringFieldUpdateOperationsInput | string | null
    fullJson?: NullableJsonNullValueInput | InputJsonValue
    datetime?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LogUncheckedUpdateManyWithoutDialogInput = {
    id?: IntFieldUpdateOperationsInput | number
    messageId?: NullableStringFieldUpdateOperationsInput | string | null
    botId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    level?: EnumLogLevelFieldUpdateOperationsInput | $Enums.LogLevel
    data?: NullableJsonNullValueInput | InputJsonValue
    text?: NullableStringFieldUpdateOperationsInput | string | null
    fullJson?: NullableJsonNullValueInput | InputJsonValue
    datetime?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use DialogCountOutputTypeDefaultArgs instead
     */
    export type DialogCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = DialogCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use DialogDefaultArgs instead
     */
    export type DialogArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = DialogDefaultArgs<ExtArgs>
    /**
     * @deprecated Use MessageDefaultArgs instead
     */
    export type MessageArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = MessageDefaultArgs<ExtArgs>
    /**
     * @deprecated Use DialogStateDefaultArgs instead
     */
    export type DialogStateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = DialogStateDefaultArgs<ExtArgs>
    /**
     * @deprecated Use LogDefaultArgs instead
     */
    export type LogArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = LogDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}