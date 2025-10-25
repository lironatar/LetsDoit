#!/bin/bash

# Create user home directory and deploy ToDoFast
# This script creates the home directory and deploys the application

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
REPO_URL="https://github.com/lironatar/LetsDoit.git"
APP_USER="todofast"
HOME_DIR="/home/todofast"
APP_DIR="$HOME_DIR/app"
VENV_DIR="$HOME_DIR/venv"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || hostname -I | awk '{print $1}')
log_info "Detected server IP: $SERVER_IP"

echo "=== Create User Home and Deploy ToDoFast ==="
echo "Repository: $REPO_URL"
echo "Server IP: $SERVER_IP"
echo "App Directory: $APP_DIR"
echo ""

read -p "Do you want to use the detected IP ($SERVER_IP) or enter a different one? [y/N]: " USE_DETECTED_IP

if [[ $USE_DETECTED_IP =~ ^[Yy]$ ]]; then
    DOMAIN=$SERVER_IP
    log_info "Using detected IP: $DOMAIN"
else
    read -p "Enter your server IP address: " DOMAIN
fi

if [ -z "$DOMAIN" ]; then
    log_error "IP address is required!"
    exit 1
fi

log_step "Starting deployment with user home directory creation..."

# 1. Create home directory for existing user
log_step "1. Creating home directory for existing user..."
mkdir -p $HOME_DIR
chown -R $APP_USER:$APP_USER $HOME_DIR
chmod -R 755 $HOME_DIR

# 2. Install required packages (as root)
log_step "2. Installing required packages..."
apt update && apt upgrade -y
apt install -y python3.12 python3.12-venv python3.12-dev python3-pip nginx git build-essential sqlite3

# Install Node.js (as root)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 3. Clone and setup application (as user)
log_step "3. Setting up application in home directory..."
sudo -u $APP_USER git clone $REPO_URL $APP_DIR
sudo -u $APP_USER python3.12 -m venv $VENV_DIR
sudo -u $APP_USER $VENV_DIR/bin/pip install --upgrade pip
sudo -u $APP_USER $VENV_DIR/bin/pip install -r $APP_DIR/requirements.txt

# 4. Setup frontend (as user)
log_step "4. Setting up frontend in home directory..."
cd $APP_DIR/frontend

# npm should work much better in home directory
sudo -u $APP_USER npm install --no-optional --legacy-peer-deps --no-audit --no-fund

# Build frontend
sudo -u $APP_USER npm run build

# 5. Setup environment (as user)
log_step "5. Setting up environment..."
sudo -u $APP_USER cp $APP_DIR/.env.production $HOME_DIR/.env
sed -i "s/yourdomain.com/$DOMAIN/g" $HOME_DIR/.env
sed -i "s/CHANGE-THIS-TO-A-SECURE-RANDOM-KEY-IN-PRODUCTION/$(openssl rand -base64 32)/g" $HOME_DIR/.env

# 6. Setup database (as user)
log_step "6. Setting up database..."
cd $APP_DIR
sudo -u $APP_USER $VENV_DIR/bin/python manage.py migrate
sudo -u $APP_USER $VENV_DIR/bin/python manage.py collectstatic --noinput

# 7. Create systemd service (as root)
log_step "7. Creating systemd service..."
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

# 8. Configure Nginx (as root)
log_step "8. Configuring Nginx..."
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

# 9. Configure firewall (as root)
log_step "9. Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw --force enable

# 10. Start services (as root)
log_step "10. Starting services..."
systemctl start todofast
systemctl restart nginx

# 11. Final checks
log_step "11. Running final checks..."
systemctl status todofast --no-pager
systemctl status nginx --no-pager

# Test application
log_info "Testing application..."
curl -I http://$DOMAIN || log_warn "Application test failed - check configuration"

echo ""
log_info "=== Deployment Complete! ==="
echo ""
echo "Your ToDoFast application is now running at: http://$DOMAIN"
echo ""
echo "User: $APP_USER"
echo "Home Directory: $HOME_DIR"
echo "Application: $APP_DIR"
echo "Python version: $(sudo -u $APP_USER $VENV_DIR/bin/python --version)"
echo ""
echo "Useful commands:"
echo "  systemctl status todofast    # Check service status"
echo "  systemctl restart todofast   # Restart application"
echo "  journalctl -u todofast -f    # View logs"
echo ""
echo "Next steps:"
echo "  1. Test your application at: http://$DOMAIN"
echo "  2. Create a superuser account: sudo -u $APP_USER $VENV_DIR/bin/python $APP_DIR/manage.py createsuperuser"
echo "  3. Configure your email settings in $HOME_DIR/.env"
echo ""
log_info "Deployment completed successfully!"
