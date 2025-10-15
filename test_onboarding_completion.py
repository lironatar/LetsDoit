import requests
import json

# Test the complete_onboarding API
# You'll need to replace this with actual authentication token or test with a real user

# First, let's test with a user that has first_time_login: True
test_data = {
    "name": "Test User",
    "task_method": "skipped",
    "onboarding_completed": True,
    "onboarding_skipped": True
}

print("Testing onboarding completion API...")
print("This would normally require authentication.")
print("Let's check if the endpoint exists and responds correctly.")

try:
    response = requests.post(
        "http://localhost:8000/api/users/complete_onboarding/",
        headers={"Content-Type": "application/json"},
        json=test_data
    )
    
    print(f"Response Status: {response.status_code}")
    print(f"Response: {response.text}")
    
except Exception as e:
    print(f"Error: {e}")
    print("Make sure the Django server is running on port 8000")
