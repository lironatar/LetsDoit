import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import UserProfile
from django.test import Client
import json

print("🔍 Testing Session Persistence Issue")
print("="*50)

# Test user
test_email = "lironatar94@gmail.com"

try:
    user = User.objects.get(email=test_email)
    print(f"User found: {user.email}")
    print(f"User is active: {user.is_active}")
    
    # Test 1: Check if user exists API without authentication
    print(f"\n1. Testing User Exists API (no authentication):")
    
    client = Client()
    response = client.get(f'/api/users/?email={test_email}')
    
    print(f"   Response status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    if response.status_code == 200:
        print("   ✅ User exists API works without authentication")
    else:
        print("   ❌ User exists API failed")
    
    # Test 2: Login and check session
    print(f"\n2. Testing Login and Session:")
    
    login_data = {
        'email': test_email,
        'password': 'test123'
    }
    
    response = client.post('/api/auth/login/', 
                          data=json.dumps(login_data),
                          content_type='application/json')
    
    print(f"   Login response status: {response.status_code}")
    
    if response.status_code == 200:
        print("   ✅ Login successful")
        print(f"   Session authenticated: {client.session.get('_auth_user_id')}")
        
        # Test 3: Check user exists API with session
        print(f"\n3. Testing User Exists API (with session):")
        
        response = client.get(f'/api/users/?email={test_email}')
        
        print(f"   Response status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 200:
            print("   ✅ User exists API works with session")
        else:
            print("   ❌ User exists API failed with session")
            
        # Test 4: Check complete_onboarding API with session
        print(f"\n4. Testing Complete Onboarding API (with session):")
        
        onboarding_data = {
            "name": "Test User",
            "task_method": "skipped",
            "onboarding_completed": True,
            "onboarding_skipped": True
        }
        
        response = client.post(
            '/api/users/complete_onboarding/',
            data=json.dumps(onboarding_data),
            content_type='application/json'
        )
        
        print(f"   Response status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 200:
            print("   ✅ Complete onboarding API works with session")
        else:
            print("   ❌ Complete onboarding API failed with session")
            
    else:
        print("   ❌ Login failed")
        print(f"   Response: {response.json()}")
        
except User.DoesNotExist:
    print(f"❌ User {test_email} not found")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n🎯 Test completed!")
