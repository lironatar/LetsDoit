@echo off
chcp 65001 >nul 2>&1
set PYTHONIOENCODING=utf-8

echo ========================================
echo   🚀 TodoFast Complete Startup Script
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo ❌ Virtual environment not found!
    echo Please run setup.bat first.
    pause
    exit /b 1
)

echo [1/4] 🔐 Starting ngrok tunnels...
start "ngrok Tunnels" cmd /k "ngrok start --all --config ngrok.yml"

echo [2/4] ⏳ Waiting for ngrok to initialize (10 seconds)...
timeout /t 10 /nobreak >nul

echo [3/4] 🐍 Starting Django backend server...
start "TodoFast Backend" cmd /k "chcp 65001 >nul 2>&1 && set PYTHONIOENCODING=utf-8 && call venv\Scripts\activate.bat && python manage.py runserver"

echo [4/4] ⚛️  Starting React frontend server...
timeout /t 2 /nobreak >nul
start "TodoFast Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo        ✅ Everything is Starting!
echo ========================================
echo.
echo 📋 Getting your ngrok URLs...
timeout /t 3 /nobreak >nul

powershell -Command "$urls = (curl http://localhost:4040/api/tunnels -UseBasicParsing | ConvertFrom-Json).tunnels; Write-Host ''; Write-Host '🌐 Your Public URLs:' -ForegroundColor Green; Write-Host ''; foreach($tunnel in $urls) { if($tunnel.name -eq 'frontend') { Write-Host '  Frontend: ' -NoNewline -ForegroundColor Cyan; Write-Host $tunnel.public_url -ForegroundColor Yellow } if($tunnel.name -eq 'backend') { Write-Host '  Backend:  ' -NoNewline -ForegroundColor Cyan; Write-Host $tunnel.public_url -ForegroundColor Yellow } }; Write-Host ''; Write-Host '📊 ngrok Dashboard: http://localhost:4040' -ForegroundColor Magenta; Write-Host ''"

echo.
echo ========================================
echo      📝 Important Next Steps
echo ========================================
echo.
echo 1. Copy the URLs above
echo 2. Run: update-ngrok-urls.bat
echo 3. Add URLs to Google OAuth Console
echo 4. Access your app from anywhere!
echo.
echo 🛑 To stop everything: run STOP-EVERYTHING.bat
echo.
pause
