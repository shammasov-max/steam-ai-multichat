import * as S from "effect/Schema";

// Branded primitives
export const SteamID64 = S.String.pipe(S.pattern(/^\d{17}$/), S.brand("SteamID64"));
export type SteamID64 = S.Schema.Type<typeof SteamID64>;

export const BotId   = S.String.pipe(S.minLength(1), S.brand("BotId"));
export const ChatId  = S.String.pipe(S.minLength(1), S.brand("ChatId"));
export const TaskId  = S.String.pipe(S.minLength(1), S.brand("TaskId"));
export const ProxyId = S.String.pipe(S.minLength(1), S.brand("ProxyId"));
export const MaFileId = S.String.pipe(S.minLength(1), S.brand("MaFileId"));
export type BotId   = S.Schema.Type<typeof BotId>;
export type ChatId  = S.Schema.Type<typeof ChatId>;
export type TaskId  = S.Schema.Type<typeof TaskId>;
export type ProxyId = S.Schema.Type<typeof ProxyId>;
export type MaFileId = S.Schema.Type<typeof MaFileId>;

// Enums (fixed by PRD)
export const BotStatus = S.Union(
  S.Literal("connecting"),
  S.Literal("connected"),
  S.Literal("disconnected"),
  S.Literal("authFailed")
);
export type BotStatus = S.Schema.Type<typeof BotStatus>;

export const TaskStatus = S.Union(
  S.Literal("created"),
  S.Literal("assigned"),
  S.Literal("invited"),
  S.Literal("accepted"),
  S.Literal("failed"),
  S.Literal("disposed"),
  S.Literal("resolved")
);
export type TaskStatus = S.Schema.Type<typeof TaskStatus>;

export const AggregateType = S.Union(
  S.Literal("Bot"),
  S.Literal("Chat"),
  S.Literal("Task"),
  S.Literal("System")
);
export type AggregateType = S.Schema.Type<typeof AggregateType>;

export const AggregateRef = S.Struct({
  type: AggregateType,
  id: S.String
});
export type AggregateRef = S.Schema.Type<typeof AggregateRef>;
