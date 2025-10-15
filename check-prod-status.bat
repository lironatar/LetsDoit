@echo off
echo ===== TodoFast Production Status Check =====
echo.

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found. Please run setup.bat first.
    pause
    exit /b 1
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

echo [INFO] Checking configuration...
python -c "from decouple import config; import os; print('=== Environment Configuration ==='); print('DEBUG:', config('DEBUG', default=True, cast=bool)); print('ALLOWED_HOSTS:', config('ALLOWED_HOSTS', default='localhost,127.0.0.1')); print('SECRET_KEY:', 'SET' if config('SECRET_KEY', default='') else 'NOT SET'); print('DATABASE: SQLite (' + ('db.sqlite3' if os.path.exists('db.sqlite3') else 'NOT FOUND') + ')'); print('Frontend build:', 'EXISTS' if os.path.exists('frontend/dist/index.html') else 'NOT BUILT'); print('Static files:', 'COLLECTED' if os.path.exists('staticfiles') else 'NOT COLLECTED'); print('Logs directory:', 'EXISTS' if os.path.exists('logs') else 'NOT CREATED')"

echo.
echo [INFO] Checking server status...
netstat -an | findstr :8000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Server is running on port 8000
) else (
    echo ❌ Server is not running on port 8000
)

echo.
pause
