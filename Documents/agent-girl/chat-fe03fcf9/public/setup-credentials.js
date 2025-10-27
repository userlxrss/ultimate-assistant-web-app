// Setup credentials for analytics dashboard
// This script configures localStorage with the required API credentials

// Set CardDAV password (Google Contacts app password)
localStorage.setItem('carddav_password', 'kqyvabfcwdqrsfex');

// Set Motion API key (placeholder - needs to be configured)
// For now, we'll use a placeholder to trigger the API flow
localStorage.setItem('motion_api_key', 'your-motion-api-key-here');

// Set Gmail credentials for email integration
localStorage.setItem('gmail_email', 'larstuesca@gmail.com');
localStorage.setItem('gmail_app_password', 'ehsdovndpswpnsqz');

console.log('Credentials configured:');
console.log('- CardDAV password: kqyvabfcwdqrsfex');
console.log('- Motion API key: placeholder (needs real key)');
console.log('- Gmail credentials: configured');

console.log('Reload the page to apply credentials');