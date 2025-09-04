# RDP - Steam Multichat - AI Facilitated

## Table of Contents
- [RDP - Steam Multichat - AI Facilitated](#rdp---steam-multichat---ai-facilitated)
  - [Table of Contents](#table-of-contents)
  - [1. Objective & Summary](#1-objective--summary)
  - [2. Users & Use Cases](#2-users--use-cases)
    - [Primary Users](#primary-users)
    - [Top Use Cases](#top-use-cases)
  - [3. Scope (MVP Feature Set)](#3-scope-mvp-feature-set)
  - [4. Non-Goals](#4-non-goals)
  - [5. Constraints & Policies](#5-constraints--policies)
  - [6. Architecture Overview](#6-architecture-overview)
    - [Code structure and tech stack](#code-structure-and-tech-stack)
    - [Event/Command/Actions](#eventcommandactions)
    - [Data Flow (CQRS-lite via SSE)](#data-flow-cqrs-lite-via-sse)
  - [7. Slices (Entities)](#7-slices-entities)
    - [Account](#account)
    - [Dialog](#dialog)
    - [System](#system)
  - [8. Event Contract (Isomorphic, action === event)](#8-event-contract-isomorphic-action--event)
  - [9. Commands](#9-commands)
  - [10. Behavior & Workflows](#10-behavior--workflows)
    - [Dialog Assignment (round-robin)](#dialog-assignment-round-robin)
    - [Invite Scheduler](#invite-scheduler)
    - [AI-Powered Dialog](#ai-powered-dialog)
    - [Manual Takeover](#manual-takeover)
  - [11. UI/UX Requirements (MVP)](#11-uiux-requirements-mvp)
    - [Accounts View](#accounts-view)
    - [Dialogs View](#dialogs-view)
    - [Multichat](#multichat)
    - [System Indicators](#system-indicators)
    - [Performance UX Notes](#performance-ux-notes)
  - [12. Data & Persistence](#12-data--persistence)
  - [13. Operational Requirements](#13-operational-requirements)
    - [SSE Server Setup](#sse-server-setup)
  - [14. Security & Privacy](#14-security--privacy)
  - [15. Performance Targets (MVP)](#15-performance-targets-mvp)
  - [16. Acceptance Criteria](#16-acceptance-criteria)
  - [17. Risks & Mitigations](#17-risks--mitigations)
  - [18. Post-MVP Roadmap](#18-post-mvp-roadmap)
  - [19. Glossary](#19-glossary)
  - [20. Open Implementation Notes (MVP discipline)](#20-open-implementation-notes-mvp-discipline)

## 1. Objective & Summary
Build a web-based operations console that automates conversations between Steam accounts and real players via Steam Friends & Chat with AI-powered dialog assessment. The system targets developers and project managers, prioritizing interface predictability, fast feedback, and operational stability.

**MVP goals:**

Connect large numbers of Steam accounts (eventual scale: up to 10,000 concurrently online).

Manage AI-powered dialogs with comprehensive assessment scoring and operator alerts.

Automatically send friend invites and conduct intelligent conversations with goal tracking.

Provide a multichat inbox with manual takeover (agent on/off, send message as account).

Establish a simple, reliable evented data contract (isomorphic package; action === event).

Out of scope for MVP: payments, escrow, external markets, fraud/AML, multi-instance clustering, replay streams.

## 2. Users & Use Cases
### Primary Users

Developer (Dev): connects accounts using maFile, configures proxies, monitors stability, inspects logs.

Project Manager / Operator (PM): monitors conversations, manages dialogs, manually takes over chats when needed.

### Top Use Cases

- Incrementally import and connect hundreds/thousands of accounts.
- Create dialogs with AI assessment, scoring factors, and goal tracking.
- Dispatch friend invites at a strict rate (≤1 per minute per account).
- AI-powered dialog after friendship acceptance with assessment scoring; PM can disable/enable agent and send messages manually.
- View and manage all active conversations in a single multichat inbox with operator alerts.
- Run continuously with always-online accounts; tolerate reconnects without losing operational state.

## 3. Scope (MVP Feature Set)
Account onboarding: Add/remove Steam account using maFile JSON and sticky proxy (1 account ↔ 1 proxy).

Dialog lifecycle: Create/manage dialogs with AI assessment; auto-assign dialogs round-robin to available accounts.

Invites & dialog: Auto friend-invite ≤1/min per account; start chat after acceptance; AI-powered conversation with assessment.

Multichat with manual control: Toggle agent per dialog; send operator messages as the account.

Realtime data flow: SSE snapshot followed by event batches; action === event; Redux store isomorphic (front/back).

Server logs: Append-only events.ndjson; MongoDB for event store and snapshots.

## 4. Non-Goals
Payment orchestration and escrow.

External marketplace integrations.

Multi-region redundancy and HA.

Hard data durability guarantees beyond snapshots + ndjson.

SSE replay buffers (reconnect = fresh snapshot).

Command idempotency/concurrency control (reserved for later).

## 5. Constraints & Policies
Platform: Steam Friends & Chat only; use unofficial npm packages for Steam connectivity.

Authentication: accounts connect using maFile (Steam Guard mobile authenticator data provided as JSON).

Connectivity: always-online for all accounts in MVP.

Proxy policy: 1 account ↔ 1 sticky proxy (minimize anti-spam/anti-abuse flags).

Rate limit: 1 invite per minute per account (strict).

Assignment policy: round-robin, skipping offline/unhealthy accounts.

Timestamps: UTC, ms epoch everywhere.

IDs: typeid-js with slice prefix (e.g., account_*, dialog_*).

Initial load: Accept up to ~10s snapshot time; snapshot may be tens of MB.

> Note: Unofficial Steam access and outside-of-Steam trade negotiations carry ToS risks. MVP logs, proxy hygiene, and rate limits are used to mitigate (not eliminate) risks.

## 6. Architecture Overview
Items marked with #mvp are pragmatic compromises for speed. We will refactor these areas in the next iteration.

### Code structure and tech stack
Monorepo — based on Yarn workspaces.
There are five primary packages in the monorepo:

1. frontend: React SPA + Tailwind CSS   
2. server: Node.js + Effect-TS (functional orchestration), SSE + HTTP routes
3. isomorphic: shared functions and types about Event-driven architecture, Redux state layer
4. steam-api: Effect-TS based Steam utilities
5. dialogs: AI-powered dialog management with OpenAI integration
6. db: MongoDB database layer with event sourcing
7. google-sheets-db: Google Sheets as database adapter

### Event/Command/Actions
Some of redux actions are events; 
Some of redux actions co creators/thunks are commands.
Reducers are event handlers (aggregates).
- Prefer simple, Redux-style naming over strict Event Sourcing/CQRS/DDD conventions.
- Use slice names (plural) for collections like dialogs and accounts; singular structures follow the same slice naming. use createEntitySlice for entities.
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

### Account

Fields: { id, steamId64, label?, proxyUrl, status, lastSeen?, maFile? }

AccountStatus: connecting | connected | disconnected | authFailed

### Dialog

Fields: { 
  id, 
  accountId, 
  playerSteamId64, 
  agentEnabled: boolean, 
  messages: Msg[], 
  assessment?: {
    continuationScore: number (0-1)
    trend: 'rising' | 'stable' | 'declining'
    factors: {
      userEngagement: number
      topicRelevance: number
      emotionalTone: number
      responseQuality: number
      goalProximity: number
    }
    issuesDetected?: Issue[]
    operatorAlert?: Alert
  },
  language: 'zh' | 'ja' | 'ko' | 'en' | 'es',
  goal?: string,
  tokensUsed?: number
}

Msg: { id, from: 'account'|'player', text, ts }

### System

Fields: { roundRobin: { pointer, eligibleAccountIds[] }, rateLimits: { [accountId]: { lastInviteAt? } } }

## 8. Event Contract (Isomorphic, action === event)
All events are Redux actions with shape { type, payload, meta }.
type === kind. meta includes { schemaVersion: 1, id, ts, kind, aggregate, ... }.

System

snapshot — { state } (SSE-first message only)

Accounts

connected — { accountId }

disconnected — { accountId }

authFailed — { accountId, reason }

Dialogs

created — { dialogId, accountId, playerSteamId64, goal?, language }

started — { dialogId, accountId, playerSteamId64 }

messageReceived — { dialogId, from: 'player'|'account', text }

messageSent — { dialogId, text }

agentToggled — { dialogId, enabled }

assessmentUpdated — { dialogId, assessment }

operatorAlertTriggered — { dialogId, alert }

Friend Invites

friendInvite.sent — { accountId, playerSteamId64 }

friendInvite.accepted — { accountId, playerSteamId64 }

friendInvite.failed — { accountId, playerSteamId64, reason }

Dialog AI

dialogAI.assessed — { dialogId, assessment }

dialogAI.goalCompleted — { dialogId }

Errors

error.logged — { message, context? }

Batching: Backend pushes event: batch with { events: WireAction[] } at ~50–100ms intervals.
Reconnect: Backend sends a fresh snapshot and resumes event batches (no replay in MVP).

## 9. Commands
HTTP POST /api/command
AddAccountFromMaFile { maFileJSON, proxyUrl, label? }
→ Connect account (always-online). Emits account.connected or account.authFailed.

RemoveAccount { accountId }
→ Disconnect account; emit account.disconnected.

CreateDialog { accountId?, playerSteamId64, goal?, language? }
→ Emit dialog.created; DialogAssigner will emit dialog.started (round-robin).

ToggleAgent { dialogId, enabled }
→ Emit dialog.agentToggled.

SendMessage { dialogId, text }
→ Send via Steam adapter (or stub); emit dialog.messageSent.

Responses:

Success: 200 { ok: true }

Validation error: 400 { ok: false, error }

Execution errors (network/Steam): also surfaced as error.logged events to UI/logs.

## 10. Behavior & Workflows
### Dialog Assignment (round-robin)
 
Maintain eligibleAccountIds (connected only).
 
Advance a single integer pointer = (pointer + 1) % eligible.length.
 
Skip accounts that are disconnected or unhealthy.
 
### Invite Scheduler
 
Per-account token bucket: 1 invite/minute.
 
On invite send → friendInvite.sent.
 
On acceptance → friendInvite.accepted → emit dialog.started and allow dialog/PM actions.
 
On failure → friendInvite.failed with reason; dialog may go to failed or re-queued (MVP: mark failed and log).
 
### AI-Powered Dialog
 
Triggered after friendInvite.accepted if agentEnabled = true.
 
Uses OpenAI GPT-4 for intelligent conversation with:
- Multi-language support (zh, ja, ko, en, es)
- Context compression after 10 messages
- Goal tracking and progress assessment
- Real-time scoring of conversation health
- Issue detection (rejection, topic drift, aggression)
- Automatic operator alerts when score drops below threshold
 
Assessment factors:
- User engagement (0-1)
- Topic relevance (0-1)
- Emotional tone (0-1)
- Response quality (0-1)
- Goal proximity (0-1)

If PM toggles agent off mid-conversation, the agent stops sending until re-enabled.
 
### Manual Takeover

agentEnabled = false halts the agent.

Operators can SendMessage as the account at any time.

Toggling back to true allows the agent to resume when appropriate.

## 11. UI/UX Requirements (MVP)
### Accounts View

Columns

| Column     | Notes                                             |
| ---------- | ------------------------------------------------- |
| account id | Internal identifier                               |
| steamId64  | Steam account ID                                  |
| label      | Optional display label                            |
| proxy      | Sticky proxy endpoint                             |
| status     | connecting, connected, disconnected, authFailed   |
| lastSeen   | Optional timestamp                                |

Buttons

- Add via maFile
- Remove

### Dialogs View

Columns

| Column          | Notes                             |
| --------------- | --------------------------------- |
| dialog id       | Internal identifier               |
| accountId       | Account handling the dialog      |
| playerSteamId64 | Target player                     |
| language        | Detected/set language             |
| score           | Continuation score (0-1)          |
| trend           | Rising/stable/declining           |
| alert           | Operator alert status             |
| messages        | Count of messages                 |
| status          | Active/completed/failed           |

Buttons

- CreateDialog
- ViewDetails
- TakeControl

### Multichat

- Left pane: dialog list (account + player handle, unread/new indicator, assessment score).
- Right pane: message thread (reverse chronological), send box, assessment details.
- Controls: Agent toggle, Send as account, View assessment factors.
- Alerts: Prominent display of operator alerts with urgency level.

### System Indicators

- SSE connection status (connected/reconnecting).
- Last error banner or panel (from error.logged).
- Active dialogs count with score distribution.
- Alert queue for operator attention.

### Performance UX Notes

- Snapshot may be large; display skeletons/spinners and incremental hydration if needed.
- Avoid freezing by applying incoming batches on animation frames or short micro-batches.
- Prioritize display of critical alerts and low-scoring dialogs.

## 12. Data & Persistence
State store: In-memory Redux on backend; identical reducers on frontend (isomorphic).

Database: MongoDB for event store and snapshots, with indexes for efficient querying.

Snapshots: Periodically write full state snapshot to MongoDB (interval-based or on safe points).

Event logs: Append each outbound event (post-validation) as a document to MongoDB events collection.

Recovery: On process restart, load last snapshot from MongoDB; if missing, start empty. (No event replay in MVP.)

## 13. Operational Requirements
 
Process manager: PM2 single process (no cluster mode).
No special CI/CD pipeline; just push to GitHub and deploy to production.    
 
### SSE Server Setup

Headers: Content-Type: text/event-stream, Cache-Control: no-cache, no-transform, Connection: keep-alive.

Optional heartbeat comments :ping\n\n if needed by infra (MVP can omit).

OS limits: ensure sufficient file descriptors (ulimit -n) for many connections.

Proxy usage: ensure per-account sticky proxy configured and monitored.

## 14. Security & Privacy
 
Secrets: .env for MVP; treat as risk. Rotate on leak; move to Vault/KMS in post-MVP.
 
Access: Operator console should be private (VPN/IP-allowed or basic auth).
 
Logging: Avoid logging secret fields (maFile contents, shared secrets). Only log minimal debug context.

## 15. Performance Targets (MVP)
 
| Metric                 | Target                                          |
| ---------------------- | ----------------------------------------------- |
| Scale                  | Up to 10,000 accounts online; 100,000 active dialogs |
| Event delivery latency | ≤ 1s from backend change to UI render          |
| Initial snapshot load  | ≤ ~10s; snapshot volume in tens of MB          |
| Invite throughput      | Enforced 1/min per account                     |
| AI response time       | ≤ 8s for dialog message processing             |
| Assessment calculation | ≤ 3s per dialog update                         |

## 16. Acceptance Criteria
 
Adding a valid maFile+proxy transitions account to connected within ~10s; an event account.connected is emitted and visible in all open UIs.
 
CreateDialog emits dialog.created, then dialog.started by round-robin to a connected account.

Per-account invite rate never exceeds 1/min; friendInvite.sent is recorded for each invite.

Upon friendInvite.accepted, a dialog is created (dialog.started); if agent is enabled, it conducts AI-powered conversation.

AI assessment updates in real-time with scoring factors visible in UI.

Operator alerts trigger immediately when continuation score drops below threshold.

PM can toggle agentEnabled and send manual messages; agent respects the toggle immediately.

Two concurrent frontends see identical state within ≤1s (after events are emitted).

SSE reconnect provides fresh snapshot and resumes streaming.

MongoDB contains all emitted events; critical errors are surfaced via error.logged and stderr.

## 17. Risks & Mitigations
 
Steam ToS/anti-abuse: use sticky proxies, strict rate limiting, conservative behaviors, monitoring/logging (mitigate flags).
 
Process crash: MongoDB snapshots + event store for recovery.

Network flakiness: reconnect with full snapshot; no replay in MVP (accepted risk).

Memory pressure: avoid excessive message history in snapshot; store only last N per dialog in initial state (UI can lazy-load later).

AI service failures: exponential backoff retry, fallback to manual mode, operator alerts.

## 18. Post-MVP Roadmap
 
SSE replay buffer + watermark (Last-Event-ID) for lossless reconnect.
 
Idempotent commands with commandId and optimistic concurrency per aggregate.

Multi-instance backend with pub/sub (Redis or NATS) for fan-out and sharding.

Enhanced AI models with fine-tuning on successful conversations.

Automated learning from high-scoring dialogs to improve future conversations.

Proxy fleet management, health checks, automatic failover.

Operator authN/authZ roles; secrets migration to Vault/KMS.

UI enhancements: filters, search, tagging, basic funnel analytics, AI performance dashboard.

## 19. Glossary
 
- **maFile** — Steam Guard mobile authenticator data (JSON) used to log in and confirm actions.
- **Round-robin** — simple cyclic assignment over eligible accounts, skipping ineligible ones.
- **Snapshot** — full POJO state sent once over SSE when a client connects or reconnects.
- **Wire action** — event object sent over SSE; identical to Redux action (action === event, type === kind).
- **Isomorphic package** — shared TypeScript module (front + back) defining event schemas and creators.
- **Sticky proxy** — a dedicated proxy endpoint used by exactly one account.
- **Continuation score** — 0-1 value indicating conversation health and likelihood of success.
- **Assessment factors** — Five key metrics (engagement, relevance, tone, quality, proximity) used to calculate score.
- **Operator alert** — Automatic notification when dialog needs human intervention.

## 20. Open Implementation Notes (MVP discipline)
 
Use effect-ts layers for adapters (Steam, storage, AI) but keep business logic thin and predictable.

Build event creators in the isomorphic package and always emit through them to ensure validation and consistent meta.

Keep batch interval short (50–100ms) and apply on the client in small chunks to avoid UI frame drops.

For entity IDs, use typeid-js with slice prefixes; for meta.id, use a unique event id (uuid-like).

Limit initial dialog history in snapshot (e.g., last 50 messages per dialog) to control payload size.

Monitor OpenAI API usage and costs; implement token tracking per dialog.

Cache AI assessments to reduce API calls; update only on significant changes.

Implement graceful degradation when AI service is unavailable.