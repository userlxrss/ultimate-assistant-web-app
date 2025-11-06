// Debug Gmail authentication
require('dotenv').config();
const { default: ImapClient } = require('emailjs-imap-client');

async function testGmailAuth() {
  const email = 'tuescalarina3@gmail.com';
  const appPassword = 'ohgugcpukifdfody';

  console.log('🔐 Testing Gmail IMAP authentication...');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 App Password: ${appPassword.substring(0, 4)}...${appPassword.substring(appPassword.length - 4)}`);

  try {
    const client = new ImapClient('imap.gmail.com', 993, {
      auth: {
        user: email,
        pass: appPassword
      },
      useSecureTransport: true,
      ignoreTLSExpires: true,
      requireTLS: false,
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('🔄 Connecting to Gmail IMAP...');
    await client.connect();
    console.log('✅ Successfully connected to Gmail IMAP!');

    // List mailboxes
    const mailboxes = await client.listMailboxes();
    console.log(`📬 Found ${mailboxes.children.length} mailboxes`);

    // Disconnect
    await client.close();
    console.log('🔌 Disconnected from Gmail IMAP');

  } catch (error) {
    console.error('❌ Gmail authentication failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code || 'N/A');

    if (error.message.includes('Invalid credentials') || error.message.includes('Authentication failed')) {
      console.log('\n🔧 Possible solutions:');
      console.log('1. Enable IMAP in Gmail Settings > Forwarding and POP/IMAP');
      console.log('2. Make sure 2-Step Authentication is enabled');
      console.log('3. Generate a new App Password');
      console.log('4. Check that App Password is correct (remove spaces)');
    }
  }
}

testGmailAuth();