#!/usr/bin/env python3
"""
Test different Google Calendar API versions and approaches
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

def test_api_version():
    """Test different API approaches"""
    
    # Get a user with Google Calendar token
    user = User.objects.filter(
        calendar_token__is_active=True
    ).first()
    
    if not user:
        print("❌ No user with Google Calendar token found")
        return
    
    print(f"🧪 Testing API version for user: {user.email}")
    
    # Get the token
    token = GoogleCalendarToken.objects.get(user=user)
    credentials = token.to_credentials()
    
    # Test different service builds
    services = [
        ('v3 (default)', build('calendar', 'v3', credentials=credentials)),
        ('v3 with cache_discovery=False', build('calendar', 'v3', credentials=credentials, cache_discovery=False)),
    ]
    
    for name, service in services:
        print(f"\n🔄 Test: {name}")
        try:
            # Try the exact parameters from Google docs
            result = service.events().list(
                calendarId='primary',
                singleEvents=True,
                orderBy='startTime',
                maxResults=10  # Small number to avoid pagination
            ).execute()
            
            events = result.get('items', [])
            sync_token = result.get('nextSyncToken')
            page_token = result.get('nextPageToken')
            
            print(f"📅 Events: {len(events)}")
            print(f"📅 Sync token: {sync_token}")
            print(f"📅 Page token: {page_token}")
            print(f"📅 Response keys: {list(result.keys())}")
            
            if sync_token:
                print(f"✅ SUCCESS with {name}: {sync_token[:20]}...")
                break
            else:
                print(f"❌ No sync token with {name}")
                
        except Exception as e:
            print(f"❌ Error with {name}: {e}")
    
    # Test with a different calendar (holiday calendar)
    print(f"\n🔄 Test: Holiday calendar")
    try:
        service = build('calendar', 'v3', credentials=credentials)
        
        # Get calendar list first
        calendar_list = service.calendarList().list().execute()
        calendars = calendar_list.get('items', [])
        
        # Find a holiday calendar
        holiday_calendar = None
        for cal in calendars:
            if 'holiday' in cal.get('summary', '').lower():
                holiday_calendar = cal
                break
        
        if holiday_calendar:
            print(f"📅 Testing with calendar: {holiday_calendar['summary']}")
            
            result = service.events().list(
                calendarId=holiday_calendar['id'],
                singleEvents=True,
                orderBy='startTime',
                maxResults=10
            ).execute()
            
            events = result.get('items', [])
            sync_token = result.get('nextSyncToken')
            
            print(f"📅 Events: {len(events)}")
            print(f"📅 Sync token: {sync_token}")
            
            if sync_token:
                print(f"✅ SUCCESS with holiday calendar: {sync_token[:20]}...")
            else:
                print(f"❌ No sync token with holiday calendar")
        else:
            print("❌ No holiday calendar found")
            
    except Exception as e:
        print(f"❌ Error with holiday calendar: {e}")

if __name__ == "__main__":
    test_api_version()
