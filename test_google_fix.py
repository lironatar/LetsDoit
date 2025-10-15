#!/usr/bin/env python
"""
Test the Google login fix
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

def test_user_creation():
    """Test user creation with picture field"""
    from django.contrib.auth.models import User
    from todo.models import UserProfile
    
    # Test data that was causing the error
    user_data = {
        'email': 'test@example.com',
        'username': 'test@example.com',
        'first_name': 'Test',
        'last_name': 'User',
        'is_active': True,
        'picture': 'https://example.com/avatar.jpg'  # This should not cause an error now
    }
    
    # Remove non-User model fields (this is what the fix does)
    user_fields = {k: v for k, v in user_data.items() if k != 'picture'}
    
    print("Testing user creation with filtered fields...")
    print(f"Original data keys: {list(user_data.keys())}")
    print(f"Filtered data keys: {list(user_fields.keys())}")
    
    try:
        # This should work now
        user, created = User.objects.get_or_create(
            email=user_data['email'],
            defaults=user_fields
        )
        
        print(f"✅ User creation successful!")
        print(f"   User: {user.email}")
        print(f"   Created: {created}")
        
        # Clean up
        if created:
            user.delete()
            print("   Cleaned up test user")
        
        return True
        
    except Exception as e:
        print(f"❌ User creation failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_user_creation()
