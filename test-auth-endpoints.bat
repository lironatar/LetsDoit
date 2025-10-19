@echo off
REM Test Railway Authentication Endpoints
echo ========================================
echo Testing Railway Auth Endpoints
echo ========================================

setlocal enabledelayedexpansion

REM Test URL
set URL=https://letsdoit-production-6d29.up.railway.app

echo.
echo 1. Testing basic connectivity...
curl -I %URL%/ -m 10

echo.
echo 2. Testing CSRF token endpoint...
curl %URL%/api/csrf-token/ -H "Content-Type: application/json" -m 10

echo.
echo 3. Testing registration endpoint...
curl -X POST %URL%/api/auth/register/ ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"TestPass123\"}" ^
  -m 10

echo.
echo 4. Testing login endpoint...
curl -X POST %URL%/api/auth/login/ ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"wrongpass\"}" ^
  -m 10

echo.
echo Test complete!
pause
