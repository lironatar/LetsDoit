#!/usr/bin/env python3
"""
Test complete sync to get sync token
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import GoogleCalendarToken
from googleapiclient.discovery import build

def test_complete_sync():
    """Test complete sync to get sync token"""
    
    # Get a user with Google Calendar token
    user = User.objects.filter(
        calendar_token__is_active=True
    ).first()
    
    if not user:
        print("❌ No user with Google Calendar token found")
        return
    
    print(f"🧪 Testing complete sync for user: {user.email}")
    
    # Get the token
    token = GoogleCalendarToken.objects.get(user=user)
    credentials = token.to_credentials()
    
    # Build service
    service = build('calendar', 'v3', credentials=credentials)
    
    # Test: Fetch ALL events with pagination to get sync token
    print("\n🔄 Test: Fetch ALL events with pagination")
    try:
        all_events = []
        page_token = None
        sync_token = None
        
        while True:
            # Build request parameters
            params = {
                'calendarId': 'primary',
                'singleEvents': True,
                'orderBy': 'startTime'
            }
            
            if page_token:
                params['pageToken'] = page_token
            
            # Make API call
            result = service.events().list(**params).execute()
            events = result.get('items', [])
            all_events.extend(events)
            
            # Check for sync token (only on first page)
            if sync_token is None:
                sync_token = result.get('nextSyncToken')
                if sync_token:
                    print(f"✅ Found sync token on page 1: {sync_token[:20]}...")
            
            # Check for pagination
            page_token = result.get('nextPageToken')
            print(f"📅 Page: {len(events)} events, Page token: {page_token is not None}")
            
            if not page_token:
                break
        
        print(f"\n📅 Total events fetched: {len(all_events)}")
        print(f"📅 Sync token: {sync_token}")
        
        if sync_token:
            print(f"✅ SUCCESS: Got sync token: {sync_token[:20]}...")
            
            # Test incremental sync
            print(f"\n🔄 Test: Incremental sync using token")
            try:
                result2 = service.events().list(
                    calendarId='primary',
                    singleEvents=True,
                    orderBy='startTime',
                    syncToken=sync_token
                ).execute()
                
                events2 = result2.get('items', [])
                sync_token2 = result2.get('nextSyncToken')
                
                print(f"📅 Incremental events: {len(events2)}")
                print(f"📅 New sync token: {sync_token2}")
                
                if sync_token2:
                    print(f"✅ Incremental sync working! New token: {sync_token2[:20]}...")
                else:
                    print("⚠️  No new sync token returned from incremental sync")
                
            except Exception as e:
                print(f"❌ Error in incremental sync: {e}")
        else:
            print("❌ FAILED: No sync token returned even after fetching all events")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_complete_sync()
