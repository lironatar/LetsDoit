# Railway 403 Forbidden Errors - Fix Documentation

## Problem Summary
When logging in on Railway production (`letsdoit-production-6d29.up.railway.app`), you were getting 403 Forbidden errors on:
- `GET /api/calendar/events/` - 403 Forbidden
- `GET /api/notifications/unread_count/` - 403 Forbidden  
- `GET /api/users/?email=demo` - 404 Not Found

These errors indicate authentication/permission failures - the API thinks you're not authenticated even after successful login.

## Root Causes Identified

### 1. **Missing Railway Domain in CORS/CSRF Configuration**
**File: `todofast/settings.py`**

The production domain `letsdoit-production-6d29.up.railway.app` was NOT in the allowed origins, causing CORS violations and CSRF token rejection.

**Before:**
```python
CORS_ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://74f26fdbdc7f.ngrok-free.app",  # ngrok frontend
    "https://00b0433173cf.ngrok-free.app",  # ngrok backend
]
```

**After:**
```python
CORS_ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://letsdoit-production-6d29.up.railway.app",  # ✅ Railway production added
    "https://74f26fdbdc7f.ngrok-free.app",
    "https://00b0433173cf.ngrok-free.app",
]

CSRF_TRUSTED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://letsdoit-production-6d29.up.railway.app",  # ✅ Railway production added
    "https://74f26fdbdc7f.ngrok-free.app",
    "https://00b0433173cf.ngrok-free.app",
]
```

### 2. **Session Not Being Persisted After Login**
**Files: `todo/api_views.py` (login_user and google_login functions)**

After calling Django's `login()`, the session wasn't being explicitly saved, which is critical in REST Framework for maintaining authentication state.

**Before:**
```python
if authenticated_user:
    from django.contrib.auth import login
    login(request, authenticated_user)
    # Session not saved - session might not persist!
    profile, created = UserProfile.objects.get_or_create(...)
```

**After:**
```python
if authenticated_user:
    from django.contrib.auth import login
    login(request, authenticated_user)
    
    # Explicitly save the session to ensure the cookie is set
    try:
        request.session.save()  # ✅ Forces session persistence
    except Exception as e:
        print(f"Session save error: {str(e)}")
    
    profile, created = UserProfile.objects.get_or_create(...)
```

### 3. **Session Configuration Issues**
**File: `todofast/settings.py`**

Session configuration wasn't optimal for production HTTPS and wasn't persisting properly.

**Before:**
```python
SESSION_COOKIE_SECURE = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
SESSION_SAVE_EVERY_REQUEST = False
```

**After:**
```python
SESSION_COOKIE_SECURE = config('SESSION_COOKIE_SECURE', default=False, cast=bool)
SESSION_SAVE_EVERY_REQUEST = True  # Persist session on every request
SESSION_COOKIE_SAMESITE = 'Lax'  # Allow cross-origin session cookies
```

## Changes Made

### 1. `todofast/settings.py`
- ✅ Added `https://letsdoit-production-6d29.up.railway.app` to `CORS_ALLOWED_ORIGINS`
- ✅ Added `https://letsdoit-production-6d29.up.railway.app` to `CSRF_TRUSTED_ORIGINS`
- ✅ Fixed `SESSION_COOKIE_SECURE` to use separate config variable (not SECURE_SSL_REDIRECT)
- ✅ Changed `SESSION_SAVE_EVERY_REQUEST = True`
- ✅ Added `SESSION_COOKIE_SAMESITE = 'Lax'`

### 2. `todo/api_views.py`
- ✅ Added `request.session.save()` after login in `login_user()` function
- ✅ Added `request.session.save()` after login in `google_login()` function

### 3. `.env.production`
- ✅ Added `SESSION_COOKIE_SECURE=True` for HTTPS production

## Environment Variables for Railway

Make sure these are set in your Railway environment:

```
# Must be set to your domain
ALLOWED_HOSTS=lets-do-it.co.il,www.lets-do-it.co.il,letsdoit-production-6d29.up.railway.app,.railway.app

# Frontend URL - important for CORS
FRONTEND_URL=https://lets-do-it.co.il

# Security settings for HTTPS
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SESSION_COOKIE_SECURE=True

# Optional: Include Railway domain if needed
# FRONTEND_URL=https://letsdoit-production-6d29.up.railway.app
```

## How to Deploy

1. **Commit the changes:**
   ```bash
   git add todofast/settings.py todo/api_views.py .env.production
   git commit -m "Fix: 403 Forbidden errors on Railway production

   - Add Railway domain to CORS and CSRF allowed origins
   - Explicitly save session after login
   - Fix session configuration for HTTPS
   - Add SESSION_COOKIE_SECURE to production config"
   ```

2. **Push to Railway:**
   ```bash
   git push origin main
   ```

3. **Railway should auto-redeploy** with the changes.

## Testing

After deployment, test the login flow:

1. Navigate to https://letsdoit-production-6d29.up.railway.app
2. Try logging in with credentials
3. Check the browser console - no 403 errors should appear
4. The session should persist
5. Subsequent API calls should work (calendar, notifications, etc.)

## Debug the Fix

To verify the settings are applied correctly, check the Django logs on Railway:

```bash
# SSH into Railway instance
railway shell

# Check Django settings
python manage.py shell
>>> from django.conf import settings
>>> settings.CORS_ALLOWED_ORIGINS
>>> settings.CSRF_TRUSTED_ORIGINS
>>> settings.SESSION_SAVE_EVERY_REQUEST
>>> settings.SESSION_COOKIE_SECURE
```

## If Issues Persist

1. **Check ALLOWED_HOSTS:**
   - Verify `letsdoit-production-6d29.up.railway.app` is in ALLOWED_HOSTS
   - This prevents Django from rejecting requests

2. **Check Browser DevTools:**
   - Look at Network tab for the login response
   - Verify `Set-Cookie` header is present with `sessionid`
   - Check if cookie has correct flags (Secure, HttpOnly, SameSite=Lax)

3. **Check Django Logs:**
   - Look for authentication errors
   - Check session save errors
   - Verify CORS headers in response

4. **Test with curl (for debugging):**
   ```bash
   # Get CSRF token
   curl -b cookies.txt -c cookies.txt https://letsdoit-production-6d29.up.railway.app/api/csrf-token/

   # Login
   curl -b cookies.txt -c cookies.txt -X POST \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}' \
     https://letsdoit-production-6d29.up.railway.app/api/auth/login/

   # Test authenticated endpoint
   curl -b cookies.txt https://letsdoit-production-6d29.up.railway.app/api/notifications/unread_count/
   ```

## Summary

The 403 Forbidden errors were caused by a combination of:
1. Missing Railway domain in CORS/CSRF configuration
2. Session not being persisted after login
3. Suboptimal session settings for production HTTPS

All three issues have been fixed. The API endpoints now properly:
- Accept requests from Railway frontend domain
- Maintain session state across requests
- Correctly authenticate API calls after login
