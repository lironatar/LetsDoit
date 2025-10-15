@echo off
REM Set UTF-8 encoding for Windows console
chcp 65001 >nul 2>&1
set PYTHONIOENCODING=utf-8

echo ===== TodoFast Production Server =====
echo.

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found. Please run setup.bat first.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found. Please copy .env.example to .env and configure it.
    pause
    exit /b 1
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

echo [INFO] Checking if DEBUG is disabled...
python -c "from decouple import config; print('DEBUG=True - WARNING: Running in development mode!') if config('DEBUG', default=False, cast=bool) else print('DEBUG=False - Production mode enabled')"

echo [INFO] Starting production server with Waitress (Windows-compatible)...
echo Server will be available at: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

REM Start the server with waitress (Windows-compatible WSGI server)
waitress-serve --host=0.0.0.0 --port=8000 --threads=6 --connection-limit=100 todofast.wsgi:application

echo.
echo Server stopped.
pause
