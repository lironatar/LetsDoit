#!/bin/bash

echo "========================================"
echo "   TodoFast - Modern Full Stack Launch"
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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js is installed"
echo

# Setup Django Backend
echo "🔧 Setting up Django backend..."
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

echo
echo "🗃️  Setting up database..."
python manage.py makemigrations
python manage.py migrate
python manage.py create_demo_data

echo
echo "📦 Setting up React frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

cd ..

echo
echo "========================================"
echo "🚀 Starting Full Stack Application"
echo "========================================"
echo
echo "📱 Login credentials:"
echo "   Demo user: demo / demo123"
echo "   Admin user: admin / admin123"
echo
echo "🌐 Frontend: http://localhost:5173"
echo "🔗 Backend API: http://localhost:8000/api/"
echo "⚙️  Admin: http://localhost:8000/admin/"
echo
echo "⚠️  Press Ctrl+C to stop both servers"
echo

# Function to cleanup background processes
cleanup() {
    echo
    echo "🛑 Stopping servers..."
    kill $DJANGO_PID $REACT_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Start Django backend in background
echo "🔄 Starting Django backend..."
source venv/bin/activate
python manage.py runserver 127.0.0.1:8000 &
DJANGO_PID=$!

# Start React frontend in background
echo "🔄 Starting React frontend..."
cd frontend
npm run dev &
REACT_PID=$!

echo
echo "🎉 Both servers are running!"
echo
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:8000/api/"
echo
echo "Press Ctrl+C to stop both servers"

# Wait for background processes
wait
