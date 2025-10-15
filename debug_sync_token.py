#!/usr/bin/env python3
"""
Debug script specifically for sync tokens
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

def debug_sync_token():
    """Debug sync token specifically"""
    
    # Get a user with Google Calendar token
    user = User.objects.filter(
        calendar_token__is_active=True
    ).first()
    
    if not user:
        print("❌ No user with Google Calendar token found")
        return
    
    print(f"🧪 Debugging sync token for user: {user.email}")
    
    # Get the token
    token = GoogleCalendarToken.objects.get(user=user)
    credentials = token.to_credentials()
    
    # Build service
    service = build('calendar', 'v3', credentials=credentials)
    
    # Test different parameter combinations to find what returns sync token
    test_cases = [
        {
            'name': 'Basic list',
            'params': {'calendarId': 'primary'}
        },
        {
            'name': 'With singleEvents',
            'params': {'calendarId': 'primary', 'singleEvents': True}
        },
        {
            'name': 'With singleEvents and orderBy',
            'params': {'calendarId': 'primary', 'singleEvents': True, 'orderBy': 'startTime'}
        },
        {
            'name': 'With maxResults=50',
            'params': {'calendarId': 'primary', 'singleEvents': True, 'orderBy': 'startTime', 'maxResults': 50}
        },
        {
            'name': 'With maxResults=100',
            'params': {'calendarId': 'primary', 'singleEvents': True, 'orderBy': 'startTime', 'maxResults': 100}
        },
        {
            'name': 'With maxResults=250',
            'params': {'calendarId': 'primary', 'singleEvents': True, 'orderBy': 'startTime', 'maxResults': 250}
        },
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🔄 Test {i}: {test_case['name']}")
        try:
            result = service.events().list(**test_case['params']).execute()
            events = result.get('items', [])
            sync_token = result.get('nextSyncToken')
            page_token = result.get('nextPageToken')
            
            print(f"📅 Events: {len(events)}")
            print(f"📅 Sync token: {sync_token}")
            print(f"📅 Page token: {page_token}")
            print(f"📅 Response keys: {list(result.keys())}")
            
            if sync_token:
                print(f"✅ Found sync token: {sync_token[:20]}...")
                break
                
        except Exception as e:
            print(f"❌ Error: {e}")
    
    # Test with a small calendar (Todoist) to see if it returns sync token
    print(f"\n🔄 Test: Small calendar (Todoist)")
    try:
        result = service.events().list(
            calendarId='en.israel#holiday@group.v.calendar.google.com',  # Holidays in Israel
            singleEvents=True,
            orderBy='startTime',
            maxResults=250
        ).execute()
        events = result.get('items', [])
        sync_token = result.get('nextSyncToken')
        page_token = result.get('nextPageToken')
        
        print(f"📅 Events: {len(events)}")
        print(f"📅 Sync token: {sync_token}")
        print(f"📅 Page token: {page_token}")
        print(f"📅 Response keys: {list(result.keys())}")
        
        if sync_token:
            print(f"✅ Found sync token for holiday calendar: {sync_token[:20]}...")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_sync_token()
