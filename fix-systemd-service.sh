#!/bin/bash

# Fix systemd service configuration for ToDoFast
# This script creates a working systemd service configuration

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

log_step "Fixing systemd service configuration..."

# 1. Stop the failing service
log_step "1. Stopping failing service..."
systemctl stop todofast || true

# 2. Create a simple working systemd service
log_step "2. Creating simple systemd service..."
cat > /etc/systemd/system/todofast.service << EOF
[Unit]
Description=ToDoFast Django Application
After=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
Environment=PATH=$VENV_DIR/bin
EnvironmentFile=$HOME_DIR/.env

# Simple command that we know works
ExecStart=$VENV_DIR/bin/waitress-serve --host=0.0.0.0 --port=8000 todofast.wsgi:application

Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# 3. Reload systemd
log_step "3. Reloading systemd..."
systemctl daemon-reload

# 4. Start service
log_step "4. Starting service..."
systemctl start todofast

# 5. Check status
log_step "5. Checking service status..."
sleep 3
systemctl status todofast --no-pager

# 6. Test application
log_step "6. Testing application..."
curl -I http://63.250.61.126 || log_warn "Application test failed - check configuration"

echo ""
log_info "=== Systemd Service Fixed! ==="
echo ""
echo "Service status:"
systemctl is-active todofast
echo ""
echo "If the service is still not running, check the logs:"
echo "  journalctl -u todofast -f"
echo ""
echo "Alternative: Run Django manually for testing:"
echo "  cd $APP_DIR"
echo "  sudo -u $APP_USER $VENV_DIR/bin/waitress-serve --host=0.0.0.0 --port=8000 todofast.wsgi:application"
echo ""
log_info "Systemd service fix completed!"
