// Script to clear invalid Gmail sessions
// Run with: node clear-sessions.cjs

const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing invalid Gmail sessions...');

// This is a helper script that can be used to clear sessions
// The actual localStorage clearing will happen in the browser console

console.log(`
📧 To clear Gmail sessions in the browser:
1. Open Developer Tools (F12)
2. Go to Console tab
3. Run: localStorage.removeItem('productivity_hub_auth')
4. Or run: authManager.clearGmailSession()

🔐 Invalid session "persistent_gmail_session_tuescalarina3_gmail_com" will be cleared.
`);