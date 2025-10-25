#!/bin/bash

# Fix npm installation issues for ToDoFast
# This script resolves common npm permission and corruption issues

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

log_step "Fixing npm installation issues..."

# 1. Clean up corrupted node_modules
log_step "1. Cleaning up corrupted node_modules..."
cd /opt/todofast/app/frontend

# Remove corrupted node_modules
sudo rm -rf node_modules package-lock.json

# Clear npm cache
sudo npm cache clean --force

# 2. Fix permissions
log_step "2. Fixing permissions..."
sudo chown -R todofast:todofast /opt/todofast/app/frontend

# 3. Install with proper permissions
log_step "3. Installing npm packages with proper permissions..."
sudo -u todofast npm install --no-optional --legacy-peer-deps

# 4. If still having issues, try alternative approach
if [ $? -ne 0 ]; then
    log_warn "Standard npm install failed, trying alternative approach..."
    
    # Try with different npm settings
    sudo -u todofast npm install --no-optional --legacy-peer-deps --force
    
    # If still failing, try with yarn
    if [ $? -ne 0 ]; then
        log_warn "npm install still failing, trying with yarn..."
        sudo -u todofast npm install -g yarn
        sudo -u todofast yarn install
    fi
fi

# 5. Build the frontend
log_step "4. Building React frontend..."
sudo -u todofast npm run build

log_info "npm installation fixed successfully!"
