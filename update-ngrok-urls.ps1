# Fetch ngrok tunnel information
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels"
    $tunnels = $response.tunnels
    
    $frontendUrl = ($tunnels | Where-Object { $_.name -eq "frontend" }).public_url
    $backendUrl = ($tunnels | Where-Object { $_.name -eq "backend" }).public_url
    
    if (-not $frontendUrl -or -not $backendUrl) {
        Write-Host "❌ Could not find ngrok URLs. Make sure ngrok is running!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Found ngrok URLs:" -ForegroundColor Green
    Write-Host "  Frontend: $frontendUrl" -ForegroundColor Cyan
    Write-Host "  Backend:  $backendUrl" -ForegroundColor Cyan
    Write-Host ""
    
    # Extract backend hostname
    $backendHost = ([System.Uri]$backendUrl).Host
    $frontendHost = ([System.Uri]$frontendUrl).Host
    
    # Update frontend/src/services/api.js
    Write-Host "📝 Updating frontend API configuration..." -ForegroundColor Yellow
    $apiFile = "frontend\src\services\api.js"
    $apiContent = Get-Content $apiFile -Raw
    $apiContent = $apiContent -replace "return 'https://YOUR-BACKEND-NGROK-URL\.ngrok-free\.app/api'", "return '$backendUrl/api'"
    Set-Content $apiFile -Value $apiContent -NoNewline
    
    # Update todofast/settings.py - Add to CORS_ALLOWED_ORIGINS
    Write-Host "📝 Updating Django CORS settings..." -ForegroundColor Yellow
    $settingsFile = "todofast\settings.py"
    $settingsContent = Get-Content $settingsFile -Raw
    
    # Replace the placeholder with actual ngrok URLs
    $ngrokUrls = "    `"$frontendUrl`",  # ngrok frontend`n    `"$backendUrl`",  # ngrok backend`n    # ngrok URLs - auto-updated by update-ngrok-urls.bat"
    $settingsContent = $settingsContent -replace '    # ngrok URLs - auto-updated by update-ngrok-urls\.bat', $ngrokUrls
    
    Set-Content $settingsFile -Value $settingsContent -NoNewline
    
    # Update .env - Add to ALLOWED_HOSTS
    Write-Host "📝 Updating .env ALLOWED_HOSTS..." -ForegroundColor Yellow
    $envFile = ".env"
    $envContent = Get-Content $envFile
    
    $newEnvContent = @()
    foreach ($line in $envContent) {
        if ($line -match "^ALLOWED_HOSTS=") {
            # Add backend host to ALLOWED_HOSTS
            if ($line -notmatch [regex]::Escape($backendHost)) {
                $line = $line.TrimEnd() + ",$backendHost"
            }
        }
        $newEnvContent += $line
    }
    
    Set-Content $envFile -Value $newEnvContent
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ All configurations updated!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Add these to Google OAuth Console:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Authorized JavaScript origins:" -ForegroundColor Yellow
    Write-Host "  $frontendUrl"
    Write-Host "  $backendUrl"
    Write-Host ""
    Write-Host "Authorized redirect URIs:" -ForegroundColor Yellow
    Write-Host "  $backendUrl/api/auth/google-login/"
    Write-Host "  $frontendUrl/auth/callback"
    Write-Host ""
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "Make sure ngrok is running (run START-EVERYTHING.bat first)" -ForegroundColor Yellow
    exit 1
}
