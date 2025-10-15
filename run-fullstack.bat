@echo off
echo ========================================
echo    TodoFast - Development Environment
echo ========================================
echo.
echo Choose your development setup:
echo 1. Full setup (first time use)
echo 2. Quick start (if already set up)
echo.
set /p choice="Enter your choice (1-2): "
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed
    echo Please install Python 3.8+ from: https://python.org
    pause
    exit /b 1
)

echo ✅ Python is installed
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed
    echo Please install Node.js from: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js is installed
echo.

REM Setup Django Backend
echo 🔧 Setting up Django backend...
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -r requirements.txt

echo.
echo 🗃️  Setting up database...
python manage.py makemigrations
python manage.py migrate
python manage.py create_demo_data

echo.
echo 📦 Setting up React frontend...
cd frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
)

echo.
echo ========================================
echo 🚀 Starting Full Stack Application
echo ========================================
echo.
echo 📱 Login credentials:
echo    Demo user: demo / demo123
echo    Admin user: admin / admin123
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔗 Backend API: http://localhost:8000/api/
echo ⚙️  Admin: http://localhost:8000/admin/
echo.
echo ⚠️  Press Ctrl+C to stop both servers
echo.

REM Start both servers
start "Django Backend" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && python manage.py runserver"
start "React Frontend" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo.
echo 🎉 Both servers are starting...
echo.
echo Frontend will open at: http://localhost:5173
echo Backend API available at: http://localhost:8000/api/
echo.
pause
