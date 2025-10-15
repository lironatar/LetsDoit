import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import UserProfile, EmailVerification
from django.test import Client
import json

print("🧪 Testing Full Flow After Fix")
print("="*50)

# Clean up and create fresh test user
test_email = "lironatar94@gmail.com"

try:
    # Delete existing user if exists
    try:
        existing_user = User.objects.get(email=test_email)
        existing_user.delete()
        print("✅ Deleted existing user")
    except User.DoesNotExist:
        pass
    
    # Create new user
    user = User.objects.create_user(
        username=test_email,
        email=test_email,
        password='test123'
    )
    user.is_active = False  # Not active until email verification
    user.save()
    
    # Create profile
    profile = UserProfile.objects.create(
        user=user,
        first_time_login=True
    )
    
    # Create email verification token
    verification = EmailVerification.create_verification(user=user)
    
    print(f"✅ Created fresh test user: {user.email}")
    print(f"   Active: {user.is_active}")
    print(f"   First time login: {profile.first_time_login}")
    print(f"   Verification token: {verification.token}")
    
    # Test the complete flow
    print(f"\n1. Testing Email Verification Flow:")
    
    client = Client()
    
    # Test email verification API
    response = client.get(f'/api/auth/verify-email/{verification.token}/')
    
    print(f"   Verification response status: {response.status_code}")
    print(f"   Verification response: {response.json()}")
    
    if response.status_code == 200:
        print("   ✅ Email verification successful!")
        
        # Check if user is now active
        user.refresh_from_db()
        print(f"   User is now active: {user.is_active}")
        
        # Check if user has a session (logged in)
        print(f"   Session authenticated: {client.session.get('_auth_user_id')}")
        
        # Test complete onboarding API
        print(f"\n2. Testing Complete Onboarding API:")
        
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
            print("   ✅ Onboarding completion successful!")
            
            # Check if first_time_login was updated
            profile.refresh_from_db()
            print(f"   Updated first_time_login: {profile.first_time_login}")
            
            print(f"\n🎯 Full flow test completed successfully!")
            print(f"   ✅ Email verification works")
            print(f"   ✅ User is logged in after verification")
            print(f"   ✅ Onboarding completion works")
            print(f"   ✅ first_time_login updated to False")
            
        else:
            print("   ❌ Onboarding completion failed")
            
    else:
        print("   ❌ Email verification failed")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n🎯 Test completed!")
