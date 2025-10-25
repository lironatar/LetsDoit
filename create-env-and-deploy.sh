#!/bin/bash

# Create environment file and deploy ToDoFast Django backend
# This script creates the environment file and deploys the application

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Configuration
APP_USER="todofast"
HOME_DIR="/home/todofast"
APP_DIR="$HOME_DIR/app"
VENV_DIR="$HOME_DIR/venv"
DOMAIN="63.250.61.126"

log_step "Creating environment file and deploying ToDoFast Django backend..."

# 1. Create environment file
log_step "1. Creating environment file..."
cat > $HOME_DIR/.env << EOF
# Django Settings
SECRET_KEY=$(openssl rand -base64 32)
DEBUG=False
ALLOWED_HOSTS=$DOMAIN,localhost,127.0.0.1

# Database Configuration
DATABASE_URL=sqlite:///home/todofast/db.sqlite3

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=TodoFast <noreply@todofast.com>

# Google OAuth Configuration
GOOGLE_OAUTH2_CLIENT_ID=
GOOGLE_OAUTH2_CLIENT_SECRET=

# Frontend URL
FRONTEND_URL=http://$DOMAIN

# Security Settings
SECURE_SSL_REDIRECT=False
SECURE_HSTS_SECONDS=0
SECURE_HSTS_INCLUDE_SUBDOMAINS=False
SECURE_HSTS_PRELOAD=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False

# CORS Settings
CORS_ALLOWED_ORIGINS=http://$DOMAIN,http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://$DOMAIN,http://localhost:5173

# Logging
LOG_LEVEL=INFO
EOF

chown $APP_USER:$APP_USER $HOME_DIR/.env

# 2. Setup database
log_step "2. Setting up database..."
cd $APP_DIR
sudo -u $APP_USER $VENV_DIR/bin/python manage.py migrate
sudo -u $APP_USER $VENV_DIR/bin/python manage.py collectstatic --noinput

# 3. Create systemd service
log_step "3. Creating systemd service..."
cat > /etc/systemd/system/todofast.service << EOF
[Unit]
Description=ToDoFast Django Application (Python 3.12)
After=network.target network-online.target
Wants=network-online.target
Requires=network.target

[Service]
Type=exec
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
Environment=PATH=$VENV_DIR/bin:/usr/local/bin:/usr/bin:/bin
EnvironmentFile=$HOME_DIR/.env

# Main application command
ExecStart=$VENV_DIR/bin/waitress-serve --host=0.0.0.0 --port=8000 --threads=4 todofast.wsgi:application

# Process management
ExecReload=/bin/kill -s HUP \$MAINPID
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=30

# Restart policy
Restart=always
RestartSec=3
StartLimitBurst=5
StartLimitInterval=60s

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$HOME_DIR
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=todofast

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable todofast

# 4. Configure Nginx
log_step "4. Configuring Nginx..."
cat > /etc/nginx/sites-available/todofast << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Static files with long cache
    location /static/ {
        alias $APP_DIR/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias $APP_DIR/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Django application
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/todofast /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# 5. Configure firewall
log_step "5. Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw --force enable

# 6. Start services
log_step "6. Starting services..."
systemctl start todofast
systemctl restart nginx

# 7. Final checks
log_step "7. Running final checks..."
systemctl status todofast --no-pager
systemctl status nginx --no-pager

# Test application
log_info "Testing application..."
curl -I http://$DOMAIN || log_warn "Application test failed - check configuration"

echo ""
log_info "=== Django Backend Deployed Successfully! ==="
echo ""
echo "Your ToDoFast Django backend is now running at: http://$DOMAIN"
echo ""
echo "User: $APP_USER"
echo "Home Directory: $HOME_DIR"
echo "Application: $APP_DIR"
echo "Environment: $HOME_DIR/.env"
echo "Python version: $(sudo -u $APP_USER $VENV_DIR/bin/python --version)"
echo ""
echo "Useful commands:"
echo "  systemctl status todofast    # Check service status"
echo "  systemctl restart todofast   # Restart application"
echo "  journalctl -u todofast -f    # View logs"
echo ""
echo "Next steps:"
echo "  1. Test your Django backend at: http://$DOMAIN"
echo "  2. Create a superuser account: sudo -u $APP_USER $VENV_DIR/bin/python $APP_DIR/manage.py createsuperuser"
echo "  3. Configure your email settings in $HOME_DIR/.env"
echo "  4. Add Google OAuth credentials to $HOME_DIR/.env"
echo ""
log_warn "Frontend build skipped due to npm issues. You can build it later with:"
echo "  cd $APP_DIR/frontend"
echo "  sudo -u $APP_USER npm install --force"
echo "  sudo -u $APP_USER npm run build"
echo ""
log_info "Django backend deployment completed successfully!"
