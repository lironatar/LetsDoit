# 🚀 TodoFast - START HERE

## 🎯 **Daily Development (99% of the time)**

### **One Command to Rule Them All:**

```bash
start-both.bat
```

**That's it!** Access at: **http://localhost:5173**

- ✅ Google OAuth works (already configured for localhost)
- ✅ Fast and responsive
- ✅ No configuration needed
- ✅ No URL changes

---

## 🌍 **External Access (When You Need It)**

### **When to use:**
- Testing on mobile phone
- Showing to friends
- External API testing

### **Steps:**

1. **Start everything:**
   ```bash
   START-EVERYTHING.bat
   ```
   
2. **Wait 15 seconds**, you'll see URLs like:
   ```
   Frontend: https://abc123.ngrok-free.app
   Backend:  https://xyz789.ngrok-free.app
   ```

3. **Update configuration:**
   ```bash
   update-ngrok-urls.bat
   ```

4. **Add to Google OAuth** (ONLY these 2):
   
   **Authorized JavaScript origins:**
   - Add your frontend URL
   - Add your backend URL
   
   **Authorized redirect URIs:**
   - Add: `https://your-backend-url.ngrok-free.app/api/auth/google-login/`

5. **Restart servers** (close windows, rerun `START-EVERYTHING.bat`)

6. **Access**: Your frontend ngrok URL

⚠️ **Important**: ngrok free URLs change **every restart**, so you'll need to repeat steps 3-4 each time.

---

## 🛑 **Stop Everything**

```bash
STOP-EVERYTHING.bat
```

Stops all services cleanly.

---

## 📊 **Summary - Which Script to Use?**

| Scenario | Script | Access URL |
|----------|--------|------------|
| **Daily development** | `start-both.bat` | http://localhost:5173 |
| **Quick local testing** | `quick-start.bat` | http://localhost:5173 |
| **External access needed** | `START-EVERYTHING.bat` | ngrok HTTPS URL |
| **Production deployment** | `deploy-prod.bat` then `start-prod.bat` | http://localhost:8000 |
| **Stop everything** | `STOP-EVERYTHING.bat` | - |

---

## 🎁 **Bonus Tips**

### **For Development (Recommended Setup)**

**Google OAuth Settings (One-Time):**
```
Authorized JavaScript origins:
✓ http://localhost:5173
✓ http://localhost:8000

Authorized redirect URIs:
✓ http://localhost:8000/api/auth/google-login/
```

Keep these configured permanently, and just use `start-both.bat` daily!

### **ngrok is Optional**

You DON'T need ngrok for:
- ✅ Daily development
- ✅ Local testing
- ✅ Google OAuth (works on localhost)

You ONLY need ngrok for:
- 📱 Mobile device testing
- 🌍 External access
- 👥 Sharing with others

---

## 🎯 **Recommended Workflow**

**90% of the time:**
```bash
start-both.bat  # Simple localhost development
```

**10% of the time (when you need external access):**
```bash
START-EVERYTHING.bat     # Starts with ngrok
update-ngrok-urls.bat    # Auto-configures
# Update Google OAuth with new URLs
# Restart servers
# Test
STOP-EVERYTHING.bat      # Clean up
```

---

**Start with `start-both.bat` and enjoy your easy life!** 🎉
