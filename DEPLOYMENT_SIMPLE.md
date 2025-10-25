# Simple Linux Deployment Guide - Works with Any Python Version

## Quick Fix for Python Installation Issue

If you're getting the error `E: Unable to locate package python3.11`, here are the solutions:

### Option 1: Use Available Python Version (Recommended)

```bash
# Check what Python versions are available
python3 --version
python3.10 --version 2>/dev/null || echo "Python 3.10 not available"
python3.9 --version 2>/dev/null || echo "Python 3.9 not available"

# Install the available version
sudo apt update
sudo apt install -y python3 python3-venv python3-dev python3-pip
```

### Option 2: Add Python 3.11 Repository

```bash
# For Ubuntu 18.04, 20.04, 22.04, 24.04
sudo apt update
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3.11-distutils
```

### Option 3: Use the Fix Script

```bash
# Download and run the fix script
wget https://raw.githubusercontent.com/yourusername/todofast/main/fix-python-install.sh
chmod +x fix-python-install.sh
./fix-python-install.sh
```

## Simplified Deployment Steps

### 1. Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python (use available version)
sudo apt install -y python3 python3-venv python3-dev python3-pip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install other dependencies
sudo apt install -y nginx git build-essential sqlite3
```

### 2. Create Application User

```bash
sudo adduser --system --group --shell /bin/bash todofast
sudo mkdir -p /opt/todofast
sudo chown todofast:todofast /opt/todofast
```

### 3. Deploy Application

```bash
# Clone your repository
sudo -u todofast git clone <your-repo-url> /opt/todofast/app

# Create virtual environment (using available Python)
cd /opt/todofast/app
sudo -u todofast python3 -m venv /opt/todofast/venv

# Install Python dependencies
sudo -u todofast /opt/todofast/venv/bin/pip install --upgrade pip
sudo -u todofast /opt/todofast/venv/bin/pip install -r requirements.txt

# Build React frontend
cd frontend
sudo -u todofast npm install
sudo -u todofast npm run build
cd ..

# Setup environment
sudo -u todofast cp .env.production /opt/todofast/.env
# Edit the environment file with your settings
sudo -u todofast nano /opt/todofast/.env
```

### 4. Configure Database

```bash
# Run migrations
sudo -u todofast /opt/todofast/venv/bin/python manage.py migrate

# Collect static files
sudo -u todofast /opt/todofast/venv/bin/python manage.py collectstatic --noinput

# Create superuser (optional)
sudo -u todofast /opt/todofast/venv/bin/python manage.py createsuperuser
```

### 5. Create Systemd Service

```bash
sudo nano /etc/systemd/system/todofast.service
```

Add this content (adjust Python path if needed):
```ini
[Unit]
Description=ToDoFast Django Application
After=network.target

[Service]
Type=exec
User=todofast
Group=todofast
WorkingDirectory=/opt/todofast/app
Environment=PATH=/opt/todofast/venv/bin
EnvironmentFile=/opt/todofast/.env
ExecStart=/opt/todofast/venv/bin/waitress-serve --host=127.0.0.1 --port=8000 todofast.wsgi:application
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### 6. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/todofast
```

Add this content:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location /static/ {
        alias /opt/todofast/app/staticfiles/;
    }
    
    location /media/ {
        alias /opt/todofast/app/media/;
    }
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/todofast /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Start Services

```bash
# Enable and start the application
sudo systemctl daemon-reload
sudo systemctl enable todofast
sudo systemctl start todofast

# Check status
sudo systemctl status todofast
```

### 8. Setup SSL (Optional)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Troubleshooting

### Check Python Version
```bash
python3 --version
/opt/todofast/venv/bin/python --version
```

### Check Service Status
```bash
sudo systemctl status todofast
sudo journalctl -u todofast -f
```

### Check Nginx
```bash
sudo nginx -t
sudo systemctl status nginx
```

### View Logs
```bash
sudo tail -f /opt/todofast/app/logs/django.log
sudo tail -f /var/log/nginx/error.log
```

## Quick Commands

```bash
# Restart application
sudo systemctl restart todofast

# Update application
cd /opt/todofast/app
sudo -u todofast git pull
sudo -u todofast /opt/todofast/venv/bin/pip install -r requirements.txt
cd frontend && sudo -u todofast npm run build && cd ..
sudo -u todofast /opt/todofast/venv/bin/python manage.py migrate
sudo -u todofast /opt/todofast/venv/bin/python manage.py collectstatic --noinput
sudo systemctl restart todofast
```

This simplified approach works with any Python 3.x version and should resolve your installation issues!
