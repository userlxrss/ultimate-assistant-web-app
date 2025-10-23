require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3004;

// In-memory storage for demo purposes
const users = new Map();
const tokens = new Map();
const oauthStates = new Map();

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'demo-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  },
  name: 'productivity-hub-session'
}));

// Security middleware (relaxed for demo)
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for demo to allow file:// access
}));

// Rate limiting
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', createRateLimit(15 * 60 * 1000, 100, 'Too many API requests'));
app.use('/auth/', createRateLimit(15 * 60 * 1000, 20, 'Too many auth attempts'));

// CORS configuration - allow both localhost and file:// for testing
app.use(cors({
  origin: [
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:5174',
    'null', // Allow file:// origin
    /^file:\/\/.*/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip} - Origin: ${req.get('Origin') || 'None'}`);
  next();
});

// Helper functions
class DatabaseService {
  static findOrCreateUser(email, name, googleId = null, avatarUrl = null) {
    if (!users.has(email)) {
      users.set(email, {
        id: uuidv4(),
        email,
        name,
        googleId,
        avatarUrl,
        createdAt: new Date()
      });
    }
    return users.get(email);
  }

  static storeServiceTokens(userId, serviceType, serviceTokens, scopes = null) {
    tokens.set(`${userId}-${serviceType}`, {
      userId,
      serviceType,
      tokens: serviceTokens,
      scopes,
      createdAt: new Date()
    });
  }

  static getServiceTokens(userId, serviceType) {
    const connection = tokens.get(`${userId}-${serviceType}`);
    if (!connection) return null;

    return {
      tokens: connection.tokens,
      scopes: connection.scopes
    };
  }

  static revokeServiceConnection(userId, serviceType) {
    const key = `${userId}-${serviceType}`;
    const existed = tokens.has(key);
    tokens.delete(key);
    return existed;
  }

  static storeOAuthState(stateToken, userId, serviceType) {
    oauthStates.set(stateToken, {
      userId,
      serviceType,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
  }

  static validateOAuthState(stateToken, serviceType) {
    const state = oauthStates.get(stateToken);
    if (!state || state.serviceType !== serviceType || state.expiresAt < new Date()) {
      oauthStates.delete(stateToken);
      return null;
    }

    oauthStates.delete(stateToken);
    return state;
  }

  static getUserServices(userId) {
    const services = { google: null, motion: null };

    for (const [key, connection] of tokens) {
      if (connection.userId === userId) {
        services[connection.serviceType] = {
          connected: true,
          lastSync: connection.createdAt,
          scopes: connection.scopes
        };
      }
    }

    return services;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'Productivity Hub Backend (Demo Mode - Fixed)',
    version: '1.0.0',
    database: 'in-memory-demo',
    cors: 'enabled-for-testing'
  });
});

// Authentication status endpoint
app.get('/api/auth/status', (req, res) => {
  console.log(`🔍 Auth Status Check - Session ID: ${req.session.id}, User ID: ${req.session.userId}, Temp User ID: ${req.session.temporaryUserId}`);
  console.log(`🔍 Users in memory: ${users.size}, Tokens in memory: ${tokens.size}`);

  if (!req.session.userId) {
    return res.json({
      authenticated: false,
      user: null,
      services: { google: null, motion: null }
    });
  }

  const services = DatabaseService.getUserServices(req.session.userId);
  const user = Array.from(users.values()).find(u => u.id === req.session.userId);

  console.log(`🔍 Found user: ${user ? user.email : 'null'}, Services: ${JSON.stringify(services)}`);

  res.json({
    authenticated: true,
    user: user ? { id: user.id, email: user.email, name: user.name } : null,
    services
  });
});

// DEMO Google OAuth flow (simulated)
app.get('/auth/google', async (req, res) => {
  try {
    // Create or find user
    let userId = req.session.userId;
    if (!userId) {
      userId = uuidv4();
      req.session.temporaryUserId = userId;
    }

    // Generate secure state token
    const stateToken = crypto.randomBytes(32).toString('hex');
    DatabaseService.storeOAuthState(stateToken, userId, 'google');

    // For demo purposes, redirect to a simulated OAuth callback
    // In production, this would redirect to actual Google OAuth
    setTimeout(() => {
      res.redirect(`/auth/google/callback?state=${stateToken}&code=demo-auth-code`);
    }, 1000);

  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    res.redirect(`/oauth-callback?success=false&service=Google&error=${encodeURIComponent('Failed to initiate OAuth flow')}`);
  }
});

app.get('/auth/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.error('Google OAuth error:', error);
    return res.redirect(`/oauth-callback?success=false&service=Google&error=${encodeURIComponent(error)}`);
  }

  if (!state) {
    return res.redirect('/oauth-callback?success=false&service=Google&error=Missing state parameter');
  }

  try {
    // Validate OAuth state
    const stateData = DatabaseService.validateOAuthState(state, 'google');
    if (!stateData) {
      return res.redirect('/oauth-callback?success=false&service=Google&error=Invalid or expired state parameter');
    }

    // Simulate successful OAuth with demo user
    const demoUser = DatabaseService.findOrCreateUser(
      'demo@example.com',
      'Demo User',
      'demo-google-id',
      'https://ui-avatars.com/api/?name=Demo+User&background=4285f4&color=fff'
    );

    // Store demo tokens
    DatabaseService.storeServiceTokens(
      demoUser.id,
      'google',
      {
        access_token: 'demo-access-token-' + Date.now(),
        refresh_token: 'demo-refresh-token-' + Date.now(),
        expiry_date: Date.now() + 3600000 // 1 hour from now
      },
      [
        'gmail.readonly',
        'gmail.send',
        'calendar.readonly',
        'calendar.events',
        'contacts.readonly'
      ]
    );

    // Update session
    req.session.userId = demoUser.id;
    delete req.session.temporaryUserId;

    console.log(`✅ Demo Google OAuth successful for demo@example.com`);

    res.redirect(`/oauth-callback?success=true&service=Google`);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`/oauth-callback?success=false&service=Google&error=${encodeURIComponent('Failed to complete authentication')}`);
  }
});

// Motion API integration (demo)
app.post('/auth/motion', async (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({
      error: 'API key required',
      message: 'Please provide your Motion API key'
    });
  }

  if (!apiKey.startsWith('mot_')) {
    return res.status(400).json({
      error: 'Invalid API key format',
      message: 'Motion API keys should start with "mot_"'
    });
  }

  try {
    // Create or find user
    let userId = req.session.userId;
    if (!userId) {
      userId = uuidv4();
      req.session.userId = userId;
    }

    // Store Motion API key
    DatabaseService.storeServiceTokens(userId, 'motion', { apiKey });

    console.log('✅ Demo Motion API connected successfully');

    res.json({
      success: true,
      message: 'Motion API connected successfully',
      workspace: { name: 'Demo Workspace', id: 'demo-workspace-id' }
    });

  } catch (error) {
    console.error('Motion API connection error:', error);
    res.status(400).json({
      error: 'Invalid API key',
      message: 'The provided Motion API key is invalid or expired'
    });
  }
});

// Disconnect service endpoint
app.post('/api/auth/disconnect/:service', async (req, res) => {
  const { service } = req.params;

  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const success = DatabaseService.revokeServiceConnection(req.session.userId, service);

    if (success) {
      res.json({
        success: true,
        message: `${service} disconnected successfully`
      });
    } else {
      res.status(404).json({
        error: 'Service not found',
        message: `${service} was not connected`
      });
    }
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect service' });
  }
});

// OAuth callback template
app.get('/oauth-callback', (req, res) => {
  const { success, service, error } = req.query;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>OAuth Callback</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
                text-align: center;
                padding: 3rem;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 400px;
                width: 90%;
            }
            .success { color: #10b981; }
            .error { color: #ef4444; }
            .spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                width: 48px;
                height: 48px;
                animation: spin 1s linear infinite;
                margin: 0 auto 1.5rem;
            }
            .icon {
                font-size: 3rem;
                margin-bottom: 1rem;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .message {
                color: #6b7280;
                line-height: 1.6;
                margin: 1rem 0;
            }
            .demo-notice {
                background: #f3f4f6;
                padding: 1rem;
                border-radius: 8px;
                margin: 1rem 0;
                font-size: 0.875rem;
                color: #4b5563;
            }
        </style>
    </head>
    <body>
        <div class="container">
            ${success === 'true' ?
                `<div class="spinner"></div>
                 <div class="icon">🎉</div>
                 <h2 class="success">Successfully Connected!</h2>
                 <p class="message">${service} has been securely connected to your account.</p>
                 <div class="demo-notice">
                    <strong>🧪 Demo Mode:</strong> This is a simulated connection for testing purposes.
                 </div>
                 <p class="message">This window will close automatically...</p>` :
                `<div class="icon">❌</div>
                 <h2 class="error">Connection Failed</h2>
                 <p class="message">${error || 'An error occurred during authentication.'}</p>
                 <p class="message">You can close this window and try again.</p>`
            }
        </div>
        <script>
            // Communicate with parent window
            window.opener?.postMessage({
                type: 'oauth-callback',
                success: ${success === 'true'},
                service: '${service}',
                error: '${error || ''}'
            }, '*'); // Allow any origin for demo

            // Close window after delay
            setTimeout(() => {
                window.close();
            }, ${success === 'true' ? 3000 : 6000});
        </script>
    </body>
    </html>
  `;

  res.send(html);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🧪 Productivity Hub Demo Server is running!
📍 Server: http://localhost:${PORT}
🌐 Frontend: http://localhost:5174 or file:///
🔧 Environment: ${process.env.NODE_ENV || 'development'}
📅 Started: ${new Date().toISOString()}

🔐 Demo Features:
   ✅ Simulated Google OAuth flow
   ✅ Motion API integration demo
   ✅ In-memory storage (demo mode)
   ✅ Session management
   ✅ Security headers (relaxed for demo)
   ✅ Rate limiting
   ✅ CORS for file:// origins

🔗 OAuth Endpoints:
   Google: http://localhost:${PORT}/auth/google (simulated)
   Motion: POST http://localhost:${PORT}/auth/motion

📡 API Endpoints:
   Auth Status: http://localhost:${PORT}/api/auth/status
   Health: http://localhost:${PORT}/health

⚠️  Demo Mode: This is a simulation for testing the UI and flow.
   No real Google OAuth credentials required.
   CORS enabled for file:// origins.
  `);
});

module.exports = app;