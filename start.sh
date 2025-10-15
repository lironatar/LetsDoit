#!/bin/bash

echo "========================================"
echo "   TodoFast - Advanced Task Manager"
echo "========================================"
echo

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found"
    echo
    echo "Please run ./setup.sh first"
    echo
    exit 1
fi

echo "🔧 Activating virtual environment..."
source venv/bin/activate

echo
echo "🚀 Starting TodoFast..."
echo
echo "📱 Login credentials:"
echo "   Demo user: demo / demo123"
echo "   Admin user: admin / admin123"
echo
echo "🌐 Website will be available at: http://127.0.0.1:8000"
echo
echo "⚠️  Press Ctrl+C to stop the server"
echo

python manage.py runserver
