@echo off
echo ========================================
echo    TodoFast - Advanced Task Manager
echo ========================================
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

REM Check if virtual environment exists
if not exist "venv" (
    echo 🔧 Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Error creating virtual environment
        pause
        exit /b 1
    )
    echo ✅ Virtual environment created
) else (
    echo ✅ Virtual environment exists
)

echo.
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo 📦 Installing packages...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Error installing packages
    pause
    exit /b 1
)
echo ✅ Packages installed successfully

echo.
echo 🗃️  Setting up database...
python manage.py makemigrations
python manage.py migrate

echo.
echo 👤 Creating demo users...
python manage.py create_demo_data

echo.
echo ========================================
echo 🚀 TodoFast is ready to run!
echo ========================================
echo.
echo 📱 Login credentials:
echo    Demo user: demo / demo123
echo    Admin user: admin / admin123
echo.
echo 👥 Additional test users:
echo    alice@todofast.com / alice123
echo    bob@todofast.com / bob123
echo    charlie@todofast.com / charlie123
echo.
echo 🌐 Website will be available at: http://127.0.0.1:8000
echo.
echo ⚠️  Press Ctrl+C to stop the server
echo.
echo 🔄 Starting server...
echo.

python manage.py runserver
