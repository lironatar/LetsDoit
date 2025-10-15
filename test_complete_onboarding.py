import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import UserProfile
from django.test import Client
import json

print("🧪 Testing Complete Onboarding API")
print("="*50)

# Test user
test_email = "lironatar94@gmail.com"

try:
    user = User.objects.get(email=test_email)
    profile = user.profile
    
    print(f"User: {user.email}")
    print(f"First time login: {profile.first_time_login}")
    
    # Test complete onboarding API
    print(f"\n1. Testing Complete Onboarding API:")
    
    client = Client()
    
    # First login
    login_data = {
        'email': test_email,
        'password': 'test123'
    }
    
    response = client.post('/api/auth/login/', 
                          data=json.dumps(login_data),
                          content_type='application/json')
    
    print(f"Login response status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Login successful")
        
        # Test complete_onboarding API
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
        
        print(f"Onboarding response status: {response.status_code}")
        print(f"Onboarding response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Onboarding API works!")
            
            # Check if first_time_login was updated
            profile.refresh_from_db()
            print(f"Updated first_time_login: {profile.first_time_login}")
            
        else:
            print("❌ Onboarding API failed")
            
    else:
        print("❌ Login failed")
        
except User.DoesNotExist:
    print(f"❌ User {test_email} not found")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n🎯 Test completed!")
