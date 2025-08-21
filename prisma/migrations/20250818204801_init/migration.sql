-- CreateTable
CREATE TABLE "bots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "steam_id64" TEXT NOT NULL,
    "label" TEXT,
    "proxy_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "last_seen" DATETIME,
    "mafile_json" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "player_steam_id64" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "price_min" REAL NOT NULL,
    "price_max" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "assigned_bot_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tasks_assigned_bot_id_fkey" FOREIGN KEY ("assigned_bot_id") REFERENCES "bots" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "task_targets" (
    "task_id" TEXT NOT NULL PRIMARY KEY,
    "target_type" TEXT NOT NULL,
    "target_payload" TEXT NOT NULL,
    "success_criteria" TEXT NOT NULL,
    CONSTRAINT "task_targets_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "task_preconditions" (
    "task_id" TEXT NOT NULL PRIMARY KEY,
    "require_friendship" BOOLEAN NOT NULL DEFAULT true,
    "script_id" TEXT,
    CONSTRAINT "task_preconditions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "friend_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bot_id" TEXT NOT NULL,
    "player_steam_id64" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "friend_requests_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bot_id" TEXT NOT NULL,
    "player_steam_id64" TEXT NOT NULL,
    "agent_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "chats_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chat_id" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "ts" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "chats_bot_id_player_steam_id64_key" ON "chats"("bot_id", "player_steam_id64");
