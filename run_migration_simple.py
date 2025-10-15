#!/usr/bin/env python
"""
Simple script to run Django migrations
"""

import os
import sys
import django

# Add the project directory to Python path
project_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_dir)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')

# Setup Django
django.setup()

from django.core.management import call_command

def main():
    print("🔄 Running Django migrations...")
    
    try:
        # Make migrations
        print("1. Creating migrations...")
        call_command('makemigrations', 'todo')
        print("✅ Migrations created successfully")
        
        # Apply migrations
        print("2. Applying migrations...")
        call_command('migrate', 'todo')
        print("✅ Migrations applied successfully")
        
        # Test the models
        print("3. Testing models...")
        from todo.models import Friend, FriendInvitation
        
        friend_count = Friend.objects.count()
        invitation_count = FriendInvitation.objects.count()
        
        print(f"✅ Friend model: {friend_count} records")
        print(f"✅ FriendInvitation model: {invitation_count} records")
        
        print("\n🎉 Migration completed successfully!")
        print("You can now use the proper database-based friend invitation system.")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print("\nManual steps:")
        print("1. Open Command Prompt (not PowerShell)")
        print("2. cd to your project directory")
        print("3. Run: python manage.py makemigrations")
        print("4. Run: python manage.py migrate")

if __name__ == "__main__":
    main()
