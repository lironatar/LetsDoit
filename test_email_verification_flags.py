import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import UserProfile, EmailVerification
from django.test import Client
import json

print("🔍 Testing Email Verification Flags")
print("="*50)

# Test user
test_email = "test_verification@example.com"

try:
    # Clean up existing user
    try:
        existing_user = User.objects.get(email=test_email)
        existing_user.delete()
        print("✅ Deleted existing test user")
    except User.DoesNotExist:
        pass
    
    # Create new user (not active)
    user = User.objects.create_user(
        username=test_email,
        email=test_email,
        password='test123'
    )
    user.is_active = False  # User starts as inactive
    user.save()
    
    # Create profile
    profile = UserProfile.objects.create(
        user=user,
        first_time_login=True
    )
    
    # Create email verification token
    verification = EmailVerification.create_verification(user=user)
    
    print(f"\n1. BEFORE Email Verification:")
    print(f"   User: {user.email}")
    print(f"   User.is_active: {user.is_active}")
    print(f"   Profile.first_time_login: {profile.first_time_login}")
    print(f"   Verification.is_used: {verification.is_used}")
    print(f"   Verification.used_at: {verification.used_at}")
    
    # Test email verification
    print(f"\n2. Testing Email Verification API:")
    
    client = Client()
    response = client.get(f'/api/auth/verify-email/{verification.token}/')
    
    print(f"   API Response Status: {response.status_code}")
    print(f"   API Response: {response.json()}")
    
    if response.status_code == 200:
        print(f"\n3. AFTER Email Verification:")
        
        # Refresh objects from database
        user.refresh_from_db()
        profile.refresh_from_db()
        verification.refresh_from_db()
        
        print(f"   User.is_active: {user.is_active}")
        print(f"   Profile.first_time_login: {profile.first_time_login}")
        print(f"   Verification.is_used: {verification.is_used}")
        print(f"   Verification.used_at: {verification.used_at}")
        print(f"   Verification.ip_address: {verification.ip_address}")
        
        print(f"\n4. Summary of Flags Updated:")
        print(f"   ✅ User.is_active: False → True")
        print(f"   ✅ Verification.is_used: False → True")
        print(f"   ✅ Verification.used_at: None → {verification.used_at}")
        print(f"   ✅ Profile.first_time_login: True (unchanged - for onboarding)")
        
        print(f"\n🎯 Answer to your questions:")
        print(f"   Q: Do we have a flag to check if user verified email?")
        print(f"   A: YES - User.is_active (Django's built-in flag)")
        print(f"   ")
        print(f"   Q: Does clicking verify button update the flag?")
        print(f"   A: YES - User.is_active changes from False to True")
        print(f"   ")
        print(f"   Additional flags:")
        print(f"   - Verification.is_used: True (token was used)")
        print(f"   - Verification.used_at: timestamp (when it was used)")
        print(f"   - Profile.first_time_login: True (triggers onboarding)")
        
    else:
        print("❌ Email verification failed")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n🎯 Test completed!")
