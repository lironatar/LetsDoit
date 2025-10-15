@echo off
REM Set UTF-8 encoding for Windows console
chcp 65001 >nul 2>&1
set PYTHONIOENCODING=utf-8

REM Simple script to run both frontend and backend - no frills!
echo Starting TodoFast Development...
echo.

REM Backend
start "Backend" cmd /k "chcp 65001 >nul 2>&1 && set PYTHONIOENCODING=utf-8 && venv\Scripts\activate && python manage.py runserver"

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Frontend  
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Servers starting:
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
pause
