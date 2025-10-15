#!/usr/bin/env python
"""
Automatic User Creation Script for Third-Party Authentication

This script handles automatic user account creation when users register
through third-party providers (Google, Facebook, etc.) for the first time.

Features:
- Creates user accounts with provider data
- Handles friend invitations for new users
- Seeds default data for new accounts
- Updates existing user data if needed
- Supports multiple authentication providers

Usage:
    This script is called automatically by authentication endpoints
    when users register through third-party providers.
"""

import os
import sys
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from todo.models import UserProfile, Friend, FriendInvitation
import requests


class AutoUserCreator:
    """
    Handles automatic user creation for third-party authentication providers
    """
    
    def __init__(self):
        self.provider = None
        self.provider_data = {}
    
    def create_user_from_provider(self, provider, provider_data):
        """
        Create or update user account from third-party provider data
        
        Args:
            provider (str): Provider name ('google', 'facebook', etc.)
            provider_data (dict): User data from the provider
            
        Returns:
            tuple: (user, created, profile, profile_created)
        """
        self.provider = provider
        self.provider_data = provider_data
        
        print(f"\n🔧 AutoUserCreator - {provider.upper()} Authentication")
        print(f"   Email: {provider_data.get('email', 'N/A')}")
        print(f"   Name: {provider_data.get('name', 'N/A')}")
        
        # Extract user data based on provider
        user_data = self._extract_user_data(provider_data)
        
        # Create or get existing user
        user, created = self._create_or_get_user(user_data)

        # On FIRST registration, ensure first/last name are set from provider data
        # even before any manual edits occur.
        if created:
            first_from_provider = user_data.get('first_name', '')
            last_from_provider = user_data.get('last_name', '')
            if first_from_provider or last_from_provider:
                needs_save = False
                if first_from_provider and user.first_name != first_from_provider:
                    user.first_name = first_from_provider
                    needs_save = True
                if last_from_provider and user.last_name != last_from_provider:
                    user.last_name = last_from_provider
                    needs_save = True
                if needs_save:
                    user.save(update_fields=['first_name', 'last_name'])
        
        # Handle friend invitations for new users
        if created:
            self._handle_friend_invitations(user)
        
        # Create or update user profile
        profile, profile_created = self._create_or_update_profile(user, created)
        
        # Update user data if needed (and not manually edited)
        self._update_user_data_if_needed(user, profile, user_data)
        
        # Seed default data for new users
        if created:
            self._seed_default_data(user)
        
        print(f"   ✅ User {'created' if created else 'updated'}: {user.email}")
        return user, created, profile, profile_created
    
    def _extract_user_data(self, provider_data):
        """Extract and normalize user data based on provider"""
        email = provider_data.get('email', '').strip().lower()
        
        if not email:
            raise ValueError("Email is required for user creation")
        
        # Handle different provider data formats
        if self.provider == 'google':
            return self._extract_google_data(provider_data, email)
        elif self.provider == 'facebook':
            return self._extract_facebook_data(provider_data, email)
        else:
            return self._extract_generic_data(provider_data, email)
    
    def _extract_google_data(self, provider_data, email):
        """Extract user data from Google OAuth response"""
        name = provider_data.get('name', '')
        given_name = provider_data.get('given_name', '')
        family_name = provider_data.get('family_name', '')
        picture = provider_data.get('picture', '')
        
        # Handle Google mojibake issue (corrupted Hebrew names)
        is_corrupted = (
            (given_name and '×' in given_name) or 
            (family_name and '×' in family_name) or 
            (name and '×' in name)
        )
        
        if is_corrupted:
            # Use email username if Google sent corrupted Hebrew
            username_part = email.split('@')[0]
            first_name = username_part
            last_name = ''
            print(f"   ⚠️  Google sent corrupted Hebrew name, using email username: {username_part}")
        elif given_name and family_name:
            first_name = given_name
            last_name = family_name
        elif name:
            name_parts = name.strip().split()
            if len(name_parts) == 1:
                first_name = name_parts[0]
                last_name = ''
            elif len(name_parts) == 2:
                first_name = name_parts[0]
                last_name = name_parts[1]
            else:
                first_name = name_parts[0]
                last_name = ' '.join(name_parts[1:])
        else:
            username_part = email.split('@')[0]
            first_name = username_part
            last_name = ''
        
        print(f"   → Parsed: first_name='{first_name}', last_name='{last_name}'")
        
        return {
            'email': email,
            'username': email,
            'first_name': first_name,
            'last_name': last_name,
            'picture': picture,
            'is_active': True,
        }
    
    def _extract_facebook_data(self, provider_data, email):
        """Extract user data from Facebook OAuth response"""
        # Facebook typically provides: id, name, email, picture
        name = provider_data.get('name', '')
        picture = provider_data.get('picture', {}).get('data', {}).get('url', '')
        
        if name:
            name_parts = name.strip().split()
            if len(name_parts) == 1:
                first_name = name_parts[0]
                last_name = ''
            else:
                first_name = name_parts[0]
                last_name = ' '.join(name_parts[1:])
        else:
            username_part = email.split('@')[0]
            first_name = username_part
            last_name = ''
        
        return {
            'email': email,
            'username': email,
            'first_name': first_name,
            'last_name': last_name,
            'picture': picture,
            'is_active': True,
        }
    
    def _extract_generic_data(self, provider_data, email):
        """Extract user data from generic OAuth response"""
        name = provider_data.get('name', '')
        picture = provider_data.get('picture', '')
        
        if name:
            name_parts = name.strip().split()
            first_name = name_parts[0] if name_parts else ''
            last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
        else:
            username_part = email.split('@')[0]
            first_name = username_part
            last_name = ''
        
        return {
            'email': email,
            'username': email,
            'first_name': first_name,
            'last_name': last_name,
            'picture': picture,
            'is_active': True,
        }
    
    def _create_or_get_user(self, user_data):
        """Create new user or get existing user"""
        email = user_data['email']
        
        # Remove non-User model fields from user_data
        user_fields = {k: v for k, v in user_data.items() if k != 'picture'}
        
        user, created = User.objects.get_or_create(
            email=email,
            defaults=user_fields
        )
        
        if created:
            print(f"   🆕 Created new user: {email}")
        else:
            print(f"   👤 Found existing user: {email}")
        
        return user, created
    
    def _handle_friend_invitations(self, user):
        """Handle pending friend invitations for new users"""
        print(f"\n💌 Checking for friend invitations for new user: {user.email}")
        
        try:
            # Check for pending friend invitations
            pending_friendship = Friend.objects.filter(
                friend_email=user.email,
                is_invitation=True,
                status='pending'
            ).first()
            
            if pending_friendship:
                print(f"   ✅ Found pending invitation from: {pending_friendship.user.email}")
                
                # Link the friendship to the new user
                pending_friendship.friend = user
                pending_friendship.is_invitation = False
                pending_friendship.save()
                
                # Create reciprocal friendship
                Friend.objects.get_or_create(
                    user=user,
                    friend=pending_friendship.user,
                    defaults={'status': 'pending'}
                )
                
                print(f"   ✅ Friend requests created for new {self.provider} user: {user.email}")
            else:
                print(f"   No pending invitations found for {user.email}")
                
        except Exception as e:
            print(f"   ❌ Error checking invitations: {e}")
    
    def _create_or_update_profile(self, user, created):
        """Create or update user profile"""
        profile, profile_created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'theme': 'light',
                'language': 'he',
                'timezone': 'Asia/Jerusalem',
                'first_time_login': created,  # True for new users, False for existing
            }
        )
        
        # For existing users, refresh profile from database
        if not profile_created:
            profile.refresh_from_db()
            print(f"   🔍 Refreshed profile for existing user: {user.email}")
            print(f"   Current first_time_login: {profile.first_time_login}")
        
        return profile, profile_created
    
    def _update_user_data_if_needed(self, user, profile, user_data):
        """Update user data if not manually edited"""
        # Update name if not manually edited
        if not profile.name_manually_edited:
            new_first = user_data.get('first_name', '')
            new_last = user_data.get('last_name', '')
            
            if user.first_name != new_first or user.last_name != new_last:
                user.first_name = new_first
                user.last_name = new_last
                user.save(update_fields=['first_name', 'last_name'])
                print(f"   🔄 Updated user name from {self.provider}: {new_first} {new_last}")
        
        # Update avatar if not manually edited
        picture = user_data.get('picture', '')
        if picture and not profile.avatar_manually_edited:
            self._update_avatar_from_provider(user, profile, picture)
    
    def _update_avatar_from_provider(self, user, profile, picture_url):
        """Download and update user avatar from provider"""
        try:
            print(f"   📸 Downloading avatar from {self.provider}...")
            response = requests.get(picture_url, timeout=5)
            
            if response.status_code == 200:
                filename = f"avatar_{user.id}_{self.provider}.jpg"
                profile.avatar.save(filename, ContentFile(response.content), save=True)
                print(f"   ✅ Updated avatar from {self.provider} for user: {user.email}")
            else:
                print(f"   ⚠️  Failed to download avatar: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Avatar download failed: {str(e)}")
    
    def _seed_default_data(self, user):
        """Seed default data for new users"""
        try:
            print(f"   🌱 Seeding default data for new user: {user.email}")
            
            # Import the seeding function from api_views
            from todo.api_views import seed_default_data_for_user
            seed_default_data_for_user(user)
            
            print(f"   ✅ Default data seeded successfully")
            
        except Exception as e:
            print(f"   ❌ Error seeding default data: {str(e)}")


def create_user_from_google(google_data):
    """
    Convenience function for Google authentication
    
    Args:
        google_data (dict): Google OAuth response data
        
    Returns:
        tuple: (user, created, profile, profile_created)
    """
    creator = AutoUserCreator()
    return creator.create_user_from_provider('google', google_data)


def create_user_from_facebook(facebook_data):
    """
    Convenience function for Facebook authentication
    
    Args:
        facebook_data (dict): Facebook OAuth response data
        
    Returns:
        tuple: (user, created, profile, profile_created)
    """
    creator = AutoUserCreator()
    return creator.create_user_from_provider('facebook', facebook_data)


def create_user_from_provider(provider, provider_data):
    """
    Generic function for any authentication provider
    
    Args:
        provider (str): Provider name ('google', 'facebook', etc.)
        provider_data (dict): Provider OAuth response data
        
    Returns:
        tuple: (user, created, profile, profile_created)
    """
    creator = AutoUserCreator()
    return creator.create_user_from_provider(provider, provider_data)


if __name__ == "__main__":
    """
    Test the auto user creation system
    """
    print("🧪 Testing Auto User Creation System")
    
    # Test data for Google
    test_google_data = {
        'email': 'test@example.com',
        'name': 'Test User',
        'given_name': 'Test',
        'family_name': 'User',
        'picture': 'https://example.com/avatar.jpg'
    }
    
    try:
        user, created, profile, profile_created = create_user_from_google(test_google_data)
        print(f"\n✅ Test successful!")
        print(f"   User: {user.email}")
        print(f"   Created: {created}")
        print(f"   Profile created: {profile_created}")
        print(f"   First time login: {profile.first_time_login}")
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
