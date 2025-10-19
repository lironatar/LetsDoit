#!/usr/bin/env python3
"""
Test script to verify Railway deployment and auth endpoints
"""
import requests
import json
from datetime import datetime

# Railway URLs to test
RAILWAY_URLS = [
    'https://letsdoit-production-6d29.up.railway.app',
    'https://lets-do-it.co.il'
]

def test_deployment(base_url):
    print(f"\n{'='*80}")
    print(f"Testing: {base_url}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"{'='*80}")
    
    # Test 1: Basic connectivity
    print("\n1. Testing basic connectivity...")
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        print(f"   ✓ Status: {response.status_code}")
        print(f"   ✓ Content-Type: {response.headers.get('Content-Type', 'N/A')}")
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")
        return
    
    # Test 2: Check CSRF token
    print("\n2. Testing CSRF token endpoint...")
    try:
        response = requests.get(f"{base_url}/api/csrf-token/", timeout=10)
        print(f"   ✓ Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            csrf_token = data.get('csrf_token', 'NOT FOUND')
            print(f"   ✓ CSRF Token: {csrf_token[:20]}..." if csrf_token != 'NOT FOUND' else f"   ✗ CSRF Token: {csrf_token}")
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")
    
    # Test 3: Test registration endpoint
    print("\n3. Testing registration endpoint...")
    test_email = f"test_{datetime.now().timestamp()}@example.com"
    test_password = "TestPass123"
    
    payload = {
        "email": test_email,
        "password": test_password
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/auth/register/",
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        print(f"   ✓ Status: {response.status_code}")
        print(f"   ✓ Response: {response.text[:200]}...")
        
        if response.status_code != 200:
            try:
                data = response.json()
                print(f"   Error details: {json.dumps(data, indent=2, ensure_ascii=False)}")
            except:
                print(f"   Raw response: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")
    
    # Test 4: Test login endpoint (should fail but show endpoint works)
    print("\n4. Testing login endpoint...")
    payload = {
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/auth/login/",
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        print(f"   ✓ Status: {response.status_code}")
        print(f"   ✓ Response: {response.text[:200]}...")
        
        if response.status_code not in [401, 200]:
            try:
                data = response.json()
                print(f"   Error details: {json.dumps(data, indent=2, ensure_ascii=False)}")
            except:
                print(f"   Raw response: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")
    
    # Test 5: Check static files
    print("\n5. Testing static files...")
    try:
        response = requests.head(f"{base_url}/static/css/main.css", timeout=10)
        print(f"   ✓ Status: {response.status_code}")
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")

if __name__ == "__main__":
    print("Railway Authentication Endpoint Tester")
    print("=" * 80)
    
    for url in RAILWAY_URLS:
        test_deployment(url)
    
    print(f"\n{'='*80}")
    print("Test complete!")
    print(f"{'='*80}")
