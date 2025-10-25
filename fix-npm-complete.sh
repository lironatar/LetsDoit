#!/bin/bash

# Complete npm fix for ToDoFast
# This script fixes npm configuration and permission issues

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

log_step "Fixing npm configuration issues..."

# 1. Fix npm configuration
log_step "1. Fixing npm configuration..."
cd /opt/todofast/app/frontend

# Remove corrupted npm cache and config
sudo rm -rf /root/.npm
sudo rm -rf /home/todofast/.npm
sudo rm -rf /opt/todofast/app/frontend/node_modules
sudo rm -rf /opt/todofast/app/frontend/package-lock.json

# 2. Set proper npm configuration
log_step "2. Setting proper npm configuration..."
sudo -u todofast npm config set cache /opt/todofast/.npm-cache
sudo -u todofast npm config set prefix /opt/todofast/.npm-global
sudo -u todofast npm config set registry https://registry.npmjs.org/

# 3. Create proper directories
log_step "3. Creating proper directories..."
sudo mkdir -p /opt/todofast/.npm-cache
sudo mkdir -p /opt/todofast/.npm-global
sudo chown -R todofast:todofast /opt/todofast/.npm-cache
sudo chown -R todofast:todofast /opt/todofast/.npm-global

# 4. Fix permissions
log_step "4. Fixing permissions..."
sudo chown -R todofast:todofast /opt/todofast/app/frontend

# 5. Try alternative installation methods
log_step "5. Trying alternative installation methods..."

# Method 1: Use npm with different settings
log_info "Trying npm with different settings..."
sudo -u todofast npm install --no-optional --legacy-peer-deps --no-audit --no-fund --cache /opt/todofast/.npm-cache

# If that fails, try Method 2: Use yarn
if [ $? -ne 0 ]; then
    log_warn "npm install failed, trying yarn..."
    
    # Install yarn
    sudo -u todofast npm install -g yarn --cache /opt/todofast/.npm-cache
    
    # Use yarn to install packages
    sudo -u todofast yarn install --no-optional
fi

# If that fails, try Method 3: Manual package installation
if [ $? -ne 0 ]; then
    log_warn "yarn install failed, trying manual installation..."
    
    # Install packages one by one
    sudo -u todofast npm install react react-dom --cache /opt/todofast/.npm-cache
    sudo -u todofast npm install @heroicons/react axios date-fns --cache /opt/todofast/.npm-cache
    sudo -u todofast npm install react-big-calendar react-multi-date-picker --cache /opt/todofast/.npm-cache
    sudo -u todofast npm install --save-dev @vitejs/plugin-react vite --cache /opt/todofast/.npm-cache
    sudo -u todofast npm install --save-dev tailwindcss autoprefixer postcss --cache /opt/todofast/.npm-cache
fi

# 6. Build the frontend
log_step "6. Building React frontend..."
sudo -u todofast npm run build

log_info "npm installation completed successfully!"
