@echo off
REM Set UTF-8 encoding for Windows console
chcp 65001 >nul 2>&1
set PYTHONIOENCODING=utf-8

echo ===== TodoFast Development Servers =====
echo.

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found. Please run setup.bat first.
    pause
    exit /b 1
)

echo [INFO] Starting development servers...
echo.

REM Start Django backend in a new window
echo [1/2] Starting Django backend server (http://localhost:8000)...
start "TodoFast Backend" cmd /k "chcp 65001 >nul 2>&1 && set PYTHONIOENCODING=utf-8 && venv\Scripts\activate && python manage.py runserver"

REM Wait a moment for Django to start
timeout /t 3 /nobreak >nul

REM Start React frontend in a new window
echo [2/2] Starting React frontend server (http://localhost:5173)...
start "TodoFast Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===== Both servers starting! =====
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window (servers will keep running)
echo To stop servers: Close the Backend and Frontend windows
echo.
pause
