$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$pgBin = "C:\Program Files\PostgreSQL\18\bin"
$pgData = Join-Path $root ".pgdata"

Write-Host "=== 1. Verificando instancia PostgreSQL 18 (Puerto 5433) ===" -ForegroundColor Cyan
if (!(Test-Path $pgData)) {
    & "$pgBin\initdb.exe" -D $pgData -U postgres -A trust --encoding=UTF8 --locale=C
}

$pgRunning = Get-NetTCPConnection -LocalPort 5433 -State Listen -ErrorAction SilentlyContinue
if (!$pgRunning) {
    Start-Process -FilePath "$pgBin\postgres.exe" -ArgumentList "-D `"$pgData`" -p 5433" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

$dbExists = & "$pgBin\psql.exe" -h localhost -p 5433 -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='mineralflow'"
if ($dbExists -ne "1") {
    & "$pgBin\createdb.exe" -h localhost -p 5433 -U postgres mineralflow
}

Write-Host "=== 2. Aplicando migraciones Prisma y datos ficticios de demostracion ===" -ForegroundColor Cyan
Set-Location (Join-Path $root "backend")
npx prisma migrate deploy
npm run db:seed

Write-Host "✅ Base de datos PostgreSQL 18 lista en localhost:5433/mineralflow" -ForegroundColor Green

