@echo off
REM Set UTF-8 encoding for Windows console
chcp 65001 >nul 2>&1
set PYTHONIOENCODING=utf-8

title TodoFast - Start Both Servers
echo ========================================
echo      TodoFast Development Servers
echo ========================================
echo.

REM Quick validation
if not exist "venv\Scripts\activate.bat" (
    echo ❌ Virtual environment not found!
    echo Please run setup.bat first or deploy-prod.bat
    echo.
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ❌ Frontend not found!
    echo.
    pause
    exit /b 1
)

REM Ask user preference
echo Choose how to run the servers:
echo.
echo [1] Separate windows (recommended)
echo [2] Single window (frontend in foreground)
echo [3] Cancel
echo.
set /p choice="Enter choice (1-3): "

if "%choice%"=="3" goto :eof
if "%choice%"=="2" goto single_window
if not "%choice%"=="1" (
    echo Invalid choice, using separate windows...
)

:separate_windows
echo.
echo 🚀 Starting servers in separate windows...

REM Start Django backend
echo [1/2] Starting Django backend server...
start "TodoFast Backend - Port 8000" cmd /k "chcp 65001 >nul 2>&1 && set PYTHONIOENCODING=utf-8 && call venv\Scripts\activate.bat && echo Backend server starting... && python manage.py runserver"

REM Wait for Django
timeout /t 2 /nobreak >nul

REM Start React frontend
echo [2/2] Starting React frontend server...
start "TodoFast Frontend - Port 5173" cmd /k "cd frontend && echo Frontend server starting... && npm run dev"

echo.
echo ✅ Both servers started in separate windows!
goto :show_info

:single_window
echo.
echo 🚀 Starting servers in single window...
set PYTHONIOENCODING=utf-8
call venv\Scripts\activate.bat

echo [1/2] Starting Django backend (background)...
start /b python manage.py runserver

echo [2/2] Starting React frontend (foreground)...
timeout /t 3 /nobreak >nul
cd frontend
echo.
echo ✅ Backend running in background, frontend starting...
npm run dev
goto :eof

:show_info
echo.
echo ========================================
echo           🌐 Server Information
echo ========================================
echo.
echo Frontend (Development):  http://localhost:5173
echo Backend (API):          http://localhost:8000
echo Admin Panel:            http://localhost:8000/admin
echo.
echo 📝 To stop servers:
echo    - Close the Backend and Frontend windows, OR
echo    - Run: stop-dev.bat
echo.
echo 🔧 Other options:
echo    - Production mode: start-prod.bat
echo    - Status check: check-prod-status.bat
echo.
pause
