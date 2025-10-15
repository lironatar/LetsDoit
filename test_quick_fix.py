#!/usr/bin/env python
"""
Quick test to verify the picture field fix
"""

import os
import sys
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from auto_user_creation import AutoUserCreator

def test_google_login_fix():
    """Test the Google login fix"""
    print("🧪 Testing Google Login Fix")
    print("=" * 40)
    
    # Test data that was causing the error
    google_data = {
        'email': 'lironatar1994@gmail.com',
        'name': 'liron man',
        'given_name': 'liron',
        'family_name': 'man',
        'picture': 'https://lh3.googleusercontent.com/a/ACg8ocJZo6m2GINcIddOdPP4fdhzBQVABUCof67PJYaUAKc_3KDgDYw=s96-c'
    }
    
    try:
        creator = AutoUserCreator()
        user, created, profile, profile_created = creator.create_user_from_provider('google', google_data)
        
        print(f"✅ Test successful!")
        print(f"   User: {user.email}")
        print(f"   Created: {created}")
        print(f"   Profile created: {profile_created}")
        print(f"   First time login: {profile.first_time_login}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_google_login_fix()
