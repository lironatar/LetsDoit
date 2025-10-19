# 🔧 Google OAuth Railway Fix - Quick Start

## Your Issue
Google login button on Railway shows:
```
הגישה חסומה: שגיאת הרשאה
Missing required parameter: client_id
שגיאה 400: invalid_request
```

## What We Fixed
✅ Updated `build.sh` to properly export `VITE_GOOGLE_OAUTH_CLIENT_ID` during Railway build
✅ Created deployment guide

## Quick Fix Steps (3 steps, 5 minutes)

### Step 1: Push Code Fix
Run this batch file:
```
push-google-fix.bat
```

Or manually:
```bash
git add -A
git commit -m "Fix: Add VITE_GOOGLE_OAUTH_CLIENT_ID export to build script for Railway production"
git push
```

### Step 2: Set Railway Environment Variables
1. Go to https://railway.app
2. Open your **ToDoFast** project
3. Click your service → **Variables** tab
4. Add these variables:

```
GOOGLE_OAUTH2_CLIENT_ID=850305689345-kmnhkiqqte2nr8cct2anfgmnkd5cm89t.apps.googleusercontent.com
GOOGLE_OAUTH2_CLIENT_SECRET=XXXXXXXXXXXXXXXXXXX
```

(Get these from your Google Console OAuth credentials)

### Step 3: Wait for Deployment
- Railway will auto-rebuild with the new variables
- Check Deployments tab to monitor
- Once complete, test the Google login button

## What Changed in the Code

### build.sh (BEFORE)
```bash
cd frontend
npm install --legacy-peer-deps
npm run build:prod
```

### build.sh (AFTER)
```bash
cd frontend

# Export VITE environment variables for the frontend build
export VITE_GOOGLE_OAUTH_CLIENT_ID=${GOOGLE_OAUTH2_CLIENT_ID}

echo "Using Google Client ID: ${VITE_GOOGLE_OAUTH_CLIENT_ID}"

npm install --legacy-peer-deps
npm run build:prod
```

## Why This Works

1. **Before**: Railway had `GOOGLE_OAUTH2_CLIENT_ID` but frontend build didn't know about it
2. **After**: Build script exports it as `VITE_GOOGLE_OAUTH_CLIENT_ID` which Vite can access
3. **Result**: The client ID gets baked into the production frontend at build time

## Troubleshooting

### ❌ Still getting "Missing required parameter: client_id"?

**Check 1: Railway Variables Set?**
- Go to Railway dashboard → Your service → Variables
- Do you see `GOOGLE_OAUTH2_CLIENT_ID` set to your actual ID?
- If empty or placeholder, update it now

**Check 2: Deployment Complete?**
- Go to Deployments tab
- Is the latest deployment marked as "Success"?
- If still deploying, wait for completion

**Check 3: Build Logs**
- Click on latest deployment
- Scroll to Build Logs
- Look for: `Using Google Client ID: 850305689345-...`
- If you see `undefined`, env var isn't set properly

**Check 4: Browser Cache**
- Hard refresh page: `Ctrl+Shift+R` or `Cmd+Shift+R`
- Old version might be cached

### ❌ Getting different Google error?

Make sure your Google OAuth credential has correct redirect URIs:
- `https://letsdoit-production-6d29.up.railway.app/api/auth/google-login/`
- `https://lets-do-it.co.il/api/auth/google-login/`
- `https://letsdoit-production-6d29.up.railway.app`
- `https://lets-do-it.co.il`

## Files Modified
- ✅ `build.sh` - Added VITE env variable export
- ✅ `RAILWAY-GOOGLE-OAUTH-FIX.md` - Detailed guide created
- ✅ `GOOGLE-OAUTH-RAILWAY-QUICK-FIX.md` - This file

## Next Steps
1. ✅ Push fix using `push-google-fix.bat`
2. ✅ Set Railway variables
3. ✅ Wait for deployment (~5 minutes)
4. ✅ Test Google login button
5. ✅ Celebrate! 🎉
