@echo off
title TodoFast - Task Manager

echo ========================================
echo    TodoFast - Advanced Task Manager
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo ❌ Virtual environment not found
    echo.
    echo Please run setup.bat first
    echo.
    pause
    exit /b 1
)

echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo 🚀 Starting TodoFast...
echo.
echo 📱 Login credentials:
echo    Demo user: demo / demo123
echo    Admin user: admin / admin123
echo.
echo 🌐 Website will be available at: http://127.0.0.1:8000
echo.
echo ⚠️  Press Ctrl+C to stop the server
echo.

python manage.py runserver
