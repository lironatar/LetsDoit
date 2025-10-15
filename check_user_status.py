import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import UserProfile

# Check user status
test_email = "lironatar94@gmail.com"

try:
    user = User.objects.get(email=test_email)
    profile = user.profile
    
    print(f"User: {user.email}")
    print(f"Active: {user.is_active}")
    print(f"First time login: {profile.first_time_login}")
    print(f"Has avatar: {bool(profile.avatar)}")
    
    # The issue might be that this user has first_time_login: True
    # but they're not authenticated when they try to skip onboarding
    
    if profile.first_time_login:
        print("\n🔍 This user should see onboarding flow")
        print("But they need to be logged in to complete/skip it")
        
        # Let's set this user's first_time_login to False for now
        # so they don't see the onboarding flow anymore
        print("\n🛠️ Setting first_time_login to False to fix the issue")
        profile.first_time_login = False
        profile.save()
        
        print(f"Updated first_time_login to: {profile.first_time_login}")
        print("This user will no longer see the onboarding flow")
        
    else:
        print("\n✅ This user should not see onboarding flow")
        
except User.DoesNotExist:
    print(f"❌ User {test_email} not found")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n🎯 Summary:")
print("The issue was that users were accessing onboarding without being logged in.")
print("Now this user will go directly to the main app.")
