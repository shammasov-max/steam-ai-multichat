# Steam Multichat MVP - Detailed Page Descriptions

## 1. **Home Page** (`/` - `app/page.tsx`)

### UI Elements
- **Header**: "Steam Multichat System" title with subtitle
- **Grid Layout**: 2x2 grid of navigation cards
- **Cards**: Bots, Tasks, Chats, Settings sections with descriptions

### Data Displayed
- Static navigation interface (no dynamic data)
- Descriptive text for each section

### Server Actions
- None (static page)

---

## 2. **Bots Management** (`/bots` - `app/bots/page.tsx`)

### UI Elements
- **View Mode Switch**: Toggle control to switch between Cards List and AG-Grid Table views

- **Add Bot Form**:
  - Textarea for maFile JSON content
  - Input for proxy URL (format: `http://user:pass@proxy:port`)
  - Input for optional label
  - Input for required password
  - Submit button (disabled if required fields missing)

- **Bots Display**:
  - **Cards List View**: Grid of bot cards with visual status indicators
  - **AG-Grid Table View**: Professional data table with sorting, filtering, and column management
  - Columns: ID (truncated), Steam ID64, Label, Proxy, Status, Last Seen, Actions
  - Status badges with color coding
  - Connect button (when disconnected)
  - Remove button

### Data Displayed
- `Bot[]` from `/api/bots` (auto-refreshes every 2s)
- Bot status: `connected`, `connecting`, `authFailed`, `disconnected`
- Timestamps formatted as locale strings
- Truncated IDs and proxy URLs for space

### Server Actions
- `addBot(input: AddBotInput)` - Creates new bot from maFile
- `removeBot(input: RemoveBotInput)` - Deletes bot and disconnects session
- `connectBot(input: ConnectBotInput)` - Initiates Steam connection

### Data Flow
1. Form submission → Server action → Database update → Page revalidation
2. Auto-polling fetches updated bot list every 2 seconds
3. Steam session manager handles actual connections

---

## 3. **Tasks Management** (`/tasks` - `app/tasks/page.tsx`)

### UI Elements
- **View Mode Switch**: Toggle control to switch between Cards List and AG-Grid Table views

- **Create Task Form**:
  - Grid layout with Player Steam ID64, Item name, Min/Max price inputs
  - Submit button with validation

- **Tasks Display**:
  - **Cards List View**: Grid of task cards with visual status and progress indicators
  - **AG-Grid Table View**: Professional data table with sorting, filtering, and column management
  - Columns: ID, Player ID, Item, Price Range, Status, Assigned Bot, Created, Actions
  - Color-coded status badges
  - Dispose button (hidden for resolved/disposed tasks)

### Data Displayed
- `Task[]` from `/api/tasks` (auto-refreshes every 2s)
- Task statuses: `created`, `assigned`, `invited`, `accepted`, `resolved`, `failed`, `disposed`
- Price ranges formatted as `$min - $max`
- Assigned bot label or Steam ID64

### Server Actions
- `createTask(input: CreateTaskInput)` - Creates task with target and preconditions
- `disposeTask(input: DisposeTaskInput)` - Marks task as disposed

### Data Flow
1. Task creation includes:
   - Target: `buy_item` type with item/price payload
   - Preconditions: `requireFriendship: true`
2. Round-robin assignment happens automatically
3. Tasks progress through status lifecycle

---

## 4. **Chats List** (`/chats` - `app/chats/page.tsx`)

### UI Elements
- **View Mode Switch**: Toggle control to switch between Cards List and AG-Grid Table views

- **Chats Display**:
  - **Cards List View**: Grid of chat cards with visual indicators and quick actions
  - **AG-Grid Table View**: Professional data table with sorting, filtering, and column management
  - Player Steam ID64 as title/column
  - Bot label/Steam ID64 as subtitle/column
  - Agent status toggle indicator
  - Message count
  - Last updated timestamp
  - Clickable navigation to individual chat

### Data Displayed
- `Chat[]` from `/api/chats` (auto-refreshes every 2s)
- Agent enabled/disabled status
- Message counts via `_count.messages`
- Updated timestamps

### Server Actions
- None (read-only list)

### Data Flow
- Auto-polling for chat list updates
- Links to individual chat pages with chat ID

---

## 5. **Individual Chat** (`/chats/[id]` - `app/chats/[id]/page.tsx`)

### UI Elements
- **Header**:
  - Back button to chats list
  - Player Steam ID64 title
  - Bot information subtitle
  - Agent toggle button

- **Message Area**:
  - Scrollable chat history (500px height)
  - Message bubbles with bot/player distinction
  - Icons for bot (Bot icon) and player (User icon)
  - Timestamps for each message

- **Input Area**:
  - Text input for new messages
  - Send button
  - Enter key submission

### Data Displayed
- `Chat` with nested `messages[]` from `/api/chats/[id]`
- Messages sorted by timestamp (newest first, displayed reverse)
- Real-time message polling via `/api/chats/[id]/messages?since=timestamp`
- Limited to 50 recent messages

### Server Actions
- `toggleAgent(input: ToggleAgentInput)` - Enables/disables AI agent
- `sendMessage(input: SendMessageInput)` - Sends message via Steam

### Data Flow
1. Initial chat load with full message history
2. Polling for new messages every 1.5s using `?since=` parameter
3. Message sending through Steam session manager
4. Real-time UI updates with optimistic rendering

---

## 6. **Settings** (`/settings` - `app/settings/page.tsx`)

### UI Elements
- **Configuration Cards**:
  - Friend request rate limits (1/minute per bot)
  - Message throughput (≤1 msg/sec system-wide)
  - Agent message count (3-5 messages)
  - Polling intervals (1-2 seconds)

- **Proxy Configuration**:
  - Warning about sticky proxy requirements
  - Format example: `http://username:password@proxy.host:port`

- **Database Status**:
  - SQLite location display
  - Active status indicator

### Data Displayed
- Static configuration values
- System constraints and limits
- Database connection status

### Server Actions
- None (read-only configuration display)

---

## API Routes Summary

### GET Routes
- `/api/bots` - Returns all bots with status
- `/api/tasks` - Returns all tasks with assigned bot info
- `/api/chats` - Returns all chats with message counts
- `/api/chats/[id]` - Returns specific chat with messages
- `/api/chats/[id]/messages?since=timestamp` - Returns new messages

### Server Actions (POST via form actions)
- **Bots**: `addBot`, `removeBot`, `connectBot`
- **Tasks**: `createTask`, `disposeTask`  
- **Chats**: `toggleAgent`, `sendMessage`

### Key Technical Features
1. **Real-time polling**: 1-2 second intervals across all pages
2. **Optimistic updates**: Form submissions trigger immediate revalidation
3. **Rate limiting**: Built-in constraints for Steam API compliance
4. **Session management**: In-process Steam connections with proxy support
5. **Auto-assignment**: Round-robin task distribution to available bots
6. **Dual view modes**: All list pages support both Cards and AG-Grid table views with persistent user preference