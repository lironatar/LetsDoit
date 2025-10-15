import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
import json

print("🔍 Testing Frontend Request Format")
print("="*50)

test_email = "lironatar94@gmail.com"
test_password = "5327158Li"

try:
    user = User.objects.get(email=test_email)
    print(f"User: {user.email}")
    print(f"User is active: {user.is_active}")
    
    client = Client()
    
    # Test 1: Exact frontend request format
    print(f"\n1. Testing exact frontend request format:")
    
    login_data = {
        'email': test_email,
        'password': test_password
    }
    
    response = client.post('/api/auth/login/', 
                          data=json.dumps(login_data),
                          content_type='application/json',
                          HTTP_ORIGIN='http://localhost:5173',
                          HTTP_REFERER='http://localhost:5173',
                          HTTP_HOST='localhost:8000',
                          HTTP_ACCEPT='application/json')
    
    print(f"   Response status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    if response.status_code == 200:
        print("   ✅ Frontend request format works")
    else:
        print(f"   ❌ Frontend request format failed: {response.status_code}")
        
    # Test 2: Check if it's a method issue
    print(f"\n2. Testing different HTTP methods:")
    
    methods = ['GET', 'POST', 'PUT', 'PATCH']
    for method in methods:
        if method == 'POST':
            response = client.post('/api/auth/login/', 
                                  data=json.dumps(login_data),
                                  content_type='application/json')
        else:
            response = getattr(client, method.lower())('/api/auth/login/')
        
        print(f"   {method}: {response.status_code}")
    
    # Test 3: Check if it's a URL issue
    print(f"\n3. Testing different URLs:")
    
    urls = ['/api/auth/login/', '/api/auth/login', '/login/', '/api/login/']
    for url in urls:
        response = client.post(url, 
                              data=json.dumps(login_data),
                              content_type='application/json')
        print(f"   {url}: {response.status_code}")
        
    # Test 4: Check response headers
    print(f"\n4. Response headers for successful request:")
    response = client.post('/api/auth/login/', 
                          data=json.dumps(login_data),
                          content_type='application/json')
    
    print(f"   Status: {response.status_code}")
    print(f"   Content-Type: {response.get('Content-Type', 'Not set')}")
    print(f"   Allow: {response.get('Allow', 'Not set')}")
    
    if response.status_code != 200:
        print(f"   Error response: {response.content}")
        
except User.DoesNotExist:
    print(f"❌ User {test_email} not found")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n🎯 Test completed!")
