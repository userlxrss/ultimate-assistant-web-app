/**
 * EMERGENCY OAUTH SERVER FIX - Critical Update
 *
 * CRITICAL FIXES:
 * 1. Dynamic frontend URL detection
 * 2. Flexible CORS for all localhost ports
 * 3. Enhanced callback with better error handling
 * 4. Improved message passing for popup/redirect flows
 * 5. Better debugging and logging
 */

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3006;

// Dynamic frontend URL detection - supports multiple ports
const getFrontendUrl = (req) => {
  const origin = req.get('Origin');
  if (origin && origin.includes('localhost')) {
    return origin;
  }
  // Fallback to common development ports
  return 'http://localhost:5173';
};

console.log('🚀 EMERGENCY OAUTH SERVER - CRITICAL FIXES APPLIED');
console.log(`📡 Server Port: ${PORT}`);
console.log(`🔑 Google Client ID: ${process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`🔐 Google Client Secret: ${process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);

// Dynamic CORS configuration - accepts any localhost origin
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow any localhost origin for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Allow specific production domains if needed
    const allowedProdDomains = [
      'your-production-domain.com'
    ];

    if (allowedProdDomains.includes(origin)) {
      return callback(null, true);
    }

    console.warn('⚠️ CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Origin']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced session configuration
const sessionConfig = {
  store: new MemoryStore({
    checkPeriod: 86400000 // 24 hours
  }),
  secret: process.env.SESSION_SECRET || 'emergency-fallback-secret-change-in-production',
  name: 'simple-oauth-session',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Better for popup flows
  }
};

app.use(session(sessionConfig));

// Google OAuth 2.0 setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/auth/google/callback`
);

// Scopes for Google services
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly'
];

// Generate Google OAuth URL with enhanced error handling
function getGoogleAuthUrl(state, frontendUrl) {
  console.log('🔗 Generating Google Auth URL:', { state, frontendUrl });

  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: state,
      prompt: 'consent',
      redirect_uri: `http://localhost:${PORT}/auth/google/callback`
    });

    console.log('✅ Generated Auth URL:', authUrl.substring(0, 100) + '...');
    return authUrl;
  } catch (error) {
    console.error('❌ Error generating auth URL:', error);
    throw new Error(`Failed to generate Google auth URL: ${error.message}`);
  }
}

// API endpoint to get Google Auth URL - Enhanced
app.get('/api/auth/google', (req, res) => {
  try {
    const frontendUrl = getFrontendUrl(req);
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Store state and frontend URL in session
    req.session.oauthState = state;
    req.session.frontendUrl = frontendUrl;

    const authUrl = getGoogleAuthUrl(state, frontendUrl);

    console.log('📤 Sending auth URL to client:', {
      state,
      frontendUrl,
      authUrl: authUrl.substring(0, 100) + '...'
    });

    res.json({
      success: true,
      authUrl: authUrl,
      state: state,
      frontendUrl: frontendUrl
    });
  } catch (error) {
    console.error('❌ Error generating auth URL:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to generate Google authentication URL'
    });
  }
});

// Enhanced Google OAuth callback handler
app.get('/auth/google/callback', async (req, res) => {
  try {
    console.log('📥 OAuth callback received:', req.query);
    console.log('🔍 Session data:', {
      state: req.session.oauthState,
      frontendUrl: req.session.frontendUrl,
      sessionId: req.sessionID
    });

    const { code, state, error } = req.query;

    if (error) {
      console.error('❌ OAuth error from Google:', error);
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code) {
      console.error('❌ No authorization code received');
      throw new Error('No authorization code received from Google');
    }

    const sessionState = req.session.oauthState;
    const frontendUrl = req.session.frontendUrl || 'http://localhost:5173';

    console.log('🔍 Validating state:', { received: state, session: sessionState });

    // Verify state to prevent CSRF
    if (!state || state !== sessionState) {
      console.error('❌ State mismatch:', { received: state, expected: sessionState });
      throw new Error('Invalid state parameter - possible CSRF attack');
    }

    console.log('✅ State validation passed, exchanging code for tokens...');

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getAccessToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('✅ Tokens received, getting user info...');

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    console.log('👤 User info retrieved:', { email: userInfo.email, name: userInfo.name });

    // Store tokens and user info in session
    req.session.accessToken = tokens.access_token;
    req.session.refreshToken = tokens.refresh_token;
    req.session.user = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture
    };
    req.session.isAuthenticated = true;

    // Clear state but keep frontend URL
    delete req.session.oauthState;

    console.log('✅ Session created successfully');

    // Enhanced success response with better message passing
    const successHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Successful</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f0f9ff;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 400px;
          }
          .success-icon {
            width: 60px;
            height: 60px;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            color: white;
            font-size: 24px;
          }
          .debug-info {
            margin-top: 1rem;
            padding: 0.5rem;
            background: #f3f4f6;
            border-radius: 4px;
            font-size: 0.75rem;
            color: #6b7280;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✓</div>
          <h2>Authentication Successful!</h2>
          <p>Your Google account has been connected successfully.</p>
          <p><strong>Welcome, ${userInfo.name}!</strong></p>
          <p>This window will close automatically.</p>

          <div class="debug-info">
            <strong>Debug Info:</strong><br>
            Frontend: ${frontendUrl}<br>
            User: ${userInfo.email}<br>
            Session ID: ${req.sessionID}
          </div>
        </div>

        <script>
          console.log('🚀 OAuth Success Script Starting');
          console.log('Frontend URL:', '${frontendUrl}');
          console.log('User data:', ${JSON.stringify(req.session.user)});

          // Enhanced message passing with multiple attempts
          function postSuccessMessage() {
            const message = {
              type: 'GOOGLE_AUTH_SUCCESS',
              user: ${JSON.stringify(req.session.user)},
              success: true,
              timestamp: Date.now()
            };

            console.log('📤 Posting success message:', message);

            // Try to post to parent window (popup flow)
            if (window.opener && !window.opener.closed) {
              try {
                window.opener.postMessage(message, '${frontendUrl}');
                window.opener.postMessage(message, '*'); // Fallback for development
                console.log('✅ Message posted to parent window');
              } catch (error) {
                console.error('❌ Error posting to parent:', error);
              }
            } else {
              console.log('❌ No parent window found');
            }

            // Also try posting to top window (for iframe scenarios)
            if (window.top !== window.self) {
              try {
                window.top.postMessage(message, '${frontendUrl}');
                window.top.postMessage(message, '*'); // Fallback
                console.log('✅ Message posted to top window');
              } catch (error) {
                console.error('❌ Error posting to top:', error);
              }
            }
          }

          // Post message immediately
          postSuccessMessage();

          // Post again after a short delay to ensure it's received
          setTimeout(postSuccessMessage, 500);

          // Auto-close after success
          setTimeout(() => {
            console.log('🔄 Auto-closing popup window');
            window.close();
          }, 2000);

          // Fallback: redirect to frontend if popup doesn't close
          setTimeout(() => {
            if (!window.closed) {
              console.log('🔄 Redirecting to frontend as fallback');
              window.location.href = '${frontendUrl}?auth=success&user=' + encodeURIComponent('${userInfo.email}');
            }
          }, 3000);
        </script>
      </body>
      </html>
    `;

    res.send(successHtml);

  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    const frontendUrl = req.session.frontendUrl || 'http://localhost:5173';

    // Enhanced error response
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Failed</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #fef2f2;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 400px;
          }
          .error-icon {
            width: 60px;
            height: 60px;
            background: #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            color: white;
            font-size: 24px;
          }
          .error-details {
            margin-top: 1rem;
            padding: 0.5rem;
            background: #fef2f2;
            border-radius: 4px;
            font-size: 0.75rem;
            color: #dc2626;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-icon">✗</div>
          <h2>Authentication Failed</h2>
          <p>There was an error connecting your Google account.</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <p>Please try again or contact support.</p>

          <div class="error-details">
            <strong>Technical Details:</strong><br>
            ${error.stack || 'No stack trace available'}
          </div>

          <p>This window will close automatically.</p>
        </div>

        <script>
          console.log('❌ OAuth Error Script Starting');
          console.log('Error:', '${error.message}');

          function postErrorMessage() {
            const message = {
              type: 'GOOGLE_AUTH_ERROR',
              error: '${error.message}',
              success: false,
              timestamp: Date.now()
            };

            console.log('📤 Posting error message:', message);

            // Try to post to parent window
            if (window.opener && !window.opener.closed) {
              try {
                window.opener.postMessage(message, '${frontendUrl}');
                window.opener.postMessage(message, '*'); // Fallback
                console.log('✅ Error message posted to parent');
              } catch (error) {
                console.error('❌ Error posting to parent:', error);
              }
            } else {
              console.log('❌ No parent window found');
            }
          }

          // Post error message
          postErrorMessage();

          // Auto-close after error
          setTimeout(() => {
            console.log('🔄 Auto-closing error window');
            window.close();
          }, 3000);
        </script>
      </body>
      </html>
    `;

    res.status(500).send(errorHtml);
  }
});

// Enhanced authentication status endpoint
app.get('/api/auth/status', async (req, res) => {
  try {
    console.log('🔍 Checking auth status for session:', req.sessionID);

    if (req.session.isAuthenticated && req.session.user) {
      res.json({
        authenticated: true,
        user: req.session.user,
        sessionId: req.sessionID
      });
    } else {
      res.json({
        authenticated: false,
        user: null,
        sessionId: req.sessionID
      });
    }
  } catch (error) {
    console.error('Auth status error:', error);
    res.status(500).json({ error: 'Failed to check auth status' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  try {
    const sessionId = req.sessionID;
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        res.status(500).json({ error: 'Failed to logout' });
      } else {
        console.log('✅ Session destroyed:', sessionId);
        res.json({ success: true });
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Get Google Contacts
app.get('/api/contacts', async (req, res) => {
  try {
    if (!req.session.isAuthenticated || !req.session.accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    oauth2Client.setCredentials({ access_token: req.session.accessToken });
    const people = google.people({ version: 'v1', auth: oauth2Client });

    const response = await people.people.connections.list({
      resourceName: 'people/me',
      pageSize: 100,
      personFields: 'names,emailAddresses,phoneNumbers,photos'
    });

    const contacts = response.data.connections?.filter(contact =>
      contact.names && contact.names.length > 0
    ).map(contact => ({
      id: contact.resourceName,
      name: contact.names?.[0]?.displayName || '',
      email: contact.emailAddresses?.[0]?.value || '',
      phone: contact.phoneNumbers?.[0]?.value || '',
      photo: contact.photos?.[0]?.url || ''
    })) || [];

    res.json({ contacts });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Get Gmail messages
app.get('/api/gmail/messages', async (req, res) => {
  try {
    if (!req.session.isAuthenticated || !req.session.accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    oauth2Client.setCredentials({ access_token: req.session.accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
      q: 'in:inbox'
    });

    if (!response.data.messages) {
      return res.json({ messages: [] });
    }

    const messages = await Promise.all(
      response.data.messages.map(async (message) => {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date']
        });

        const headers = msg.data.payload?.headers;
        const fromHeader = headers?.find(h => h.name === 'From');
        const subjectHeader = headers?.find(h => h.name === 'Subject');
        const dateHeader = headers?.find(h => h.name === 'Date');

        return {
          id: msg.data.id,
          from: fromHeader?.value || '',
          subject: subjectHeader?.value || '',
          date: dateHeader?.value || '',
          snippet: msg.data.snippet || ''
        };
      })
    );

    res.json({ messages });

  } catch (error) {
    console.error('Get Gmail messages error:', error);
    res.status(500).json({ error: 'Failed to fetch Gmail messages' });
  }
});

// Get Calendar events
app.get('/api/calendar/events', async (req, res) => {
  try {
    if (!req.session.isAuthenticated || !req.session.accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    oauth2Client.setCredentials({ access_token: req.session.accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 20
    });

    const events = response.data.items?.map(event => ({
      id: event.id,
      summary: event.summary || 'No title',
      description: event.description || '',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      location: event.location || ''
    })) || [];

    res.json({ events });

  } catch (error) {
    console.error('Get Calendar events error:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// Enhanced health check endpoint
app.get('/api/health', (req, res) => {
  const frontendUrl = getFrontendUrl(req);
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.1.0-EMERGENCY-CRITICAL-FIX',
    service: 'Emergency OAuth Server - CRITICAL FIXES',
    port: PORT,
    frontendUrl: frontendUrl,
    sessionStore: 'MemoryStore',
    googleAuth: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'missing',
    corsMode: 'dynamic-localhost'
  });
});

// Enhanced error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    origin: req.get('Origin'),
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    error: 'Internal server error',
    details: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server with enhanced logging
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  🚀 EMERGENCY OAUTH SERVER - CRITICAL FIXES ACTIVE!         ║
║                                                              ║
║  Server: http://localhost:${PORT}                           ║
║  CORS: Dynamic (all localhost ports)                        ║
║  Popup Flow: Enhanced with fallbacks                        ║
║  Redirect Flow: Supported as fallback                       ║
║  Message Passing: Multi-attempt with debugging             ║
║                                                              ║
║  ✅ CRITICAL FIXES APPLIED:                                 ║
║  • Dynamic frontend URL detection                           ║
║  • Flexible CORS for all localhost ports                    ║
║  • Enhanced popup monitoring                                ║
║  • Better error handling and logging                        ║
║  • Improved message passing                                 ║
║  • Automatic fallback mechanisms                            ║
║                                                              ║
║  📋 IMMEDIATE TEST INSTRUCTIONS:                           ║
║  1. Start OAuth server: node simple-oauth-server.cjs       ║
║  2. Start frontend: npm run dev                             ║
║  3. Test Google OAuth flow immediately                     ║
║  4. Check browser console for debugging info               ║
║  5. Verify authentication works for presentation           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;