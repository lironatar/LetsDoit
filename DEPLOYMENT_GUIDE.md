# Linux Server Deployment Guide for ToDoFast

This guide will help you deploy your Django + React application to a Linux server for production.

## Prerequisites

- Ubuntu 20.04+ or CentOS 7+ server
- Root or sudo access
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)

## 1. Server Setup

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Required Packages
```bash
# Install Python 3.11 and pip
sudo apt install python3.11 python3.11-venv python3.11-dev python3-pip -y

# Install Node.js 18+ (for building React frontend)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Install system dependencies
sudo apt install nginx postgresql postgresql-contrib git build-essential libpq-dev -y

# Install additional packages for your app
sudo apt install sqlite3 -y
```

### Create Application User
```bash
sudo adduser --system --group --shell /bin/bash todofast
sudo mkdir -p /opt/todofast
sudo chown todofast:todofast /opt/todofast
```

## 2. Application Deployment

### Clone and Setup Application
```bash
sudo -u todofast git clone <your-repo-url> /opt/todofast/app
cd /opt/todofast/app

# Create virtual environment
sudo -u todofast python3.11 -m venv /opt/todofast/venv
sudo -u todofast /opt/todofast/venv/bin/pip install --upgrade pip

# Install Python dependencies
sudo -u todofast /opt/todofast/venv/bin/pip install -r requirements.txt

# Build React frontend
cd frontend
sudo -u todofast npm install
sudo -u todofast npm run build
cd ..
```

## 3. Environment Configuration

Create production environment file:
```bash
sudo -u todofast nano /opt/todofast/.env
```

Add the following content:
```env
# Django Settings
SECRET_KEY=your-super-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,your-server-ip

# Database (using SQLite for simplicity, or configure PostgreSQL)
DATABASE_URL=sqlite:///opt/todofast/db.sqlite3

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Google OAuth
GOOGLE_OAUTH2_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH2_CLIENT_SECRET=your-google-client-secret

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Security Settings
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Logging
LOG_LEVEL=INFO
```

## 4. Database Setup

```bash
# Run migrations
sudo -u todofast /opt/todofast/venv/bin/python /opt/todofast/app/manage.py migrate

# Create superuser (optional)
sudo -u todofast /opt/todofast/venv/bin/python /opt/todofast/app/manage.py createsuperuser

# Collect static files
sudo -u todofast /opt/todofast/venv/bin/python /opt/todofast/app/manage.py collectstatic --noinput
```

## 5. Nginx Configuration

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/todofast
```

Add the following content:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (replace with your certificate paths)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Static files
    location /static/ {
        alias /opt/todofast/app/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias /opt/todofast/app/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Django application
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/todofast /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Systemd Service

Create systemd service file:
```bash
sudo nano /etc/systemd/system/todofast.service
```

Add the following content:
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
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable todofast
sudo systemctl start todofast
sudo systemctl status todofast
```

## 7. SSL Certificate (Let's Encrypt)

Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
```

Get SSL certificate:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 8. Firewall Configuration

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

## 9. Monitoring and Logs

### View Application Logs
```bash
sudo journalctl -u todofast -f
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Application Logs
```bash
sudo tail -f /opt/todofast/app/logs/django.log
sudo tail -f /opt/todofast/app/logs/errors.log
```

## 10. Backup Strategy

Create backup script:
```bash
sudo nano /opt/todofast/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/todofast/backups"
APP_DIR="/opt/todofast/app"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
cp $APP_DIR/db.sqlite3 $BACKUP_DIR/db_$DATE.sqlite3

# Backup media files
tar -czf $BACKUP_DIR/media_$DATE.tar.gz $APP_DIR/media/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sqlite3" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Make it executable and add to cron:
```bash
sudo chmod +x /opt/todofast/backup.sh
sudo crontab -e
# Add: 0 2 * * * /opt/todofast/backup.sh
```

## 11. Updates and Maintenance

### Update Application
```bash
cd /opt/todofast/app
sudo -u todofast git pull origin main
sudo -u todofast /opt/todofast/venv/bin/pip install -r requirements.txt
cd frontend
sudo -u todofast npm install
sudo -u todofast npm run build
cd ..
sudo -u todofast /opt/todofast/venv/bin/python manage.py migrate
sudo -u todofast /opt/todofast/venv/bin/python manage.py collectstatic --noinput
sudo systemctl restart todofast
```

## 12. Performance Optimization

### Install Redis for Caching (Optional)
```bash
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Configure Django for Redis
Add to your `.env` file:
```env
REDIS_URL=redis://localhost:6379/1
```

## Troubleshooting

### Common Issues

1. **Permission Issues**: Ensure `todofast` user owns all files
2. **Port Conflicts**: Check if port 8000 is available
3. **SSL Issues**: Verify certificate paths and permissions
4. **Database Issues**: Check SQLite file permissions

### Useful Commands

```bash
# Check service status
sudo systemctl status todofast

# Restart service
sudo systemctl restart todofast

# Check Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check disk space
df -h

# Check memory usage
free -h
```

## Security Checklist

- [ ] Change default SSH port
- [ ] Disable root login
- [ ] Set up fail2ban
- [ ] Configure firewall
- [ ] Enable automatic security updates
- [ ] Set up monitoring
- [ ] Regular backups
- [ ] SSL certificate auto-renewal

Your application should now be running securely on your Linux server!
