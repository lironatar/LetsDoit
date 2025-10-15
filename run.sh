#!/bin/bash

echo "========================================"
echo "   TodoFast - Advanced Task Manager"
echo "========================================"
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python is not installed"
    echo "Please install Python 3.8+ from: https://python.org"
    exit 1
fi

echo "✅ Python is installed"
echo

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "🔧 Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ Error creating virtual environment"
        exit 1
    fi
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment exists"
fi

echo
echo "🔧 Activating virtual environment..."
source venv/bin/activate

echo
echo "📦 Installing packages..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Error installing packages"
    exit 1
fi
echo "✅ Packages installed successfully"

echo
echo "🗃️  Setting up database..."
python manage.py makemigrations
python manage.py migrate

echo
echo "👤 Creating demo users..."
python manage.py create_demo_data

echo
echo "========================================"
echo "🚀 TodoFast is ready to run!"
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
echo "🌐 Website will be available at: http://127.0.0.1:8000"
echo
echo "⚠️  Press Ctrl+C to stop the server"
echo
echo "🔄 Starting server..."
echo

python manage.py runserver
