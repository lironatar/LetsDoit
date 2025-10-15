import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import UserProfile
from django.test import Client
import json

print("🔍 Debugging Current Issue")
print("="*50)

# Test user
test_email = "lironatar94@gmail.com"

try:
    user = User.objects.get(email=test_email)
    profile = user.profile
    
    print(f"1. User Status:")
    print(f"   Email: {user.email}")
    print(f"   Active: {user.is_active}")
    print(f"   First time login: {profile.first_time_login}")
    
    # Test if we can login this user
    print(f"\n2. Testing Login:")
    client = Client()
    
    # Try to login
    login_data = {
        'email': test_email,
        'password': 'test123'  # You might need to adjust this
    }
    
    response = client.post('/api/auth/login/', 
                          data=json.dumps(login_data),
                          content_type='application/json')
    
    print(f"   Login response status: {response.status_code}")
    if response.status_code == 200:
        print("   ✅ Login successful")
        
        # Test complete_onboarding API
        print(f"\n3. Testing Complete Onboarding API:")
        
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
        
        print(f"   Onboarding response status: {response.status_code}")
        print(f"   Onboarding response: {response.json()}")
        
        if response.status_code == 200:
            print("   ✅ Onboarding API works!")
            
            # Check if first_time_login was updated
            profile.refresh_from_db()
            print(f"   Updated first_time_login: {profile.first_time_login}")
            
        else:
            print("   ❌ Onboarding API failed")
            
    else:
        print("   ❌ Login failed")
        print(f"   Response: {response.json()}")
        
        # Let's try to create a new user with known password
        print(f"\n4. Creating test user with known password:")
        try:
            # Delete existing user
            user.delete()
            print("   Deleted existing user")
            
            # Create new user
            new_user = User.objects.create_user(
                username=test_email,
                email=test_email,
                password='test123'
            )
            new_user.is_active = True
            new_user.save()
            
            # Create profile
            profile = UserProfile.objects.create(
                user=new_user,
                first_time_login=True
            )
            
            print("   ✅ Created new user with password 'test123'")
            
            # Test login again
            response = client.post('/api/auth/login/', 
                                  data=json.dumps(login_data),
                                  content_type='application/json')
            
            print(f"   New login response status: {response.status_code}")
            
            if response.status_code == 200:
                print("   ✅ New user login successful")
                
                # Test onboarding API
                response = client.post(
                    '/api/users/complete_onboarding/',
                    data=json.dumps(onboarding_data),
                    content_type='application/json'
                )
                
                print(f"   New onboarding response status: {response.status_code}")
                print(f"   New onboarding response: {response.json()}")
                
        except Exception as e:
            print(f"   ❌ Error creating test user: {e}")
        
except User.DoesNotExist:
    print(f"❌ User {test_email} not found")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n🎯 Debug completed!")
