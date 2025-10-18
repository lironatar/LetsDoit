#!/bin/bash
# Build script for Railway deployment

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "🎨 Building frontend..."
cd frontend
npm install
npm run build:prod
cd ..

echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Build complete!"
