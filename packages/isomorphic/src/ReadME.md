Вот README на английском — максимально «каноничный» для TypeScript-разработчиков.

---

# README — Isomorphic Events Package for Steam Multichat (MVP)

This package is the **single source of truth** for domain events shared between the backend and the frontend. Events are represented as **Redux actions** and validated at the boundaries via **`effect/Schema`**. The wire format that travels over SSE is **the same object** you dispatch into Redux.

> Core invariant: **`action === event`** and **`type === kind`**.

---

## Why this exists

* **One contract** for both ends: no hand-written DTOs per layer.
* **Runtime validation** on ingress/egress (cheap, schema-driven).
* **Predictable evolution**: new events are added in one registry.
* **Minimal glue code**: the “wire object” is also your Redux action.

---

## Principles

* **Wire format**: `{ type, payload, meta }` (JSON-serializable).
* **`type === kind`**: the Redux `action.type` equals the domain event kind string (e.g. `"chat.messageSent"`).
* **Validation at edges**: validate `payload` with `effect/Schema` when sending/receiving; keep the store lean.
* **Meta is required**: `meta` carries `schemaVersion`, `id`, `ts`, `aggregate`, etc.
* **ID policy**: entity IDs are generated with **`typeid-js`**, prefixed by slice name (`bot_*`, `task_*`, `chat_*`).
  `meta.id` is the **event id**, not an entity id.
* **Time**: all timestamps are **UTC epoch milliseconds** (`number`).

---

## Directory layout

```
@app/isomorphic/
  events/
    core.ts       # Branded primitives & aggregate refs (SteamID64, BotId, ChatId, TaskId, AggregateRef)
    payloads.ts   # Global registry: kind -> payload schema
    meta.ts       # EventMeta schema + WireAction type (action == event)
    factory.ts    # createEventAction(kind, inferAggregate) – builds/validates wire actions
    actions.ts    # Concrete domain events (ready-to-use creators/decoders)
    index.ts      # Re-exports for convenience
```

> Reducers/selectors live in your app. They subscribe to `action.type` exported from `actions.ts`.

---

## File-by-file

### `core.ts`

Branded types (safe-by-construction) and aggregate references:

* `SteamID64` (17-digit regex brand).
* `BotId`, `ChatId`, `TaskId` (non-empty strings).
* `AggregateRef = { type: 'Bot'|'Chat'|'Task'|'System', id: string }`.

These ensure we don’t accidentally pass the wrong identifiers across layers.

### `payloads.ts`

The **global event registry** mapping `kind` → `effect/Schema` for `payload`.

Included (MVP + headroom for growth):

* System: `"snapshot"` (first SSE message only).
* Bots: `"bot.connected"`, `"bot.disconnected"`, `"bot.authenticationFailed"`.
* Tasks: `"task.created"`, `"task.assigned"`, `"task.statusUpdated"`.
* Friend invites: `"friendInvite.sent"`, `"friendInvite.accepted"`, `"friendInvite.failed"`.
* Chats: `"chat.started"`, `"chat.messageReceived"`, `"chat.messageSent"`, `"chat.agentToggled"`.
* Dialog script: `"dialogScript.advanced"`, `"dialogScript.completed"`.
* Logs: `"error.logged"`.

Utility types:

* `EventKind` — union of all event kind strings.
* `PayloadOf<K>` — statically infers the payload type for a given `kind`.

> Domain status enums are fixed by PRD:
>
> * **BotStatus**: `connecting | connected | disconnected | authFailed`
> * **TaskStatus**: `created | assigned | invited | accepted | failed | disposed | resolved`
>   Enforce in app reducers/commands; wire schemas keep strings for MVP simplicity.

### `meta.ts`

Defines the required metadata and the wire action shape.

```ts
type EventMeta = {
  schemaVersion: 1;
  id: string;      // event id (uuid-like / snowflake-like)
  ts: number;      // epoch ms (UTC)
  kind: string;    // MUST equal action.type
  aggregate: { type: 'Bot'|'Chat'|'Task'|'System'; id: string };
  source?: 'server'|'client';
  correlationId?: string; // reserved
  causationId?: string;   // reserved
};

type WireAction = { type: string; payload: unknown; meta: EventMeta };
```

### `factory.ts`

Factory to define **event-as-action** creators in a typesafe, validated way.

```ts
createEventAction(
  kind: EventKind,
  inferAggregate: (payload: PayloadOf<typeof kind>) => AggregateRef
) -> {
  make(payload, meta?) -> WireAction     // validates payload and builds meta
  decodeIncoming(raw) -> WireAction      // validates wire object on ingress
  type: kind, kind
}
```

* Use `make()` on the server to emit events (and broadcast over SSE).
* Use `decodeIncoming()` on the client to validate incoming events before `dispatch`.

### `actions.ts`

Domain events wired via the factory, e.g.:

```ts
export const chatMessageSent = createEventAction(
  "chat.messageSent",
  p => ({ type: "Chat", id: p.chatId })
);
```

Use these creators:

* **Server**: `const evt = chatMessageSent.make({ chatId, text })`.
* **Client**: `const evt = chatMessageSent.decodeIncoming(raw)`.

### `index.ts`

Re-exports the modules (`Core`, `Meta`, `Payloads`, `Factory`, and all event creators).

---

## SSE protocol (wire contract)

**Endpoint:** `GET /api/event-stream`

1. **Initial snapshot** (first message only):

```
event: snapshot
data: {"state": { ...entire POJO application state... }}

```

2. **Event batches** (every \~50–100ms):

```
event: batch
data: {"events":[
  {"type":"chat.messageSent","payload":{"chatId":"...","text":"..."},"meta":{...}},
  {"type":"chat.agentToggled","payload":{"chatId":"...","enabled":true},"meta":{...}}
]}

```

**Reconnect**: no replay in MVP. On reconnect, the server sends a fresh `snapshot` and resumes streaming.

**Server requirements**:

* Always construct events via `*.make(payload)` from `actions.ts`.
* Batch outgoing events on a short interval to avoid chatty streams.
* Ensure headers suitable for SSE: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`.

---

## Server usage (minimal)

```ts
import { chatMessageSent } from "@app/isomorphic/events/actions";
import type { WireAction } from "@app/isomorphic/events/meta";

// 1) Build a validated event
const evt: WireAction = chatMessageSent.make({ chatId: "chat_01", text: "Hello!" });

// 2) Apply to server store (if any)
store.dispatch(evt);

// 3) Broadcast as-is over SSE
broadcastBatch([evt]); // batch writer wraps into `event: batch`
```

**IDs & time:**

* Generate entity ids (bots/tasks/chats) using **`typeid-js`** (e.g., `chat_...`).
* Set `meta.id` to a unique **event id**.
* Use `Date.now()` (UTC ms) for `meta.ts`.

---

## Client usage (minimal)

```ts
import { store } from "./store";
import type { WireAction } from "@app/isomorphic/events/meta";
import { PayloadSchemas } from "@app/isomorphic/events/payloads";
import * as S from "effect/Schema";

const es = new EventSource("/api/event-stream");

// 1) Snapshot replaces state
es.addEventListener("snapshot", (e: MessageEvent) => {
  const { state } = JSON.parse(e.data);
  store.dispatch({ type: "system/replaceState", payload: state });
});

// 2) Batches: validate each event, then dispatch
es.addEventListener("batch", (e: MessageEvent) => {
  const { events } = JSON.parse(e.data) as { events: WireAction[] };
  for (const raw of events) {
    const kind = raw?.meta?.kind;
    const schema = kind && PayloadSchemas[kind as keyof typeof PayloadSchemas];
    if (!schema || raw.type !== kind) continue;

    // Validate payload against schema
    const payload = S.decodeUnknownSync(schema)(raw.payload);
    store.dispatch({ ...raw, payload });
  }
});
```

---

## Adding a new event

1. **Declare payload** in `payloads.ts`:

```ts
"chat.typing": S.Struct({ chatId: ChatId, isTyping: S.Boolean })
```

2. **Create action** in `actions.ts`:

```ts
export const chatTyping = createEventAction(
  "chat.typing",
  p => ({ type: "Chat", id: p.chatId })
);
```

3. **Subscribe reducer** in your app:

```ts
builder.addCase(chatTyping.type as any, (state, action: any) => {
  // update slice
});
```

> Ensure `action.type` and `meta.kind` are equal. Do not rename kinds without migrating reducers.

---

## Redux integration

* Reducers listen to `action.type` (string) exported from `actions.ts`.
* Prefer **normalized** state (by id) for large collections (`chats`, `tasks`).
* Limit heavy history in initial **snapshot** (e.g., last `N` messages per chat).

---

## Known MVP limitations

* No SSE replay on reconnect (fresh snapshot instead).
* No schema version migrations (fixed `schemaVersion: 1`).
* `correlationId` / `causationId` are reserved but unused.
* No command idempotency at API level yet.

---

## Evolution roadmap (when needed)

* Add **replay buffer + watermark** to SSE for lossless reconnects.
* Introduce **idempotent commands** (e.g., `commandId`) and optimistic concurrency.
* Extract domain status enums into schemas and switch `task.statusUpdated` to literal unions.
* Serve initial **snapshot** via `GET /snapshot` (gzip + ETag) and keep SSE for events only.

---

## Practical tips

* Reuse these event creators in tests to build valid wire actions.
* Keep event names (`kind`) stable. Consider suffixes (`@1`) if you foresee breaking changes.
* Use short batch intervals (\~50–100ms) to reduce re-render churn while keeping UI snappy.

---

This package is intentionally small and opinionated. It locks in a clear contract so the rest of the system (Steam adapters, schedulers, UI) can evolve independently without arguing over JSON shapes.