# Railway 403 Forbidden - Debug Guide

## Quick Test Commands

After deploying the fixes, use these commands to debug authentication issues:

### 1. Check Authentication Status
```bash
# Test without login
curl -i https://letsdoit-production-6d29.up.railway.app/api/debug/auth-status/

# Should show: "is_authenticated": false
```

### 2. Test Login Flow
```bash
# Step 1: Get CSRF token
curl -i -b cookies.txt -c cookies.txt \
  https://letsdoit-production-6d29.up.railway.app/api/csrf-token/

# Step 2: Login with credentials
curl -i -b cookies.txt -c cookies.txt \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  https://letsdoit-production-6d29.up.railway.app/api/auth/login/

# Step 3: Check authenticated status (should show user info now)
curl -i -b cookies.txt \
  https://letsdoit-production-6d29.up.railway.app/api/debug/auth-status/

# Should show: "is_authenticated": true and user details
```

### 3. Test Tasks Endpoint After Login
```bash
curl -i -b cookies.txt \
  https://letsdoit-production-6d29.up.railway.app/api/tasks/

# Should return 200 OK with tasks list, not 403 Forbidden
```

## Browser DevTools Testing

### Step 1: Open DevTools (F12) and go to Network tab

### Step 2: Login on the application
- Watch the `/api/auth/login/` request
- Check the Response headers for `Set-Cookie: sessionid=...`
- Check the Cookie value is being stored

### Step 3: After login, check the next API call
- Look at `/api/tasks/` or `/api/notifications/unread_count/`
- In the Request headers, verify `Cookie: sessionid=...` is being sent
- Check for `X-CSRFToken` header

### Step 4: Expected Headers
**Request should have:**
```
Cookie: sessionid=abc123def456...
X-CSRFToken: your-csrf-token-here
```

**Response should have:**
```
HTTP/1.1 200 OK
(not 403 Forbidden)
```

## Common Issues & Solutions

### Issue 1: Login succeeds but next API call returns 403

**Cause:** Session cookie is not being set after login

**Check:**
```javascript
// In browser console after login
console.log(document.cookie)
// Should contain: sessionid=...
```

**Fix:** Ensure `request.session.save()` is called in login_user view ✅ (Already done)

---

### Issue 2: Session cookie not being sent with API calls

**Cause:** Frontend not using `credentials: 'include'`

**Check:** In `frontend/src/services/api.js`:
```javascript
// Should have:
withCredentials: true

// In apiUrl.js:
credentials: 'include'
```

**Status:** ✅ Already configured correctly

---

### Issue 3: CORS preflight requests failing

**Cause:** Production domain not in CORS_ALLOWED_ORIGINS

**Check:** In Django settings:
```python
CORS_ALLOWED_ORIGINS = [
    "https://letsdoit-production-6d29.up.railway.app",  # ✅ Should be here
    ...
]
```

**Status:** ✅ Already added

---

### Issue 4: Session not persisting

**Cause:** SESSION_SAVE_EVERY_REQUEST = False

**Check:** In Django settings:
```python
SESSION_SAVE_EVERY_REQUEST = True  # ✅ Should be True
```

**Status:** ✅ Already fixed

---

## Production Environment Checklist

```
☐ ALLOWED_HOSTS includes: letsdoit-production-6d29.up.railway.app
☐ CORS_ALLOWED_ORIGINS includes: https://letsdoit-production-6d29.up.railway.app
☐ CSRF_TRUSTED_ORIGINS includes: https://letsdoit-production-6d29.up.railway.app
☐ SECURE_SSL_REDIRECT = True (for HTTPS)
☐ SESSION_COOKIE_SECURE = True (for HTTPS)
☐ SESSION_SAVE_EVERY_REQUEST = True
☐ SESSION_COOKIE_SAMESITE = 'Lax'
☐ DEBUG = False (in production)
☐ request.session.save() called after login
```

## Railway Environment Variables Verification

SSH into Railway and check:
```bash
railway shell

python manage.py shell
>>> from django.conf import settings
>>> print(f"ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
>>> print(f"CORS_ALLOWED_ORIGINS: {settings.CORS_ALLOWED_ORIGINS}")
>>> print(f"SESSION_SAVE_EVERY_REQUEST: {settings.SESSION_SAVE_EVERY_REQUEST}")
>>> print(f"SESSION_COOKIE_SECURE: {settings.SESSION_COOKIE_SECURE}")
>>> print(f"DEBUG: {settings.DEBUG}")
```

## Check Logs

SSH into Railway and view logs:
```bash
railway logs --follow

# Look for:
# - Session save errors
# - Authentication failures
# - CORS policy violations
# - 403 Forbidden errors with stack traces
```

## If Still Failing

### Scenario A: Login succeeds but session not created
```python
# Check if login() is creating session
# In todo/api_views.py login_user function:
# Line should have: request.session.save()
```

### Scenario B: Session created but not being sent by frontend
```javascript
// In browser console
fetch('/api/debug/auth-status/', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log(d))

// If shows "is_authenticated": false, cookie not being sent
```

### Scenario C: Server rejecting session as invalid
```bash
# Check Railway logs for session decode errors
railway logs --follow
# Look for: "Session decode error" or "SessionStore error"
```

## Network Request Trace

This is what should happen:

```
1. POST /api/csrf-token/ -> 200 OK
   Response: Set-Cookie: csrftoken=xxx; sessionid=yyy

2. POST /api/auth/login/ 
   Request: Cookie: csrftoken=xxx; sessionid=yyy
   Response: { success: true, user: {...} }
   Response: Set-Cookie: sessionid=yyy (may be resent)

3. GET /api/tasks/
   Request: Cookie: sessionid=yyy
   Expected Response: 200 OK with tasks
   Actual Response (buggy): 403 Forbidden

4. With fixes applied:
   GET /api/tasks/
   Request: Cookie: sessionid=yyy
   Response: 200 OK with tasks ✅
```

## Testing the Deployment

After pushing changes:

```bash
# 1. Wait for Railway to redeploy (check dashboard)
# 2. Clear browser cache (Ctrl+Shift+Delete)
# 3. Hard refresh (Ctrl+Shift+R)
# 4. Try login again
# 5. Check console for 403 errors
# 6. If still seeing 403, use curl commands above to debug
```

## Still Having Issues?

Check these in order:

1. **Are changes deployed?**
   - Railway dashboard should show "Deploy successful"
   - You can see git commit in recent deploys

2. **Is browser caching old code?**
   - Hard refresh: Ctrl+Shift+R
   - Clear cache: Ctrl+Shift+Delete

3. **Is session being created?**
   ```bash
   curl -b cookies.txt -c cookies.txt \
     -X POST -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}' \
     https://letsdoit-production-6d29.up.railway.app/api/auth/login/
   
   cat cookies.txt  # Check for sessionid cookie
   ```

4. **Is session being sent?**
   ```bash
   curl -b cookies.txt \
     https://letsdoit-production-6d29.up.railway.app/api/debug/auth-status/
   
   # Should show is_authenticated: true
   ```

5. **Still failing?**
   - Check Railway logs: `railway logs --follow`
   - Look for error messages and stack traces
   - Contact support with the logs
