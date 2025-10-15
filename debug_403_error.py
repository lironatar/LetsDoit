import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from django.test import Client
from django.middleware.csrf import get_token
import json

print("🔍 Debugging 403 Forbidden Error")
print("="*50)

# Test user
test_email = "lironatar94@gmail.com"
test_password = "5327158Li"

try:
    user = User.objects.get(email=test_email)
    print(f"User: {user.email}")
    print(f"User is active: {user.is_active}")
    
    # Test 1: Test login API without CSRF token
    print(f"\n1. Testing login API without CSRF token:")
    
    client = Client()
    
    login_data = {
        'email': test_email,
        'password': test_password
    }
    
    response = client.post('/api/auth/login/', 
                          data=json.dumps(login_data),
                          content_type='application/json')
    
    print(f"   Response status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    if response.status_code == 200:
        print("   ✅ Login successful without CSRF")
    else:
        print(f"   ❌ Login failed with status: {response.status_code}")
    
    # Test 2: Test login API with CSRF token
    print(f"\n2. Testing login API with CSRF token:")
    
    # Get CSRF token
    csrf_response = client.get('/api/auth/login/')
    csrf_token = csrf_response.cookies.get('csrftoken')
    
    if csrf_token:
        print(f"   CSRF token: {csrf_token.value}")
        
        response = client.post('/api/auth/login/', 
                              data=json.dumps(login_data),
                              content_type='application/json',
                              HTTP_X_CSRFTOKEN=csrf_token.value)
        
        print(f"   Response status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 200:
            print("   ✅ Login successful with CSRF")
        else:
            print(f"   ❌ Login failed with CSRF, status: {response.status_code}")
    else:
        print("   ❌ Could not get CSRF token")
    
    # Test 3: Test with enforce_csrf_checks=False
    print(f"\n3. Testing with CSRF checks disabled:")
    
    client = Client(enforce_csrf_checks=False)
    
    response = client.post('/api/auth/login/', 
                          data=json.dumps(login_data),
                          content_type='application/json')
    
    print(f"   Response status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    if response.status_code == 200:
        print("   ✅ Login successful with CSRF disabled")
    else:
        print(f"   ❌ Login failed even with CSRF disabled, status: {response.status_code}")
    
    # Test 4: Check Django settings
    print(f"\n4. Checking Django CSRF settings:")
    
    from django.conf import settings
    print(f"   CSRF_COOKIE_SECURE: {getattr(settings, 'CSRF_COOKIE_SECURE', 'Not set')}")
    print(f"   CSRF_COOKIE_HTTPONLY: {getattr(settings, 'CSRF_COOKIE_HTTPONLY', 'Not set')}")
    print(f"   CSRF_TRUSTED_ORIGINS: {getattr(settings, 'CSRF_TRUSTED_ORIGINS', 'Not set')}")
    print(f"   CORS_ALLOW_CREDENTIALS: {getattr(settings, 'CORS_ALLOW_CREDENTIALS', 'Not set')}")
    
    # Test 5: Check if it's a CORS issue
    print(f"\n5. Testing with CORS headers:")
    
    response = client.post('/api/auth/login/', 
                          data=json.dumps(login_data),
                          content_type='application/json',
                          HTTP_ORIGIN='http://localhost:5173',
                          HTTP_REFERER='http://localhost:5173')
    
    print(f"   Response status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    if response.status_code == 200:
        print("   ✅ Login successful with CORS headers")
    else:
        print(f"   ❌ Login failed with CORS headers, status: {response.status_code}")
        
except User.DoesNotExist:
    print(f"❌ User {test_email} not found")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n🎯 Test completed!")
