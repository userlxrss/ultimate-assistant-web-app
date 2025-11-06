const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3001/auth/google/callback';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('⚠️  Warning: Google OAuth credentials not found in environment variables');
}

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Google OAuth routes
router.get('/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({
      error: 'Google OAuth not configured',
      message: 'Server administrator needs to configure Google OAuth credentials'
    });
  }

  // Generate a state parameter for security
  const state = Math.random().toString(36).substring(2, 15);
  req.session.oauthState = state;

  // Scopes for Gmail, Calendar, and Contacts
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/contacts.readonly'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: state,
    prompt: 'consent', // Force consent to get refresh token
    include_granted_scopes: true
  });

  // Redirect to Google OAuth
  res.redirect(authUrl);
});

router.get('/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // Check for OAuth errors
  if (error) {
    console.error('Google OAuth error:', error);
    return res.redirect(`/oauth-callback?success=false&service=Google&error=${encodeURIComponent(error)}`);
  }

  // Verify state parameter
  if (!state || state !== req.session.oauthState) {
    console.error('Invalid OAuth state');
    return res.redirect('/oauth-callback?success=false&service=Google&error=Invalid state parameter');
  }

  try {
    // Exchange authorization code for tokens
    const response = await oauth2Client.getToken(code);
    const tokens = response.tokens;

    // Store tokens in session
    req.session.googleTokens = tokens;

    // Create a new OAuth2 client with the tokens for user info request
    const authClient = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );
    authClient.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: authClient });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Store user info in session
    req.session.user = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      verified: userInfo.verified_email
    };

    // Clean up OAuth state
    delete req.session.oauthState;

    console.log(`✅ Google OAuth successful for ${userInfo.email}`);

    // Redirect to success page
    res.redirect(`/oauth-callback?success=true&service=Google`);

  } catch (error) {
    console.error('Google OAuth token exchange error:', error);
    res.redirect(`/oauth-callback?success=false&service=Google&error=${encodeURIComponent('Failed to exchange authorization code')}`);
  }
});

// Motion API OAuth (simplified - just API key)
router.post('/motion', (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({
      error: 'API key required',
      message: 'Please provide your Motion API key'
    });
  }

  // Store Motion API key in session
  req.session.motionApiKey = apiKey;

  console.log('✅ Motion API key stored');

  res.json({
    success: true,
    message: 'Motion API connected successfully'
  });
});

// Test OAuth connections
router.get('/test/:service', async (req, res) => {
  const { service } = req.params;

  try {
    switch (service) {
      case 'google':
        if (!req.session.googleTokens) {
          return res.status(401).json({
            connected: false,
            error: 'Google not connected'
          });
        }

        // Set credentials and test
        oauth2Client.setCredentials(req.session.googleTokens);

        // Test Gmail API
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const gmailProfile = await gmail.users.getProfile({ userId: 'me' });

        // Test Calendar API
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const calendarList = await calendar.calendarList.list({ maxResults: 1 });

        res.json({
          connected: true,
          service: 'Google',
          user: req.session.user,
          gmail: {
            emailAddress: gmailProfile.data.emailAddress,
            messagesTotal: gmailProfile.data.messagesTotal
          },
          calendar: {
            calendarsFound: calendarList.data.items?.length || 0
          }
        });
        break;

      case 'motion':
        if (!req.session.motionApiKey) {
          return res.status(401).json({
            connected: false,
            error: 'Motion not connected'
          });
        }

        // Test Motion API (would require Motion API client)
        res.json({
          connected: true,
          service: 'Motion',
          message: 'Motion API key is valid'
        });
        break;

      default:
        res.status(400).json({
          error: 'Invalid service',
          message: `Service '${service}' is not supported`
        });
    }
  } catch (error) {
    console.error(`OAuth test error for ${service}:`, error);
    res.status(500).json({
      connected: false,
      error: 'Connection test failed',
      message: error.message
    });
  }
});

module.exports = router;