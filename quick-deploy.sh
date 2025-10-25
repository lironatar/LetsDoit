#!/bin/bash

# Quick Deployment Script for ToDoFast
# This script automates the entire deployment process

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    log_error "This script should not be run as root. Use sudo for specific commands."
    exit 1
fi

# Configuration
DOMAIN=""
EMAIL=""
REPO_URL=""

# Get user input
echo "=== ToDoFast Quick Deployment ==="
echo "This script will set up your ToDoFast application on a Linux server."
echo ""

read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN
read -p "Enter your email for SSL certificate: " EMAIL
# Repository URL is now fixed
REPO_URL="https://github.com/lironatar/LetsDoit.git"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    log_error "Domain and email are required!"
    exit 1
fi

log_step "Starting deployment process..."

# 1. Update system
log_step "1. Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install required packages
log_step "2. Installing required packages..."
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip nginx postgresql postgresql-contrib git build-essential libpq-dev sqlite3

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Create application user
log_step "3. Creating application user..."
sudo adduser --system --group --shell /bin/bash todofast || true
sudo mkdir -p /opt/todofast
sudo chown todofast:todofast /opt/todofast

# 4. Clone and setup application
log_step "4. Setting up application..."
sudo -u todofast git clone https://github.com/lironatar/LetsDoit.git /opt/todofast/app
sudo -u todofast python3.11 -m venv /opt/todofast/venv
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

# Update environment file with domain
sudo sed -i "s/yourdomain.com/$DOMAIN/g" /opt/todofast/.env
sudo sed -i "s/CHANGE-THIS-TO-A-SECURE-RANDOM-KEY-IN-PRODUCTION/$(openssl rand -base64 32)/g" /opt/todofast/.env

# 6. Setup database
log_step "6. Setting up database..."
sudo -u todofast /opt/todofast/venv/bin/python /opt/todofast/app/manage.py migrate
sudo -u todofast /opt/todofast/venv/bin/python /opt/todofast/app/manage.py collectstatic --noinput

# 7. Create systemd service
log_step "7. Creating systemd service..."
sudo cp /opt/todofast/app/todofast.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable todofast

# 8. Configure Nginx
log_step "8. Configuring Nginx..."
sudo cp /opt/todofast/app/nginx-todofast.conf /etc/nginx/sites-available/todofast
sudo sed -i "s/yourdomain.com/$DOMAIN/g" /etc/nginx/sites-available/todofast
sudo ln -sf /etc/nginx/sites-available/todofast /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# 9. Setup SSL certificate
log_step "9. Setting up SSL certificate..."
sudo apt install -y certbot python3-certbot-nginx

# Start services
sudo systemctl start todofast
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# 10. Configure firewall
log_step "10. Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 11. Setup backup
log_step "11. Setting up backup system..."
sudo chmod +x /opt/todofast/app/deploy.sh
sudo cp /opt/todofast/app/deploy.sh /usr/local/bin/todofast-deploy
sudo chmod +x /usr/local/bin/todofast-deploy

# Create backup cron job
echo "0 2 * * * /usr/local/bin/todofast-deploy backup" | sudo crontab -u todofast -

# 12. Final checks
log_step "12. Running final checks..."
sudo systemctl status todofast --no-pager
sudo systemctl status nginx --no-pager

# Test SSL
log_info "Testing SSL certificate..."
curl -I https://$DOMAIN || log_warn "SSL test failed - check certificate"

echo ""
log_info "=== Deployment Complete! ==="
echo ""
echo "Your ToDoFast application is now running at: https://$DOMAIN"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status todofast    # Check service status"
echo "  sudo systemctl restart todofast   # Restart application"
echo "  todofast-deploy status            # Check application status"
echo "  todofast-deploy logs              # View logs"
echo "  todofast-deploy update            # Update application"
echo ""
echo "Important files:"
echo "  Application: /opt/todofast/app"
echo "  Environment: /opt/todofast/.env"
echo "  Logs: /opt/todofast/app/logs/"
echo "  Nginx config: /etc/nginx/sites-available/todofast"
echo ""
log_warn "Don't forget to:"
echo "  1. Update your Google OAuth settings with the new domain"
echo "  2. Configure your email settings in /opt/todofast/.env"
echo "  3. Create a superuser account: sudo -u todofast /opt/todofast/venv/bin/python /opt/todofast/app/manage.py createsuperuser"
echo ""
log_info "Deployment completed successfully!"
