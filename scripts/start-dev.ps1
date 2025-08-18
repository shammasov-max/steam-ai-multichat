# Development setup script for Steam Bot with ClickHouse

Write-Host "🚀 Starting Steam Bot development environment..." -ForegroundColor Cyan

# Start ClickHouse
Write-Host "📦 Starting ClickHouse container..." -ForegroundColor Yellow
docker-compose up -d clickhouse

# Wait for ClickHouse to be ready
Write-Host "⏳ Waiting for ClickHouse to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check ClickHouse health
$healthCheck = docker exec steam-bot-clickhouse clickhouse-client --query="SELECT 1"
if ($healthCheck -eq "1") {
    Write-Host "✅ ClickHouse is ready!" -ForegroundColor Green
} else {
    Write-Host "❌ ClickHouse is not responding" -ForegroundColor Red
    exit 1
}

# Test database connection
Write-Host "🧪 Testing database connection..." -ForegroundColor Yellow
npx tsx scripts/test-db.ts

Write-Host "🎉 Development environment is ready!" -ForegroundColor Green
Write-Host "💡 Next steps:" -ForegroundColor Cyan
Write-Host "   - Run 'yarn dev' to start the server" -ForegroundColor White
Write-Host "   - Use 'scripts/clear-db.ps1' to reset the database" -ForegroundColor White
Write-Host "   - Check ClickHouse at http://localhost:8123/play" -ForegroundColor White