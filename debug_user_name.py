#!/usr/bin/env python
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import UserProfile

# Check the user
user = User.objects.filter(email='lironatar94@gmail.com').first()

if user:
    print(f"User found: {user.email}")
    print(f"Username: {repr(user.username)}")
    print(f"First name: {repr(user.first_name)}")
    print(f"Last name: {repr(user.last_name)}")
    print(f"First name (as bytes): {user.first_name.encode('utf-8') if user.first_name else 'None'}")
    print(f"Last name (as bytes): {user.last_name.encode('utf-8') if user.last_name else 'None'}")
    
    # Check profile
    try:
        profile = user.userprofile
        print(f"Profile found: name_manually_edited = {profile.name_manually_edited}")
    except UserProfile.DoesNotExist:
        print("No profile found")
else:
    print("No user found with email: lironatar94@gmail.com")
    print("Available users:")
    for u in User.objects.all():
        print(f"  - {u.email}: first='{u.first_name}', last='{u.last_name}'")
