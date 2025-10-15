#!/usr/bin/env python3
"""
Debug script to test Google Calendar API directly
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

def debug_google_api():
    """Debug Google Calendar API calls directly"""
    
    # Get a user with Google Calendar token
    user = User.objects.filter(
        calendar_token__is_active=True
    ).first()
    
    if not user:
        print("❌ No user with Google Calendar token found")
        return
    
    print(f"🧪 Debugging Google Calendar API for user: {user.email}")
    
    # Get the token
    token = GoogleCalendarToken.objects.get(user=user)
    credentials = token.to_credentials()
    
    # Build service
    service = build('calendar', 'v3', credentials=credentials)
    
    # Test 1: Basic events list without any parameters
    print("\n🔄 Test 1: Basic events list (no parameters)")
    try:
        result1 = service.events().list(calendarId='primary').execute()
        events1 = result1.get('items', [])
        next_token1 = result1.get('nextSyncToken')
        print(f"📅 Events: {len(events1)}")
        print(f"📅 Next sync token: {next_token1}")
        print(f"📅 Response keys: {list(result1.keys())}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Events list with singleEvents
    print("\n🔄 Test 2: Events list with singleEvents=True")
    try:
        result2 = service.events().list(calendarId='primary', singleEvents=True).execute()
        events2 = result2.get('items', [])
        next_token2 = result2.get('nextSyncToken')
        print(f"📅 Events: {len(events2)}")
        print(f"📅 Next sync token: {next_token2}")
        print(f"📅 Response keys: {list(result2.keys())}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Events list with singleEvents and orderBy
    print("\n🔄 Test 3: Events list with singleEvents=True, orderBy='startTime'")
    try:
        result3 = service.events().list(
            calendarId='primary', 
            singleEvents=True, 
            orderBy='startTime'
        ).execute()
        events3 = result3.get('items', [])
        next_token3 = result3.get('nextSyncToken')
        print(f"📅 Events: {len(events3)}")
        print(f"📅 Next sync token: {next_token3}")
        print(f"📅 Response keys: {list(result3.keys())}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Events list with maxResults
    print("\n🔄 Test 4: Events list with maxResults=10")
    try:
        result4 = service.events().list(
            calendarId='primary', 
            singleEvents=True, 
            orderBy='startTime',
            maxResults=10
        ).execute()
        events4 = result4.get('items', [])
        next_token4 = result4.get('nextSyncToken')
        print(f"📅 Events: {len(events4)}")
        print(f"📅 Next sync token: {next_token4}")
        print(f"📅 Response keys: {list(result4.keys())}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_google_api()
