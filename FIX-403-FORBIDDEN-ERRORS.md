# Fix for 403 Forbidden Errors on Authentication

## Problem

You were getting:
```
Failed to load unread count: AxiosError 403 (Forbidden)
```

This means:
- ✅ The API endpoint exists and can be reached
- ✅ Your login request was processed
- ❌ But you're not authenticated for this endpoint

## Root Cause

The 403 error occurred because **`lets-do-it.co.il` was NOT in the CORS and CSRF settings**.

When you access the app from `https://lets-do-it.co.il`:
1. Browser makes API call to `/api/notifications/unread_count/`
2. Django checks CORS headers
3. Django sees the origin is `https://lets-do-it.co.il`
4. Django checks if this origin is in `CORS_ALLOWED_ORIGINS`
5. **It's NOT there!** So Django rejects it with 403

## The Fix

Added `lets-do-it.co.il` and `www.lets-do-it.co.il` to:

### In `todofast/settings.py`:

**CORS_ALLOWED_ORIGINS** (where browser requests come from):
```python
CORS_ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://lets-do-it.co.il",           # ✅ ADDED
    "https://www.lets-do-it.co.il",       # ✅ ADDED
    "https://letsdoit-production-6d29.up.railway.app",
    "https://74f26fdbdc7f.ngrok-free.app",
    "https://00b0433173cf.ngrok-free.app",
]
```

**CSRF_TRUSTED_ORIGINS** (where form submissions come from):
```python
CSRF_TRUSTED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://lets-do-it.co.il",           # ✅ ADDED
    "https://www.lets-do-it.co.il",       # ✅ ADDED
    "https://letsdoit-production-6d29.up.railway.app",
    "https://74f26fdbdc7f.ngrok-free.app",
    "https://00b0433173cf.ngrok-free.app",
]
```

## How CORS Works

### ❌ Before the Fix
```
Browser at lets-do-it.co.il sends request to /api/notifications/unread_count/
↓
Django checks: Is "https://lets-do-it.co.il" in CORS_ALLOWED_ORIGINS?
↓
NO! ❌ Return 403 Forbidden
```

### ✅ After the Fix
```
Browser at lets-do-it.co.il sends request to /api/notifications/unread_count/
↓
Django checks: Is "https://lets-do-it.co.il" in CORS_ALLOWED_ORIGINS?
↓
YES! ✅ Allow request and process it
↓
NotificationViewSet.unread_count() called
↓
Check: Is user authenticated?
↓
If yes: Return unread count
If no: Return 403 (but for auth reasons, not CORS)
```

## What to Do Now

1. **Push these changes to GitHub:**
   ```bash
   git add todofast/settings.py
   git commit -m "Fix: Add lets-do-it.co.il to CORS and CSRF settings"
   git push
   ```

2. **Wait for Railway to redeploy** (3-5 minutes)

3. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete` or `Cmd+Shift+Delete`
   - Select "All time"
   - Check "Cookies and site data"
   - Clear browsing data

4. **Try logging in again from `https://lets-do-it.co.il`**

## Testing

After deploying, test these:

**Test 1: CSRF Token endpoint**
```
https://lets-do-it.co.il/api/csrf-token/
```
Should return JSON with CSRF token

**Test 2: After logging in, check unread count**
Open browser console and run:
```javascript
fetch('https://lets-do-it.co.il/api/notifications/unread_count/', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(d => console.log('✓ Unread count:', d))
  .catch(e => console.error('✗ Failed:', e))
```

Should return `{"count": 0}` or similar (not 403!)

## Why This Wasn't a Problem Before

- `letsdoit-production-6d29.up.railway.app` was already in CORS settings
- When accessed from Railway URL directly, it worked
- But when accessing from custom domain `lets-do-it.co.il`, it failed
- Now both domains work!

## Files Changed

- ✅ `todofast/settings.py` - Added custom domain to CORS and CSRF

## Related Files

If you're still having issues:
1. Check `ALLOWED_HOSTS` in Django (for which domains are accepted)
2. Check Google OAuth redirect URIs include your domain
3. Check Railway environment variables are all set

---

**Bottom line**: The 403 error was because the API didn't recognize your domain as a trusted origin. Now that it's added, CORS checks will pass and your authentication will work properly! 🎉
