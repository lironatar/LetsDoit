#!/usr/bin/env python
"""
Script to apply the Friend invitation migration
"""

import os
import sys
import django

# Add the project directory to Python path
project_dir = r"c:\Users\liron\OneDrive\שולחן העבודה\New folder\ToDoFast2"
sys.path.insert(0, project_dir)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')

# Setup Django
django.setup()

from django.core.management import call_command

try:
    print("Applying Friend invitation migration...")
    call_command('migrate', 'todo', '0011')
    print("✅ Friend invitation migration applied successfully!")
    
    # Test the models
    from todo.models import Friend, FriendInvitation
    friend_count = Friend.objects.count()
    invitation_count = FriendInvitation.objects.count()
    print(f"✅ Models are working! Friend count: {friend_count}, Invitation count: {invitation_count}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nTrying full migrate...")
    try:
        call_command('migrate')
        print("✅ Full migrate completed!")
    except Exception as e2:
        print(f"❌ Full migrate also failed: {e2}")
        print("\nPlease run these commands manually:")
        print("1. cd 'c:\\Users\\liron\\OneDrive\\שולחן העבודה\\New folder\\ToDoFast2'")
        print("2. python manage.py migrate")
