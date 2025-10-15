#!/usr/bin/env python
"""
Script to apply the Friend model migration
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
    print("Applying Friend model migration...")
    call_command('migrate', 'todo', '0010')
    print("✅ Migration applied successfully!")
    
    # Test the Friend model
    from todo.models import Friend
    count = Friend.objects.count()
    print(f"✅ Friend model is working! Current friend count: {count}")
    
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
