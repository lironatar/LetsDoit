#!/bin/bash
# Build script for Railway deployment
set -e  # Exit on any error

echo "====================================="
echo "  Railway Build Script"
echo "====================================="

echo ""
echo "📦 Step 1: Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "🎨 Step 2: Building frontend..."
cd frontend

# Export VITE environment variables for the frontend build
# These are used by Vite to inject values at build time
export VITE_GOOGLE_OAUTH_CLIENT_ID=${GOOGLE_OAUTH2_CLIENT_ID}

echo "Using Google Client ID: ${VITE_GOOGLE_OAUTH_CLIENT_ID}"

npm install --legacy-peer-deps
npm run build:prod
cd ..

echo ""
echo "📁 Step 3: Collecting static files..."
python manage.py collectstatic --noinput --clear

echo ""
echo "====================================="
echo "✅ Build complete!"
echo "====================================="
