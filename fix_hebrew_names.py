#!/usr/bin/env python
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import UserProfile

# Delete the problematic user so they can be recreated with proper Hebrew name
email = 'lironatar94@gmail.com'

try:
    user = User.objects.get(email=email)
    print(f"Found user: {user.email}")
    print(f"Current first_name: {repr(user.first_name)}")
    print(f"Current last_name: {repr(user.last_name)}")
    
    # Delete the user (this will cascade delete the profile too)
    user.delete()
    print(f"✅ Deleted user {email}")
    print("Next Google login will create a fresh user with proper Hebrew name")
    
except User.DoesNotExist:
    print(f"No user found with email: {email}")
    print("Ready for fresh Google login")
