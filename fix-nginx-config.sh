#!/bin/bash

# Fix Nginx configuration for ToDoFast
# This script creates proper Nginx configuration to proxy to Django

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
APP_DIR="/home/todofast/app"
STATIC_DIR="/home/todofast/app/staticfiles"
MEDIA_DIR="/home/todofast/app/media"
SERVER_IP="63.250.61.126"

log_step "Fixing Nginx configuration for ToDoFast..."

# 1. Check if Django is running
log_step "1. Checking Django service..."
if systemctl is-active --quiet todofast; then
    log_info "Django service is running"
else
    log_warn "Django service is not running, starting it..."
    systemctl start todofast
    sleep 3
fi

# 2. Test Django directly
log_step "2. Testing Django directly..."
if curl -s http://localhost:8000 > /dev/null; then
    log_info "Django is responding on port 8000"
else
    log_error "Django is not responding on port 8000"
    log_info "Checking Django logs..."
    journalctl -u todofast --no-pager -n 10
    exit 1
fi

# 3. Create Nginx configuration
log_step "3. Creating Nginx configuration..."
cat > /etc/nginx/sites-available/todofast << EOF
server {
    listen 80;
    server_name $SERVER_IP;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy to Django
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Static files
    location /static/ {
        alias $STATIC_DIR/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias $MEDIA_DIR/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 4. Enable the site and disable default
log_step "4. Enabling ToDoFast site..."
ln -sf /etc/nginx/sites-available/todofast /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 5. Test Nginx configuration
log_step "5. Testing Nginx configuration..."
if nginx -t; then
    log_info "Nginx configuration is valid"
else
    log_error "Nginx configuration has errors"
    exit 1
fi

# 6. Reload Nginx
log_step "6. Reloading Nginx..."
systemctl reload nginx

# 7. Test the application
log_step "7. Testing application..."
sleep 2
if curl -s -I http://$SERVER_IP | grep -q "200 OK"; then
    log_info "Application is responding correctly"
else
    log_warn "Application test failed, checking logs..."
    tail -n 20 /var/log/nginx/error.log
fi

# 8. Show status
log_step "8. Final status check..."
echo ""
log_info "=== Nginx Configuration Fixed! ==="
echo ""
echo "Service status:"
echo "  Django: $(systemctl is-active todofast)"
echo "  Nginx:  $(systemctl is-active nginx)"
echo ""
echo "Test your application:"
echo "  curl -I http://$SERVER_IP"
echo "  curl http://$SERVER_IP"
echo ""
echo "Check logs if needed:"
echo "  journalctl -u todofast -f"
echo "  tail -f /var/log/nginx/error.log"
echo ""
log_info "Nginx configuration fix completed!"
