@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════
echo   Git Setup - Step 1
echo ═══════════════════════════════════════════════════
echo.

echo [1/3] Initializing Git...
git init
if errorlevel 1 goto error
echo ✓ Done
echo.

echo [2/3] Adding files...
git add .
if errorlevel 1 goto error
echo ✓ Done
echo.

echo [3/3] Creating commit...
git commit -m "Fix Railway deployment - remove UTF-8 issues"
if errorlevel 1 goto error
echo ✓ Done
echo.

echo ═══════════════════════════════════════════════════
echo   ✅ Git Setup Complete!
echo ═══════════════════════════════════════════════════
echo.
echo NEXT STEPS:
echo.
echo 1. Create GitHub repository at: https://github.com/new
echo 2. Run: .\2-push-github.bat
echo.
pause
exit /b 0

:error
echo.
echo ❌ Error occurred!
echo.
pause
exit /b 1
