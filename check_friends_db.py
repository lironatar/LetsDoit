#!/usr/bin/env python
"""
Quick script to check Friend records in database
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from todo.models import Friend

def check_friends():
    print("🔍 Checking Friend records in database...")
    
    total = Friend.objects.count()
    print(f"Total Friend records: {total}")
    
    if total > 0:
        print("\nRecent Friend records:")
        for i, friend in enumerate(Friend.objects.all()[:10], 1):
            try:
                friend_email = getattr(friend, 'friend_email', 'NO COLUMN')
                is_invitation = getattr(friend, 'is_invitation', 'NO COLUMN')
                print(f"  {i}. {friend.user.email} -> {friend.friend.email if friend.friend else friend_email} ({friend.status}, invitation: {is_invitation})")
            except Exception as e:
                print(f"  {i}. Error reading record: {e}")
    
    # Check for invitation records specifically
    try:
        invitation_count = Friend.objects.filter(is_invitation=True).count()
        print(f"\n📧 Invitation records: {invitation_count}")
        
        if invitation_count > 0:
            print("Pending invitations:")
            for inv in Friend.objects.filter(is_invitation=True):
                try:
                    print(f"  - {inv.user.email} invited {inv.friend_email} ({inv.status})")
                except Exception as e:
                    print(f"  - Error reading invitation: {e}")
    except Exception as e:
        print(f"❌ Error checking invitations: {e}")

if __name__ == "__main__":
    check_friends()
