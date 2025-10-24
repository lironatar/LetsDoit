# 🔧 Google Login postMessage Error - Fix Guide

## ❌ The Error
```
Uncaught TypeError: Cannot read properties of null (reading 'postMessage')
```

## 🎯 Root Causes

The error occurs when Google's Sign-In library tries to communicate with a popup or iframe using `postMessage()`, but the target window/frame is null. This happens due to:

### 1. **Callback Function Reference Issue** (PRIMARY ISSUE)
- The callback `handleCredentialResponse` was being passed to `window.google.accounts.id.initialize()` **before it was properly defined**
- This caused a stale or invalid function reference
- When Google's library tried to call the callback, it couldn't access it properly

### 2. **Script Loading Race Condition**
- The Google Sign-In script (`https://accounts.google.com/gsi/client`) wasn't fully initialized before being used
- Multiple components might load the script simultaneously
- The script needs time to attach `window.google.accounts` to the window object

### 3. **Third-Party Cookie Restrictions on Railway**
- Railway environment may have stricter cross-origin cookie policies
- Google's postMessage communication requires proper cookie handling
- This affects how the popup window communicates back to the parent

### 4. **Fallback Button Event Handling**
- The original fallback button used `onclick="handleManualGoogleLogin()"` in HTML
- This approach can lose the closure context
- Direct event listener is more reliable

---

## ✅ Fixes Applied

### Fix #1: Stable Callback Reference with useRef
```javascript
const handleCredentialResponseRef = useRef(null)

// Define callback with proper lifecycle management
useEffect(() => {
  handleCredentialResponseRef.current = async (response) => {
    // ... callback logic
  }
}, [onGoogleLogin])

// Use the ref when initializing
window.google.accounts.id.initialize({
  client_id: clientId,
  callback: handleCredentialResponseRef.current,  // ✅ Use ref
  auto_select: false,
  cancel_on_tap_outside: true
})
```

**Why:** Using `useRef` maintains a stable reference that persists across re-renders and properly captures the component's state/props.

---

### Fix #2: Improved Script Loading with Initialization Check
```javascript
script.onload = () => {
  console.log('Google script loaded successfully')
  // Add small delay to ensure script is fully initialized
  setTimeout(() => {
    if (window.google && window.google.accounts) {
      setGoogleLoaded(true)
      resolve()
    } else {
      console.warn('Google script loaded but window.google not available yet')
      reject(new Error('Google script not initialized'))
    }
  }, 100)
}
```

**Why:** The script loading event fires before `window.google` is available. The small delay ensures the library has fully attached to the window object.

---

### Fix #3: Better Script Duplicate Handling
```javascript
if (existingScript.dataset.loadAttempted === 'true') {
  // Script already loading, wait for it
  const checkScript = () => {
    if (window.google && window.google.accounts) {
      setGoogleLoaded(true)
      resolve()
    } else {
      setTimeout(checkScript, 100)
    }
  }
  checkScript()
}
```

**Why:** Prevents multiple simultaneous script loads and provides proper polling for script initialization.

---

### Fix #4: Proper Fallback Button Implementation
**Before (Problematic):**
```javascript
googleButtonRef.current.innerHTML = `
  <button onclick="handleManualGoogleLogin()" ...>
    Text
  </button>
`
window.handleManualGoogleLogin = () => { ... }
```

**After (Fixed):**
```javascript
const button = document.createElement('button')
button.addEventListener('click', () => {
  if (window.google && window.google.accounts) {
    window.google.accounts.id.prompt()
  }
})
googleButtonRef.current.appendChild(button)
```

**Why:** Direct event listeners maintain proper closure and don't rely on global function scope.

---

## 🚀 Additional Recommendations for Railway

### 1. Configure Google OAuth Redirect URIs
Ensure Railway domain is configured in Google Cloud Console:
- `https://letsdoit-production-6d29.up.railway.app/api/auth/google-login/`
- `https://www.lets-do-it.co.il/api/auth/google-login/`
- `https://lets-do-it.co.il/api/auth/google-login/`

### 2. Backend Session Handling
In `todo/api_views.py` `google_login()` function, ensure:
```python
request.session.save()  # Explicitly save session
```

### 3. CORS Configuration in Django Settings
```python
CORS_ALLOWED_ORIGINS = [
    "https://letsdoit-production-6d29.up.railway.app",
    "https://lets-do-it.co.il",
]

CSRF_TRUSTED_ORIGINS = [
    "https://letsdoit-production-6d29.up.railway.app",
    "https://lets-do-it.co.il",
]
```

### 4. Environment Variable Verification
Check Railway environment variables:
```
VITE_GOOGLE_OAUTH_CLIENT_ID - Correct value set?
VITE_API_BASE_URL - Points to correct backend URL?
```

---

## 🧪 Testing the Fix

1. **Open browser console** (F12)
2. **Look for these logs:**
   - ✅ `Google script loaded successfully`
   - ✅ `🔑 Google Client ID: [partial ID]...`
   - ✅ `Google credential response received: {...}`

3. **Troubleshooting logs to watch for:**
   - ❌ `Google script failed to load` → Network/CORS issue
   - ❌ `Google script not initialized` → Script didn't attach to window
   - ❌ `MISSING!` for client ID → Environment variable not set

---

## 🔍 Browser Console Commands for Debugging

```javascript
// Check if Google library is loaded
window.google?.accounts

// Check if button was rendered
document.querySelector('[data-google-signin-button]')

// Check environment variables
import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID

// Manually trigger prompt (if loaded)
window.google?.accounts?.id?.prompt()
```

---

## 📋 Checklist Before Deployment

- [ ] Backend environment variables verified
- [ ] Google Cloud Console OAuth URI configured
- [ ] Railway domain added to allowed origins
- [ ] CSRF tokens properly configured
- [ ] Session save called after login
- [ ] Browser console shows no errors
- [ ] Fallback button appears if primary fails
- [ ] Third-party cookies enabled in browser (for popup flow)

---

## 🔗 Related Issues

- Third-party cookie blocking (common in private browsing or strict corporate networks)
- CORS issues if backend URL doesn't match
- CSRF token validation failures
- Session persistence on Railway due to ephemeral storage
