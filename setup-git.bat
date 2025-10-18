@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ╔═══════════════════════════════════════════════════╗
echo ║  Git Setup for Railway Deployment                ║
echo ╚═══════════════════════════════════════════════════╝
echo.

:: Navigate to the script's directory (project root)
cd /d "%~dp0"

echo [1/6] Initializing Git repository...
if exist ".git" (
    echo ✓ Git already initialized
) else (
    git init
    echo ✓ Git initialized
)
echo.

echo [2/6] Creating .gitattributes for UTF-8...
echo * text=auto eol=lf > .gitattributes
echo *.bat text eol=crlf >> .gitattributes
echo ✓ Created .gitattributes
echo.

echo [3/6] Adding files to Git...
git add .
echo ✓ Files added
echo.

echo [4/6] Creating initial commit...
git commit -m "Fix Railway deployment - remove UTF-8 issues"
echo ✓ Commit created
echo.

echo [5/6] Checking for remote repository...
git remote -v
echo.

echo ════════════════════════════════════════════════════
echo.
echo ✅ Git setup complete!
echo.
echo 📝 NEXT STEPS:
echo.
echo    1. Create a new repository on GitHub:
echo       https://github.com/new
echo.
echo    2. Run this command with YOUR GitHub repo URL:
echo       git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
echo.
echo    3. Push to GitHub:
echo       git branch -M main
echo       git push -u origin main
echo.
echo    4. Deploy on Railway:
echo       https://railway.app
echo.
echo ════════════════════════════════════════════════════
echo.
pause
