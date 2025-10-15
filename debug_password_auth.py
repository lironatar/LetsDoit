import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.test import Client
import json

print("🔍 Debugging Password Authentication")
print("="*50)

# Test user
test_email = "lironatar94@gmail.com"
test_password = "5327158Li"

try:
    user = User.objects.get(email=test_email)
    print(f"User found: {user.email}")
    print(f"Username: {user.username}")
    print(f"User is active: {user.is_active}")
    print(f"Password hash: {user.password[:50]}...")
    print(f"Has usable password: {user.has_usable_password()}")
    
    # Test 1: Direct authentication with username
    print(f"\n1. Testing authentication with username:")
    authenticated_user = authenticate(username=user.username, password=test_password)
    if authenticated_user:
        print("   ✅ Authentication successful with username")
    else:
        print("   ❌ Authentication failed with username")
    
    # Test 2: Direct authentication with email
    print(f"\n2. Testing authentication with email:")
    authenticated_user = authenticate(username=test_email, password=test_password)
    if authenticated_user:
        print("   ✅ Authentication successful with email")
    else:
        print("   ❌ Authentication failed with email")
    
    # Test 3: Check password manually
    print(f"\n3. Testing password check manually:")
    if user.check_password(test_password):
        print("   ✅ Password check successful")
    else:
        print("   ❌ Password check failed")
    
    # Test 4: Test login API
    print(f"\n4. Testing login API:")
    
    client = Client()
    
    login_data = {
        'email': test_email,
        'password': test_password
    }
    
    response = client.post('/api/auth/login/', 
                          data=json.dumps(login_data),
                          content_type='application/json')
    
    print(f"   Login response status: {response.status_code}")
    print(f"   Login response: {response.json()}")
    
    if response.status_code == 200:
        print("   ✅ Login API successful")
    else:
        print("   ❌ Login API failed")
    
    # Test 5: Try different password variations
    print(f"\n5. Testing different password variations:")
    
    password_variations = [
        test_password,
        test_password.lower(),
        test_password.upper(),
        "test123",
        "demo123",
        "admin123"
    ]
    
    for pwd in password_variations:
        if user.check_password(pwd):
            print(f"   ✅ Password '{pwd}' works!")
            break
        else:
            print(f"   ❌ Password '{pwd}' doesn't work")
    
    # Test 6: Check if we can reset the password
    print(f"\n6. Setting new password:")
    user.set_password(test_password)
    user.save()
    print(f"   ✅ Password reset to: {test_password}")
    
    # Test 7: Test authentication after password reset
    print(f"\n7. Testing authentication after password reset:")
    authenticated_user = authenticate(username=user.username, password=test_password)
    if authenticated_user:
        print("   ✅ Authentication successful after password reset")
    else:
        print("   ❌ Authentication failed after password reset")
    
    # Test 8: Test login API after password reset
    print(f"\n8. Testing login API after password reset:")
    
    response = client.post('/api/auth/login/', 
                          data=json.dumps(login_data),
                          content_type='application/json')
    
    print(f"   Login response status: {response.status_code}")
    print(f"   Login response: {response.json()}")
    
    if response.status_code == 200:
        print("   ✅ Login API successful after password reset")
    else:
        print("   ❌ Login API failed after password reset")
        
except User.DoesNotExist:
    print(f"❌ User {test_email} not found")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n🎯 Test completed!")
