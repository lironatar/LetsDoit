#!/bin/bash

# One-Command Deployment for ToDoFast - No Domain Required
# Repository: https://github.com/lironatar/LetsDoit.git
# Optimized for Python 3.12
# This version works with IP address only

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

# Get server IP address
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || hostname -I | awk '{print $1}')
log_info "Detected server IP: $SERVER_IP"

# Get user input
echo "=== ToDoFast One-Command Deployment (No Domain Required) ==="
echo "Repository: $REPO_URL"
echo "Optimized for Python 3.12"
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

log_step "Starting deployment process..."

# 1. Update system
log_step "1. Updating system packages..."
apt update && apt upgrade -y

# 2. Install required packages
log_step "2. Installing required packages..."
apt install -y python3.12 python3.12-venv python3.12-dev python3.12-distutils python3-pip nginx git build-essential sqlite3

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 3. Create application user
log_step "3. Creating application user..."
adduser --system --group --shell /bin/bash todofast || true
mkdir -p /opt/todofast
chown todofast:todofast /opt/todofast

# 4. Clone and setup application
log_step "4. Setting up application with Python 3.12..."
sudo -u todofast git clone $REPO_URL /opt/todofast/app
sudo -u todofast python3.12 -m venv /opt/todofast/venv
sudo -u todofast /opt/todofast/venv/bin/pip install --upgrade pip
sudo -u todofast /opt/todofast/venv/bin/pip install -r /opt/todofast/app/requirements.txt

# Build frontend
cd /opt/todofast/app/frontend
sudo -u todofast npm install
sudo -u todofast npm run build
cd /opt/todofast/app

# 5. Create environment file
log_step "5. Creating environment configuration..."
sudo -u todofast cp /opt/todofast/app/.env.production /opt/todofast/.env

# Update environment file with IP address
sed -i "s/yourdomain.com/$DOMAIN/g" /opt/todofast/.env
sed -i "s/CHANGE-THIS-TO-A-SECURE-RANDOM-KEY-IN-PRODUCTION/$(openssl rand -base64 32)/g" /opt/todofast/.env

# 6. Setup database
log_step "6. Setting up database..."
sudo -u todofast /opt/todofast/venv/bin/python /opt/todofast/app/manage.py migrate
sudo -u todofast /opt/todofast/venv/bin/python /opt/todofast/app/manage.py collectstatic --noinput

# 7. Create systemd service
log_step "7. Creating systemd service..."
cat > /etc/systemd/system/todofast.service << EOF
[Unit]
Description=ToDoFast Django Application (Python 3.12)
After=network.target network-online.target
Wants=network-online.target
Requires=network.target

[Service]
Type=exec
User=todofast
Group=todofast
WorkingDirectory=/opt/todofast/app
Environment=PATH=/opt/todofast/venv/bin:/usr/local/bin:/usr/bin:/bin
EnvironmentFile=/opt/todofast/.env

# Main application command
ExecStart=/opt/todofast/venv/bin/waitress-serve --host=0.0.0.0 --port=8000 --threads=4 todofast.wsgi:application

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
ReadWritePaths=/opt/todofast
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

# 8. Configure Nginx (HTTP only, no SSL)
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

# 9. Configure firewall
log_step "9. Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw --force enable

# 10. Start services
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
echo "Repository: $REPO_URL"
echo "Python version: $(sudo -u todofast /opt/todofast/venv/bin/python --version)"
echo ""
echo "Useful commands:"
echo "  systemctl status todofast    # Check service status"
echo "  systemctl restart todofast   # Restart application"
echo "  journalctl -u todofast -f    # View logs"
echo ""
echo "Important files:"
echo "  Application: /opt/todofast/app"
echo "  Environment: /opt/todofast/.env"
echo "  Logs: /opt/todofast/app/logs/"
echo "  Nginx config: /etc/nginx/sites-available/todofast"
echo ""
log_warn "Next steps:"
echo "  1. Test your application at: http://$DOMAIN"
echo "  2. Create a superuser account: sudo -u todofast /opt/todofast/venv/bin/python /opt/todofast/app/manage.py createsuperuser"
echo "  3. Configure your email settings in /opt/todofast/.env"
echo "  4. When you get a domain, you can add SSL later"
echo ""
log_info "Deployment completed successfully!"
