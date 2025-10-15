import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import UserProfile

# Set your email here
user_email = "lironatar94@gmail.com"

try:
    user = User.objects.get(email=user_email)
    profile = user.profile
    print(f"Before: User {user_email} has first_time_login: {profile.first_time_login}")
    
    # Set first_time_login to False
    profile.first_time_login = False
    profile.save()
    
    print(f"After: User {user_email} has first_time_login: {profile.first_time_login}")
    print("Done! Try logging in now - you should NOT see the onboarding flow.")
    
except User.DoesNotExist:
    print(f"User {user_email} not found!")
except Exception as e:
    print(f"Error: {e}")
