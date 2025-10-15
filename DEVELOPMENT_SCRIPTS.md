# TodoFast Development Scripts Guide

## 🚀 **Quick Start Scripts**

### **Development Mode (Port 5173 + 8000)**
- **`start-both.bat`** - Interactive script to run both frontend and backend
- **`run-dev.bat`** - Runs both servers in separate windows
- **`run-dev-single.bat`** - Runs both servers in one window
- **`stop-dev.bat`** - Stops both development servers

### **Production Mode (Port 8000 only)**
- **`deploy-prod.bat`** - Deploy and build for production
- **`start-prod.bat`** - Start optimized production server
- **`check-prod-status.bat`** - Check production configuration

## 📋 **Script Details**

### Development Scripts

#### `start-both.bat` (Recommended)
Interactive menu to choose how to run development servers:
- Option 1: Separate windows (Backend + Frontend)
- Option 2: Single window (Frontend in foreground)
- Includes validation and helpful information

#### `run-dev.bat`
- Starts Django backend in separate window (port 8000)
- Starts React frontend in separate window (port 5173)
- Perfect for development with hot reload

#### `run-dev-single.bat`
- Starts Django backend in background
- Starts React frontend in foreground
- Good for single terminal workflow

#### `stop-dev.bat`
- Automatically stops all development servers
- Kills processes on ports 8000 and 5173
- Cleans up Node.js and Python processes

### Production Scripts

#### `deploy-prod.bat`
Complete production deployment:
- Installs/updates dependencies
- Runs database migrations  
- Builds optimized frontend
- Collects static files
- Creates logs directory

#### `start-prod.bat`
- Starts production server with Waitress (Windows-compatible)
- Serves everything from port 8000
- Optimized for production use

#### `check-prod-status.bat`
- Validates production configuration
- Checks if DEBUG=False
- Verifies all required files exist
- Shows server status

## 🌐 **Port Configuration**

### Development Mode
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:8000 (Django dev server)
- **Admin**: http://localhost:8000/admin
- **API**: http://localhost:8000/api

### Production Mode
- **Full App**: http://localhost:8000 (All served by Django)
- **Admin**: http://localhost:8000/admin
- **API**: http://localhost:8000/api

## 🛠️ **Common Workflows**

### First Time Setup
```bash
setup.bat                    # Initial setup
start-both.bat              # Start development
```

### Daily Development
```bash
start-both.bat              # Start both servers
# Develop your features...
stop-dev.bat               # Stop when done
```

### Production Testing
```bash
deploy-prod.bat             # Build production
start-prod.bat              # Test production build
```

### Production Deployment
```bash
# Update .env with production settings
deploy-prod.bat             # Deploy
start-prod.bat              # Start production server
```

## 🔧 **Troubleshooting**

### Port Already in Use
```bash
stop-dev.bat               # Stop all development servers
netstat -an | findstr :8000  # Check what's using port 8000  
netstat -an | findstr :5173  # Check what's using port 5173
```

### Frontend Not Loading
1. Make sure Node.js is installed
2. Run `cd frontend && npm install`
3. Try `start-both.bat` again

### Backend Errors
1. Make sure Python virtual environment is activated
2. Run `pip install -r requirements.txt`
3. Run `python manage.py migrate`

### Production Issues
1. Run `check-prod-status.bat` to diagnose
2. Check logs in `logs/` directory
3. Verify .env configuration

## 💡 **Tips**

- **Use `start-both.bat`** for the best development experience
- **Use separate windows** to see both server outputs
- **Always run `stop-dev.bat`** before switching to production mode
- **Check `logs/` directory** for production debugging
- **Use `check-prod-status.bat`** before production deployment

## 📁 **File Overview**

```
TodoFast2/
├── start-both.bat          # 🌟 Main development script
├── run-dev.bat            # Separate windows
├── run-dev-single.bat     # Single window  
├── stop-dev.bat           # Stop development
├── deploy-prod.bat        # Production deployment
├── start-prod.bat         # Production server
├── check-prod-status.bat  # Production status
└── run-fullstack.bat      # Legacy full setup
```

Choose the script that best fits your workflow! 🎯
