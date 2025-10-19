@echo off
REM Deploy 403 Forbidden Fix to Railway Production

echo ========================================
echo Railway 403 Forbidden Fix - Deployment
echo ========================================
echo.

echo 1. Adding changes to git...
git add todofast/settings.py todo/api_views.py .env.production RAILWAY-403-FIX.md
echo ✓ Changes staged

echo.
echo 2. Committing changes...
git commit -m "Fix: 403 Forbidden errors on Railway production

- Add Railway domain (letsdoit-production-6d29.up.railway.app) to CORS_ALLOWED_ORIGINS
- Add Railway domain to CSRF_TRUSTED_ORIGINS  
- Explicitly save session after login in login_user()
- Explicitly save session after login in google_login()
- Fix SESSION_COOKIE_SECURE configuration variable
- Enable SESSION_SAVE_EVERY_REQUEST for proper persistence
- Add SESSION_COOKIE_SAMESITE = 'Lax' for cross-origin
- Update .env.production with SESSION_COOKIE_SECURE=True
- Add comprehensive fix documentation"

echo.
echo 3. Pushing to main branch...
git push origin main

echo.
echo ========================================
echo ✅ Deployment Started!
echo ========================================
echo.
echo Railway should automatically redeploy with these changes.
echo.
echo 📋 Changes Made:
echo   • Added Railway domain to CORS/CSRF config
echo   • Fixed session persistence after login
echo   • Updated session security settings for HTTPS
echo.
echo 🧪 After deployment, test:
echo   1. Navigate to https://letsdoit-production-6d29.up.railway.app
echo   2. Login with your credentials
echo   3. Check browser console for 403 errors
echo   4. Verify calendar and notifications work
echo.
echo 📖 Full documentation: RAILWAY-403-FIX.md
echo.
pause
