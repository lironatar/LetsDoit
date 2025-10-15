@echo off
echo ===== TodoFast Development Servers (Single Window) =====
echo.

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found. Please run setup.bat first.
    pause
    exit /b 1
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

echo [INFO] Starting Django backend server in background...
start /b python manage.py runserver >nul 2>&1

echo [INFO] Waiting for Django to start...
timeout /t 4 /nobreak >nul

echo [INFO] Starting React frontend server...
echo.
echo ===== Servers Status =====
echo Backend:  http://localhost:8000 (running in background)
echo Frontend: http://localhost:5173 (starting...)
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start frontend in foreground (this will show the output)
cd frontend
npm run dev
