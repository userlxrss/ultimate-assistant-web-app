const http = require('http');
const url = require('url');
const { google } = require('googleapis');

const PORT = 3006;

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret';
const REDIRECT_URI = `http://localhost:${PORT}/auth/google/callback`;

console.log('🔐 Simple OAuth Server Starting...');
console.log(`   Client ID: ${GOOGLE_CLIENT_ID.substring(0, 20)}...`);
console.log(`   Redirect URI: ${REDIRECT_URI}`);
console.log(`   Server Port: ${PORT}`);

// Initialize Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Store tokens in memory
const storedTokens = new Map();
const sessions = new Map();

// Simple session management
function getSession(req) {
  const cookies = req.headers.cookie || '';
  const sessionIdMatch = cookies.match(/sessionId=([^;]+)/);
  const sessionId = sessionIdMatch ? sessionIdMatch[1] : 'session-' + Math.random().toString(36).substr(2, 9);

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {});
  }

  return { sessionId, session: sessions.get(sessionId) };
}

// CORS headers
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Send JSON response
function sendJSON(res, data, status = 200) {
  setCORSHeaders(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Send HTML redirect
function sendRedirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCORSHeaders(res);
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`📡 ${req.method} ${pathname}`);

  try {
    // Auth status endpoints
    if (pathname === '/api/auth/status/google') {
      const { session } = getSession(req);
      const hasToken = storedTokens.has(session.googleEmail || 'default');

      sendJSON(res, {
        connected: hasToken,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (pathname === '/api/auth/status/motion') {
      sendJSON(res, {
        connected: false, // Always false for now
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Google OAuth endpoints
    if (pathname === '/auth/google') {
      const { sessionId, session } = getSession(req);
      const state = 'state-' + Math.random().toString(36).substr(2, 9);
      session.oauthState = state;

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

      console.log('🔗 Redirecting to Google OAuth...');
      sendRedirect(res, authUrl);
      return;
    }

    if (pathname === '/auth/google/callback') {
      const { code, state, error } = query;
      const { sessionId, session } = getSession(req);

      if (error) {
        console.error('❌ Google OAuth error:', error);
        sendRedirect(res, 'http://localhost:5175/?auth=error');
        return;
      }

      if (!state || state !== session.oauthState) {
        console.error('❌ Invalid state parameter');
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid state parameter');
        return;
      }

      // Exchange code for tokens
      oauth2Client.getAccessToken(code, async (err, tokens) => {
        if (err) {
          console.error('❌ Token exchange error:', err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Token exchange failed');
          return;
        }

        try {
          oauth2Client.setCredentials(tokens);

          // Get user info
          const userInfo = await google.userinfo('v2').get({ auth: oauth2Client });

        // Store tokens
        const email = userInfo.data.email;
        storedTokens.set(email, {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          email: email,
          name: userInfo.data.name,
          picture: userInfo.data.picture,
          expiresAt: Date.now() + (tokens.expiry_date || 3600000)
        });

        session.googleEmail = email;

          console.log(`✅ Google OAuth successful for ${email}`);
          sendRedirect(res, 'http://localhost:5175/?auth=success');

        } catch (tokenError) {
          console.error('❌ User info error:', tokenError);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Failed to get user info');
        }
      });
      return;
    }

    // Get stored tokens
    if (pathname === '/api/auth/tokens/google') {
      const { session } = getSession(req);
      const email = session.googleEmail;
      const tokens = email ? storedTokens.get(email) : null;

      if (!tokens) {
        sendJSON(res, { error: 'No tokens found' }, 401);
        return;
      }

      sendJSON(res, tokens);
      return;
    }

    // Disconnect Google
    if (pathname === '/api/auth/disconnect/google' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const { session } = getSession(req);
        const email = session.googleEmail;

        if (email) {
          storedTokens.delete(email);
          delete session.googleEmail;
        }

        console.log('🔌 Google OAuth disconnected');
        sendJSON(res, { success: true });
      });
      return;
    }

    // Proxy token endpoint (for app password authentication)
    if (pathname === '/api/auth/proxy-token' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { email, appPassword } = JSON.parse(body);

          if (!email || !appPassword) {
            sendJSON(res, { error: 'Email and app password required' }, 400);
            return;
          }

          // Generate a mock access token for app password users
          // In a real implementation, you'd exchange this for a real OAuth token
          const mockToken = Buffer.from(`${email}:${appPassword}`).toString('base64');

          sendJSON(res, {
            accessToken: mockToken,
            tokenType: 'Bearer',
            expiresIn: 3600,
            email: email
          });

        } catch (parseError) {
          sendJSON(res, { error: 'Invalid request body' }, 400);
        }
      });
      return;
    }

    // Health check
    if (pathname === '/health') {
      sendJSON(res, {
        status: 'OK',
        port: PORT,
        timestamp: new Date().toISOString(),
        activeTokens: storedTokens.size
      });
      return;
    }

    // 404 for unknown routes
    setCORSHeaders(res);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));

  } catch (error) {
    console.error('❌ Server error:', error);
    setCORSHeaders(res);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Simple OAuth Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Google OAuth: http://localhost:${PORT}/auth/google`);
  console.log(`📡 Status endpoints:`);
  console.log(`   Google: http://localhost:${PORT}/api/auth/status/google`);
  console.log(`   Motion: http://localhost:${PORT}/api/auth/status/motion`);
});