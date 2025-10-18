@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════
echo   Push to GitHub - Step 2
echo ═══════════════════════════════════════════════════
echo.

set /p REPO_URL="Enter your GitHub repository URL: "
if "%REPO_URL%"=="" (
    echo ❌ No URL provided!
    pause
    exit /b 1
)

echo.
echo Adding remote repository...
git remote add origin %REPO_URL%
echo.

echo Setting branch to main...
git branch -M main
echo.

echo Pushing to GitHub...
echo (You may need to enter your GitHub credentials)
git push -u origin main
if errorlevel 1 (
    echo.
    echo ❌ Push failed!
    echo.
    echo TIP: Use a Personal Access Token as password
    echo Create at: https://github.com/settings/tokens
    echo.
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════
echo   ✅ Pushed to GitHub Successfully!
echo ═══════════════════════════════════════════════════
echo.
echo NEXT: Deploy on Railway
echo   1. Go to: https://railway.app
echo   2. Connect your GitHub repo
echo   3. Add environment variables
echo   4. Deploy!
echo.
pause
