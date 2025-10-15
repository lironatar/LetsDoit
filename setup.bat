@echo off
echo ========================================
echo    TodoFast - Initial Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed
    echo.
    echo Please install Python 3.8+ from: https://python.org
    echo Make sure to add Python to PATH
    echo.
    pause
    exit /b 1
)

echo ✅ Python is installed
python --version
echo.

REM Create virtual environment
echo 🔧 Creating virtual environment...
if exist "venv" (
    echo ⚠️  Virtual environment already exists
    set /p choice="Delete and recreate? (y/n): "
    if /i "%choice%"=="y" (
        rmdir /s /q venv
        python -m venv venv
        echo ✅ Virtual environment recreated
    ) else (
        echo ℹ️  Using existing environment
    )
) else (
    python -m venv venv
    echo ✅ Virtual environment created
)

echo.
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo 📦 Updating pip...
python -m pip install --upgrade pip

echo.
echo 📦 Installing packages...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Error installing packages
    echo.
    echo Try running:
    echo   pip install --upgrade pip
    echo   pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)
echo ✅ Packages installed successfully

echo.
echo 🗃️  Creating migrations...
python manage.py makemigrations
if errorlevel 1 (
    echo ❌ Error creating migrations
    pause
    exit /b 1
)

echo.
echo 🗃️  Running migrations...
python manage.py migrate
if errorlevel 1 (
    echo ❌ Error running migrations
    pause
    exit /b 1
)

echo.
echo 👤 Creating admin user...
python manage.py createsuperuser --username admin --email admin@todofast.com --noinput
if errorlevel 1 (
    echo ⚠️  Admin user already exists
) else (
    echo ✅ Admin user created
)

echo.
echo 👤 Creating demo data...
python manage.py create_demo_data
if errorlevel 1 (
    echo ⚠️  Error creating demo data
) else (
    echo ✅ Demo data created
)

echo.
echo 📁 Collecting static files...
python manage.py collectstatic --noinput
if errorlevel 1 (
    echo ⚠️  Error collecting static files
) else (
    echo ✅ Static files collected
)

echo.
echo ========================================
echo ✅ TodoFast setup completed successfully!
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
echo 🚀 To run the application:
echo    Windows: run.bat
echo    Linux/Mac: ./run.sh
echo.
echo 🌐 Website will be available at: http://127.0.0.1:8000
echo.
pause
