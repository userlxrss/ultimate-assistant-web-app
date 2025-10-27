require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3006;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: 'oauth-session-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret';
const REDIRECT_URI = `http://localhost:${PORT}/auth/google/callback`;

console.log('🔐 Google OAuth Server Starting...');
console.log(`   Client ID: ${GOOGLE_CLIENT_ID.substring(0, 20)}...`);
console.log(`   Redirect URI: ${REDIRECT_URI}`);
console.log(`   Server Port: ${PORT}`);

// Initialize Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Store tokens in memory (in production, use proper storage)
const storedTokens = new Map();

// Auth status endpoints
app.get('/api/auth/status/google', (req, res) => {
  const sessionId = req.sessionID || 'default';
  const hasToken = storedTokens.has(sessionId);

  res.json({
    connected: hasToken,
    sessionId: sessionId,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/auth/status/motion', (req, res) => {
  const motionKey = localStorage?.getItem('motion_api_key');
  res.json({
    connected: !!motionKey,
    timestamp: new Date().toISOString()
  });
});

// Google OAuth endpoints
app.get('/auth/google', (req, res) => {
  const state = uuidv4();
  req.session.oauthState = state;

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/contacts.readonly'
    ],
    state: state,
    prompt: 'consent'
  });

  console.log('🔗 Redirecting to Google OAuth URL:', authUrl.substring(0, 100) + '...');
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const storedState = req.session.oauthState;

    if (!state || state !== storedState) {
      console.error('❌ Invalid state parameter');
      return res.status(400).send('Invalid state parameter');
    }

    const { tokens } = await oauth2Client.getAccessToken(code);
    const userInfo = await google.userinfo('v2').get({ auth: oauth2Client });

    // Store tokens
    const sessionId = req.sessionID || 'default';
    storedTokens.set(sessionId, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture,
      expiresAt: Date.now() + (tokens.expiry_date || 3600000)
    });

    // Also store for the authManager to find
    if (typeof window !== 'undefined') {
      localStorage.setItem('google_access_token', tokens.access_token);
      localStorage.setItem('google_account_email', userInfo.data.email);
    }

    console.log(`✅ Google OAuth successful for ${userInfo.data.email}`);

    // Redirect back to the app
    res.redirect('http://localhost:5175/?auth=success');

  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

// Get stored tokens
app.get('/api/auth/tokens/google', (req, res) => {
  const sessionId = req.sessionID || 'default';
  const tokens = storedTokens.get(sessionId);

  if (!tokens) {
    return res.status(401).json({ error: 'No tokens found' });
  }

  res.json(tokens);
});

// Disconnect Google
app.post('/api/auth/disconnect/google', (req, res) => {
  const sessionId = req.sessionID || 'default';
  storedTokens.delete(sessionId);

  console.log('🔌 Google OAuth disconnected');
  res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    port: PORT,
    timestamp: new Date().toISOString(),
    activeSessions: storedTokens.size
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OAuth Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Google OAuth: http://localhost:${PORT}/auth/google`);
});