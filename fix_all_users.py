import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import UserProfile

print("Setting all existing users to first_time_login: False")
print("(They've already used the system before)")

updated_count = 0
for user in User.objects.all():
    try:
        profile = user.profile
        if profile.first_time_login:
            profile.first_time_login = False
            profile.save()
            updated_count += 1
            print(f"Updated: {user.email}")
    except UserProfile.DoesNotExist:
        print(f"No profile for: {user.email}")

print(f"\nDone! Updated {updated_count} users.")
print("All existing users will now go directly to the main app.")
print("Only truly new users (after this fix) will see onboarding.")
