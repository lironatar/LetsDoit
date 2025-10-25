#!/bin/bash

# Fix waitress-serve issue for ToDoFast
# This script checks and fixes the waitress-serve command issue

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

log_step "Fixing waitress-serve issue..."

# 1. Check if waitress is installed
log_step "1. Checking if waitress is installed..."
sudo -u $APP_USER $VENV_DIR/bin/pip list | grep waitress || {
    log_warn "Waitress not found, installing..."
    sudo -u $APP_USER $VENV_DIR/bin/pip install waitress
}

# 2. Check waitress-serve command
log_step "2. Checking waitress-serve command..."
sudo -u $APP_USER $VENV_DIR/bin/waitress-serve --help || {
    log_error "waitress-serve command not found"
    exit 1
}

# 3. Test Django application
log_step "3. Testing Django application..."
cd $APP_DIR
sudo -u $APP_USER $VENV_DIR/bin/python manage.py check || {
    log_error "Django check failed"
    exit 1
}

# 4. Create missing frontend directory
log_step "4. Creating missing frontend directory..."
mkdir -p $APP_DIR/frontend/dist
chown -R $APP_USER:$APP_USER $APP_DIR/frontend/dist

# 5. Test waitress-serve manually
log_step "5. Testing waitress-serve manually..."
cd $APP_DIR
timeout 5 sudo -u $APP_USER $VENV_DIR/bin/waitress-serve --host=0.0.0.0 --port=8000 --threads=4 todofast.wsgi:application &
WAITRESS_PID=$!
sleep 2
kill $WAITRESS_PID 2>/dev/null || true

# 6. Update systemd service with correct command
log_step "6. Updating systemd service..."
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

# Main application command - using full path
ExecStart=$VENV_DIR/bin/python -m waitress --host=0.0.0.0 --port=8000 --threads=4 todofast.wsgi:application

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

# 7. Reload systemd and restart service
log_step "7. Reloading systemd and restarting service..."
systemctl daemon-reload
systemctl restart todofast

# 8. Check service status
log_step "8. Checking service status..."
sleep 3
systemctl status todofast --no-pager

# 9. Test application
log_step "9. Testing application..."
curl -I http://63.250.61.126 || log_warn "Application test failed - check configuration"

echo ""
log_info "=== Waitress Issue Fixed! ==="
echo ""
echo "Service status:"
systemctl is-active todofast
echo ""
echo "If the service is still not running, check the logs:"
echo "  journalctl -u todofast -f"
echo ""
echo "Alternative: Run Django manually for testing:"
echo "  cd $APP_DIR"
echo "  sudo -u $APP_USER $VENV_DIR/bin/python manage.py runserver 0.0.0.0:8000"
echo ""
log_info "Waitress issue fix completed!"
