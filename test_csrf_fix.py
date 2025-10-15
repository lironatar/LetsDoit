import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.conf import settings
from django.test import Client
import json

print("🔍 Testing CSRF Fix")
print("="*50)

# Check CSRF settings
print("1. CSRF Settings:")
print(f"   CSRF_TRUSTED_ORIGINS: {getattr(settings, 'CSRF_TRUSTED_ORIGINS', 'Not set')}")
print(f"   CORS_ALLOWED_ORIGINS: {getattr(settings, 'CORS_ALLOWED_ORIGINS', 'Not set')}")
print(f"   CORS_ALLOW_CREDENTIALS: {getattr(settings, 'CORS_ALLOW_CREDENTIALS', 'Not set')}")

# Test login API with frontend-like request
print(f"\n2. Testing login API with frontend-like request:")

test_email = "lironatar94@gmail.com"
test_password = "5327158Li"

client = Client()

login_data = {
    'email': test_email,
    'password': test_password
}

# Simulate frontend request with origin header
response = client.post('/api/auth/login/', 
                      data=json.dumps(login_data),
                      content_type='application/json',
                      HTTP_ORIGIN='http://localhost:5173',
                      HTTP_REFERER='http://localhost:5173',
                      HTTP_HOST='localhost:8000')

print(f"   Response status: {response.status_code}")
print(f"   Response: {response.json()}")

if response.status_code == 200:
    print("   ✅ Login successful with CSRF trusted origins")
else:
    print(f"   ❌ Login failed with status: {response.status_code}")
    
    # Check response headers for CSRF info
    print(f"   Response headers: {dict(response)}")

print("\n🎯 Test completed!")
