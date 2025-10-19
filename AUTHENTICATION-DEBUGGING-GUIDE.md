# Authentication Debugging Guide

You're having issues with login and registration on Railway. Let's troubleshoot step by step.

## Step 1: Get Error Details from Browser

**CRITICAL**: We need to know the exact error message. Please follow these steps:

1. **Open your Railway deployment**: https://letsdoit-production-6d29.up.railway.app
2. **Open Developer Tools**: Press `F12` or `Ctrl+Shift+I`
3. **Go to the Console tab**
4. **Try to login or register**
5. **Look for red error messages and take a screenshot** (or copy the text)
6. **Also check the Network tab**:
   - Click on the Network tab
   - Try to login again
   - Look for any failed requests (marked in red)
   - Click on those requests to see the response
7. **Share with me**:
   - The console error message
   - The Network tab response
   - The HTTP status code (200, 400, 401, 403, 404, 500, etc.)

## Step 2: Check if the Build was Deployed

Your latest build script changes might not be deployed yet. Let's verify:

1. Go to https://railway.app
2. Click on your **ToDoFast** project
3. Go to **Deployments** tab
4. Click on the **latest deployment**
5. Look for the Build Logs
6. Search for "Using Google Client ID"
7. **Screenshot this** so we can see what client ID (if any) is being used

## Step 3: Check Railway Environment Variables

1. Go to https://railway.app → Your project → Service → **Variables** tab
2. Verify these are set:
   - `GOOGLE_OAUTH2_CLIENT_ID` (should have a value starting with numbers)
   - `GOOGLE_OAUTH2_CLIENT_SECRET` (should have a value)
   - `SECRET_KEY` (should have a value)
   - `ALLOWED_HOSTS` (should include your domains)
3. **Screenshot** the variables (hide actual values if sharing publicly)

## Step 4: Test API Endpoint Directly

Try accessing the API directly to see if it's working:

**Test 1: Basic connectivity**
```
https://letsdoit-production-6d29.up.railway.app/api/csrf-token/
```
Should return something like:
```json
{"csrf_token": "xxxxx..."}
```

**Test 2: Registration (will fail, but shows endpoint works)**
```
POST to: https://letsdoit-production-6d29.up.railway.app/api/auth/register/
Body: {"email":"test@example.com","password":"TestPass123"}
```
Should return a response (error or success, either shows the endpoint works)

## Step 5: Check if it's a Frontend Build Issue

1. **Open the site**: https://letsdoit-production-6d29.up.railway.app
2. **Right-click → View Page Source**
3. Look for the `<script>` tags
4. Search for `VITE_` in the page source
5. If you see `undefined` or missing variables, the build didn't inject env vars properly

## Common Issues and Solutions

### ❌ Issue: "Cannot POST /api/auth/register/"
**Status**: 404
**Cause**: API routes not found
**Solution**: 
- Check deployment logs
- Verify Django app started successfully
- Check ALLOWED_HOSTS includes your domain

### ❌ Issue: "Network Error" or "Failed to fetch"
**Cause**: CORS issue or API not accessible
**Solution**:
- Check CORS settings in Django
- Verify the API domain is accessible
- Check CSRF token is being sent

### ❌ Issue: "Missing required parameter: client_id" 
**Cause**: `VITE_GOOGLE_OAUTH_CLIENT_ID` not injected
**Solution**:
- Check build logs show "Using Google Client ID: 850305..."
- If shows "undefined", Railway vars aren't set

### ❌ Issue: "Invalid credentials" on login
**Cause**: User doesn't exist or password wrong
**Solution**:
- Make sure user is registered first
- Check email/password are lowercase
- Try registering a new test account

### ❌ Issue: Registration succeeds but then redirects to login with "verify email"
**Cause**: This is NORMAL!
**Solution**:
- Check your email for verification link
- Verify your email
- Then try logging in again

## What to Share With Me

Run these tests and share:

1. **Browser Console Error** (screenshot or text)
2. **Network Tab Failed Requests** (screenshot showing the error response)
3. **Railway Deployment Status** (screenshot showing latest deployment)
4. **Railway Variables** (screenshot with hidden sensitive values)
5. **Result of CSRF token test** (did the endpoint work?)
6. **Result of registration test** (what was the response status?)

## Quick Diagnostic Commands

If you have access to your local machine, you can test from there:

**Test 1: Ping the server**
```bash
curl -v https://letsdoit-production-6d29.up.railway.app/
```

**Test 2: Test CSRF endpoint**
```bash
curl https://letsdoit-production-6d29.up.railway.app/api/csrf-token/
```

**Test 3: Test registration**
```bash
curl -X POST https://letsdoit-production-6d29.up.railway.app/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```

## Next Steps

1. ✅ Try the steps above
2. ✅ Collect the error information
3. ✅ Share the results with me
4. I'll diagnose and fix the specific issue

**Do NOT:** Share actual passwords or private keys even if asked!
