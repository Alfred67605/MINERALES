$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

& (Join-Path $PSScriptRoot "iniciar-base-datos.ps1")

Write-Host "=== 3. Iniciando Backend API (Fastify :3001) ===" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; npm start"

Write-Host "=== 4. Iniciando Frontend Web (Vite :5173) ===" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"

Write-Host "✅ MineralFlow en ejecucion:" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173"
Write-Host "   Backend:  http://localhost:3001/api/health"

