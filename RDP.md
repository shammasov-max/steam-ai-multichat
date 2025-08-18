# RDP - Steam Multichat - AI Facilitated

## Table of Contents
- [RDP - Steam Multichat - AI Facilitated](#rdp---steam-multichat---ai-facilitated)
  - [Table of Contents](#table-of-contents)
  - [1. Objective \& Summary](#1-objective--summary)
  - [2. Users \& Use Cases](#2-users--use-cases)
    - [Primary Users](#primary-users)
    - [Top Use Cases](#top-use-cases)
  - [3. Scope (MVP Feature Set)](#3-scope-mvp-feature-set)
  - [4. Non-Goals](#4-non-goals)
  - [5. Constraints \& Policies](#5-constraints--policies)
  - [6. Architecture Overview](#6-architecture-overview)
    - [Code structure and tech stack](#code-structure-and-tech-stack)
    - [Event/Command/Actions](#eventcommandactions)
    - [Data Flow (CQRS-lite via SSE)](#data-flow-cqrs-lite-via-sse)
  - [7. Slices (Entities)](#7-slices-entities)
    - [Bot](#bot)
    - [Task](#task)
    - [Chat](#chat)
    - [System](#system)
  - [8. Event Contract (Isomorphic, action === event)](#8-event-contract-isomorphic-action--event)
  - [9. Commands](#9-commands)
  - [10. Behavior \& Workflows](#10-behavior--workflows)
    - [Task Assignment (round-robin)](#task-assignment-round-robin)
    - [Invite Scheduler](#invite-scheduler)
    - [Scripted Dialog (3–5 steps)](#scripted-dialog-35-steps)
    - [Manual Takeover](#manual-takeover)
  - [11. UI/UX Requirements (MVP)](#11-uiux-requirements-mvp)
    - [Bots View](#bots-view)
    - [Tasks View](#tasks-view)
    - [Multichat](#multichat)
    - [System Indicators](#system-indicators)
    - [Performance UX Notes](#performance-ux-notes)
  - [12. Data \& Persistence](#12-data--persistence)
  - [13. Operational Requirements](#13-operational-requirements)
    - [SSE Server Setup](#sse-server-setup)
  - [14. Security \& Privacy](#14-security--privacy)
  - [15. Performance Targets (MVP)](#15-performance-targets-mvp)
  - [16. Acceptance Criteria](#16-acceptance-criteria)
  - [17. Risks \& Mitigations](#17-risks--mitigations)
  - [18. Post-MVP Roadmap](#18-post-mvp-roadmap)
  - [19. Glossary](#19-glossary)
  - [20. Open Implementation Notes (MVP discipline)](#20-open-implementation-notes-mvp-discipline)

## 1. Objective & Summary
Build a web-based operations console that automates conversations between Steam bot accounts and real players via Steam Friends & Chat. The system targets developers and project managers, prioritizing interface predictability, fast feedback, and operational stability.

**MVP goals:**

Connect large numbers of bot accounts (eventual scale: up to 10,000 concurrently online).

Manage a live queue of player “tasks” (each with item and price range).

Automatically send friend invites and run a short scripted dialog (3–5 messages).

Provide a multichat inbox with manual takeover (agent on/off, send message as bot).

Establish a simple, reliable evented data contract (isomorphic package; action === event).

Out of scope for MVP: payments, escrow, external markets, fraud/AML, multi-instance clustering, replay streams.

## 2. Users & Use Cases
### Primary Users

Developer (Dev): connects bots using maFile, configures proxies, monitors stability, inspects logs.

Project Manager / Operator (PM): monitors conversations, assigns tasks, manually takes over chats when needed.

### Top Use Cases

- Incrementally import and connect hundreds/thousands of bots.
- Create tasks individually (no CSV import in MVP) with player SteamID64, target item, and price range.
- Dispatch friend invites at a strict rate (≤1 per minute per bot).
- Automatic short dialog after friendship acceptance; PM can disable/enable agent and send messages manually.
- View and manage all active conversations in a single multichat inbox.
- Run continuously with always-online bots; tolerate reconnects without losing operational state.

## 3. Scope (MVP Feature Set)
Bot onboarding: Add/remove Steam bot using maFile JSON and sticky proxy (1 bot ↔ 1 proxy).

Task lifecycle: Create/Dispose tasks via commands (no CSV); auto-assign tasks round-robin to available bots.

Invites & dialog: Auto friend-invite ≤1/min per bot; start chat after acceptance; run 3–5 message script.

Multichat with manual control: Toggle agent per chat; send operator messages as the bot.

Realtime data flow: SSE snapshot followed by event batches; action === event; Redux store isomorphic (front/back).

Server logs: Append-only events.ndjson; simple on-disk snapshots for process restarts.

## 4. Non-Goals
Payment orchestration and escrow.

External marketplace integrations.

Multi-region redundancy and HA.

Hard data durability guarantees beyond snapshots + ndjson.

SSE replay buffers (reconnect = fresh snapshot).

Command idempotency/concurrency control (reserved for later).

## 5. Constraints & Policies
Platform: Steam Friends & Chat only; use unofficial npm packages for Steam connectivity.

Authentication: bots connect using maFile (Steam Guard mobile authenticator data provided as JSON).

Connectivity: always-online for all bots in MVP.

Proxy policy: 1 bot ↔ 1 sticky proxy (minimize anti-spam/anti-abuse flags).

Rate limit: 1 invite per minute per bot (strict).

Assignment policy: round-robin, skipping offline/unhealthy bots.

Timestamps: UTC, ms epoch everywhere.

IDs: typeid-js with slice prefix (e.g., bot_*, task_*, chat_*).

Initial load: Accept up to ~10s snapshot time; snapshot may be tens of MB.

> Note: Unofficial Steam access and outside-of-Steam trade negotiations carry ToS risks. MVP logs, proxy hygiene, and rate limits are used to mitigate (not eliminate) risks.

## 6. Architecture Overview
Items marked with #mvp are pragmatic compromises for speed. We will refactor these areas in the next iteration.

### Code structure and tech stack
Monorepo — based on Yarn workspaces.
There are four packages in the monorepo:

1. frontend: React SPA + Tailwind CSS   
2. backend: Node.js + Effect-TS (functional orchestration), SSE + 2 HTTP routes
3. isomorphic: shared functions and types about Event-driven architecture, similar to Event Sourcing + CQRS. Redux is the isomorphic, monolithic state layer (#mvp).
4. steam-utils: effect-ts based steam utils. Internally calls other open-source unofficial npm packages.

### Event/Command/Actions
Some of redux actions are events; 
Some of redux actions co creators/thunks are commands.
Reducers are event handlers (aggregates).
- Prefer simple, Redux-style naming over strict Event Sourcing/CQRS/DDD conventions.
- Use slice names (plural) for collections like tasks and bots; singular structures follow the same slice naming. use createEntitySlice for entities.
- Use slice names instead of aggregate names.
- Use entity IDs analogous to aggregateId.

Deployment: single backend instance controlled by PM2 (OK for MVP).
State: in-memory Redux store on the backend with regular snapshotting.

Logs: events.ndjson append-only (daily or size-based rotation).
Secrets: .env in MVP (mark as risk; move to Vault/KMS later).

### Data Flow (CQRS-lite via SSE)

GET /api/event-stream (SSE):

First message: full snapshot of POJO state.

Then: event batch every ~50–100ms (array of wire actions).

POST /api/command:

Executes a command; on success emits domain events to SSE stream.

Returns { ok: true } or { ok: false, error }.


Event schemas via effect/Schema.

Event creators via createEventAction(kind, inferAggregate).

Policy: action === event, type === kind, consistent meta shape.

## 7. Slices (Entities)

Each slice defined with dependent types and helpers in one file with path isomorphic/src/slices/{sliceName}.ts.

Each slice has effect-ts schema for validation

### Bot

Fields: { id, steamId64, label?, proxyUrl, status, lastSeen? }

BotStatus: connecting | connected | disconnected | authFailed


### Task

Fields: { id, playerSteamId64, item, priceMin, priceMax, status, assignedBotId? }

TaskStatus: created | assigned | invited | accepted | failed | disposed | resolved

### Chat

Fields: { id, botId, playerSteamId64, agentEnabled: boolean, messages: Msg[], scriptStep? }

Msg: { id, from: 'bot'|'player', text, ts }

### System

Fields: { roundRobin: { pointer, eligibleBotIds[] }, rateLimits: { [botId]: { lastInviteAt? } } }

## 8. Event Contract (Isomorphic, action === event)
All events are Redux actions with shape { type, payload, meta }.
type === kind. meta includes { schemaVersion: 1, id, ts, kind, aggregate, ... }.

System

snapshot — { state } (SSE-first message only)

Bots

connected — { botId }

disconnected — { botId }

authFailed — { botId, reason }

Tasks

created — { taskId, playerSteamId64, item, priceMin, priceMax }

assigned — { taskId, botId }

statusChanged — { taskId, status } (status per enum policy)

Friend Invites

friendInvite.sent — { botId, playerSteamId64 }

friendInvite.accepted — { botId, playerSteamId64 }

friendInvite.failed — { botId, playerSteamId64, reason }

Chats

started — { chatId, botId, playerSteamId64 }

messageReceived — { chatId, from: 'player'|'bot', text }

messageSent — { chatId, text }

agentToggled — { chatId, enabled }

Dialog Script

dialogScript.advanced — { chatId, step }

dialogScript.completed — { chatId }

Errors

error.logged — { message, context? }

Batching: Backend pushes event: batch with { events: WireAction[] } at ~50–100ms intervals.
Reconnect: Backend sends a fresh snapshot and resumes event batches (no replay in MVP).

## 9. Commands
HTTP POST /api/command
AddBotFromMaFile { maFileJSON, proxyUrl, label? }
→ Connect bot (always-online). Emits bot.connected or bot.authFailed.

RemoveBot { botId }
→ Disconnect bot; emit bot.disconnected.

CreateTask { taskId?, playerSteamId64, item, priceMin, priceMax }
→ Emit task.created; TaskAssigner will emit task.assigned (round-robin).

DisposeTask { taskId, reason? }
→ Emit task.statusChanged('disposed').

ToggleAgent { chatId, enabled }
→ Emit chat.agentToggled.

SendMessage { chatId, text }
→ Send via Steam adapter (or stub); emit chat.messageSent.

Responses:

Success: 200 { ok: true }

Validation error: 400 { ok: false, error }

Execution errors (network/Steam): also surfaced as error.logged events to UI/logs.

## 10. Behavior & Workflows
### Task Assignment (round-robin)
 
Maintain eligibleBotIds (connected only).
 
Advance a single integer pointer = (pointer + 1) % eligible.length.
 
Skip bots that are disconnected or unhealthy.
 
### Invite Scheduler
 
Per-bot token bucket: 1 invite/minute.
 
On invite send → friendInvite.sent.
 
On acceptance → friendInvite.accepted → emit chat.started and allow dialog/PM actions.
 
On failure → friendInvite.failed with reason; task may go to failed or re-queued (MVP: mark failed and log).
 
### Scripted Dialog (3–5 steps)
 
Triggered after friendInvite.accepted if agentEnabled = true.
 
Send sequential messages, with simple pacing (e.g., delays of a few seconds).
 
Advance with dialogScript.advanced events; finish with dialogScript.completed.
 
If PM toggles agent off mid-conversation, the agent stops sending until re-enabled.
 
### Manual Takeover

agentEnabled = false halts the agent.

Operators can SendMessage as the bot at any time.

Toggling back to true allows the agent to resume when appropriate.

## 11. UI/UX Requirements (MVP)
### Bots View

Columns

| Column     | Notes                                             |
| ---------- | ------------------------------------------------- |
| bot id     | Internal identifier                                |
| steamId64  | Steam account ID                                   |
| label      | Optional display label                              |
| proxy      | Sticky proxy endpoint                               |
| status     | connecting, connected, disconnected, authFailed     |
| lastSeen   | Optional timestamp                                  |

Buttons

- Add via maFile
- Remove

### Tasks View

Columns

| Column          | Notes                             |
| --------------- | --------------------------------- |
| task id         | Internal identifier               |
| playerSteamId64 | Target player                     |
| item            | Target item                       |
| price range     | Min–Max                           |
| status          | created→assigned→...              |
| assigned bot    | Bot handling the task             |

Buttons

- CreateTask
- DisposeTask

### Multichat

- Left pane: chat list (bot + player handle, unread/new indicator).
- Right pane: message thread (reverse chronological), send box.
- Controls: Agent toggle, Send as bot.

### System Indicators

- SSE connection status (connected/reconnecting).
- Last error banner or panel (from error.logged).

### Performance UX Notes

- Snapshot may be large; display skeletons/spinners and incremental hydration if needed.
- Avoid freezing by applying incoming batches on animation frames or short micro-batches.

## 12. Data & Persistence
State store: In-memory Redux on backend; identical reducers on frontend (isomorphic).

Snapshots: Periodically write full state snapshot to disk (interval-based or on safe points).

Event logs: Append each outbound event (post-validation) as a line of JSON to events.ndjson with rotation policy.

Recovery: On process restart, load last snapshot; if missing, start empty. (No event replay in MVP.)

## 13. Operational Requirements
 
Process manager: PM2 single process (no cluster mode).
No special CI/CD pipeline; just push to GitHub and deploy to production.    
 
### SSE Server Setup

Headers: Content-Type: text/event-stream, Cache-Control: no-cache, no-transform, Connection: keep-alive.

Optional heartbeat comments :ping\n\n if needed by infra (MVP can omit).

OS limits: ensure sufficient file descriptors (ulimit -n) for many connections.

Proxy usage: ensure per-bot sticky proxy configured and monitored.

## 14. Security & Privacy
 
Secrets: .env for MVP; treat as risk. Rotate on leak; move to Vault/KMS in post-MVP.
 
Access: Operator console should be private (VPN/IP-allowed or basic auth).
 
Logging: Avoid logging secret fields (maFile contents, shared secrets). Only log minimal debug context.

## 15. Performance Targets (MVP)
 
| Metric                 | Target                                          |
| ---------------------- | ----------------------------------------------- |
| Scale                  | Up to 10,000 bots online; 100,000 active chats  |
| Event delivery latency | ≤ 1s from backend change to UI render           |
| Initial snapshot load  | ≤ ~10s; snapshot volume in tens of MB           |
| Invite throughput      | Enforced 1/min per bot                          |

## 16. Acceptance Criteria
 
Adding a valid maFile+proxy transitions bot to connected within ~10s; an event bot.connected is emitted and visible in all open UIs.
 
CreateTask emits task.created, then task.assigned by round-robin to a connected bot.

Per-bot invite rate never exceeds 1/min; friendInvite.sent is recorded for each invite.

Upon friendInvite.accepted, a chat is created (chat.started); if agent is enabled, it sends 3–5 scripted messages.

PM can toggle agentEnabled and send manual messages; agent respects the toggle immediately.

Two concurrent frontends see identical state within ≤1s (after events are emitted).

SSE reconnect provides fresh snapshot and resumes streaming.

events.ndjson contains all emitted events; critical errors are surfaced via error.logged and stderr.

## 17. Risks & Mitigations
 
Steam ToS/anti-abuse: use sticky proxies, strict rate limiting, conservative behaviors, monitoring/logging (mitigate flags).
 
Process crash: on-disk snapshots + append-only event logs for inspection/recovery.

Network flakiness: reconnect with full snapshot; no replay in MVP (accepted risk).

Memory pressure: avoid excessive message history in snapshot; store only last N per chat in initial state (UI can lazy-load later).

## 18. Post-MVP Roadmap
 
SSE replay buffer + watermark (Last-Event-ID) for lossless reconnect.
 
Idempotent commands with commandId and optimistic concurrency per aggregate.

Multi-instance backend with pub/sub (Redis or NATS) for fan-out and sharding.

Persist event streams to ClickHouse (event sourcing) and derive read models.

Proxy fleet management, health checks, automatic failover.

Operator authN/authZ roles; secrets migration to Vault/KMS.

UI enhancements: filters, search, tagging, basic funnel analytics.

## 19. Glossary
 
- **maFile** — Steam Guard mobile authenticator data (JSON) used to log in and confirm actions.
- **Round-robin** — simple cyclic assignment over eligible bots, skipping ineligible ones.
- **Snapshot** — full POJO state sent once over SSE when a client connects or reconnects.
- **Wire action** — event object sent over SSE; identical to Redux action (action === event, type === kind).
- **Isomorphic package** — shared TypeScript module (front + back) defining event schemas and creators.
- **Sticky proxy** — a dedicated proxy endpoint used by exactly one bot account.

## 20. Open Implementation Notes (MVP discipline)
 
Use effect-ts layers for adapters (Steam, storage) but keep business logic thin and predictable.

Build event creators in the isomorphic package and always emit through them to ensure validation and consistent meta.

Keep batch interval short (50–100ms) and apply on the client in small chunks to avoid UI frame drops.

For entity IDs, use typeid-js with slice prefixes; for meta.id, use a unique event id (uuid-like).

Limit initial chat history in snapshot (e.g., last 50 messages per chat) to control payload size.

