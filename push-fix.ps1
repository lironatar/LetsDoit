# Quick fix push script
Write-Host ""
Write-Host "🔧 Pushing Railway fix to GitHub..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repo
if (!(Test-Path ".git")) {
    Write-Host "❌ Not a git repository!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run: git init" -ForegroundColor Yellow
    Write-Host "Then run this script again." -ForegroundColor Yellow
    pause
    exit 1
}

# Add the fixed files
Write-Host "📁 Adding fixed files..." -ForegroundColor Yellow
git add railway.json build.sh Procfile

# Check if there are changes
$status = git status --short
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "✓ No changes to commit" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your repository is already up to date!" -ForegroundColor Green
    pause
    exit 0
}

# Commit
Write-Host "💾 Creating commit..." -ForegroundColor Yellow
git commit -m "Fix Railway deployment - simplify build process"

# Push
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Railway will now automatically redeploy with the fix!" -ForegroundColor Cyan
    Write-Host "Check your Railway dashboard to monitor the deployment." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you've set up the remote:" -ForegroundColor Yellow
    Write-Host "  git remote add origin https://github.com/YOUR-USERNAME/todofast.git" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "And try: git push -u origin main" -ForegroundColor Cyan
}

Write-Host ""
pause
