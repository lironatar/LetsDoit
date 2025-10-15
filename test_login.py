import requests
import json

# Test login API
login_data = {
    "email": "lironatar94@gmail.com",
    "password": "your_password_here"  # Replace with actual password
}

response = requests.post(
    "http://localhost:8000/api/auth/login/",
    headers={"Content-Type": "application/json"},
    json=login_data
)

print("Login API Response:")
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
