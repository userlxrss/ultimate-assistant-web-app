require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { google } = require('googleapis');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3004;

// In-memory storage for demo purposes (use database in production)
const users = new Map();
const tokens = new Map();
const oauthStates = new Map();

// SECURE: Fixed encryption utilities
class TokenEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    
    // SECURE: Generate a proper random salt for key derivation
    const keySalt = process.env.ENCRYPTION_SALT ? 
      Buffer.from(process.env.ENCRYPTION_SALT, 'hex') : 
      crypto.randomBytes(32);
    
    // SECURE: Use proper key derivation with random salt
    this.secretKey = crypto.scryptSync(
      process.env.ENCRYPTION_KEY || 'demo-key-change-in-production', 
      keySalt, 
      32
    );
    
    // SECURE: Validate key strength
    if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY === 'demo-key-change-in-production') {
      console.warn('🚨 WARNING: Using default encryption key. Set ENCRYPTION_KEY for production security.');
    }
  }

  encrypt(text) {
    // SECURE: Generate random IV for each encryption
    const iv = crypto.randomBytes(16);
    
    // SECURE: Use createCipheriv with proper IV parameter
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    // SECURE: Use createDecipheriv with proper IV parameter
    const decipher = crypto.createDecipheriv(
      this.algorithm, 
      this.secretKey, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

const tokenEncryption = new TokenEncryption();

// SECURE: Enhanced session configuration with stronger secret
const sessionSecret = process.env.SESSION_SECRET || 
  crypto.randomBytes(64).toString('hex');

if (!process.env.SESSION_SECRET) {
  console.warn('🚨 WARNING: Using auto-generated session secret. Set SESSION_SECRET for persistence.');
}

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  name: 'productivity-hub-session'
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://apis.google.com", "https://www.googleapis.com"],
    },
  },
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

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Google OAuth configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI || 'http://localhost:3004/auth/google/callback'
);

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

  static storeServiceTokens(userId, serviceType, tokens, scopes = null) {
    const encryptedTokens = tokenEncryption.encrypt(JSON.stringify(tokens));
    tokens.set(`${userId}-${serviceType}`, {
      userId,
      serviceType,
      encryptedTokens,
      scopes,
      createdAt: new Date()
    });
  }

  static getServiceTokens(userId, serviceType) {
    const connection = tokens.get(`${userId}-${serviceType}`);
    if (!connection) return null;

    const decryptedTokens = JSON.parse(tokenEncryption.decrypt(connection.encryptedTokens));
    return {
      tokens: decryptedTokens,
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
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
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

// SECURE: Security audit endpoint
app.get('/security/audit', (req, res) => {
  const securityStatus = {
    timestamp: new Date().toISOString(),
    encryption: {
      algorithm: 'AES-256-GCM',
      keyDerivation: 'scryptSync (IMPROVED)',
      ivGeneration: 'random per encryption',
      authTag: 'enabled'
    },
    sessionSecurity: {
      secretConfigured: !!process.env.SESSION_SECRET,
      cookieSecure: process.env.NODE_ENV === 'production',
      secretStrength: sessionSecret.length >= 64 ? 'strong' : 'weak'
    },
    recommendations: []
  };

  if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.includes('demo')) {
    securityStatus.recommendations.push('Set a strong ENCRYPTION_KEY environment variable');
  }

  if (!process.env.SESSION_SECRET) {
    securityStatus.recommendations.push('Set a SESSION_SECRET environment variable for persistence');
  }

  if (!process.env.ENCRYPTION_SALT) {
    securityStatus.recommendations.push('Set ENCRYPTION_SALT for consistent key derivation');
  }

  res.json(securityStatus);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'Productivity Hub Backend (SECURITY-FIXED VERSION)',
    version: '1.0.1-security-fixed',
    database: 'in-memory-demo',
    encryption: 'AES-256-GCM (Fixed: proper IV usage, random salt)'
  });
});

// Authentication status endpoint
app.get('/api/auth/status', (req, res) => {
  if (!req.session.userId) {
    return res.json({
      authenticated: false,
      user: null,
      services: { google: null, motion: null }
    });
  }

  const services = DatabaseService.getUserServices(req.session.userId);
  const user = Array.from(users.values()).find(u => u.id === req.session.userId);

  res.json({
    authenticated: true,
    user: user ? { id: user.id, email: user.email, name: user.name } : null,
    services
  });
});

// Google OAuth flow
app.get('/auth/google', async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({
      error: 'Google OAuth not configured',
      message: 'Server administrator needs to configure Google OAuth credentials'
    });
  }

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

    // Define OAuth scopes
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
      state: stateToken,
      prompt: 'consent',
      include_granted_scopes: true
    });

    res.redirect(authUrl);
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

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getAccessToken(code);

    // Get user information
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Create or update user
    const user = DatabaseService.findOrCreateUser(
      userInfo.email,
      userInfo.name,
      userInfo.id,
      userInfo.picture
    );

    // Store tokens
    DatabaseService.storeServiceTokens(
      user.id,
      'google',
      tokens,
      [
        'gmail.readonly',
        'gmail.send',
        'calendar.readonly',
        'calendar.events',
        'contacts.readonly'
      ]
    );

    // Update session
    req.session.userId = user.id;
    delete req.session.temporaryUserId;

    console.log(`✅ Google OAuth successful for ${userInfo.email}`);

    res.redirect(`/oauth-callback?success=true&service=Google`);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`/oauth-callback?success=false&service=Google&error=${encodeURIComponent('Failed to complete authentication')}`);
  }
});

// Motion API integration
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
    // Test API key validity (simple validation)
    const testResponse = await axios.get('https://api.usemotion.com/v1/workspace', {
      headers: { 'X-API-Key': apiKey },
      timeout: 10000
    });

    // Create or find user
    let userId = req.session.userId;
    if (!userId) {
      userId = uuidv4();
      req.session.userId = userId;
    }

    // Store Motion API key
    DatabaseService.storeServiceTokens(userId, 'motion', { apiKey });

    console.log('✅ Motion API connected successfully');

    res.json({
      success: true,
      message: 'Motion API connected successfully',
      workspace: testResponse.data
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
app.post('/api/auth/disconnect/:service', (req, res) => {
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
        </style>
    </head>
    <body>
        <div class="container">
            ${success === 'true' ?
                `<div class="spinner"></div>
                 <div class="icon">🎉</div>
                 <h2 class="success">Successfully Connected!</h2>
                 <p class="message">${service} has been securely connected to your account.</p>
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
            }, '${process.env.FRONTEND_URL || 'http://localhost:5174'}');

            // Close window after delay
            setTimeout(() => {
                window.close();
            }, ${success === 'true' ? 2500 : 6000});
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
🚀 Productivity Hub Backend Server is running!
📍 Server: http://localhost:${PORT}
🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5174'}
🔧 Environment: ${process.env.NODE_ENV || 'development'}
📅 Started: ${new Date().toISOString()}

🔐 SECURITY IMPROVEMENTS:
   ✅ Fixed deprecated createCipher/createDecipher
   ✅ Implemented proper IV/nonce management
   ✅ Random salt generation for key derivation
   ✅ Strong session secret generation
   ✅ Security audit endpoint: /security/audit

🔗 OAuth Endpoints:
   Google: http://localhost:${PORT}/auth/google
   Motion: POST http://localhost:${PORT}/auth/motion

📡 API Endpoints:
   Auth Status: http://localhost:${PORT}/api/auth/status
   Health: http://localhost:${PORT}/health
   Security Audit: http://localhost:${PORT}/security/audit

⚠️  SECURITY NOTES:
   - Critical cryptographic vulnerabilities have been fixed
   - Encryption now uses proper IV parameters
   - Random salt generation prevents rainbow table attacks
   - Consider using Argon2id for production-grade security
  `);
});

module.exports = app;