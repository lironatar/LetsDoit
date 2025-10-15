# 🌐 TodoFast Domain Setup Guide
## lets-do-it.co.il Production Deployment

Congratulations on purchasing your domain! Here's your complete setup guide.

---

## 🎯 **Overview**

**Domain**: `lets-do-it.co.il`  
**Registrar**: domainthenet.com  
**Current Status**: Domain purchased, needs configuration

---

## 📋 **Step-by-Step Setup**

### **Phase 1: Choose Your Hosting Solution**

You need to decide where to host your TodoFast application. Here are your options:

#### **Option A: Home/Office Server (Your Current Setup)** 💻

**Pros:**
- ✅ Full control
- ✅ No monthly fees
- ✅ Keep current SQLite setup

**Cons:**
- ❌ Need static IP or dynamic DNS
- ❌ Need to manage SSL certificates
- ❌ Server must run 24/7
- ❌ Your internet reliability affects uptime

**Requirements:**
- Static IP address (or Dynamic DNS service)
- Port forwarding on your router (port 80, 443)
- SSL certificate (free from Let's Encrypt)

#### **Option B: Cloud Hosting (Recommended)** ☁️

**Popular Options:**

1. **Railway.app** (Easiest)
   - Free tier available
   - Auto HTTPS
   - $5/month after free tier
   - Deploy in minutes

2. **PythonAnywhere** (Django-specific)
   - Free tier: yourapp.pythonanywhere.com
   - $5/month for custom domain
   - Perfect for Django apps

3. **DigitalOcean App Platform**
   - $5/month starter
   - Auto scaling
   - Managed service

4. **Vercel** (Frontend) + **Railway** (Backend)
   - Free for frontend
   - $5/month for backend
   - Excellent performance

---

## 🚀 **Deployment Path A: Home Server**

### **Step 1: Get Static IP or Dynamic DNS**

**Option 1: Static IP**
- Contact your ISP to get a static IP address
- Usually costs extra per month

**Option 2: Dynamic DNS (Free)**
- Use services like No-IP, DuckDNS, or DynDNS
- Updates your domain even if IP changes

### **Step 2: Configure DNS at domainthenet.com**

Login to your domain control panel and add:

**A Records:**
```
Type: A
Name: @
Value: YOUR_PUBLIC_IP_ADDRESS
TTL: 3600

Type: A  
Name: www
Value: YOUR_PUBLIC_IP_ADDRESS
TTL: 3600
```

**To find your public IP**: Visit https://whatismyipaddress.com

### **Step 3: Router Port Forwarding**

Access your router settings (usually at 192.168.1.1) and forward:
- Port 80 (HTTP) → Your computer IP:8000
- Port 443 (HTTPS) → Your computer IP:8000

### **Step 4: SSL Certificate Setup**

**Install Certbot (for Windows):**
```bash
# Install Certbot via Chocolatey
choco install certbot

# Or download from: https://certbot.eff.org/
```

**Get Free SSL Certificate:**
```bash
certbot certonly --standalone -d lets-do-it.co.il -d www.lets-do-it.co.il
```

### **Step 5: Configure Django for HTTPS**

Update `.env`:
```env
DEBUG=False
ALLOWED_HOSTS=lets-do-it.co.il,www.lets-do-it.co.il
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
FRONTEND_URL=https://lets-do-it.co.il
```

### **Step 6: Use HTTPS Server**

Install `daphne` or `nginx`:
```bash
pip install daphne
```

Run with SSL:
```bash
daphne -b 0.0.0.0 -p 443 --ssl-certificate cert.pem --ssl-key key.pem todofast.asgi:application
```

---

## 🚀 **Deployment Path B: Railway (Recommended)**

Railway is the easiest way to deploy Django + React apps!

### **Step 1: Prepare Your App**

1. Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python manage.py migrate && python manage.py collectstatic --noinput && waitress-serve --host=0.0.0.0 --port=$PORT todofast.wsgi:application",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. Create `Procfile`:
```
web: waitress-serve --host=0.0.0.0 --port=$PORT todofast.wsgi:application
release: python manage.py migrate && python manage.py collectstatic --noinput
```

3. Create `.gitignore` (if not exists):
```
*.pyc
__pycache__/
db.sqlite3
venv/
.env
logs/
staticfiles/
frontend/node_modules/
frontend/dist/
```

### **Step 2: Deploy to Railway**

1. **Go to**: https://railway.app
2. **Sign up** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Connect** your GitHub repository
5. **Add Environment Variables** (from your `.env.production`)
6. **Deploy!**

### **Step 3: Connect Your Domain**

In Railway:
1. Go to **Settings** → **Domains**
2. **Add Custom Domain**: `lets-do-it.co.il`
3. Railway will show you DNS records to add

In domainthenet.com:
1. Add the **CNAME** or **A records** Railway provides
2. Wait 10-60 minutes for DNS propagation

### **Step 4: Configure Google OAuth**

**Authorized JavaScript origins:**
```
https://lets-do-it.co.il
https://www.lets-do-it.co.il
```

**Authorized redirect URIs:**
```
https://lets-do-it.co.il/api/auth/google-login/
https://www.lets-do-it.co.il/api/auth/google-login/
```

---

## 🚀 **Deployment Path C: PythonAnywhere**

### **Step 1: Sign Up**

1. Go to: https://www.pythonanywhere.com
2. Create free account
3. Upgrade to $5/month plan (needed for custom domain)

### **Step 2: Upload Your Code**

```bash
# On PythonAnywhere console
git clone your-repository-url
cd ToDoFast2
pip install -r requirements.txt --user
```

### **Step 3: Configure Web App**

1. **Web tab** → **Add new web app**
2. **Manual configuration** → **Python 3.10**
3. **Set source code**: `/home/yourusername/ToDoFast2`
4. **Set WSGI file** to point to your project

### **Step 4: Connect Domain**

1. **Web tab** → **Add custom domain**
2. Enter: `lets-do-it.co.il`
3. Follow DNS instructions provided

---

## 🎯 **My Recommendation for You**

### **Best Option: Railway** ⭐

**Why:**
- ✅ Easiest to set up
- ✅ Automatic HTTPS/SSL
- ✅ Auto-deployment from GitHub
- ✅ Free tier to start
- ✅ Scales automatically
- ✅ Better than managing your own server

**Cost**: Free tier, then ~$5-10/month

### **Quick Railway Setup:**

1. **Push your code to GitHub** (if not already)
2. **Connect Railway to GitHub**
3. **Add environment variables** from `.env.production`
4. **Deploy automatically**
5. **Connect domain** in Railway dashboard
6. **Update DNS** at domainthenet.com
7. **Configure Google OAuth** with your domain

---

## 📝 **DNS Configuration at domainthenet.com**

### **For Railway/Cloud Hosting:**

They'll give you records like:
```
Type: CNAME
Name: @
Value: your-app.up.railway.app
```

### **For Home Server:**

```
Type: A
Name: @
Value: YOUR_PUBLIC_IP

Type: A
Name: www
Value: YOUR_PUBLIC_IP
```

---

## 🔐 **Google OAuth Final Configuration**

Once your domain is live, update Google OAuth:

**Authorized JavaScript origins:**
```
https://lets-do-it.co.il
https://www.lets-do-it.co.il
http://localhost:5173
http://localhost:8000
```

**Authorized redirect URIs:**
```
https://lets-do-it.co.il/api/auth/google-login/
https://www.lets-do-it.co.il/api/auth/google-login/
http://localhost:8000/api/auth/google-login/
```

Keep localhost for development!

---

## 📦 **Files Ready for Production**

I've already updated:
- ✅ `.env.production` - Production configuration
- ✅ `deploy-prod.bat` - Production build script
- ✅ `start-prod.bat` - Production server
- ✅ Django settings - Production-ready
- ✅ Frontend build - Optimized

---

## 🎯 **Next Steps**

1. **Choose hosting** (I recommend Railway)
2. **Set up DNS** at domainthenet.com
3. **Deploy your app**
4. **Configure Google OAuth** with your domain
5. **Test at**: `https://lets-do-it.co.il`

**Would you like me to help you deploy to Railway, or another platform?** 🚀

Your domain is perfect - short, memorable, and .co.il for Israeli users! 🇮🇱

