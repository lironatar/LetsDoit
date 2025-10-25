#!/bin/bash

# Fix Python 3.11 Installation for Ubuntu
# This script handles different Ubuntu versions and installs Python 3.11

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

# Check Ubuntu version
log_step "Checking Ubuntu version..."
UBUNTU_VERSION=$(lsb_release -rs)
log_info "Detected Ubuntu version: $UBUNTU_VERSION"

# Function to install Python 3.11 from deadsnakes PPA
install_python_311_ppa() {
    log_step "Installing Python 3.11 from deadsnakes PPA..."
    sudo apt update
    sudo apt install -y software-properties-common
    sudo add-apt-repository -y ppa:deadsnakes/ppa
    sudo apt update
    sudo apt install -y python3.11 python3.11-venv python3.11-dev python3.11-distutils
    sudo apt install -y python3-pip
}

# Function to install Python 3.11 from source
install_python_311_source() {
    log_step "Installing Python 3.11 from source..."
    
    # Install build dependencies
    sudo apt update
    sudo apt install -y build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev libsqlite3-dev wget libbz2-dev
    
    # Download and compile Python 3.11
    cd /tmp
    wget https://www.python.org/ftp/python/3.11.9/Python-3.11.9.tgz
    tar -xf Python-3.11.9.tgz
    cd Python-3.11.9
    
    ./configure --enable-optimizations
    make -j $(nproc)
    sudo make altinstall
    
    # Create symlinks
    sudo ln -sf /usr/local/bin/python3.11 /usr/bin/python3.11
    sudo ln -sf /usr/local/bin/pip3.11 /usr/bin/pip3.11
    
    cd /
    rm -rf /tmp/Python-3.11.9*
}

# Function to use available Python version
use_available_python() {
    log_step "Using available Python version..."
    
    # Check what Python versions are available
    PYTHON_VERSIONS=$(apt list --installed | grep python3 | grep -E "python3\.[0-9]+" | cut -d' ' -f1 | sort -V)
    
    if [ -z "$PYTHON_VERSIONS" ]; then
        log_info "Installing default Python 3..."
        sudo apt update
        sudo apt install -y python3 python3-venv python3-dev python3-pip
        PYTHON_CMD="python3"
    else
        # Get the highest available version
        PYTHON_CMD=$(echo "$PYTHON_VERSIONS" | tail -1 | sed 's/python3/python3/')
        log_info "Using available Python version: $PYTHON_CMD"
    fi
    
    # Update deployment scripts to use available Python
    log_info "Updating deployment scripts to use $PYTHON_CMD..."
    
    # Create a modified deployment script
    cat > /tmp/updated-deploy.sh << 'EOF'
#!/bin/bash

# Updated deployment script with flexible Python version

set -e

# Configuration
APP_DIR="/opt/todofast/app"
VENV_DIR="/opt/todofast/venv"
ENV_FILE="/opt/todofast/.env"
SERVICE_NAME="todofast"
USER="todofast"

# Find available Python version
PYTHON_CMD=""
for version in python3.11 python3.10 python3.9 python3.8 python3; do
    if command -v $version &> /dev/null; then
        PYTHON_CMD=$version
        break
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    echo "No Python version found!"
    exit 1
fi

echo "Using Python: $PYTHON_CMD"

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

setup_application() {
    log_info "Setting up ToDoFast application..."
    
    # Create directories
    sudo mkdir -p /opt/todofast
    sudo chown $USER:$USER /opt/todofast
    
    # Clone repository (if not exists)
    if [ ! -d "$APP_DIR" ]; then
        log_info "Cloning repository..."
        sudo -u $USER git clone <your-repo-url> $APP_DIR
    fi
    
    # Create virtual environment
    if [ ! -d "$VENV_DIR" ]; then
        log_info "Creating virtual environment with $PYTHON_CMD..."
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
    
    log_info "Setup completed successfully!"
}

# Main script logic
case "${1:-help}" in
    setup)
        setup_application
        ;;
    help|*)
        echo "Updated ToDoFast Deployment Script"
        echo "Usage: $0 setup"
        ;;
esac
EOF

    chmod +x /tmp/updated-deploy.sh
    log_info "Updated deployment script created at /tmp/updated-deploy.sh"
    log_info "You can now run: /tmp/updated-deploy.sh setup"
}

# Main logic
case "${1:-auto}" in
    "ppa")
        install_python_311_ppa
        ;;
    "source")
        install_python_311_source
        ;;
    "available")
        use_available_python
        ;;
    "auto"|*)
        log_info "Auto-detecting best installation method..."
        
        # Try PPA first for Ubuntu 18.04+
        if [[ "$UBUNTU_VERSION" == "18.04" ]] || [[ "$UBUNTU_VERSION" == "20.04" ]] || [[ "$UBUNTU_VERSION" == "22.04" ]] || [[ "$UBUNTU_VERSION" == "24.04" ]]; then
            log_info "Ubuntu $UBUNTU_VERSION detected, trying deadsnakes PPA..."
            if install_python_311_ppa; then
                log_info "Python 3.11 installed successfully from PPA!"
                exit 0
            else
                log_warn "PPA installation failed, trying alternative method..."
            fi
        fi
        
        # Try using available Python version
        log_info "Trying to use available Python version..."
        use_available_python
        ;;
esac

log_info "Python installation completed!"
log_info "You can now proceed with your Django deployment."
