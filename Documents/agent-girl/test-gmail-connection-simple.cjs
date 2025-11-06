require('dotenv').config();
const Imap = require('imap');

console.log('🔍 Testing Gmail IMAP connection...');

const imap = new Imap({
  user: process.env.GMAIL_USER,
  password: process.env.GMAIL_APP_PASSWORD,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false
  },
  connTimeout: 10000,
  authTimeout: 10000
});

imap.once('ready', () => {
  console.log('✅ IMAP connection successful!');
  imap.openBox('INBOX', false, (err, box) => {
    if (err) {
      console.error('❌ Failed to open INBOX:', err);
    } else {
      console.log(`📧 INBOX opened. Total messages: ${box.messages.total}`);
    }
    imap.end();
  });
});

imap.once('error', (err) => {
  console.error('❌ IMAP connection failed:', err.message);
  if (err.message.includes('Invalid credentials')) {
    console.log('💡 This means your username or app password is wrong');
  } else if (err.message.includes('authentication failed')) {
    console.log('💡 Authentication failed - check if:');
    console.log('   1. App password is correct');
    console.log('   2. "Less secure app access" is ON in Gmail settings');
    console.log('   3. IMAP is enabled in Gmail settings');
  }
  process.exit(1);
});

imap.once('end', () => {
  console.log('🔚 IMAP connection ended');
  process.exit(0);
});

try {
  imap.connect();
} catch (err) {
  console.error('❌ Failed to start IMAP connection:', err.message);
  process.exit(1);
}