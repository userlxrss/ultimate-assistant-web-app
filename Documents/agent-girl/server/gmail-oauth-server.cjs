/**
 * Gmail OAuth 2.0 Proxy Server
 * Provides authenticated access to Gmail API using OAuth 2.0
 * Run this server on localhost:3011
 */

const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const crypto = require('crypto');

const app = express();
const PORT = 3011;

// Configuration
const OAUTH_CONFIG = {
  client_id: '534080929731-hv61mmkvguqdaep13g9gipl7d6gi5d0l.apps.googleusercontent.com',
  client_secret: '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',
  redirect_uri: 'http://localhost:3011/auth/google/callback',
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send'
  ]
};

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  store: new FileStore({
    path: './sessions',
    ttl: 86400 // 24 hours
  }),
  secret: 'gmail-oauth-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  OAUTH_CONFIG.client_id,
  OAUTH_CONFIG.client_secret,
  OAUTH_CONFIG.redirect_uri
);

// Store tokens in memory (in production, use a proper database)
const userTokens = new Map();

// Helper functions
function getSessionUser(req) {
  return req.session && req.session.user ? req.session.user : null;
}

function setSessionUser(req, userData) {
  if (!req.session) {
    req.session = {};
  }
  req.session.user = userData;
}

function getUserTokens(userId) {
  return userTokens.get(userId);
}

function setUserTokens(userId, tokens) {
  userTokens.set(userId, tokens);
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Gmail OAuth Proxy Server'
  });
});

// Get auth URL
app.get('/auth/google', (req, res) => {
  const state = crypto.randomBytes(32).toString('hex');
  req.session.oauth_state = state;

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: OAUTH_CONFIG.scopes,
    state: state,
    prompt: 'consent'
  });

  res.json({ authUrl, state });
});

// OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  try {
    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!state || state !== req.session.oauth_state) {
      throw new Error('Invalid state parameter');
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getAccessToken(code);
    const decodedToken = oauth2Client.decodeIdToken(tokens.id_token);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const userData = {
      id: userInfo.data.id,
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture
    };

    // Store tokens
    setUserTokens(userData.id, tokens);
    setSessionUser(req, userData);

    // Clear OAuth state
    delete req.session.oauth_state;

    // Redirect to success page
    res.send(`
      <html>
        <head>
          <title>Gmail Authentication Successful</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
            .success { color: #4CAF50; font-size: 24px; margin-bottom: 20px; }
            .info { background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .close-btn { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="success">✅ Gmail Authentication Successful!</div>
          <div class="info">
            <h3>Connected as: ${userData.email}</h3>
            <p>You can now close this window and return to your application.</p>
          </div>
          <button class="close-btn" onclick="window.close()">Close Window</button>
          <script>
            setTimeout(() => window.close(), 5000);
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <head>
          <title>Authentication Failed</title>
        </head>
        <body>
          <h1>❌ Authentication Failed</h1>
          <p>Error: ${error.message}</p>
          <p>Please try again.</p>
          <button onclick="window.close()">Close Window</button>
        </body>
      </html>
    `);
  }
});

// Check authentication status
app.get('/api/auth/status', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.json({ authenticated: false });
  }

  const tokens = getUserTokens(user.id);
  if (!tokens) {
    return res.json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    user: {
      email: user.email,
      name: user.name,
      picture: user.picture
    }
  });
});

// Get recent emails
app.get('/api/gmail/emails', async (req, res) => {
  try {
    const user = getSessionUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const tokens = getUserTokens(user.id);
    if (!tokens) {
      return res.status(401).json({ error: 'No tokens found' });
    }

    // Set credentials
    oauth2Client.setCredentials(tokens);

    // Create Gmail client
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get recent messages
    const maxResults = parseInt(req.query.maxResults) || 20;
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults,
      labelIds: ['INBOX']
    });

    if (!response.data.messages) {
      return res.json({ messages: [] });
    }

    // Get full message details
    const messages = await Promise.all(
      response.data.messages.map(async (msg) => {
        try {
          const fullMessage = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full'
          });

          return parseGmailMessage(fullMessage.data);
        } catch (error) {
          console.error('Error fetching message:', error);
          return null;
        }
      })
    );

    const validMessages = messages.filter(msg => msg !== null);

    res.json({
      messages: validMessages,
      total: validMessages.length,
      user: user.email
    });

  } catch (error) {
    console.error('Error fetching emails:', error);

    // Handle token expiration
    if (error.code === 401 || error.message.includes('invalid_grant')) {
      // Try to refresh token
      try {
        const user = getSessionUser(req);
        const tokens = getUserTokens(user.id);

        oauth2Client.setCredentials(tokens);
        const { credentials } = await oauth2Client.refreshAccessToken();

        // Update stored tokens
        const newTokens = { ...tokens, ...credentials };
        setUserTokens(user.id, newTokens);

        // Retry the request
        return getGmailEmails(req, res);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return res.status(401).json({ error: 'Token expired, please re-authenticate' });
      }
    }

    res.status(500).json({
      error: 'Failed to fetch emails',
      details: error.message
    });
  }
});

// Send email
app.post('/api/gmail/send', async (req, res) => {
  try {
    const user = getSessionUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const tokens = getUserTokens(user.id);
    if (!tokens) {
      return res.status(401).json({ error: 'No tokens found' });
    }

    const { to, subject, body, cc, bcc } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }

    // Set credentials
    oauth2Client.setCredentials(tokens);

    // Create Gmail client
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create email message
    const email = createEmailMessage({
      to,
      subject,
      body,
      from: user.email,
      cc,
      bcc
    });

    // Send email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: email
      }
    });

    res.json({
      success: true,
      messageId: response.data.id,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const user = getSessionUser(req);
  if (user) {
    userTokens.delete(user.id);
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
  });

  res.json({ success: true, message: 'Logged out successfully' });
});

// Helper functions
function parseGmailMessage(message) {
  const headers = message.payload.headers;
  const getHeader = (name) => {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : '';
  };

  const parseEmailAddresses = (headerValue) => {
    if (!headerValue) return [];
    return headerValue.split(',').map(addr => {
      const match = addr.trim().match(/^(.*?)\s*<(.+?)>$/) || [, '', addr.trim()];
      return {
        name: match[1]?.replace(/"/g, '').trim() || '',
        email: match[2] || addr.trim(),
      };
    });
  };

  const extractBody = (payload) => {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64url').toString('utf-8');
    }

    if (payload.parts) {
      const textPart = payload.parts.find(part => part.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        return Buffer.from(textPart.body.data, 'base64url').toString('utf-8');
      }

      const htmlPart = payload.parts.find(part => part.mimeType === 'text/html');
      if (htmlPart?.body?.data) {
        return Buffer.from(htmlPart.body.data, 'base64url').toString('utf-8');
      }
    }

    return '';
  };

  const attachments = extractAttachments(message.payload);

  return {
    id: message.id,
    threadId: message.threadId,
    subject: getHeader('Subject') || '(No subject)',
    snippet: message.snippet || '',
    body: extractBody(message.payload),
    from: parseEmailAddresses(getHeader('From'))[0] || { email: 'unknown@example.com' },
    to: parseEmailAddresses(getHeader('To')),
    cc: parseEmailAddresses(getHeader('Cc')),
    bcc: parseEmailAddresses(getHeader('Bcc')),
    date: new Date(parseInt(message.internalDate)),
    isRead: !message.labelIds?.includes('UNREAD'),
    isStarred: message.labelIds?.includes('STARRED') || false,
    isImportant: message.labelIds?.includes('IMPORTANT') || false,
    labels: message.labelIds || [],
    attachments,
    hasAttachments: attachments.length > 0,
    folder: determineFolder(message.labelIds || [])
  };
}

function extractAttachments(payload) {
  const attachments = [];

  if (payload.parts) {
    payload.parts.forEach(part => {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          id: part.body.attachmentId,
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size || 0,
        });
      }

      if (part.parts) {
        attachments.push(...extractAttachments(part));
      }
    });
  }

  return attachments;
}

function determineFolder(labelIds) {
  if (labelIds.includes('INBOX')) return 'inbox';
  if (labelIds.includes('SENT')) return 'sent';
  if (labelIds.includes('DRAFT')) return 'drafts';
  if (labelIds.includes('SPAM')) return 'spam';
  if (labelIds.includes('TRASH')) return 'trash';
  if (labelIds.includes('IMPORTANT')) return 'important';
  return 'inbox';
}

function createEmailMessage({ to, subject, body, from, cc, bcc }) {
  const emailLines = [];

  emailLines.push(`To: ${Array.isArray(to) ? to.join(', ') : to}`);
  if (cc) emailLines.push(`Cc: ${Array.isArray(cc) ? cc.join(', ') : cc}`);
  if (bcc) emailLines.push(`Bcc: ${Array.isArray(bcc) ? bcc.join(', ') : bcc}`);
  emailLines.push(`From: ${from}`);
  emailLines.push(`Subject: ${subject}`);
  emailLines.push('MIME-Version: 1.0');
  emailLines.push('Content-Type: text/plain; charset=utf-8');
  emailLines.push('');
  emailLines.push(body);

  return Buffer.from(emailLines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Gmail OAuth Proxy Server running on http://localhost:${PORT}`);
  console.log(`📧 Gmail OAuth flow ready`);
  console.log(`🔗 Auth URL: http://localhost:${PORT}/auth/google`);
  console.log(`📊 API Endpoints:`);
  console.log(`   GET  /api/auth/status - Check auth status`);
  console.log(`   GET  /api/gmail/emails - Get recent emails`);
  console.log(`   POST /api/gmail/send - Send email`);
  console.log(`   POST /api/auth/logout - Logout`);
  console.log(`\n⏰ Server started at ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;