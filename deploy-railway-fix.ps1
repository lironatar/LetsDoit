# Deploy 403 Forbidden Fix to Railway Production

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Railway 403 Forbidden Fix - Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Adding changes to git..." -ForegroundColor Yellow
git add todofast/settings.py todo/api_views.py .env.production RAILWAY-403-FIX.md
Write-Host "✓ Changes staged" -ForegroundColor Green

Write-Host ""
Write-Host "2. Committing changes..." -ForegroundColor Yellow
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

Write-Host ""
Write-Host "3. Pushing to main branch..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Deployment Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Railway should automatically redeploy with these changes." -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Changes Made:" -ForegroundColor Magenta
Write-Host "   • Added Railway domain to CORS/CSRF config"
Write-Host "   • Fixed session persistence after login"
Write-Host "   • Updated session security settings for HTTPS"
Write-Host ""

Write-Host "🧪 After deployment, test:" -ForegroundColor Magenta
Write-Host "   1. Navigate to https://letsdoit-production-6d29.up.railway.app"
Write-Host "   2. Login with your credentials"
Write-Host "   3. Check browser console for 403 errors"
Write-Host "   4. Verify calendar and notifications work"
Write-Host ""

Write-Host "📖 Full documentation: RAILWAY-403-FIX.md" -ForegroundColor Magenta
Write-Host ""
