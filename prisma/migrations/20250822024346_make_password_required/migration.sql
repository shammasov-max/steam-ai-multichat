/*
  Warnings:

  - Made the column `password` on table `bots` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "steam_id64" TEXT NOT NULL,
    "label" TEXT,
    "proxy_url" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "last_seen" DATETIME,
    "mafile_json" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_bots" ("created_at", "id", "label", "last_seen", "mafile_json", "password", "proxy_url", "status", "steam_id64", "updated_at") SELECT "created_at", "id", "label", "last_seen", "mafile_json", COALESCE("password", 'default_password'), "proxy_url", "status", "steam_id64", "updated_at" FROM "bots";
DROP TABLE "bots";
ALTER TABLE "new_bots" RENAME TO "bots";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
