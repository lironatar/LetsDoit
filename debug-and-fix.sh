#!/bin/bash

# Debug and fix ToDoFast service issues
# This script checks the service status and fixes common issues

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

log_step "Debugging and fixing ToDoFast service issues..."

# 1. Check service status
log_step "1. Checking service status..."
systemctl status todofast --no-pager || true

# 2. Check logs
log_step "2. Checking service logs..."
journalctl -u todofast --no-pager -n 20 || true

# 3. Check if Python virtual environment exists
log_step "3. Checking Python virtual environment..."
if [ ! -d "$VENV_DIR" ]; then
    log_error "Virtual environment not found at $VENV_DIR"
    exit 1
fi

# 4. Check if Django app exists
log_step "4. Checking Django application..."
if [ ! -f "$APP_DIR/manage.py" ]; then
    log_error "Django application not found at $APP_DIR"
    exit 1
fi

# 5. Test Django application manually
log_step "5. Testing Django application manually..."
cd $APP_DIR
sudo -u $APP_USER $VENV_DIR/bin/python manage.py check || {
    log_error "Django check failed"
    exit 1
}

# 6. Fix frontend dist directory issue
log_step "6. Fixing frontend dist directory issue..."
mkdir -p $APP_DIR/frontend/dist
chown -R $APP_USER:$APP_USER $APP_DIR/frontend/dist

# 7. Update Django settings to handle missing frontend
log_step "7. Updating Django settings..."
# Create a simple index.html for the frontend
cat > $APP_DIR/frontend/dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ToDoFast</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .status { background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .api-link { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 10px; }
        .api-link:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 ToDoFast Backend Running!</h1>
            <p>Django backend is successfully deployed and running.</p>
        </div>
        
        <div class="status">
            <h3>✅ Backend Status: Running</h3>
            <p>Your Django backend is working correctly. The frontend will be built later.</p>
        </div>
        
        <div class="links">
            <h3>Available Endpoints:</h3>
            <a href="/admin/" class="api-link">Admin Interface</a>
            <a href="/api/" class="api-link">API Endpoints</a>
            <a href="/static/" class="api-link">Static Files</a>
        </div>
        
        <div class="info">
            <h3>Next Steps:</h3>
            <ul>
                <li>Create a superuser account for admin access</li>
                <li>Configure your email settings</li>
                <li>Build the React frontend when npm issues are resolved</li>
            </ul>
        </div>
    </div>
</body>
</html>
EOF

chown -R $APP_USER:$APP_USER $APP_DIR/frontend/dist

# 8. Restart service
log_step "8. Restarting service..."
systemctl restart todofast

# 9. Check service status again
log_step "9. Checking service status after restart..."
systemctl status todofast --no-pager

# 10. Test application
log_step "10. Testing application..."
sleep 3
curl -I http://63.250.61.126 || log_warn "Application test failed - check configuration"

echo ""
log_info "=== Debug and Fix Complete! ==="
echo ""
echo "Service status:"
systemctl is-active todofast
echo ""
echo "If the service is still not running, check the logs:"
echo "  journalctl -u todofast -f"
echo ""
echo "If there are still issues, try:"
echo "  sudo -u todofast /home/todofast/venv/bin/python /home/todofast/app/manage.py runserver 0.0.0.0:8000"
echo ""
log_info "Debug and fix completed!"
