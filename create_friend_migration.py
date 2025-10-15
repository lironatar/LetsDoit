#!/usr/bin/env python
"""
Manual script to create Friend model migration
Run this script to create the migration file for the Friend model
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
    print("Creating migration for Friend model...")
    call_command('makemigrations', 'todo')
    print("✅ Migration created successfully!")
    
    print("Applying migration...")
    call_command('migrate')
    print("✅ Migration applied successfully!")
    
    print("\n🎉 Friend model is now ready to use!")
    print("You can now test the friend request functionality.")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nPlease run these commands manually:")
    print("1. Navigate to project directory")
    print("2. python manage.py makemigrations")
    print("3. python manage.py migrate")
