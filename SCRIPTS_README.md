# 🚀 TodoFast - Launch Scripts

## 📋 Overview

I've created comprehensive scripts to run TodoFast on any operating system:

### 🪟 **Windows Scripts**
- `setup.bat` - Complete initial setup
- `run.bat` - Quick start (includes setup)
- `start.bat` - Quick start (setup already done)
- `run.ps1` - PowerShell script with colors
- `start.ps1` - PowerShell quick start
- `run-fullstack.bat` - **NEW!** Modern React + Django full stack

### 🐧 **Linux/Mac Scripts**
- `setup.sh` - Complete initial setup
- `run.sh` - Quick start (includes setup)
- `start.sh` - Quick start (setup already done)
- `run-fullstack.sh` - **NEW!** Modern React + Django full stack

---

## 🎯 **How to Use**

### 🆕 **First Time Setup (Complete Setup)**

#### Windows:
```cmd
setup.bat
```

#### Linux/Mac:
```bash
chmod +x setup.sh
./setup.sh
```

### ⚡ **Quick Start (Includes Setup)**

#### Windows:
```cmd
run.bat
```

#### Linux/Mac:
```bash
chmod +x run.sh
./run.sh
```

### 🚀 **NEW! Modern Full Stack (React + Django)**

#### Windows:
```cmd
run-fullstack.bat
```

#### Linux/Mac:
```bash
chmod +x run-fullstack.sh
./run-fullstack.sh
```

### 🏃 **Quick Start (Setup Already Done)**

#### Windows:
```cmd
start.bat
```

#### Linux/Mac:
```bash
chmod +x start.sh
./start.sh
```

---

## 🔧 **What the Scripts Do**

### 📦 **setup.bat/setup.sh**
1. ✅ Checks if Python is installed
2. 🔧 Creates virtual environment
3. 📦 Installs Python packages
4. 🗃️ Creates and runs migrations
5. 👤 Creates admin user
6. 📊 Creates demo data
7. 📁 Collects static files

### 🚀 **run.bat/run.sh**
1. ✅ Checks if Python is installed
2. 🔧 Creates virtual environment (if not exists)
3. 📦 Installs packages
4. 🗃️ Sets up database
5. 👤 Creates demo users
6. 🌐 Starts server

### ⚡ **start.bat/start.sh**
1. ✅ Checks if virtual environment exists
2. 🔧 Activates virtual environment
3. 🌐 Starts server

---

## 📱 **Login Credentials**

After running the scripts, you can login with:

### 👤 **Demo Users:**
- **demo** / `demo123` - Demo user with sample data
- **admin** / `admin123` - Admin user

### 👥 **Test Users for Collaboration:**
- **alice@todofast.com** / `alice123`
- **bob@todofast.com** / `bob123`
- **charlie@todofast.com** / `charlie123`

---

## 🌐 **Access the Application**

After running the scripts:
- **🌍 Main Website:** http://127.0.0.1:8000
- **⚙️ Admin Interface:** http://127.0.0.1:8000/admin

---

## 🛠️ **Troubleshooting**

### ❌ **Python Not Installed**
```
❌ Python is not installed
```
**Solution:** Install Python 3.8+ from: https://python.org

### ❌ **Package Installation Error**
```
❌ Error installing packages
```
**Solution:**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### ❌ **Migrations Error**
```
❌ Error creating migrations
```
**Solution:**
```bash
python manage.py makemigrations
python manage.py migrate
```

### ❌ **Port Already in Use**
```
Error: That port is already in use
```
**Solution:** Close the previous server or change port:
```bash
python manage.py runserver 8001
```

---

## 📁 **File Structure**

```
TodoFast2/
├── setup.bat          # Initial setup (Windows)
├── setup.sh           # Initial setup (Linux/Mac)
├── run.bat            # Quick start (Windows)
├── run.sh             # Quick start (Linux/Mac)
├── start.bat          # Quick start (Windows)
├── start.sh           # Quick start (Linux/Mac)
├── run.ps1            # PowerShell script (Windows)
├── start.ps1          # PowerShell quick start (Windows)
├── requirements.txt   # Python packages
├── manage.py          # Django management tool
└── README.md          # Usage instructions
```

---

## 🎯 **Usage Tips**

### 💡 **Quick Start**
- Use `start.bat`/`start.sh` for quick startup
- Use `run.bat`/`run.sh` if you need to reset setup

### 🔄 **Complete Reset**
```bash
# Windows
rmdir /s /q venv
setup.bat

# Linux/Mac
rm -rf venv
./setup.sh
```

### 📊 **Status Check**
```bash
# Check if server is running
curl http://127.0.0.1:8000

# Check logs
python manage.py runserver --verbosity=2
```

---

## 🚀 **Quick Start - Summary**

### 🪟 **Windows:**
1. Open Command Prompt
2. Navigate to project directory
3. Run: `run.bat`
4. Open: http://127.0.0.1:8000

### 🐧 **Linux/Mac:**
1. Open Terminal
2. Navigate to project directory
3. Run: `chmod +x run.sh && ./run.sh`
4. Open: http://127.0.0.1:8000

---

**🎉 TodoFast is ready to use!** 

*All scripts include clear English messages and comprehensive error handling*
