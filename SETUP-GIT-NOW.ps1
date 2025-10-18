# Git Setup PowerShell Script
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Git Setup for Railway Deployment" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Initializing Git repository..." -ForegroundColor Yellow
git init
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Git initialized" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to initialize Git" -ForegroundColor Red
    pause
    exit 1
}
Write-Host ""

Write-Host "[2/3] Adding all files..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Files added" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to add files" -ForegroundColor Red
    pause
    exit 1
}
Write-Host ""

Write-Host "[3/3] Creating commit..." -ForegroundColor Yellow
git commit -m "Fix Railway deployment - remove UTF-8 issues"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Commit created" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create commit" -ForegroundColor Red
    pause
    exit 1
}
Write-Host ""

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Git Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Create GitHub repository:" -ForegroundColor White
Write-Host "   https://github.com/new" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Then run these commands (replace YOUR-USERNAME):" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/YOUR-USERNAME/todofast.git" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Deploy on Railway:" -ForegroundColor White
Write-Host "   https://railway.app" -ForegroundColor Cyan
Write-Host ""

pause
