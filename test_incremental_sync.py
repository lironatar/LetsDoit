#!/usr/bin/env python3
"""
Test script to verify incremental sync is working properly
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import GoogleCalendarToken
from todo.calendar_views import sync_google_calendar_events

def test_incremental_sync():
    """Test incremental sync functionality"""
    
    # Get a user with Google Calendar token
    user = User.objects.filter(
        calendar_token__is_active=True
    ).first()
    
    if not user:
        print("❌ No user with Google Calendar token found")
        return
    
    print(f"🧪 Testing incremental sync for user: {user.email}")
    
    # Check current sync tokens
    token = GoogleCalendarToken.objects.get(user=user)
    print(f"📅 Current sync tokens: {token.sync_tokens}")
    print(f"📅 Last sync time: {token.last_sync_time}")
    
    # Test 1: First sync (should be full sync)
    print("\n🔄 Test 1: First sync (should be full sync)")
    events1, sync_tokens1, has_more1 = sync_google_calendar_events(user, force_full_sync=False)
    print(f"📅 Events found: {len(events1)}")
    print(f"📅 Sync tokens: {sync_tokens1}")
    
    # Test 2: Second sync (should be incremental)
    print("\n🔄 Test 2: Second sync (should be incremental)")
    events2, sync_tokens2, has_more2 = sync_google_calendar_events(user, force_full_sync=False)
    print(f"📅 Events found: {len(events2)}")
    print(f"📅 Sync tokens: {sync_tokens2}")
    
    # Test 3: Force full sync
    print("\n🔄 Test 3: Force full sync")
    events3, sync_tokens3, has_more3 = sync_google_calendar_events(user, force_full_sync=True)
    print(f"📅 Events found: {len(events3)}")
    print(f"📅 Sync tokens: {sync_tokens3}")
    
    # Verify sync tokens are being tracked per calendar
    print("\n✅ Verification:")
    print(f"📅 Number of calendars with sync tokens: {len(sync_tokens3) if sync_tokens3 else 0}")
    
    if sync_tokens3:
        for calendar_id, sync_token in sync_tokens3.items():
            print(f"  - Calendar {calendar_id}: {sync_token[:20]}...")
    
    # Check if tokens are different (indicating incremental sync)
    if sync_tokens1 and sync_tokens2:
        tokens_different = sync_tokens1 != sync_tokens2
        print(f"📅 Sync tokens changed between calls: {tokens_different}")
        
        if tokens_different:
            print("✅ Incremental sync is working - tokens are being updated")
        else:
            print("⚠️  Sync tokens didn't change - might indicate no new events or issue with incremental sync")

if __name__ == "__main__":
    test_incremental_sync()
