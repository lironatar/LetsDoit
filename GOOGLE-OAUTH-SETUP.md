# 🔐 Google OAuth Configuration for lets-do-it.co.il

## 📋 **Quick Reference**

### **Your Domain:**
`lets-do-it.co.il`

### **Google Cloud Console:**
https://console.cloud.google.com/apis/credentials

---

## ✅ **Complete Google OAuth Configuration**

### **Step 1: Open Your OAuth Client**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find: **OAuth 2.0 Client IDs**
3. Click: Your existing client (your-client-id-...)
4. Click: **Edit** (pencil icon)

---

### **Step 2: Authorized JavaScript Origins**

**Add ALL of these** (click "+ ADD URI" for each):

```
https://lets-do-it.co.il
https://www.lets-do-it.co.il
http://localhost:5173
http://localhost:8000
```

**Why each one:**
- ✅ `https://lets-do-it.co.il` - Production main domain
- ✅ `https://www.lets-do-it.co.il` - Production with www
- ✅ `http://localhost:5173` - Development frontend
- ✅ `http://localhost:8000` - Development backend

---

### **Step 3: Authorized Redirect URIs**

**Add ALL of these** (click "+ ADD URI" for each):

```
https://lets-do-it.co.il/api/auth/google-login/
https://www.lets-do-it.co.il/api/auth/google-login/
http://localhost:8000/api/auth/google-login/
http://localhost:5173/auth/callback
```

**Why each one:**
- ✅ `https://lets-do-it.co.il/api/auth/google-login/` - Production OAuth callback
- ✅ `https://www.lets-do-it.co.il/api/auth/google-login/` - Production OAuth callback (www)
- ✅ `http://localhost:8000/api/auth/google-login/` - Development OAuth callback
- ✅ `http://localhost:5173/auth/callback` - Development frontend callback (if needed)

---

### **Step 4: Save**

**Click the "SAVE" button at the bottom!**

⏰ Changes may take **1-2 minutes** to propagate.

---

## 🔧 **Verification**

After saving, verify in the console:

```
Authorized JavaScript origins (4):
✓ https://lets-do-it.co.il
✓ https://www.lets-do-it.co.il  
✓ http://localhost:5173
✓ http://localhost:8000

Authorized redirect URIs (4):
✓ https://lets-do-it.co.il/api/auth/google-login/
✓ https://www.lets-do-it.co.il/api/auth/google-login/
✓ http://localhost:8000/api/auth/google-login/
✓ http://localhost:5173/auth/callback
```

---

## 🎯 **Common Issues**

### **"redirect_uri_mismatch"**
- ✅ Check spelling of domain (exact match required)
- ✅ Check for trailing slashes (none needed)
- ✅ Verify http vs https matches your setup
- ✅ Wait 1-2 minutes after saving changes

### **"Access blocked: This app's request is invalid"**
- ✅ Verify domain is added to origins
- ✅ Check that www version is also added
- ✅ Clear browser cache and retry

### **Still not working?**
- ✅ Double-check all URLs are typed correctly
- ✅ Ensure OAuth consent screen is configured
- ✅ Verify app is not in "Testing" mode (or add test users)

---

## 📝 **Development vs Production**

### **Development (localhost):**
- Use: `start-both.bat`
- Access: `http://localhost:5173`
- OAuth callback: `http://localhost:8000/api/auth/google-login/`

### **Production (your domain):**
- Use: Domain with your hosting provider
- Access: `https://lets-do-it.co.il`
- OAuth callback: `https://lets-do-it.co.il/api/auth/google-login/`

**Both can coexist!** That's why we keep localhost URLs in the configuration.

---

## 🎁 **Pro Tips**

1. **Keep localhost URLs** - You'll still develop locally
2. **Use www redirect** - Redirect www.lets-do-it.co.il → lets-do-it.co.il
3. **Monitor OAuth errors** - Check browser console for detailed error messages
4. **Test after changes** - Wait 1-2 minutes for Google to propagate changes

---

## 🆘 **Need Help?**

If you encounter issues:
1. Check browser console for exact error messages
2. Verify domain DNS is properly configured
3. Test OAuth with localhost first
4. Clear browser cookies/cache and retry

---

**Your Google OAuth will be configured once and work forever!** 🎉

