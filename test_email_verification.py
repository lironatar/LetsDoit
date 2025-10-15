import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import UserProfile, EmailVerification
from django.test import Client
import json

print("🧪 Testing Email Verification Flow")
print("="*50)

# Test user
test_email = "lironatar94@gmail.com"

# Create a test client
client = Client()

print(f"1. Testing email verification for: {test_email}")

# First, let's check if there's a verification token for this user
try:
    user = User.objects.get(email=test_email)
    print(f"User found: {user.email}")
    
    # Get the latest verification token for this user
    verification = EmailVerification.objects.filter(user=user).order_by('-created_at').first()
    
    if verification:
        print(f"Verification token found: {verification.token}")
        print(f"Token is valid: {verification.is_valid()}")
        print(f"Token is used: {verification.is_used}")
        
        # Test the email verification API
        print(f"\n2. Testing email verification API")
        
        response = client.get(f'/api/auth/verify-email/{verification.token}/')
        
        print(f"Verification response status: {response.status_code}")
        print(f"Verification response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Email verification successful!")
            
            # Check if user has a session now
            print(f"Session authenticated: {client.session.get('_auth_user_id')}")
            
            # Check if first_time_login was set correctly
            profile = user.profile
            print(f"User first_time_login after verification: {profile.first_time_login}")
            
            # Test complete onboarding API
            print(f"\n3. Testing complete onboarding API after verification")
            
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
                profile.refresh_from_db()
                print(f"User first_time_login after completion: {profile.first_time_login}")
                
            else:
                print("❌ Onboarding completion failed")
                
        else:
            print("❌ Email verification failed")
            
    else:
        print("❌ No verification token found for this user")
        
except User.DoesNotExist:
    print(f"❌ User {test_email} not found")

print("\n🎯 Test completed!")
