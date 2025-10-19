# Railway Google OAuth Fix - Missing Client ID

## Problem
The Google login button on Railway deployment fails with error:
```
הגישה חסומה: שגיאת הרשאה
Missing required parameter: client_id
שגיאה 400: invalid_request
```

## Root Cause
The frontend needs the `VITE_GOOGLE_OAUTH_CLIENT_ID` environment variable **during the build process** (not just at runtime). When building on Railway, this variable was undefined, causing the Google client ID to be missing in the production build.

## Solution

### Step 1: Set Environment Variables on Railway

1. Go to your Railway project: https://railway.app
2. Open your project dashboard
3. Click on your **ToDoFast** service
4. Go to the **Variables** tab
5. Add/Update the following environment variables:

```
GOOGLE_OAUTH2_CLIENT_ID=your-google-client-id-here
GOOGLE_OAUTH2_CLIENT_SECRET=your-google-client-secret-here
```

The `GOOGLE_OAUTH2_CLIENT_ID` is the value from your Google Console that starts with numbers like:
```
850305689345-kmnhkiqqte2nr8cct2anfgmnkd5cm89t.apps.googleusercontent.com
```

### Step 2: Verify Your Google Console Setup

1. Go to https://console.cloud.google.com
2. Select your project
3. Go to **OAuth 2.0 Credentials**
4. Find your credential and verify authorized redirect URIs include:
   - `https://letsdoit-production-6d29.up.railway.app/api/auth/google-login/`
   - `https://lets-do-it.co.il/api/auth/google-login/`
   - `https://lets-do-it.co.il`
   - `https://letsdoit-production-6d29.up.railway.app`

### Step 3: Deploy

Once environment variables are set:

1. Push your code to GitHub:
```bash
git add -A
git commit -m "Fix: Add VITE_GOOGLE_OAUTH_CLIENT_ID to build script"
git push
```

2. Railway will automatically rebuild with the new environment variables
3. Wait for deployment to complete
4. Test the Google login button

### How It Works Now

The updated `build.sh` script now:
1. Takes the `GOOGLE_OAUTH2_CLIENT_ID` from Railway environment variables
2. Exports it as `VITE_GOOGLE_OAUTH_CLIENT_ID` before building the frontend
3. Vite injects this value into the production build at compile time
4. The frontend JavaScript receives the correct client ID

## Debugging

If it still doesn't work:

1. **Check Railway Build Logs**
   - Go to Railway dashboard → Deployments
   - Click the latest deployment
   - Check Build Logs for "Using Google Client ID" message
   - If it shows `undefined`, the env var isn't set

2. **Verify Frontend Environment Variables**
   - Open Browser Developer Tools (F12)
   - Go to Network tab
   - Look for any errors in console about Google
   - Check if `VITE_GOOGLE_OAUTH_CLIENT_ID` is defined

3. **Check Redirect URI Configuration**
   - Ensure your Google OAuth app has the correct redirect URIs
   - Railway might assign different domain/URL

## Quick Check List
- [ ] `GOOGLE_OAUTH2_CLIENT_ID` set in Railway Variables
- [ ] `GOOGLE_OAUTH2_CLIENT_SECRET` set in Railway Variables  
- [ ] Redirect URIs updated in Google Console
- [ ] Code pushed to GitHub
- [ ] Railway deployment completed successfully
- [ ] Build logs show "Using Google Client ID: 850305689345-..."
- [ ] Test Google login button
