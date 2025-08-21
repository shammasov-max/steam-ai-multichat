# Steam Multichat MVP

**Next.js RSC + Server Actions · SQLite · Real Steam (maFile + proxies) · Typesafe · ≤1 msg/sec**

## Core Requirements

### Features
- **Bots**: Add/remove (maFile+proxy), connect, status tracking
- **Tasks**: Create/dispose for players, auto-assign via round-robin, friend invites (1/min/bot)
- **Chats**: List/thread view, manual messages, agent toggle (3-5 scripted messages)
- **Polling**: 1-2s refresh, `?since=` for messages

### Tech Stack
- Next.js App Router (RSC + Server Actions)
- SQLite (Prisma/Drizzle)
- Zod validation
- In-process Steam sessions
- No: Redux, OpenAPI, CQRS, WebSockets

### Database
- `bots`: id, steam_id64, label, proxy_url, status, last_seen, mafile_json
- `tasks`: id, player_steam_id64, item, price_min/max, status, assigned_bot_id
- `task_targets`, `task_preconditions`: 1:1 with tasks
- `friend_requests`: bot_id, player_steam_id64, status
- `chats`: bot_id, player_steam_id64, agent_enabled
- `messages`: chat_id, from, text, ts

### API
**Server Actions**: addBot, removeBot, connectBot, createTask, disposeTask, toggleAgent, sendMessage
**Routes**: GET /api/{bots,tasks,chats,chats/:id,chats/:id/messages}

### Behaviors
- Auto-connect bots on boot
- Round-robin task assignment
- Invite pacing (1/min/bot)
- Agent: 3-5 messages on accept if enabled
- Polling-based UI updates

### Constraints
- ≤1 msg/sec throughput
- Internal use (no auth)
- Docker deployment
- SQLite persistence