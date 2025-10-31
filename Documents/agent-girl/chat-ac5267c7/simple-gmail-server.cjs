require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const Imap = require('imap');

const app = express();
const PORT = 3012;

// Store active Gmail sessions in memory
const gmailSessions = new Map();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Gmail IMAP Server' });
});

// Gmail authentication
app.post('/api/gmail/authenticate', async (req, res) => {
  try {
    const { email, appPassword } = req.body;

    console.log('🔐 Gmail authentication attempt for:', email);

    // Test IMAP connection
    const imapConfig = {
      user: email,
      password: appPassword,
      host: 'imap.gmail.com',
      port: 993,
      tls: true
    };

    const imap = new Imap(imapConfig);

    await new Promise((resolve, reject) => {
      imap.once('ready', () => {
        console.log('✅ IMAP connection successful');
        imap.end();
        resolve();
      });

      imap.once('error', (err) => {
        console.error('❌ IMAP connection failed:', err);
        reject(err);
      });

      imap.connect();
    });

    // Generate session ID
    const sessionId = 'gmail_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Store session
    gmailSessions.set(sessionId, {
      email,
      appPassword,
      createdAt: new Date()
    });

    console.log('✅ Gmail session created:', sessionId);

    res.json({
      sessionId,
      email,
      message: 'Gmail authenticated successfully'
    });

  } catch (error) {
    console.error('Gmail authentication error:', error);
    res.status(401).json({
      message: 'Authentication failed: ' + error.message
    });
  }
});

// Get emails
app.get('/api/gmail/emails/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const session = gmailSessions.get(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    console.log('📧 Fetching emails for:', session.email);

    const imapConfig = {
      user: session.email,
      password: session.appPassword,
      host: 'imap.gmail.com',
      port: 993,
      tls: true
    };

    const imap = new Imap(imapConfig);
    const emails = [];

    await new Promise((resolve, reject) => {
      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) return reject(err);

          // Fetch recent emails
          const fetch = imap.seq.fetch(`${Math.max(1, box.messages.total - limit + 1)}:*`, {
            bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID)',
            struct: true
          });

          fetch.on('message', (msg, seqno) => {
            const email = { id: seqno.toString() };

            msg.on('body', (stream, info) => {
              let buffer = '';
              stream.on('data', (chunk) => {
                buffer += chunk.toString('ascii');
              });
              stream.once('end', () => {
                const header = Imap.parseHeader(buffer);
                email.from = header.from && header.from[0] ? parseAddress(header.from[0]) : null;
                email.to = header.to && header.to[0] ? parseAddress(header.to[0]) : null;
                email.subject = header.subject && header.subject[0] ? header.subject[0] : '(No subject)';
                email.date = header.date && header.date[0] ? new Date(header.date[0]) : new Date();
                email.isRead = false;
                email.isStarred = false;
                email.hasAttachments = false;
                email.snippet = 'Email content preview...';
                email.body = 'Email body content would be here...';
                email.labels = [];

                emails.unshift(email); // Add to beginning (newest first)
              });
            });

            msg.once('attributes', (attrs) => {
              email.isRead = !attrs.flags.includes('\\Seen');
              email.isStarred = attrs.flags.includes('\\Flagged');
              email.hasAttachments = attrs.struct && attrs.struct.some(part => part.disposition && part.disposition.type === 'attachment');
            });
          });

          fetch.once('error', reject);
          fetch.once('end', () => {
            imap.end();
            resolve();
          });
        });
      });

      imap.once('error', reject);
      imap.connect();
    });

    console.log(`✅ Fetched ${emails.length} emails`);

    res.json({
      emails,
      total: emails.length
    });

  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({
      error: 'Failed to fetch emails',
      message: error.message
    });
  }
});

// Send email
app.post('/api/gmail/send/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { to, subject, body, cc, bcc } = req.body;

    const session = gmailSessions.get(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    console.log('📤 Sending email from:', session.email);

    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: session.email,
        pass: session.appPassword
      }
    });

    const mailOptions = {
      from: session.email,
      to,
      subject,
      text: body,
      cc: cc || undefined,
      bcc: bcc || undefined
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', result.messageId);

    res.json({
      messageId: result.messageId,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
});

// Helper function to parse email addresses
function parseAddress(addrStr) {
  const match = addrStr.match(/^(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)$/);
  if (match) {
    return {
      name: match[1] ? match[1].trim() : '',
      email: match[2] ? match[2].trim() : ''
    };
  }
  return { name: '', email: addrStr.trim() };
}

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Gmail IMAP Server is running!
📍 Server: http://localhost:${PORT}
🌐 Frontend: http://localhost:5173
📧 Gmail IMAP: Enabled
📅 Started: ${new Date().toISOString()}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;