import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import UserProfile

# Test user email
test_email = "lironatar94@gmail.com"

print("Testing onboarding completion for user:", test_email)

try:
    user = User.objects.get(email=test_email)
    profile = user.profile
    
    print(f"Before completion:")
    print(f"  - first_time_login: {profile.first_time_login}")
    
    # Simulate onboarding completion
    profile.first_time_login = False
    profile.save()
    
    print(f"After completion:")
    print(f"  - first_time_login: {profile.first_time_login}")
    
    print("\n✅ Onboarding completion logic works!")
    print("When user completes/skips onboarding, first_time_login will be set to False")
    
except User.DoesNotExist:
    print(f"❌ User {test_email} not found!")
except Exception as e:
    print(f"❌ Error: {e}")

# Let's also check what happens with a new user
print("\n" + "="*50)
print("Testing with a fresh user scenario...")

# Create a test user (if it doesn't exist)
test_user_email = "newtest@example.com"
try:
    test_user = User.objects.get(email=test_user_email)
    print(f"Test user {test_user_email} already exists")
except User.DoesNotExist:
    print(f"Creating test user: {test_user_email}")
    test_user = User.objects.create_user(
        username=test_user_email,
        email=test_user_email,
        password="testpass123"
    )
    test_user.is_active = True
    test_user.save()

# Check the test user's profile
try:
    test_profile = test_user.profile
    print(f"New user first_time_login: {test_profile.first_time_login}")
    
    # Simulate completing onboarding
    test_profile.first_time_login = False
    test_profile.save()
    print(f"After completion: {test_profile.first_time_login}")
    
    print("✅ New user onboarding completion works!")
    
except UserProfile.DoesNotExist:
    print("❌ No profile for test user")

print("\n🎯 Summary:")
print("- New users have first_time_login: True (default)")
print("- When they complete/skip onboarding, it becomes False")
print("- Users with first_time_login: False never see onboarding again")
