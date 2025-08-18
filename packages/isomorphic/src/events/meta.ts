import * as S from "effect/Schema";
import { AggregateRef } from "./core";

export const EventMeta = S.Struct({
  schemaVersion: S.Literal(1),
  id: S.String,          // TypeID ('evt' prefix)
  ts: S.Number,          // epoch ms UTC
  kind: S.String,        // == action.type
  aggregate: AggregateRef,
  source: S.optional(S.Literal("server","client")),
  correlationId: S.optional(S.String),
  causationId:  S.optional(S.String),
});
export type EventMeta = S.Schema.Type<typeof EventMeta>;

// wire action == redux action
export type WireAction = { type: string; payload: unknown; meta: EventMeta };
