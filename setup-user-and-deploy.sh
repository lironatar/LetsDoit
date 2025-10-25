#!/bin/bash

# Complete user setup and deployment for ToDoFast
# This script creates a proper user and deploys the application

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
APP_DIR="/opt/todofast"
VENV_DIR="/opt/todofast/venv"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || hostname -I | awk '{print $1}')
log_info "Detected server IP: $SERVER_IP"

echo "=== ToDoFast Complete User Setup and Deployment ==="
echo "Repository: $REPO_URL"
echo "Server IP: $SERVER_IP"
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

log_step "Starting complete setup..."

# 1. Create application user
log_step "1. Creating application user..."
if id "$APP_USER" &>/dev/null; then
    log_info "User $APP_USER already exists"
else
    useradd --system --group --shell /bin/bash --home-dir $APP_DIR --create-home $APP_USER
    log_info "Created user: $APP_USER"
fi

# 2. Create directories
log_step "2. Creating directories..."
mkdir -p $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR

# 3. Install required packages
log_step "3. Installing required packages..."
apt update && apt upgrade -y
apt install -y python3.12 python3.12-venv python3.12-dev python3-pip nginx git build-essential sqlite3

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 4. Clone and setup application
log_step "4. Setting up application..."
sudo -u $APP_USER git clone $REPO_URL $APP_DIR/app
sudo -u $APP_USER python3.12 -m venv $VENV_DIR
sudo -u $APP_USER $VENV_DIR/bin/pip install --upgrade pip
sudo -u $APP_USER $VENV_DIR/bin/pip install -r $APP_DIR/app/requirements.txt

# 5. Setup frontend (with proper user)
log_step "5. Setting up frontend..."
cd $APP_DIR/app/frontend

# Create npm directories for the user
sudo -u $APP_USER mkdir -p $APP_DIR/.npm-cache
sudo -u $APP_USER mkdir -p $APP_DIR/.npm-global

# Set npm configuration
sudo -u $APP_USER npm config set cache $APP_DIR/.npm-cache
sudo -u $APP_USER npm config set prefix $APP_DIR/.npm-global

# Install npm packages
sudo -u $APP_USER npm install --no-optional --legacy-peer-deps --no-audit --no-fund

# Build frontend
sudo -u $APP_USER npm run build

# 6. Setup environment
log_step "6. Setting up environment..."
sudo -u $APP_USER cp $APP_DIR/app/.env.production $APP_DIR/.env
sed -i "s/yourdomain.com/$DOMAIN/g" $APP_DIR/.env
sed -i "s/CHANGE-THIS-TO-A-SECURE-RANDOM-KEY-IN-PRODUCTION/$(openssl rand -base64 32)/g" $APP_DIR/.env

# 7. Setup database
log_step "7. Setting up database..."
cd $APP_DIR/app
sudo -u $APP_USER $VENV_DIR/bin/python manage.py migrate
sudo -u $APP_USER $VENV_DIR/bin/python manage.py collectstatic --noinput

# 8. Create systemd service
log_step "8. Creating systemd service..."
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
WorkingDirectory=$APP_DIR/app
Environment=PATH=$VENV_DIR/bin:/usr/local/bin:/usr/bin:/bin
EnvironmentFile=$APP_DIR/.env

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
ReadWritePaths=$APP_DIR
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

# 9. Configure Nginx
log_step "9. Configuring Nginx..."
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
        alias $APP_DIR/app/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias $APP_DIR/app/media/;
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

# 10. Configure firewall
log_step "10. Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw --force enable

# 11. Start services
log_step "11. Starting services..."
systemctl start todofast
systemctl restart nginx

# 12. Final checks
log_step "12. Running final checks..."
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
echo "Application: $APP_DIR/app"
echo "Python version: $(sudo -u $APP_USER $VENV_DIR/bin/python --version)"
echo ""
echo "Useful commands:"
echo "  systemctl status todofast    # Check service status"
echo "  systemctl restart todofast   # Restart application"
echo "  journalctl -u todofast -f    # View logs"
echo ""
echo "Next steps:"
echo "  1. Test your application at: http://$DOMAIN"
echo "  2. Create a superuser account: sudo -u $APP_USER $VENV_DIR/bin/python $APP_DIR/app/manage.py createsuperuser"
echo "  3. Configure your email settings in $APP_DIR/.env"
echo ""
log_info "Deployment completed successfully!"
