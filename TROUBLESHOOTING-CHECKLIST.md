# Complete Troubleshooting Checklist

## Status Summary
- ✅ Fixed build.sh to export VITE_GOOGLE_OAUTH_CLIENT_ID
- ❓ Waiting to diagnose why auth isn't working
- 🔴 Need to check Railway deployment status

## Step 1: PUSH THE CODE FIX FIRST ⭐

If you haven't already, push the build.sh fix to GitHub:

```bash
git add -A
git commit -m "Fix: Add VITE_GOOGLE_OAUTH_CLIENT_ID export to build script"
git push
```

**Or run**: `push-google-fix.bat`

Wait 3-5 minutes for Railway to auto-deploy.

## Step 2: CHECK RAILWAY VARIABLES

This is CRITICAL:

1. Go to https://railway.app
2. Click your ToDoFast project
3. Select your service
4. Go to **Variables** tab
5. Verify you have:

```
GOOGLE_OAUTH2_CLIENT_ID=850305689345-kmnhkiqqte2nr8cct2anfgmnkd5cm89t.apps.googleusercontent.com
GOOGLE_OAUTH2_CLIENT_SECRET=your-secret-here
SECRET_KEY=some-secret-value
DEBUG=False
ALLOWED_HOSTS=lets-do-it.co.il,www.lets-do-it.co.il,letsdoit-production-6d29.up.railway.app
FRONTEND_URL=https://lets-do-it.co.il
```

**If ANY are missing or empty**, add them now.

## Step 3: WAIT FOR DEPLOYMENT

1. Go to **Deployments** tab
2. Wait for the latest deployment to show "Success" (green checkmark)
3. This can take 5-10 minutes
4. **Don't** test until it shows successful

## Step 4: GET DIAGNOSTIC INFORMATION

We need to know what's actually happening. Please:

### A. Open the site in browser

Go to: https://letsdoit-production-6d29.up.railway.app

### B. Open Developer Tools (F12)

- **Console tab**: Look for red errors
- **Network tab**: Check for failed requests
- Look for any message like:
  - "404 Not Found"
  - "CORS error"
  - "Failed to fetch"
  - "Network error"
  - "Invalid client_id"
  - etc.

### C. Try to Login

1. Click "Login" or registration button
2. Watch the Console for errors
3. Watch the Network tab for failed requests

### D. Screenshot or Copy the Error

Share:
- The exact error message
- The HTTP status code
- The Response body from Network tab

## Possible Scenarios and Fixes

### Scenario 1: "Network Error" or "Failed to fetch"

**Likely causes**:
- CORS issue
- API not accessible
- Server not responding

**Check**:
- Can you open https://letsdoit-production-6d29.up.railway.app/api/csrf-token/ in browser?
- Does it return JSON or an error?

**Fix**:
If you get a network error, the problem is at the network level:
- CORS headers missing
- Firewall issue
- Server not running

### Scenario 2: "404 Not Found" on /api/auth/register/

**Likely causes**:
- Django app not starting
- URL routes not configured
- Build failed

**Check**:
- Go to Railway Deployments
- Click latest deployment
- Look at Build Logs for errors
- Look for "✅ Build complete!"

**Fix**:
- Check build logs for errors
- If build failed, check what went wrong
- Restart deployment manually

### Scenario 3: "Missing required parameter: client_id"

**Likely causes**:
- VITE_GOOGLE_OAUTH_CLIENT_ID not set during build
- Build script changes not deployed yet

**Check**:
- In Railway Deployments → Build Logs
- Search for "Using Google Client ID"
- Does it show "undefined" or actual client ID?

**Fix**:
- Make sure GOOGLE_OAUTH2_CLIENT_ID is in Railway Variables
- Rebuild deployment
- Check build logs show correct client ID

### Scenario 4: Registration succeeds, then shows "verify email"

**This is NORMAL!**

Users must verify their email before they can log in (unless they use Google OAuth).

**Expected flow**:
1. Register → Get confirmation email
2. Click link in email to verify
3. Now you can login

**Check**:
- Did you check your email?
- Is there a verification link?

### Scenario 5: Login fails with "Invalid email/password"

**Likely causes**:
- User not registered
- Wrong password
- Email case mismatch

**Fix**:
- Make sure you registered first
- Try registering a new test account: `test@test.com` / `TestPass123`
- Check email is exactly correct (including case)

## Quick Health Check Script

Try this in your browser console to test API connectivity:

```javascript
// Test CSRF token endpoint
fetch('https://letsdoit-production-6d29.up.railway.app/api/csrf-token/')
  .then(r => r.json())
  .then(d => console.log('✓ CSRF OK:', d))
  .catch(e => console.error('✗ CSRF Failed:', e))

// Test registration endpoint
fetch('https://letsdoit-production-6d29.up.railway.app/api/auth/register/', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email: 'test@test.com', password: 'TestPass123'})
})
  .then(r => r.json())
  .then(d => console.log('✓ Register response:', d))
  .catch(e => console.error('✗ Register failed:', e))
```

## Information to Collect

Please provide:

1. **Exact error message** (screenshot or copy)
2. **HTTP Status code** (404, 500, 403, etc.)
3. **Deployment status** (Success or Failed?)
4. **Build logs** (does it show "Using Google Client ID"?)
5. **Railway Variables** (are they all set?)

## Files That Were Changed

- ✅ `build.sh` - Added VITE_GOOGLE_OAUTH_CLIENT_ID export
- ✅ `GOOGLE-OAUTH-RAILWAY-QUICK-FIX.md` - Quick fix guide
- ✅ `RAILWAY-GOOGLE-OAUTH-FIX.md` - Detailed fix guide
- ✅ `GOOGLE-OAUTH-FIX-EXPLAINED.md` - Full explanation
- ✅ `AUTHENTICATION-DEBUGGING-GUIDE.md` - Debugging guide
- ✅ `push-google-fix.bat` - Deploy script

## Next Actions

1. ⬜ **Push code** (if not already done)
2. ⬜ **Set Railway Variables** (if not already done)
3. ⬜ **Wait for deployment** to complete (5-10 minutes)
4. ⬜ **Collect error information** from browser
5. ⬜ **Share diagnostics** with me
6. ⬜ **I'll fix the specific issue**

---

**Bottom line**: The auth endpoints exist and are configured. The issue is most likely one of:
1. Environment variables not set on Railway
2. Build script changes not deployed yet
3. Some configuration missing on Railway
4. CORS or network issue

Once we see the actual error, we can pinpoint and fix it! 🔧
