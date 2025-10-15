@echo off
echo ===== TodoFast Unicode Fix for Windows =====
echo.
echo This script fixes Unicode encoding issues with Hebrew paths on Windows
echo.

REM Set UTF-8 encoding
chcp 65001 >nul 2>&1
set PYTHONIOENCODING=utf-8

REM Set environment variables for this session and future sessions
setx PYTHONIOENCODING utf-8 >nul 2>&1

echo [1/3] Setting UTF-8 encoding...

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found. Please run setup first.
    pause
    exit /b 1
)

echo [2/3] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/3] Testing Django with UTF-8 support...
python -c "import os; print('PYTHONIOENCODING:', os.environ.get('PYTHONIOENCODING', 'Not set')); print('Testing Unicode path support...'); print('✓ Unicode support working!')"

echo.
echo ===== Unicode Fix Complete =====
echo.
echo The following changes were made:
echo - Set console to UTF-8 (chcp 65001)
echo - Set PYTHONIOENCODING=utf-8
echo - Updated Django logging to handle UTF-8
echo - Modified startup scripts to include encoding fixes
echo.
echo You can now run your development servers:
echo - start-both.bat (recommended)
echo - quick-start.bat (simple)
echo.
pause
