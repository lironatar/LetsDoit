@echo off
chcp 65001 >nul 2>&1

echo ========================================
echo   🔄 Auto-Update ngrok URLs
echo ========================================
echo.

echo Fetching ngrok tunnel information...
echo.

powershell -ExecutionPolicy Bypass -File update-ngrok-urls.ps1

echo.
echo ✅ Configuration updated!
echo.
echo Next steps:
echo 1. Restart your servers (close and rerun START-EVERYTHING.bat)
echo 2. Add the URLs to Google OAuth Console
echo.
pause
