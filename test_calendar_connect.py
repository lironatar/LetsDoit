#!/usr/bin/env python
"""
Test script to debug calendar connection
"""
import requests
import json

def test_calendar_connect():
    """Test the calendar connect endpoint"""
    try:
        print("Testing calendar connect endpoint...")
        
        # Test without authentication first
        response = requests.get('http://localhost:8000/api/calendar/connect/')
        print(f"Status code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 401:
            print("Authentication required - this is expected")
            return True
        else:
            print("Unexpected response")
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_calendar_connect()
