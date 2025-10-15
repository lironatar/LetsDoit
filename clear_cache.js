// Clear all onboarding-related localStorage keys
console.log("🧹 Clearing onboarding-related cache...");

// Get all localStorage keys
const allKeys = Object.keys(localStorage);
console.log("All localStorage keys:", allKeys);

// Keys that might interfere with onboarding
const onboardingKeys = allKeys.filter(key => 
  key.includes('onboarding') || 
  key.includes('first_time') ||
  key.includes('email_verified') ||
  key.includes('needs_onboarding')
);

console.log("Onboarding-related keys found:", onboardingKeys);

// Clear these keys
onboardingKeys.forEach(key => {
  console.log(`Removing: ${key}`);
  localStorage.removeItem(key);
});

// Also clear any user-specific onboarding keys
const userKeys = allKeys.filter(key => key.includes('@') && (key.includes('onboarding') || key.includes('email_verified')));
console.log("User-specific onboarding keys found:", userKeys);

userKeys.forEach(key => {
  console.log(`Removing: ${key}`);
  localStorage.removeItem(key);
});

console.log("✅ Cache cleared! Refresh the page and try again.");
