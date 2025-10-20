# 🔴 Google OAuth postMessage Error - Complete Troubleshooting Guide

## Current Status:
- ✅ Client ID is injected: `850305689345-kmnhkiq...`
- ✅ Origin is correct: `https://letsdoit-production-6d29.up.railway.app`
- ❌ postMessage error still occurring

---

## 🎯 **CRITICAL CHECKS - Do These in Order:**

### **CHECK #1: OAuth Consent Screen Status**
Go to: https://console.cloud.google.com/apis/credentials/consent

**Look for:**
- **Publishing status:** Is it "Testing" or "In production"?

**If "Testing":**
1. Scroll down to "Test users"
2. Click **"+ ADD USERS"**
3. Add your email: `lironatar94@gmail.com`
4. **SAVE**

**OR publish to production:**
1. Click "PUBLISH APP" button
2. Follow prompts (may require verification for sensitive scopes)

---

### **CHECK #2: Exact URLs in OAuth Client**
Go to: https://console.cloud.google.com/apis/credentials

Click on: `850305689345-kmnhkiqqte2nr8cct2anfgmnkd5cm89t.apps.googleusercontent.com`

**Authorized JavaScript origins - Must have EXACTLY:**
```
https://letsdoit-production-6d29.up.railway.app
```
**Copy-paste this line directly! Check for:**
- ❌ NO trailing slash `/`
- ❌ NO `www.`
- ❌ NO port numbers
- ✅ Exact match only

**Authorized redirect URIs - ADD THIS:**
```
https://letsdoit-production-6d29.up.railway.app
```
**Yes, same as the origin! (no /api/auth/google-login/)**

**Why?** When using Google Identity Services (GSI) button, you need BOTH the origin AND a redirect URI that matches the origin.

---

### **CHECK #3: Third-Party Cookies**
The postMessage error often occurs when third-party cookies are blocked.

**Test this:**
1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Check **Cookies** section
4. Can you see cookies from `accounts.google.com`?

**If blocked:**
- In Chrome: Settings → Privacy → Cookies → "Allow all cookies" (temporarily)
- In Firefox: Settings → Privacy → "Standard" protection

**Try login again after enabling cookies**

---

### **CHECK #4: Content Security Policy (CSP)**
Your Django app might be blocking Google's iframe.

**Check current CSP settings:**
Look in browser DevTools Console for:
```
Refused to frame 'https://accounts.google.com/' because it violates the following Content Security Policy directive
```

**If you see this error**, we need to add CSP headers to allow Google iframes.

---

### **CHECK #5: Browser Console Full Error**
In your Railway app, open DevTools Console and look for the FULL error message.

**Copy the entire error, especially:**
- The full stack trace
- Any messages before/after the postMessage error
- Any CORS errors
- Any CSP errors

---

### **CHECK #6: Test in Incognito/Private Window**
1. Open **Incognito/Private browsing** window
2. Go to: https://letsdoit-production-6d29.up.railway.app
3. Try Google login
4. Does the same error occur?

**If it works in incognito:** → Browser extensions or cookies are the issue
**If it still fails:** → Configuration issue

---

## 🔧 **Most Likely Fixes:**

### **FIX #1: Add Your Email as Test User**
If app is in "Testing" mode, add yourself as a test user (see CHECK #1)

### **FIX #2: Add Redirect URI to Match Origin**
Add `https://letsdoit-production-6d29.up.railway.app` to BOTH:
- Authorized JavaScript origins
- Authorized redirect URIs

### **FIX #3: Enable Third-Party Cookies (Temporarily)**
For testing, allow third-party cookies in your browser

### **FIX #4: Wait 5 Minutes After Changes**
Google takes 2-5 minutes to propagate OAuth changes. After making ANY change in Google Console:
1. Save
2. Wait 5 full minutes
3. Hard refresh browser (Ctrl+Shift+R)
4. Try again

---

## 📋 **Complete Your Google Console Setup:**

### **Authorized JavaScript origins:**
```
https://letsdoit-production-6d29.up.railway.app
http://localhost:5173
```

### **Authorized redirect URIs:**
```
https://letsdoit-production-6d29.up.railway.app
https://letsdoit-production-6d29.up.railway.app/api/auth/google-login/
http://localhost:5173
http://localhost:8000/api/auth/google-login/
```

**Note:** Having the base URL in redirect URIs is REQUIRED for GSI (Google Sign-In button flow)

---

## 🎯 **What to Report Back:**

Please check and report:
1. ✅ or ❌ App publishing status (Testing or Production)?
2. ✅ or ❌ Are you added as a test user?
3. ✅ or ❌ Do you have the base URL in redirect URIs?
4. ✅ or ❌ Are third-party cookies enabled?
5. 📋 Full error message from console
6. ✅ or ❌ Does it work in incognito mode?

---

## 🔍 **Advanced Debugging:**

If all above fails, we'll check:
- Django CSP headers
- Railway proxy configuration
- Google OAuth app verification status
- Firewall/network blocking



