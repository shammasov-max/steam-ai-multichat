# Clear and reinstall ClickHouse database schema for Steam Bot (Windows PowerShell)

Write-Host "🧹 Clearing ClickHouse database..." -ForegroundColor Cyan

# Check if ClickHouse is running
$clickhouseRunning = docker ps --format "table {{.Names}}" | Select-String "steam-bot-clickhouse"

if (-not $clickhouseRunning) {
    Write-Host "❌ ClickHouse container is not running. Starting docker-compose..." -ForegroundColor Red
    docker-compose up -d clickhouse
    Write-Host "⏳ Waiting for ClickHouse to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Clear existing data
Write-Host "🗑️  Dropping existing tables..." -ForegroundColor Yellow
docker exec steam-bot-clickhouse clickhouse-client --query="DROP TABLE IF EXISTS steam_bot.events"
docker exec steam-bot-clickhouse clickhouse-client --query="DROP TABLE IF EXISTS steam_bot.snapshots"

# Recreate tables
Write-Host "🔄 Recreating tables with fresh schema..." -ForegroundColor Yellow
Get-Content scripts\clickhouse-init.sql | docker exec -i steam-bot-clickhouse clickhouse-client --multiquery

Write-Host "✅ Database cleared and schema reinstalled successfully!" -ForegroundColor Green
Write-Host "📊 Verifying tables:" -ForegroundColor Cyan
docker exec steam-bot-clickhouse clickhouse-client --query="SHOW TABLES FROM steam_bot"

Write-Host "🎉 Ready for development!" -ForegroundColor Green