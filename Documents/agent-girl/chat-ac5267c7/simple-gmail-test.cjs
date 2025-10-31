require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Imap = require('imap');

const app = express();
app.use(cors());
const PORT = 3007; // Use different port to avoid conflicts

// Gmail sessions storage
const gmailSessions = new Map();

// Add session with the same ID the frontend expects
gmailSessions.set('persistent_gmail_session_tuescalarina3_gmail_com', {
  email: process.env.GMAIL_USER,
  appPassword: process.env.GMAIL_APP_PASSWORD
});

// Authentication endpoint
app.post('/api/gmail/authenticate', async (req, res) => {
  try {
    const { email, appPassword } = req.body;

    // For now, just accept the credentials and return the session ID
    // In a real implementation, you'd validate these credentials first
    const sessionId = `persistent_gmail_session_${email.replace(/[@.]/g, '_')}`;

    gmailSessions.set(sessionId, {
      email,
      appPassword
    });

    res.json({
      success: true,
      sessionId,
      email,
      message: 'Gmail authenticated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple email fetch endpoint
app.get('/api/gmail/emails/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const session = gmailSessions.get(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    console.log(`🔍 Fetching emails for ${session.email}`);

    const imapConfig = {
      user: session.email,
      password: session.appPassword,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false,
        servername: 'imap.gmail.com'
      },
      connTimeout: 30000,
      authTimeout: 30000
    };

    const emails = await new Promise((resolve, reject) => {
      const imap = new Imap(imapConfig);
      const emails = [];

      imap.once('ready', () => {
        console.log('✅ IMAP connected, opening INBOX...');
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            console.error('❌ Error opening INBOX:', err);
            return reject(err);
          }

          console.log(`📧 INBOX opened, total messages: ${box.messages.total}`);

          // Fetch just the most recent emails
          const fetch = imap.seq.fetch(`${box.messages.total}:${Math.max(1, box.messages.total - limit + 1)}`, {
            bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
            struct: false
          });

          fetch.on('message', (msg, seqno) => {
            console.log(`📨 Processing message #${seqno}`);

            msg.on('body', (stream, info) => {
              let buffer = '';
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              stream.once('end', () => {
                try {
                  const header = Imap.parseHeader(buffer);
                  const email = {
                    id: seqno.toString(),
                    from: header.from && header.from[0] ? header.from[0] : 'Unknown',
                    to: header.to && header.to[0] ? header.to[0] : 'Unknown',
                    subject: header.subject && header.subject[0] ? header.subject[0] : '(No subject)',
                    date: header.date && header.date[0] ? header.date[0] : new Date().toISOString(),
                    snippet: header.subject && header.subject[0] ? header.subject[0].substring(0, 100) : ''
                  };
                  emails.push(email);
                  console.log(`✅ Processed: ${email.subject.substring(0, 50)}...`);
                } catch (err) {
                  console.error(`❌ Error parsing message ${seqno}:`, err.message);
                }
              });
            });

            msg.once('attributes', (attrs) => {
              console.log(`📋 Message ${seqno} attributes received`);
            });
          });

          fetch.once('error', (err) => {
            console.error('❌ Fetch error:', err);
            reject(err);
          });

          fetch.once('end', () => {
            console.log(`✅ Fetch completed. Got ${emails.length} emails.`);
            imap.end();
          });
        });
      });

      imap.once('error', (err) => {
        console.error('❌ IMAP error:', err);
        reject(err);
      });

      imap.once('end', () => {
        console.log('🔚 IMAP connection ended');
        resolve(emails);
      });

      imap.connect();
    });

    res.json({
      success: true,
      emails,
      total: emails.length
    });

  } catch (error) {
    console.error('❌ Email fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Simple Gmail test server running on port ${PORT}`);
  console.log(`📧 Test endpoint: http://localhost:${PORT}/api/emails/test_session`);
});