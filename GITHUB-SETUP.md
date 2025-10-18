# 🚀 GitHub + Railway Deployment Guide

## 📋 **Quick Overview**

To deploy on Railway, you need:
1. ✅ Git repository (local)
2. ✅ GitHub repository (online)
3. ✅ Railway connected to GitHub

---

## 🎯 **Step-by-Step Setup**

### **Step 1: Initialize Git (2 minutes)**

**Run this script:**
```bash
.\setup-git.bat
```

This will:
- ✅ Initialize Git repository
- ✅ Add all your files
- ✅ Create initial commit

---

### **Step 2: Create GitHub Repository (3 minutes)**

1. **Go to**: https://github.com/new

2. **Fill in:**
   - **Repository name**: `todofast` (or any name you like)
   - **Description**: "TodoFast - Task Management App"
   - **Privacy**: Choose **Private** or **Public**
   - **DON'T check** "Initialize this repository with a README"

3. **Click**: "Create repository"

4. **Copy the repository URL** shown (e.g., `https://github.com/YOUR-USERNAME/todofast.git`)

---

### **Step 3: Connect Local to GitHub (1 minute)**

**In your terminal, run these commands** (replace with YOUR GitHub URL):

```bash
git remote add origin https://github.com/YOUR-USERNAME/todofast.git
git branch -M main
git push -u origin main
```

**If prompted for credentials:**
- Use your GitHub username
- Use a **Personal Access Token** as password (not your GitHub password!)

**To create a Personal Access Token:**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name: "TodoFast Deployment"
4. Check: `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)
7. Use this token as your password when pushing

---

### **Step 4: Deploy on Railway (5 minutes)**

1. **Go to**: https://railway.app

2. **Sign up/Login** with GitHub

3. **New Project** → **Deploy from GitHub repo**

4. **Select**: Your `todofast` repository

5. **Add Environment Variables** (Variables tab):
   ```env
   SECRET_KEY=your-secret-key-here
   DEBUG=False
   ALLOWED_HOSTS=lets-do-it.co.il,www.lets-do-it.co.il,.railway.app
   FRONTEND_URL=https://lets-do-it.co.il
   
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password
   DEFAULT_FROM_EMAIL=TodoFast <noreply@lets-do-it.co.il>
   
   GOOGLE_OAUTH2_CLIENT_ID=your-client-id
   GOOGLE_OAUTH2_CLIENT_SECRET=your-client-secret
   
   SECURE_SSL_REDIRECT=True
   SECURE_HSTS_SECONDS=31536000
   LOG_LEVEL=INFO
   ```

6. **Wait** for deployment (3-5 minutes)

7. **Check logs** for any errors

---

### **Step 5: Connect Your Domain (5 minutes)**

**In Railway:**
1. **Settings** → **Networking** → **Public Networking**
2. **Add Custom Domain**: `lets-do-it.co.il`
3. **Copy the CNAME target** (e.g., `your-app.up.railway.app`)

**At domainthenet.com:**
1. **Login** to domain panel
2. **DNS Settings** → **Add CNAME Record**:
   ```
   Type: CNAME
   Name: @
   Value: your-app.up.railway.app
   TTL: 3600
   ```
3. **Add CNAME for www**:
   ```
   Type: CNAME
   Name: www
   Value: your-app.up.railway.app
   TTL: 3600
   ```
4. **Save**

⏰ Wait 10-60 minutes for DNS propagation.

---

### **Step 6: Configure Google OAuth**

**Go to**: https://console.cloud.google.com/apis/credentials

**Add to Authorized JavaScript origins:**
```
https://lets-do-it.co.il
https://www.lets-do-it.co.il
```

**Add to Authorized redirect URIs:**
```
https://lets-do-it.co.il/api/auth/google-login/
https://www.lets-do-it.co.il/api/auth/google-login/
```

**Click SAVE** ✅

---

## 🎉 **You're Live!**

Visit: `https://lets-do-it.co.il`

---

## 🔄 **Future Updates**

When you make code changes:

```bash
git add .
git commit -m "Your update description"
git push
```

**Railway auto-deploys!** 🚀

---

## 🆘 **Troubleshooting**

### **Git push asks for password repeatedly**
- Use a Personal Access Token instead of password
- Or set up SSH keys: https://docs.github.com/en/authentication

### **Railway build fails**
- Check Railway logs for errors
- Verify environment variables are set
- Check that all dependencies are in `requirements.txt`

### **Domain not working**
- Verify DNS at: https://dnschecker.org
- Wait up to 48 hours for full propagation
- Check CNAME records are correct

---

## 📚 **Helpful Links**

- **GitHub**: https://github.com
- **Personal Access Token**: https://github.com/settings/tokens
- **Railway**: https://railway.app
- **DNS Checker**: https://dnschecker.org
- **Google OAuth**: https://console.cloud.google.com/apis/credentials

---

**Need help? Let me know!** 🚀
