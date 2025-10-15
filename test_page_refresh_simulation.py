import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import UserProfile
from django.test import Client
import json

print("🔍 Testing Page Refresh Simulation")
print("="*50)

# Test user
test_email = "lironatar94@gmail.com"

try:
    user = User.objects.get(email=test_email)
    print(f"User: {user.email}")
    print(f"User is active: {user.is_active}")
    
    # Test 1: Simulate login (like when user first logs in)
    print(f"\n1. Simulating Initial Login:")
    
    client = Client()
    
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
        
        # Test 2: Simulate the user exists API call (like on page refresh)
        print(f"\n2. Simulating Page Refresh - User Exists API Call:")
        
        response = client.get(f'/api/users/?email={test_email}')
        
        print(f"   Response status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 200:
            print("   ✅ User exists API works after login")
            
            # Check if the response includes profile data
            response_data = response.json()
            if 'user' in response_data and response_data['user']:
                user_data = response_data['user']
                print(f"   User data returned: {user_data}")
                
                # Check if we can access the profile
                try:
                    profile = user.profile
                    print(f"   Profile first_time_login: {profile.first_time_login}")
                except:
                    print("   ❌ No profile found")
                    
        else:
            print("   ❌ User exists API failed after login")
            
        # Test 3: Simulate new client (like new browser tab)
        print(f"\n3. Simulating New Browser Tab (New Client):")
        
        new_client = Client()
        
        # Try to access user exists API without login
        response = new_client.get(f'/api/users/?email={test_email}')
        
        print(f"   Response status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 200:
            print("   ✅ User exists API works without session (as expected)")
        else:
            print("   ❌ User exists API failed without session")
            
        # Test 4: Simulate complete_onboarding API call
        print(f"\n4. Simulating Complete Onboarding API Call:")
        
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
