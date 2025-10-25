#!/bin/bash

# Fix permissions for ToDoFast deployment
# This script fixes all permission issues

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

log_step "Fixing permissions for ToDoFast..."

# 1. Fix ownership of all files
log_step "1. Fixing ownership of all files..."
chown -R todofast:todofast /opt/todofast

# 2. Fix permissions
log_step "2. Setting proper permissions..."
chmod -R 755 /opt/todofast
chmod -R 644 /opt/todofast/app/*.py
chmod -R 644 /opt/todofast/app/*.txt
chmod -R 644 /opt/todofast/app/*.md
chmod +x /opt/todofast/app/manage.py

# 3. Fix npm cache and config
log_step "3. Fixing npm configuration..."
# Remove corrupted npm cache
rm -rf /root/.npm
rm -rf /home/todofast/.npm
rm -rf /opt/todofast/app/frontend/node_modules
rm -rf /opt/todofast/app/frontend/package-lock.json

# Create proper npm directories
mkdir -p /opt/todofast/.npm-cache
mkdir -p /opt/todofast/.npm-global
chown -R todofast:todofast /opt/todofast/.npm-cache
chown -R todofast:todofast /opt/todofast/.npm-global

# 4. Set npm configuration for todofast user
log_step "4. Setting npm configuration..."
sudo -u todofast npm config set cache /opt/todofast/.npm-cache
sudo -u todofast npm config set prefix /opt/todofast/.npm-global
sudo -u todofast npm config set registry https://registry.npmjs.org/

# 5. Try to install npm packages
log_step "5. Installing npm packages..."
cd /opt/todofast/app/frontend

# Try different approaches
sudo -u todofast npm install --no-optional --legacy-peer-deps --no-audit --no-fund || {
    log_warn "npm install failed, trying yarn..."
    sudo -u todofast npm install -g yarn
    sudo -u todofast yarn install --no-optional
}

# 6. Build frontend
log_step "6. Building frontend..."
sudo -u todofast npm run build || sudo -u todofast yarn build

# 7. Fix Django setup
log_step "7. Setting up Django..."
cd /opt/todofast/app
sudo -u todofast /opt/todofast/venv/bin/python manage.py migrate
sudo -u todofast /opt/todofast/venv/bin/python manage.py collectstatic --noinput

# 8. Start services
log_step "8. Starting services..."
systemctl start todofast
systemctl restart nginx

log_info "Permissions fixed successfully!"
log_info "Your application should now be running!"
