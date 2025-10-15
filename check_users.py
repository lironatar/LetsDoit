import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import UserProfile

print("Checking all users and their first_time_login status:")
print("=" * 60)

for user in User.objects.all():
    try:
        profile = user.profile
        print(f"User: {user.email}")
        print(f"  - Active: {user.is_active}")
        print(f"  - First time login: {profile.first_time_login}")
        print(f"  - Has avatar: {bool(profile.avatar)}")
        print("-" * 40)
    except UserProfile.DoesNotExist:
        print(f"User: {user.email} | No profile found!")
        print("-" * 40)

print("Done!")
