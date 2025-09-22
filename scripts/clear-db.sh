#!/bin/bash

# Clear and reinstall ClickHouse database schema for Steam Bot

set -e

echo "🧹 Clearing ClickHouse database..."

# Check if ClickHouse is running
if ! docker ps | grep -q steam-bot-clickhouse; then
    echo "❌ ClickHouse container is not running. Starting docker-compose..."
    docker-compose up -d clickhouse
    echo "⏳ Waiting for ClickHouse to be ready..."
    sleep 10
fi

# Clear existing data
echo "🗑️  Dropping existing tables..."
docker exec steam-bot-clickhouse clickhouse-client --query="DROP TABLE IF EXISTS steam_bot.events"
docker exec steam-bot-clickhouse clickhouse-client --query="DROP TABLE IF EXISTS steam_bot.snapshots"

# Recreate tables
echo "🔄 Recreating tables with fresh schema..."
docker exec steam-bot-clickhouse clickhouse-client --multiquery < scripts/clickhouse-init.sql

echo "✅ Database cleared and schema reinstalled successfully!"
echo "📊 Verifying tables:"
docker exec steam-bot-clickhouse clickhouse-client --query="SHOW TABLES FROM steam_bot"

echo "🎉 Ready for development!"