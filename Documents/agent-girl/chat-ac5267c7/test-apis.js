// Quick API Integration Test
console.log('🧪 Testing API Integrations...\n');

// Test Motion API
console.log('1️⃣ Motion API Test:');
try {
  const motionKey = import.meta.env.VITE_MOTION_API_KEY;
  console.log('✅ Motion API Key:', motionKey ? 'Present' : 'Missing');

  if (motionKey) {
    console.log('📋 Motion API Key length:', motionKey.length);
    console.log('🔗 Motion API Base URL: https://api.usemotion.com/v1');
  }
} catch (error) {
  console.log('❌ Motion API test failed:', error.message);
}

// Test Gmail Configuration
console.log('\n2️⃣ Gmail API Test:');
try {
  const gmailUser = import.meta.env.VITE_GMAIL_USER || 'tuescalarina3@gmail.com';
  console.log('✅ Gmail User:', gmailUser);

  const gmailAppPassword = import.meta.env.VITE_GMAIL_APP_PASSWORD;
  console.log('🔐 Gmail App Password:', gmailAppPassword ? 'Present' : 'Missing');
} catch (error) {
  console.log('❌ Gmail API test failed:', error.message);
}

// Test Google OAuth
console.log('\n3️⃣ Google OAuth Test:');
try {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  console.log('✅ Google Client ID:', googleClientId ? 'Present' : 'Missing');

  if (googleClientId) {
    console.log('📋 Google Client ID length:', googleClientId.length);
  }
} catch (error) {
  console.log('❌ Google OAuth test failed:', error.message);
}

// Test CardDAV Contacts
console.log('\n4️⃣ CardDAV Contacts Test:');
try {
  const carddavUrl = import.meta.env.VITE_CARDDAV_URL || 'https://contacts.google.com';
  console.log('✅ CardDAV URL:', carddavUrl);

  const carddavUser = import.meta.env.VITE_CARDDAV_USER || 'larstuesca@gmail.com';
  console.log('👤 CardDAV User:', carddavUser);
} catch (error) {
  console.log('❌ CardDAV test failed:', error.message);
}

console.log('\n🎉 API Integration Test Complete!');
console.log('📝 Check browser console for detailed integration status when the app loads.');