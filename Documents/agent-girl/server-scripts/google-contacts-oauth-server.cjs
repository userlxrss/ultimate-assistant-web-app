// Google Contacts OAuth2 Server
// This server handles OAuth2 authentication with Google and fetches real contacts

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const crypto = require('crypto');

const app = express();
const PORT = 3013; // Use port 3013 for contacts proxy

// OAuth2 Configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID', // You'll need to set this
  process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET', // You'll need to set this
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3013/auth/google/callback'
);

// Google People API scopes
const SCOPES = [
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Store OAuth sessions in memory (in production, use Redis or database)
const oauthSessions = new Map();
const userTokens = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'Google Contacts OAuth2 Server',
    port: PORT,
    ready: true,
    features: ['Real Google Contacts', 'OAuth2 Authentication', 'Google People API']
  });
});

// Get Google OAuth URL
app.get('/api/auth/google', (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: state,
      prompt: 'consent'
    });

    // Store state for verification
    oauthSessions.set(state, {
      created: new Date(),
      originalUrl: req.query.originalUrl || '/'
    });

    res.json({
      success: true,
      authUrl,
      state
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate auth URL',
      message: error.message
    });
  }
});

// OAuth2 callback handler
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send('Missing authorization code or state');
    }

    const session = oauthSessions.get(state);
    if (!session) {
      return res.status(400).send('Invalid or expired state parameter');
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getAccessToken(code);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Store user tokens
    const sessionId = `contacts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    userTokens.set(sessionId, {
      tokens,
      userInfo: {
        id: userInfo.data.id,
        email: userInfo.data.email,
        name: userInfo.data.name,
        picture: userInfo.data.picture
      },
      createdAt: new Date()
    });

    // Clean up state
    oauthSessions.delete(state);

    // Redirect to frontend with session
    const redirectUrl = `http://localhost:5173?google_contacts_session=${sessionId}&auth_success=true`;
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

// Alternative: Direct email/password authentication (limited functionality)
// Note: This won't work for Google People API, but we can provide a fallback
app.post('/api/contacts/authenticate', async (req, res) => {
  try {
    const { email, appPassword } = req.body;

    console.log(`🔐 Attempting Google Contacts authentication: ${email}`);

    if (!email || !appPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials',
        message: 'Email and app password are required',
        needsOAuth: true,
        oauthUrl: `http://localhost:${PORT}/api/auth/google`
      });
    }

    // Google People API requires OAuth2, not app passwords
    // We'll provide a helpful error message directing them to OAuth
    res.status(400).json({
      success: false,
      error: 'OAuth2 Required',
      message: 'Google Contacts requires OAuth2 authentication. App passwords cannot access the Google People API.',
      needsOAuth: true,
      oauthUrl: `http://localhost:${PORT}/api/auth/google`,
      instructions: [
        '1. Set up Google OAuth2 credentials',
        '2. Visit the OAuth URL provided',
        '3. Sign in with your Google account',
        '4. Grant permissions for Contacts access'
      ]
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
  }
});

// Get real Google Contacts
app.get('/api/contacts/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 100, pageToken } = req.query;

    const userSession = userTokens.get(sessionId);
    if (!userSession) {
      return res.status(401).json({
        success: false,
        error: 'Session not found',
        message: 'Please authenticate with OAuth2 first',
        needsOAuth: true,
        oauthUrl: `http://localhost:${PORT}/api/auth/google`
      });
    }

    console.log(`📊 Fetching real Google Contacts for: ${userSession.userInfo.email}`);

    // Set up authenticated Google People API client
    oauth2Client.setCredentials(userSession.tokens);
    const people = google.people({ version: 'v1', auth: oauth2Client });

    // Fetch real contacts
    const response = await people.people.connections.list({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,phoneNumbers,organizations,photos,biographies,addresses',
      pageSize: parseInt(limit) || 100,
      pageToken: pageToken
    });

    const contacts = response.data.connections || [];

    // Transform contacts to match expected format
    const transformedContacts = contacts
      .filter(contact => contact.names && contact.names.length > 0) // Only include contacts with names
      .map(contact => ({
        id: contact.resourceName?.replace('people/', '') || contact.id,
        resourceName: contact.resourceName,
        etag: contact.etag,
        displayName: contact.names?.[0]?.displayName || 'Unknown',
        name: {
          givenName: contact.names?.[0]?.givenName,
          familyName: contact.names?.[0]?.familyName,
          formatted: contact.names?.[0]?.displayName
        },
        emails: contact.emailAddresses?.map(email => ({
          value: email.value,
          type: email.type || 'home'
        })) || [],
        phoneNumbers: contact.phoneNumbers?.map(phone => ({
          value: phone.value,
          type: phone.type || 'mobile'
        })) || [],
        organizations: contact.organizations?.map(org => ({
          name: org.name,
          title: org.title
        })) || [],
        photos: contact.photos?.map(photo => ({
          url: photo.url,
          default: photo.default
        })) || [],
        addresses: contact.addresses?.map(addr => ({
          streetAddress: addr.streetAddress,
          city: addr.city,
          region: addr.region,
          postalCode: addr.postalCode,
          country: addr.country,
          type: addr.type
        })) || [],
        biographies: contact.biographies?.map(bio => ({
          value: bio.value,
          contentType: bio.contentType
        })) || [],
        raw: contact // Include raw data for debugging
      }));

    console.log(`✅ Successfully fetched ${transformedContacts.length} real Google Contacts`);

    res.json({
      success: true,
      connections: transformedContacts,
      totalItems: response.data.totalItems || transformedContacts.length,
      nextPageToken: response.data.nextPageToken,
      source: 'Google People API (Real Data)',
      user: userSession.userInfo,
      message: 'Successfully fetched your actual Google Contacts'
    });

  } catch (error) {
    console.error('Google Contacts fetch error:', error);

    // Handle specific Google API errors
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      // Token expired or invalid
      return res.status(401).json({
        success: false,
        error: 'Authentication expired',
        message: 'Your Google session has expired. Please authenticate again.',
        needsOAuth: true,
        oauthUrl: `http://localhost:${PORT}/api/auth/google`
      });
    }

    if (error.code === 403) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Please grant Contacts permissions when authenticating with Google.',
        needsOAuth: true,
        oauthUrl: `http://localhost:${PORT}/api/auth/google`
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch contacts',
      message: error.message,
      source: 'Google People API'
    });
  }
});

// Get user session info
app.get('/api/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const userSession = userTokens.get(sessionId);

    if (!userSession) {
      return res.status(401).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      user: userSession.userInfo,
      createdAt: userSession.createdAt
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check session',
      message: error.message
    });
  }
});

// Sign out
app.delete('/api/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    userTokens.delete(sessionId);

    res.json({
      success: true,
      message: 'Signed out successfully'
    });
  } catch (error) {
    console.error('Sign out error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sign out',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 GOOGLE CONTACTS OAUTH2 SERVER IS RUNNING!
📍 Server: http://localhost:${PORT}
📊 Contacts Endpoint: http://localhost:${PORT}/api/contacts/:sessionId
🔐 OAuth URL: http://localhost:${PORT}/api/auth/google
📅 Session Info: http://localhost:${PORT}/api/session/:sessionId
🚪 Sign Out: DELETE http://localhost:${PORT}/api/session/:sessionId
📅 Started: ${new Date().toISOString()}

🎯 GOOGLE CONTACTS OAUTH2 FEATURES:
✅ Real Google People API integration
✅ OAuth2 authentication flow
✅ Secure session management
✅ Real contacts data (no more dummy data!)
✅ CORS enabled for frontend

📋 SETUP INSTRUCTIONS:
1. Create Google Cloud Project: https://console.cloud.google.com/
2. Enable People API & OAuth2 API
3. Create OAuth2 credentials (Web Application)
4. Set redirect URI to: http://localhost:${PORT}/auth/google/callback
5. Set environment variables:
   - GOOGLE_CLIENT_ID=your_client_id
   - GOOGLE_CLIENT_SECRET=your_client_secret
   - GOOGLE_REDIRECT_URI=http://localhost:${PORT}/auth/google/callback

📋 USAGE:
1. Visit: http://localhost:${PORT}/api/auth/google
2. Sign in with Google and grant permissions
3. Use the returned sessionId to fetch real contacts
4. No more dummy/sample data - only your actual contacts!

🚀 REAL GOOGLE CONTACTS READY!
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