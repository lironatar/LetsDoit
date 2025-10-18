# Quick script to push Railway fixes
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔧 Pushing Railway Deployment Fixes" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if in a git repo
if (!(Test-Path ".git")) {
    Write-Host "❌ Not a git repository!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Setting up Git now..." -ForegroundColor Yellow
    git init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to initialize git" -ForegroundColor Red
        pause
        exit 1
    }
    Write-Host "✓ Git initialized" -ForegroundColor Green
    Write-Host ""
}

# Add the fixed files
Write-Host "📁 Adding fixed files..." -ForegroundColor Yellow
Write-Host "   - requirements.txt (added Pillow)" -ForegroundColor Gray
Write-Host "   - build.sh (improved build process)" -ForegroundColor Gray
Write-Host "   - railway.json" -ForegroundColor Gray

git add requirements.txt build.sh railway.json

# Check if there are changes
$status = git status --short
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host ""
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Yellow
    Write-Host "Files are already up to date!" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 0
}

Write-Host "✓ Files staged" -ForegroundColor Green
Write-Host ""

# Commit
Write-Host "💾 Creating commit..." -ForegroundColor Yellow
git commit -m "Fix Railway deployment - add Pillow and improve build"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Commit created" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create commit" -ForegroundColor Red
    pause
    exit 1
}
Write-Host ""

# Check if remote exists
$remotes = git remote
if ([string]::IsNullOrWhiteSpace($remotes)) {
    Write-Host "⚠️  No remote repository configured!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You need to set up GitHub first:" -ForegroundColor Yellow
    Write-Host "1. Create repo at: https://github.com/new" -ForegroundColor Cyan
    Write-Host "2. Run: git remote add origin YOUR_REPO_URL" -ForegroundColor Cyan
    Write-Host "3. Run: git push -u origin main" -ForegroundColor Cyan
    Write-Host ""
    pause
    exit 0
}

# Push
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  ✅ Successfully Pushed!" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎯 Railway will now automatically redeploy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Monitor deployment at:" -ForegroundColor Yellow
    Write-Host "https://railway.app/dashboard" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Expected build time: 5-7 minutes" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Look for success messages:" -ForegroundColor Yellow
    Write-Host "  ✓ Installing Python dependencies..." -ForegroundColor Gray
    Write-Host "  ✓ Building frontend..." -ForegroundColor Gray
    Write-Host "  ✓ Collecting static files..." -ForegroundColor Gray
    Write-Host "  ✓ Build complete!" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible reasons:" -ForegroundColor Yellow
    Write-Host "1. Need to set upstream branch: git push -u origin main" -ForegroundColor Cyan
    Write-Host "2. Authentication required (use Personal Access Token)" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host ""
pause
