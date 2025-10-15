@echo off
echo ========================================
echo   🛑 Stopping All TodoFast Services
echo ========================================
echo.

echo Stopping Django backend (port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo Stopping Vite frontend (port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo Stopping ngrok tunnels...
taskkill /f /im ngrok.exe >nul 2>&1

echo Stopping Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo ✅ All services stopped!
echo.
pause
