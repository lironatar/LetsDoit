#!/usr/bin/env python3
"""
Test following Google Calendar API documentation exactly
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

def test_google_docs_example():
    """Test following Google Calendar API docs exactly"""
    
    # Get a user with Google Calendar token
    user = User.objects.filter(
        calendar_token__is_active=True
    ).first()
    
    if not user:
        print("❌ No user with Google Calendar token found")
        return
    
    print(f"🧪 Testing Google Calendar API docs example for user: {user.email}")
    
    # Get the token
    token = GoogleCalendarToken.objects.get(user=user)
    credentials = token.to_credentials()
    
    # Build service
    service = build('calendar', 'v3', credentials=credentials)
    
    # Test 1: Exactly as per Google docs - initial sync
    print("\n🔄 Test 1: Initial sync (Google docs example)")
    try:
        # This is the exact example from Google Calendar API docs
        events_result = service.events().list(
            calendarId='primary',
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        sync_token = events_result.get('nextSyncToken')
        page_token = events_result.get('nextPageToken')
        
        print(f"📅 Events: {len(events)}")
        print(f"📅 Sync token: {sync_token}")
        print(f"📅 Page token: {page_token}")
        print(f"📅 Response keys: {list(events_result.keys())}")
        
        # Print the full response to see what we're getting
        print(f"📅 Full response: {events_result}")
        
        if sync_token:
            print(f"✅ Found sync token: {sync_token[:20]}...")
            
            # Test 2: Use the sync token for incremental sync
            print("\n🔄 Test 2: Incremental sync using the token")
            try:
                events_result2 = service.events().list(
                    calendarId='primary',
                    singleEvents=True,
                    orderBy='startTime',
                    syncToken=sync_token
                ).execute()
                
                events2 = events_result2.get('items', [])
                sync_token2 = events_result2.get('nextSyncToken')
                
                print(f"📅 Events: {len(events2)}")
                print(f"📅 New sync token: {sync_token2}")
                print(f"📅 Response keys: {list(events_result2.keys())}")
                
            except Exception as e:
                print(f"❌ Error in incremental sync: {e}")
        else:
            print("❌ No sync token returned - this is the problem!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_google_docs_example()
