#!/bin/bash

# ToDoFast Deployment Script for Python 3.12
# Optimized for Python 3.12.3

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
APP_DIR="/opt/todofast/app"
VENV_DIR="/opt/todofast/venv"
ENV_FILE="/opt/todofast/.env"
SERVICE_NAME="todofast"
USER="todofast"
PYTHON_CMD="python3.12"

# Check if Python 3.12 is available
if ! command -v $PYTHON_CMD &> /dev/null; then
    log_error "Python 3.12 not found. Please install Python 3.12 first."
    log_info "You can install it with: sudo apt install python3.12 python3.12-venv python3.12-dev"
    exit 1
fi

log_info "Using Python: $PYTHON_CMD"

setup_application() {
    log_info "Setting up ToDoFast application with Python 3.12..."
    
    # Create directories
    sudo mkdir -p /opt/todofast
    sudo chown $USER:$USER /opt/todofast
    
    # Clone repository (if not exists)
    if [ ! -d "$APP_DIR" ]; then
        log_info "Cloning repository..."
        sudo -u $USER git clone <your-repo-url> $APP_DIR
    fi
    
    # Create virtual environment with Python 3.12
    if [ ! -d "$VENV_DIR" ]; then
        log_info "Creating virtual environment with Python 3.12..."
        sudo -u $USER $PYTHON_CMD -m venv $VENV_DIR
    fi
    
    # Install Python dependencies
    log_info "Installing Python dependencies..."
    sudo -u $USER $VENV_DIR/bin/pip install --upgrade pip
    sudo -u $USER $VENV_DIR/bin/pip install -r $APP_DIR/requirements.txt
    
    # Install Node.js dependencies and build frontend
    log_info "Building React frontend..."
    cd $APP_DIR/frontend
    sudo -u $USER npm install
    sudo -u $USER npm run build
    cd $APP_DIR
    
    # Copy environment file if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        log_warn "Environment file not found. Please create $ENV_FILE"
        log_info "You can copy .env.production as a template:"
        log_info "sudo cp $APP_DIR/.env.production $ENV_FILE"
        log_info "Then edit the file with your production values."
    fi
    
    # Run Django setup
    log_info "Running Django migrations..."
    sudo -u $USER $VENV_DIR/bin/python $APP_DIR/manage.py migrate
    
    log_info "Collecting static files..."
    sudo -u $USER $VENV_DIR/bin/python $APP_DIR/manage.py collectstatic --noinput
    
    log_info "Setup completed successfully with Python 3.12!"
}

update_application() {
    log_info "Updating ToDoFast application..."
    
    # Backup current database
    log_info "Creating database backup..."
    sudo -u $USER cp $APP_DIR/db.sqlite3 $APP_DIR/db.sqlite3.backup.$(date +%Y%m%d_%H%M%S)
    
    # Pull latest changes
    log_info "Pulling latest changes..."
    cd $APP_DIR
    sudo -u $USER git pull origin main
    
    # Update Python dependencies
    log_info "Updating Python dependencies..."
    sudo -u $USER $VENV_DIR/bin/pip install -r requirements.txt
    
    # Update and build frontend
    log_info "Updating and building frontend..."
    cd frontend
    sudo -u $USER npm install
    sudo -u $USER npm run build
    cd ..
    
    # Run Django migrations
    log_info "Running Django migrations..."
    sudo -u $USER $VENV_DIR/bin/python manage.py migrate
    
    # Collect static files
    log_info "Collecting static files..."
    sudo -u $USER $VENV_DIR/bin/python manage.py collectstatic --noinput
    
    # Restart service
    log_info "Restarting service..."
    sudo systemctl restart $SERVICE_NAME
    
    log_info "Update completed successfully!"
}

restart_service() {
    log_info "Restarting $SERVICE_NAME service..."
    sudo systemctl restart $SERVICE_NAME
    sudo systemctl status $SERVICE_NAME --no-pager
}

check_status() {
    log_info "Checking service status..."
    sudo systemctl status $SERVICE_NAME --no-pager
    
    log_info "Checking Python version in virtual environment..."
    sudo -u $USER $VENV_DIR/bin/python --version
    
    log_info "Checking Nginx status..."
    sudo systemctl status nginx --no-pager
    
    log_info "Checking disk space..."
    df -h /opt/todofast
    
    log_info "Checking memory usage..."
    free -h
}

show_logs() {
    log_info "Showing recent logs..."
    echo "=== Service Logs ==="
    sudo journalctl -u $SERVICE_NAME --no-pager -n 20
    
    echo -e "\n=== Application Logs ==="
    if [ -f "$APP_DIR/logs/django.log" ]; then
        sudo tail -n 20 $APP_DIR/logs/django.log
    fi
    
    echo -e "\n=== Error Logs ==="
    if [ -f "$APP_DIR/logs/errors.log" ]; then
        sudo tail -n 20 $APP_DIR/logs/errors.log
    fi
    
    echo -e "\n=== Nginx Access Logs ==="
    sudo tail -n 10 /var/log/nginx/access.log
    
    echo -e "\n=== Nginx Error Logs ==="
    sudo tail -n 10 /var/log/nginx/error.log
}

# Main script logic
case "${1:-help}" in
    setup)
        setup_application
        ;;
    update)
        update_application
        ;;
    restart)
        restart_service
        ;;
    status)
        check_status
        ;;
    logs)
        show_logs
        ;;
    help|*)
        echo "ToDoFast Deployment Script for Python 3.12"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  setup    - Initial application setup with Python 3.12"
        echo "  update   - Update application to latest version"
        echo "  restart  - Restart the service"
        echo "  status   - Check service and system status"
        echo "  logs     - Show recent logs"
        echo "  help     - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 setup     # First-time setup with Python 3.12"
        echo "  $0 update    # Update to latest version"
        echo "  $0 status    # Check if everything is running"
        ;;
esac
