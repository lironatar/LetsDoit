// Debug script to check frontend authentication state
// Run this in the browser console when you get the 401 error

console.log("🔍 Frontend Authentication Debug");
console.log("="*50);

// Check localStorage data
console.log("1. localStorage data:");
console.log("   username:", localStorage.getItem('username'));
console.log("   user_authenticated:", localStorage.getItem('user_authenticated'));
console.log("   email_verified:", localStorage.getItem(`${localStorage.getItem('username')}_email_verified`));

// Check all localStorage keys
console.log("   All localStorage keys:", Object.keys(localStorage));

// Test API call manually
const currentUser = localStorage.getItem('username');
if (currentUser) {
    console.log("2. Testing API call manually:");
    
    fetch(`http://localhost:8000/api/users/?email=${encodeURIComponent(currentUser)}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        console.log("   API response status:", response.status);
        console.log("   API response ok:", response.ok);
        return response.json();
    })
    .then(data => {
        console.log("   API response data:", data);
    })
    .catch(error => {
        console.log("   API error:", error);
    });
} else {
    console.log("2. No current user found in localStorage");
}

// Check if user is logged in via session
console.log("3. Testing login status:");
fetch('http://localhost:8000/api/auth/login/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
        email: currentUser,
        password: 'test123' // You might need to adjust this
    })
})
.then(response => {
    console.log("   Login test response status:", response.status);
    return response.json();
})
.then(data => {
    console.log("   Login test response data:", data);
})
.catch(error => {
    console.log("   Login test error:", error);
});

console.log("🎯 Debug completed! Check the results above.");
