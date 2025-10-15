#!/usr/bin/env python
"""
Simple test script to check if the database endpoint works
"""

import requests
import json

def test_db_endpoint():
    """Test the database check endpoint"""
    try:
        print("🔍 Testing database endpoint...")
        
        # Test the simple DB check endpoint
        url = "http://localhost:8000/api/db-check/"
        response = requests.get(url)
        
        print(f"Status Code: {response.status_code}")
        print(f"Content Type: {response.headers.get('content-type', 'Unknown')}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print("✅ JSON Response:")
                print(json.dumps(data, indent=2))
            except json.JSONDecodeError:
                print("❌ Response is not valid JSON:")
                print(response.text[:500])
        else:
            print(f"❌ Error Response:")
            print(response.text[:500])
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Django server. Is it running on localhost:8000?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_db_endpoint()
