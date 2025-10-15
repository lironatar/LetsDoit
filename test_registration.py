#!/usr/bin/env python
"""
Test what happens during registration for invited users
"""

import os
import sys
import django

# Setup Django
project_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import Friend

def test_registration_flow():
    """Test the registration flow for invited users"""
    print("🔍 Testing Registration Flow for Invited Users")
    print("=" * 60)
    
    # Check current state
    print("\n1. Current Friend records:")
    all_friends = Friend.objects.all()
    print(f"   Total Friend records: {all_friends.count()}")
    
    for f in all_friends:
        try:
            print(f"   - ID: {f.id}, User: {f.user.email}, Friend: {f.friend.email if f.friend else 'None'}, Email: {getattr(f, 'friend_email', 'NO COLUMN')}, Invitation: {getattr(f, 'is_invitation', 'NO COLUMN')}, Status: {f.status}")
        except Exception as e:
            print(f"   - Error reading record {f.id}: {e}")
    
    # Check invitations specifically
    print("\n2. Invitation records:")
    try:
        invitations = Friend.objects.filter(is_invitation=True)
        print(f"   Total invitations: {invitations.count()}")
        
        for inv in invitations:
            print(f"   - ID: {inv.id}, From: {inv.user.email}, To: {getattr(inv, 'friend_email', 'NO COLUMN')}, Status: {inv.status}")
    except Exception as e:
        print(f"   ❌ Error checking invitations: {e}")
    
    # Check if pythonersnake@gmail.com exists as user
    print("\n3. Check if pythonersnake@gmail.com is registered:")
    try:
        user = User.objects.get(email='pythonersnake@gmail.com')
        print(f"   ✅ User exists: {user.email}")
        
        # Check friend records for this user
        user_friends = Friend.objects.filter(
            models.Q(user=user) | models.Q(friend=user)
        )
        print(f"   Friend records involving this user: {user_friends.count()}")
        
        for f in user_friends:
            print(f"   - Record: user={f.user.email}, friend={f.friend.email if f.friend else 'None'}, status={f.status}")
            
    except User.DoesNotExist:
        print(f"   ❌ User pythonersnake@gmail.com does not exist")
    except Exception as e:
        print(f"   ❌ Error checking user: {e}")
    
    print("\n" + "=" * 60)
    print("💡 If you see invitation records but no friend records for the user,")
    print("   it means the registration process didn't create the friend requests.")
    print("   Check the Django console during registration for debug messages.")

if __name__ == "__main__":
    test_registration_flow()
