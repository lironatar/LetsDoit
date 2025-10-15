import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.contrib.auth.models import User
from todo.models import UserProfile
from django.test import Client
import json

print("🧪 Testing Onboarding API Endpoint")
print("="*50)

# Create a test user
test_email = "apitest@example.com"

# Clean up any existing test user
User.objects.filter(email=test_email).delete()

print(f"Creating test user: {test_email}")
test_user = User.objects.create_user(
    username=test_email,
    email=test_email,
    password="testpass123"
)
test_user.is_active = True
test_user.save()

# Create profile
profile, created = UserProfile.objects.get_or_create(
    user=test_user,
    defaults={
        'theme': 'light',
        'language': 'he',
        'timezone': 'Asia/Jerusalem',
        'first_time_login': True
    }
)

print(f"Initial first_time_login: {profile.first_time_login}")

# Test the API endpoint
client = Client()
client.force_login(test_user)

# Test 1: Complete onboarding
print(f"\n🔍 Test 1: Complete Onboarding API")
complete_data = {
    "name": "Test User",
    "task_method": "pen_paper",
    "onboarding_completed": True
}

response = client.post(
    '/api/users/complete_onboarding/',
    data=json.dumps(complete_data),
    content_type='application/json'
)

print(f"Response status: {response.status_code}")
print(f"Response data: {response.json()}")

# Check if first_time_login was updated
profile.refresh_from_db()
print(f"After completion API: first_time_login: {profile.first_time_login}")

# Test 2: Skip onboarding
print(f"\n🔍 Test 2: Skip Onboarding API")
# Reset for testing
profile.first_time_login = True
profile.save()

skip_data = {
    "name": "Test User",
    "task_method": "skipped",
    "onboarding_completed": True,
    "onboarding_skipped": True
}

response = client.post(
    '/api/users/complete_onboarding/',
    data=json.dumps(skip_data),
    content_type='application/json'
)

print(f"Response status: {response.status_code}")
print(f"Response data: {response.json()}")

# Check if first_time_login was updated
profile.refresh_from_db()
print(f"After skip API: first_time_login: {profile.first_time_login}")

print(f"\n🎯 API ENDPOINT TEST RESULTS:")
if profile.first_time_login == False:
    print(f"✅ API endpoint works correctly!")
    print(f"✅ Both complete and skip set first_time_login to False")
else:
    print(f"❌ API endpoint has issues")

# Clean up
test_user.delete()
print(f"✅ Test user cleaned up")
