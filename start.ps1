# TodoFast - Quick Start
# PowerShell Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TodoFast - Advanced Task Manager" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "❌ Virtual environment not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run run.ps1 or setup.bat first" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "🔧 Activating virtual environment..." -ForegroundColor Blue
& "venv\Scripts\Activate.ps1"

Write-Host ""
Write-Host "🚀 Starting TodoFast..." -ForegroundColor Blue
Write-Host ""
Write-Host "📱 Login credentials:" -ForegroundColor White
Write-Host "   Demo user: demo / demo123" -ForegroundColor Gray
Write-Host "   Admin user: admin / admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Website will be available at: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

python manage.py runserver
