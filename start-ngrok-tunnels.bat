@echo off
echo ========================================
echo     TodoFast ngrok Tunnel Setup
echo ========================================
echo.

echo Starting ngrok tunnels for external access...
echo.

REM Start ngrok for frontend (port 5173)
echo [1/2] Starting ngrok tunnel for FRONTEND (port 5173)...
start "ngrok Frontend" cmd /k "ngrok http 5173"

REM Wait for first tunnel to initialize
timeout /t 3 /nobreak >nul

REM Start ngrok for backend (port 8000)
echo [2/2] Starting ngrok tunnel for BACKEND (port 8000)...
start "ngrok Backend" cmd /k "ngrok http 8000"

echo.
echo ========================================
echo     Tunnels Starting!
echo ========================================
echo.
echo Open in your browser to see URLs:
echo   Frontend Dashboard: http://localhost:4040
echo   Backend Dashboard:  http://localhost:4041
echo.
echo Wait a few seconds, then:
echo 1. Check the dashboards for your public URLs
echo 2. Update Google OAuth with the URLs
echo 3. Update frontend API to use the backend ngrok URL
echo.
pause
