# TodoFast - Advanced Task Manager
# PowerShell Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TodoFast - Advanced Task Manager" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python is installed: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ from: https://python.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "🔧 Creating virtual environment..." -ForegroundColor Blue
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error creating virtual environment" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "✅ Virtual environment exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Blue
& "venv\Scripts\Activate.ps1"

Write-Host ""
Write-Host "📦 Installing packages..." -ForegroundColor Blue
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error installing packages" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✅ Packages installed successfully" -ForegroundColor Green

Write-Host ""
Write-Host "🗃️  Setting up database..." -ForegroundColor Blue
python manage.py makemigrations
python manage.py migrate

Write-Host ""
Write-Host "👤 Creating demo users..." -ForegroundColor Blue
python manage.py create_demo_data

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 TodoFast is ready to run!" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Login credentials:" -ForegroundColor White
Write-Host "   Demo user: demo / demo123" -ForegroundColor Gray
Write-Host "   Admin user: admin / admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "👥 Additional test users:" -ForegroundColor White
Write-Host "   alice@todofast.com / alice123" -ForegroundColor Gray
Write-Host "   bob@todofast.com / bob123" -ForegroundColor Gray
Write-Host "   charlie@todofast.com / charlie123" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Website will be available at: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔄 Starting server..." -ForegroundColor Blue
Write-Host ""

python manage.py runserver
