@echo off
REM Deploy all authentication fixes to GitHub
echo ========================================
echo Deploying All Authentication Fixes
echo ========================================
echo.

cd /d "C:\Users\liron\OneDrive\שולחן העבודה\New folder\ToDoFast2"

echo Checking git status...
git status

echo.
echo ========================================
echo Adding all changes...
git add -A

echo.
echo ========================================
echo Committing changes...
git commit -m "Fix: Authentication issues - Add CORS domain and VITE env vars"

echo.
echo ========================================
echo Pushing to GitHub...
git push

echo.
echo ========================================
echo ✅ All fixes deployed!
echo ========================================
echo.
echo Next steps:
echo 1. Go to https://railway.app
echo 2. Wait 5-10 minutes for deployment to complete
echo 3. Test login at https://lets-do-it.co.il or https://letsdoit-production-6d29.up.railway.app
echo 4. Try registering and logging in
echo.
pause
