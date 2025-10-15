@echo off
echo ===== Stopping TodoFast Development Servers =====
echo.

echo [INFO] Stopping Django development server (port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    if not "%%a"=="" (
        taskkill /f /pid %%a >nul 2>&1
        if !errorlevel! equ 0 echo - Django server stopped
    )
)

echo [INFO] Stopping Vite development server (port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    if not "%%a"=="" (
        taskkill /f /pid %%a >nul 2>&1
        if !errorlevel! equ 0 echo - Vite server stopped
    )
)

echo [INFO] Stopping Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo [INFO] Stopping Python processes (manage.py)...
wmic process where "commandline like '%%manage.py runserver%%'" delete >nul 2>&1

echo.
echo ===== Development servers stopped =====
echo.
pause
