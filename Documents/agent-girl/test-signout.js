/**
 * Test script to verify sign-out functionality
 * Run this in the browser console when the app is loaded
 */

// Test 1: Check if authentication system is properly initialized
console.log('=== SIGN-OUT FUNCTIONALITY TEST ===');

// Check if userAuthManager is available
if (typeof userAuthManager !== 'undefined') {
  console.log('✅ userAuthManager is available');
} else {
  console.log('❌ userAuthManager is not available');
}

// Check if authManager is available
if (typeof authManager !== 'undefined') {
  console.log('✅ authManager is available');
} else {
  console.log('❌ authManager is not available');
}

// Test 2: Check if handleSignOut function exists in the component
// This will be visible through React DevTools or by checking the sign-out button

console.log('\n=== TESTING SIGN-OUT BUTTON ===');
console.log('Instructions:');
console.log('1. Click the profile button (user icon) in the top-right');
console.log('2. Click the "Sign Out" button in the dropdown');
console.log('3. Check the console for "🔴 handleSignOut called!" message');
console.log('4. Verify the page redirects to / (login page)');
console.log('5. Verify localStorage auth data is cleared');

// Test 3: Helper function to check localStorage state
function checkAuthState() {
  console.log('\n=== CURRENT AUTH STATE ===');

  // Check for user session
  const sessionId = localStorage.getItem('current_user_session_id');
  console.log('Session ID:', sessionId ? 'exists' : 'none');

  // Check for auth sessions
  const authData = localStorage.getItem('productivity_hub_auth');
  console.log('Auth sessions:', authData ? 'exists' : 'none');

  // Count user-specific data
  const keys = Object.keys(localStorage);
  const userKeys = keys.filter(key => key.startsWith('user:'));
  const sessionKeys = keys.filter(key => key.startsWith('session:'));

  console.log('User data entries:', userKeys.length);
  console.log('Session data entries:', sessionKeys.length);

  return {
    hasSession: !!sessionId,
    hasAuthData: !!authData,
    userEntries: userKeys.length,
    sessionEntries: sessionKeys.length
  };
}

// Run the check
const initialState = checkAuthState();

console.log('\n=== EXPECTED BEHAVIOR AFTER SIGN-OUT ===');
console.log('- Page should redirect to /');
console.log('- All auth data should be cleared');
console.log('- Console should show "🔴 handleSignOut called!"');
console.log('- No user session data should remain');

// Export the check function for manual testing
window.checkAuthState = checkAuthState;