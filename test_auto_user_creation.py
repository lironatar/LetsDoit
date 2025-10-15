#!/usr/bin/env python
"""
Test script for the Auto User Creation system

This script tests the automatic user creation functionality
for Google and other authentication providers.
"""

import os
import sys
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import UserProfile, Friend
from auto_user_creation import AutoUserCreator


def test_google_user_creation():
    """Test Google user creation"""
    print("🧪 Testing Google User Creation")
    print("=" * 50)
    
    # Test data for Google
    google_data = {
        'email': 'test.google@example.com',
        'name': 'Test Google User',
        'given_name': 'Test',
        'family_name': 'Google User',
        'picture': 'https://example.com/avatar.jpg'
    }
    
    try:
        # Create user using AutoUserCreator
        creator = AutoUserCreator()
        user, created, profile, profile_created = creator.create_user_from_provider('google', google_data)
        
        print(f"\n✅ Google Test Results:")
        print(f"   User: {user.email}")
        print(f"   Username: {user.username}")
        print(f"   First Name: {user.first_name}")
        print(f"   Last Name: {user.last_name}")
        print(f"   Created: {created}")
        print(f"   Profile created: {profile_created}")
        print(f"   First time login: {profile.first_time_login}")
        print(f"   Theme: {profile.theme}")
        print(f"   Language: {profile.language}")
        
        # Test second login (should not create new user)
        print(f"\n🔄 Testing second login (should update existing user)...")
        user2, created2, profile2, profile_created2 = creator.create_user_from_provider('google', google_data)
        
        print(f"   Same user: {user.id == user2.id}")
        print(f"   Created again: {created2}")
        print(f"   Profile created again: {profile_created2}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Google Test Failed: {str(e)}")
        return False


def test_facebook_user_creation():
    """Test Facebook user creation"""
    print("\n🧪 Testing Facebook User Creation")
    print("=" * 50)
    
    # Test data for Facebook
    facebook_data = {
        'email': 'test.facebook@example.com',
        'name': 'Test Facebook User',
        'picture': {
            'data': {
                'url': 'https://example.com/facebook-avatar.jpg'
            }
        }
    }
    
    try:
        # Create user using AutoUserCreator
        creator = AutoUserCreator()
        user, created, profile, profile_created = creator.create_user_from_provider('facebook', facebook_data)
        
        print(f"\n✅ Facebook Test Results:")
        print(f"   User: {user.email}")
        print(f"   Username: {user.username}")
        print(f"   First Name: {user.first_name}")
        print(f"   Last Name: {user.last_name}")
        print(f"   Created: {created}")
        print(f"   Profile created: {profile_created}")
        print(f"   First time login: {profile.first_time_login}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Facebook Test Failed: {str(e)}")
        return False


def test_generic_provider():
    """Test generic provider user creation"""
    print("\n🧪 Testing Generic Provider User Creation")
    print("=" * 50)
    
    # Test data for generic provider
    generic_data = {
        'email': 'test.generic@example.com',
        'name': 'Test Generic User',
        'picture': 'https://example.com/generic-avatar.jpg'
    }
    
    try:
        # Create user using AutoUserCreator
        creator = AutoUserCreator()
        user, created, profile, profile_created = creator.create_user_from_provider('generic', generic_data)
        
        print(f"\n✅ Generic Provider Test Results:")
        print(f"   User: {user.email}")
        print(f"   Username: {user.username}")
        print(f"   First Name: {user.first_name}")
        print(f"   Last Name: {user.last_name}")
        print(f"   Created: {created}")
        print(f"   Profile created: {profile_created}")
        print(f"   First time login: {profile.first_time_login}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Generic Provider Test Failed: {str(e)}")
        return False


def cleanup_test_users():
    """Clean up test users"""
    print("\n🧹 Cleaning up test users...")
    
    test_emails = [
        'test.google@example.com',
        'test.facebook@example.com',
        'test.generic@example.com'
    ]
    
    for email in test_emails:
        try:
            user = User.objects.get(email=email)
            user.delete()
            print(f"   ✅ Deleted test user: {email}")
        except User.DoesNotExist:
            print(f"   ℹ️  Test user not found: {email}")


def main():
    """Run all tests"""
    print("🚀 Starting Auto User Creation Tests")
    print("=" * 60)
    
    tests = [
        test_google_user_creation,
        test_facebook_user_creation,
        test_generic_provider,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {str(e)}")
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
    else:
        print("⚠️  Some tests failed!")
    
    # Clean up test data
    cleanup_test_users()
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
