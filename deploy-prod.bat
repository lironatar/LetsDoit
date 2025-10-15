@echo off
echo ===== TodoFast Production Deployment Script =====
echo.

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found. Please run setup.bat first.
    pause
    exit /b 1
)

echo [1/8] Activating virtual environment...
call venv\Scripts\activate.bat

echo [2/8] Installing/updating Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies.
    pause
    exit /b 1
)

echo [3/8] Running Django migrations...
python manage.py migrate
if %errorlevel% neq 0 (
    echo ERROR: Database migration failed.
    pause
    exit /b 1
)

echo [4/8] Collecting static files...
python manage.py collectstatic --noinput
if %errorlevel% neq 0 (
    echo ERROR: Static files collection failed.
    pause
    exit /b 1
)

echo [5/8] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies.
    cd ..
    pause
    exit /b 1
)

echo [6/8] Building frontend for production...
call npm run build:prod
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed.
    cd ..
    pause
    exit /b 1
)
cd ..

echo [7/8] Collecting static files again (including frontend build)...
python manage.py collectstatic --noinput

echo [8/8] Creating logs directory...
if not exist "logs" mkdir logs

echo.
echo ===== Deployment Complete! =====
echo.
echo To start the production server:
echo 1. Make sure your .env file has production settings (DEBUG=False)
echo 2. Run: start-prod.bat
echo.
pause
