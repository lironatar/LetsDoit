#!/bin/bash

echo "========================================"
echo "   TodoFast - Initial Setup"
echo "========================================"
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python is not installed"
    echo
    echo "Please install Python 3.8+ from: https://python.org"
    echo "Make sure to add Python to PATH"
    echo
    exit 1
fi

echo "✅ Python is installed"
python3 --version
echo

# Create virtual environment
echo "🔧 Creating virtual environment..."
if [ -d "venv" ]; then
    echo "⚠️  Virtual environment already exists"
    read -p "Delete and recreate? (y/n): " choice
    if [[ $choice == "y" || $choice == "Y" ]]; then
        rm -rf venv
        python3 -m venv venv
        echo "✅ Virtual environment recreated"
    else
        echo "ℹ️  Using existing environment"
    fi
else
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

echo
echo "🔧 Activating virtual environment..."
source venv/bin/activate

echo
echo "📦 Updating pip..."
python -m pip install --upgrade pip

echo
echo "📦 Installing packages..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Error installing packages"
    echo
    echo "Try running:"
    echo "  pip install --upgrade pip"
    echo "  pip install -r requirements.txt"
    echo
    exit 1
fi
echo "✅ Packages installed successfully"

echo
echo "🗃️  Creating migrations..."
python manage.py makemigrations
if [ $? -ne 0 ]; then
    echo "❌ Error creating migrations"
    exit 1
fi

echo
echo "🗃️  Running migrations..."
python manage.py migrate
if [ $? -ne 0 ]; then
    echo "❌ Error running migrations"
    exit 1
fi

echo
echo "👤 Creating admin user..."
python manage.py createsuperuser --username admin --email admin@todofast.com --noinput
if [ $? -ne 0 ]; then
    echo "⚠️  Admin user already exists"
else
    echo "✅ Admin user created"
fi

echo
echo "👤 Creating demo data..."
python manage.py create_demo_data
if [ $? -ne 0 ]; then
    echo "⚠️  Error creating demo data"
else
    echo "✅ Demo data created"
fi

echo
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput
if [ $? -ne 0 ]; then
    echo "⚠️  Error collecting static files"
else
    echo "✅ Static files collected"
fi

echo
echo "========================================"
echo "✅ TodoFast setup completed successfully!"
echo "========================================"
echo
echo "📱 Login credentials:"
echo "   Demo user: demo / demo123"
echo "   Admin user: admin / admin123"
echo
echo "👥 Additional test users:"
echo "   alice@todofast.com / alice123"
echo "   bob@todofast.com / bob123"
echo "   charlie@todofast.com / charlie123"
echo
echo "🚀 To run the application:"
echo "   Windows: run.bat"
echo "   Linux/Mac: ./run.sh"
echo
echo "🌐 Website will be available at: http://127.0.0.1:8000"
echo
