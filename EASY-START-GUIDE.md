# 🚀 TodoFast Easy Start Guide

## One-Click Startup System

I've created a complete automation system for you!

## 📋 **Quick Start (3 Easy Steps)**

### **Step 1: Start Everything**
```bash
START-EVERYTHING.bat
```

This single script starts:
- ✅ ngrok tunnels (both frontend and backend)
- ✅ Django backend server (port 8000)
- ✅ React frontend server (port 5173)

**Wait 15 seconds** for everything to initialize.

### **Step 2: Auto-Update Configuration**
```bash
update-ngrok-urls.bat
```

This automatically:
- ✅ Gets your ngrok URLs
- ✅ Updates frontend API configuration
- ✅ Updates Django CORS settings
- ✅ Updates ALLOWED_HOSTS
- ✅ Shows you what to add to Google OAuth

### **Step 3: Update Google OAuth**

Copy the URLs from Step 2 and add them to [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

**Authorized JavaScript origins:**
- Both URLs shown in the script

**Authorized redirect URIs:**
- The callback URLs shown in the script

## 🎯 **Access Your App**

After setup, access from **ANY device, ANYWHERE**:
- Use the **Frontend URL** shown in Step 1
- Example: `https://abc123.ngrok-free.app`

## 🛑 **Stop Everything**

When you're done:
```bash
STOP-EVERYTHING.bat
```

This stops all services cleanly.

## 📁 **Files Created**

| File | Purpose |
|------|---------|
| `START-EVERYTHING.bat` | 🚀 Master startup script |
| `STOP-EVERYTHING.bat` | 🛑 Stop all services |
| `update-ngrok-urls.bat` | 🔄 Auto-configure URLs |
| `update-ngrok-urls.ps1` | 📝 PowerShell helper |
| `ngrok.yml` | ⚙️ ngrok configuration |

## 🔧 **How It Works**

1. **ngrok.yml** - Defines both tunnels in one ngrok session (free plan compatible!)
2. **START-EVERYTHING.bat** - Opens 3 windows:
   - ngrok (with both tunnels)
   - Django backend
   - React frontend
3. **update-ngrok-urls.bat** - Automatically updates all config files

## ⚠️ **Important Notes**

### **ngrok URLs Change**
- ngrok free plan gives you NEW URLs each time you restart
- Re-run `update-ngrok-urls.bat` after each restart
- Update Google OAuth with new URLs

### **First Time Setup**
1. Run `START-EVERYTHING.bat`
2. Wait for URLs to appear
3. Run `update-ngrok-urls.bat`
4. Add URLs to Google OAuth
5. **Restart servers** (close windows and rerun `START-EVERYTHING.bat`)
6. Access your frontend URL!

### **Daily Use**
1. Run `START-EVERYTHING.bat`
2. Run `update-ngrok-urls.bat`
3. Update Google OAuth (URLs changed)
4. Access and develop!
5. Run `STOP-EVERYTHING.bat` when done

## 🎁 **Pro Tips**

### **Keep Windows Organized**
The scripts open labeled windows:
- "ngrok Tunnels" - Shows tunnel status
- "TodoFast Backend" - Django logs
- "TodoFast Frontend" - Vite logs

### **Monitor Traffic**
- Open http://localhost:4040 to see ngrok dashboard
- View all requests in real-time

### **Development vs External**
- **Localhost** (`http://localhost:5173`) - Fast, no ngrok needed
- **ngrok** - When you need external access or Google OAuth from other devices

## 🆘 **Troubleshooting**

### **"ngrok not found"**
- ngrok is installed but run `ngrok config add-authtoken YOUR_TOKEN` again

### **"Port already in use"**
- Run `STOP-EVERYTHING.bat` first
- Or manually close the conflicting application

### **"CSRF token missing"**
- Make sure you ran `update-ngrok-urls.bat`
- Restart backend server after updating

### **"Google OAuth error"**
- Verify URLs are added to Google Console
- Wait 1-2 minutes after adding URLs
- Check URLs match exactly (no trailing slashes)

## 🎯 **Complete Workflow Example**

```bash
# Morning - Start working
START-EVERYTHING.bat
# Wait 15 seconds
update-ngrok-urls.bat
# Update Google OAuth with new URLs
# Close windows and restart: START-EVERYTHING.bat
# Access your ngrok URL and start coding!

# Evening - Finish work
STOP-EVERYTHING.bat
```

---

**Enjoy your easy life! 🎉** No more manual configuration!
