require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { google } = require('googleapis');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3006; // Use port 3006

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '376726065823.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret';

console.log('🔐 Google OAuth Configuration:');
console.log(`   Client ID: ${GOOGLE_CLIENT_ID.substring(0, 20)}...`);
console.log(`   Port: ${PORT}`);

// Simple in-memory storage
const users = new Map();
const tokens = new Map();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: 'simple-oauth-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Google OAuth Setup
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `http://localhost:3006/auth/google/callback`
);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'Simple OAuth Server',
    port: PORT
  });
});

// Auth status
app.get('/api/auth/status', (req, res) => {
  if (!req.session.userId) {
    return res.json({
      authenticated: false,
      user: null,
      services: { google: null, motion: null }
    });
  }

  const user = Array.from(users.values()).find(u => u.id === req.session.userId);
  const hasGoogleTokens = tokens.has(`${req.session.userId}-google`);

  res.json({
    authenticated: true,
    user: user ? { id: user.id, email: user.email, name: user.name } : null,
    services: {
      google: hasGoogleTokens ? { connected: true, lastSync: new Date().toISOString() } : null,
      motion: null
    }
  });
});

// API endpoint to start Google OAuth (for the frontend)
app.get('/api/auth/google', async (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    req.session.oauthState = state;

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/contacts.readonly'],
      state: state,
      prompt: 'consent'
    });

    console.log(`🔗 Generating OAuth URL for frontend`);
    res.json({
      success: true,
      authUrl: authUrl,
      state: state
    });
  } catch (error) {
    console.error('OAuth API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authentication URL',
      details: error.message
    });
  }
});

// Start Google OAuth (redirect version)
app.get('/auth/google', async (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    req.session.oauthState = state;

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/contacts.readonly'],
      state: state,
      prompt: 'consent'
    });

    console.log(`🔗 Redirecting to Google OAuth`);
    res.redirect(authUrl);
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).json({ error: 'Failed to start OAuth' });
  }
});

// Google OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`/oauth-callback?success=false&error=${encodeURIComponent(error)}`);
    }

    if (state !== req.session.oauthState) {
      return res.redirect('/oauth-callback?success=false&error=Invalid state');
    }

    // Exchange code for tokens
    const response = await oauth2Client.getAccessToken(code);
    const tokens = response.tokens;

    // Get user info
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Store user and tokens
    const user = {
      id: uuidv4(),
      email: userInfo.email,
      name: userInfo.name,
      avatar: userInfo.picture
    };

    users.set(user.id, user);
    tokens.set(`${user.id}-google`, tokens);
    req.session.userId = user.id;

    console.log(`✅ Google OAuth successful for ${userInfo.email}`);

    res.redirect(`/oauth-callback?success=true&service=Google`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`/oauth-callback?success=false&error=${encodeURIComponent('Authentication failed')}`);
  }
});

// OAuth callback page
app.get('/oauth-callback', (req, res) => {
  const { success, error } = req.query;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>OAuth Callback</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                   display: flex; align-items: center; justify-content: center;
                   height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { text-align: center; padding: 3rem; background: white;
                        border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
            .success { color: #10b981; }
            .error { color: #ef4444; }
        </style>
    </head>
    <body>
        <div class="container">
            ${success === 'true' ?
                `<h2 class="success">✅ Successfully Connected!</h2>
                 <p>Google account has been connected.</p>` :
                `<h2 class="error">❌ Connection Failed</h2>
                 <p>${error || 'Authentication failed'}</p>`
            }
        </div>
        <script>
            window.opener?.postMessage({
                type: 'oauth-callback',
                success: ${success === 'true'},
                service: 'Google',
                error: '${error || ''}'
            }, '*');
            setTimeout(() => window.close(), 3000);
        </script>
    </body>
    </html>
  `;

  res.send(html);
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to logout'
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

// Disconnect
app.post('/api/auth/disconnect/:service', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { service } = req.params;
  tokens.delete(`${req.session.userId}-${service}`);

  res.json({
    success: true,
    message: `${service} disconnected successfully`
  });
});

// Gmail test endpoint
app.get('/api/gmail/test', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const tokens_data = tokens.get(`${req.session.userId}-google`);
  if (!tokens_data) {
    return res.status(401).json({ error: 'No Google tokens' });
  }

  try {
    oauth2Client.setCredentials(tokens_data);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const response = await gmail.users.getProfile({ userId: 'me' });

    res.json({
      success: true,
      profile: response.data,
      message: 'Gmail API working! 📧'
    });
  } catch (error) {
    console.error('Gmail API error:', error);
    res.status(500).json({ error: 'Gmail API failed', message: error.message });
  }
});

// Calendar test endpoint
app.get('/api/calendar/test', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const tokens_data = tokens.get(`${req.session.userId}-google`);
  if (!tokens_data) {
    return res.status(401).json({ error: 'No Google tokens' });
  }

  try {
    oauth2Client.setCredentials(tokens_data);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime'
    });

    res.json({
      success: true,
      events: response.data.items,
      message: 'Calendar API working! 📅'
    });
  } catch (error) {
    console.error('Calendar API error:', error);
    res.status(500).json({ error: 'Calendar API failed', message: error.message });
  }
});

// Contacts test endpoint
app.get('/api/contacts/test', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const tokens_data = tokens.get(`${req.session.userId}-google`);
  if (!tokens_data) {
    return res.status(401).json({ error: 'No Google tokens' });
  }

  try {
    oauth2Client.setCredentials(tokens_data);
    const people = google.people({ version: 'v1', auth: oauth2Client });

    const response = await people.people.connections.list({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses',
      pageSize: 5
    });

    res.json({
      success: true,
      contacts: response.data.connections || [],
      message: 'Contacts API working! 👥'
    });
  } catch (error) {
    console.error('Contacts API error:', error);
    res.status(500).json({ error: 'Contacts API failed', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`
🚀 SIMPLE OAuth Server is running!
📍 Server: http://localhost:${PORT}
🔐 Real Google OAuth
📧 Gmail API
📅 Calendar API
👥 Contacts API
✅ Ready for testing!
  `);
});