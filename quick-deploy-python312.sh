#!/bin/bash

# Quick Deployment Script for ToDoFast with Python 3.12
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
echo "=== ToDoFast Quick Deployment with Python 3.12 ==="
echo "This script will set up your ToDoFast application on a Linux server."
echo ""

read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN
read -p "Enter your email for SSL certificate: " EMAIL
read -p "Enter your Git repository URL: " REPO_URL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ] || [ -z "$REPO_URL" ]; then
    log_error "All fields are required!"
    exit 1
fi

log_step "Starting deployment process with Python 3.12..."

# 1. Update system
log_step "1. Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install required packages
log_step "2. Installing required packages..."
sudo apt install -y python3.12 python3.12-venv python3.12-dev python3.12-distutils python3-pip nginx postgresql postgresql-contrib git build-essential libpq-dev sqlite3

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Create application user
log_step "3. Creating application user..."
sudo adduser --system --group --shell /bin/bash todofast || true
sudo mkdir -p /opt/todofast
sudo chown todofast:todofast /opt/todofast

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

# Update environment file with domain
sudo sed -i "s/yourdomain.com/$DOMAIN/g" /opt/todofast/.env
sudo sed -i "s/CHANGE-THIS-TO-A-SECURE-RANDOM-KEY-IN-PRODUCTION/$(openssl rand -base64 32)/g" /opt/todofast/.env

# 6. Setup database
log_step "6. Setting up database..."
sudo -u todofast /opt/todofast/venv/bin/python /opt/todofast/app/manage.py migrate
sudo -u todofast /opt/todofast/venv/bin/python /opt/todofast/app/manage.py collectstatic --noinput

# 7. Create systemd service
log_step "7. Creating systemd service..."
sudo tee /etc/systemd/system/todofast.service > /dev/null << EOF
[Unit]
Description=ToDoFast Django Application
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
ExecStart=/opt/todofast/venv/bin/waitress-serve --host=127.0.0.1 --port=8000 --threads=4 --url-scheme=https todofast.wsgi:application

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

sudo systemctl daemon-reload
sudo systemctl enable todofast

# 8. Configure Nginx
log_step "8. Configuring Nginx..."
sudo tee /etc/nginx/sites-available/todofast > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (will be updated by certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
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
sudo chmod +x /opt/todofast/app/deploy-python312.sh
sudo cp /opt/todofast/app/deploy-python312.sh /usr/local/bin/todofast-deploy
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
log_info "=== Deployment Complete with Python 3.12! ==="
echo ""
echo "Your ToDoFast application is now running at: https://$DOMAIN"
echo ""
echo "Python version: $(sudo -u todofast /opt/todofast/venv/bin/python --version)"
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
log_info "Deployment completed successfully with Python 3.12!"
