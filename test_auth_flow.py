import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import UserProfile
from django.test import Client
import json

print("🧪 Testing Authentication Flow")
print("="*50)

# Test user
test_email = "lironatar1994@gmail.com"

# Create a test client
client = Client()

print(f"1. Testing login for: {test_email}")

# Test login
login_data = {
    "email": test_email,
    "password": "5327158Li"  # Use the actual password from logs
}

response = client.post(
    '/api/auth/login/',
    data=json.dumps(login_data),
    content_type='application/json'
)

print(f"Login response status: {response.status_code}")
print(f"Login response: {response.json()}")

if response.status_code == 200:
    print("✅ Login successful!")
    
    # Check if user has a session
    print(f"Session authenticated: {client.session.get('_auth_user_id')}")
    
    # Test complete onboarding API
    print(f"\n2. Testing complete onboarding API")
    
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
        print("✅ Onboarding completion successful!")
        
        # Check if first_time_login was updated
        user = User.objects.get(email=test_email)
        profile = user.profile
        print(f"User first_time_login after completion: {profile.first_time_login}")
        
    else:
        print("❌ Onboarding completion failed")
        
else:
    print("❌ Login failed")

print("\n🎯 Test completed!")
