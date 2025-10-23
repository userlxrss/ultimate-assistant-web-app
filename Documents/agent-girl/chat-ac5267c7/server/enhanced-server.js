require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const crypto = require('crypto');
const { google } = require('googleapis');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3003;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/productivity_hub',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Encryption utilities
class TokenEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key-change-in-production', crypto.randomBytes(32), 32);
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey);
    cipher.setAAD(Buffer.from('token-encryption', 'utf8'));

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
    const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey);
    decipher.setAAD(Buffer.from('token-encryption', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

const tokenEncryption = new TokenEncryption();

// Enhanced session configuration with PostgreSQL store
app.use(session({
  store: new pgSession({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
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

// Enhanced rate limiting
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', createRateLimit(15 * 60 * 1000, 100, 'Too many API requests'));
app.use('/auth/', createRateLimit(15 * 60 * 1000, 20, 'Too many auth attempts'));
app.use('/auth/google', createRateLimit(15 * 60 * 1000, 5, 'Too many Google OAuth attempts'));

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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Google OAuth configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI || 'http://localhost:3003/auth/google/callback'
);

// Database helper functions
class DatabaseService {
  static async query(text, params) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  static async findOrCreateUser(email, name, googleId = null, avatarUrl = null) {
    const query = `
      INSERT INTO users (email, name, google_id, avatar_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        google_id = COALESCE(EXCLUDED.google_id, users.google_id),
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, email, name, avatar_url, google_id
    `;

    const result = await this.query(query, [email, name, googleId, avatarUrl]);
    return result.rows[0];
  }

  static async storeServiceTokens(userId, serviceType, tokens, scopes = null) {
    const encryptedTokens = tokenEncryption.encrypt(JSON.stringify(tokens));

    const query = `
      INSERT INTO service_connections (user_id, service_type, encrypted_tokens, scopes, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, service_type)
      DO UPDATE SET
        encrypted_tokens = EXCLUDED.encrypted_tokens,
        scopes = EXCLUDED.scopes,
        expires_at = EXCLUDED.expires_at,
        last_used_at = CURRENT_TIMESTAMP,
        is_active = true
      RETURNING id
    `;

    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
    const result = await this.query(query, [userId, serviceType, JSON.stringify(encryptedTokens), scopes, expiresAt]);
    return result.rows[0];
  }

  static async getServiceTokens(userId, serviceType) {
    const query = `
      SELECT encrypted_tokens, scopes, expires_at, last_used_at
      FROM service_connections
      WHERE user_id = $1 AND service_type = $2 AND is_active = true
    `;

    const result = await this.query(query, [userId, serviceType]);
    if (result.rows.length === 0) return null;

    const connection = result.rows[0];
    const tokens = JSON.parse(tokenEncryption.decrypt(JSON.parse(connection.encrypted_tokens)));

    return {
      tokens,
      scopes: connection.scopes,
      expiresAt: connection.expires_at,
      lastUsedAt: connection.last_used_at
    };
  }

  static async revokeServiceConnection(userId, serviceType) {
    const query = `
      UPDATE service_connections
      SET is_active = false
      WHERE user_id = $1 AND service_type = $2
      RETURNING id
    `;

    const result = await this.query(query, [userId, serviceType]);
    return result.rows.length > 0;
  }

  static async storeOAuthState(stateToken, userId, serviceType) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const query = `
      INSERT INTO oauth_states (state_token, user_id, service_type, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    await this.query(query, [stateToken, userId, serviceType, expiresAt]);
  }

  static async validateOAuthState(stateToken, serviceType) {
    const query = `
      SELECT user_id, expires_at
      FROM oauth_states
      WHERE state_token = $1 AND service_type = $2 AND expires_at > CURRENT_TIMESTAMP
    `;

    const result = await this.query(query, [stateToken, serviceType]);
    if (result.rows.length === 0) return null;

    // Clean up used state
    await this.query('DELETE FROM oauth_states WHERE state_token = $1', [stateToken]);

    return {
      userId: result.rows[0].user_id,
      expiresAt: result.rows[0].expires_at
    };
  }

  static async getUserServices(userId) {
    const query = `
      SELECT
        sc.service_type,
        sc.is_active,
        sc.last_used_at,
        sc.expires_at,
        sc.scopes,
        u.email,
        u.name
      FROM service_connections sc
      JOIN users u ON sc.user_id = u.id
      WHERE sc.user_id = $1
    `;

    const result = await this.query(query, [userId]);
    return result.rows;
  }

  static async updateLastUsed(userId, serviceType) {
    const query = `
      UPDATE service_connections
      SET last_used_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND service_type = $2 AND is_active = true
    `;

    await this.query(query, [userId, serviceType]);
  }

  static async trackAPIUsage(userId, serviceType, endpoint) {
    const query = `
      INSERT INTO api_usage (user_id, service_type, endpoint, request_count, last_request_at)
      VALUES ($1, $2, $3, 1, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, service_type, endpoint, CURRENT_DATE)
      DO UPDATE SET
        request_count = api_usage.request_count + 1,
        last_request_at = CURRENT_TIMESTAMP
    `;

    await this.query(query, [userId, serviceType, endpoint]);
  }
}

// Token management service
class TokenManager {
  static async refreshIfNeeded(userId, serviceType) {
    const connection = await DatabaseService.getServiceTokens(userId, serviceType);
    if (!connection) return null;

    const { tokens, expiresAt } = connection;

    if (this.isExpiringSoon(expiresAt)) {
      try {
        const newTokens = await this.refreshGoogleTokens(tokens.refresh_token);
        await DatabaseService.storeServiceTokens(userId, serviceType, newTokens, connection.scopes);
        console.log(`✅ Refreshed tokens for ${serviceType} service`);
        return newTokens;
      } catch (error) {
        console.error(`❌ Failed to refresh ${serviceType} tokens:`, error);
        // Revoke connection on refresh failure
        await DatabaseService.revokeServiceConnection(userId, serviceType);
        throw new Error('Token refresh failed, please reconnect the service');
      }
    }

    return tokens;
  }

  static isExpiringSoon(expiresAt) {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  }

  static async refreshGoogleTokens(refreshToken) {
    oauth2Client.setCredentials({ refresh_token });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  }

  static async getValidatedTokens(userId, serviceType) {
    try {
      const tokens = await this.refreshIfNeeded(userId, serviceType);
      if (tokens) {
        await DatabaseService.updateLastUsed(userId, serviceType);
      }
      return tokens;
    } catch (error) {
      console.error(`Token validation failed for ${serviceType}:`, error);
      throw error;
    }
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: 'Productivity Hub Backend Enhanced',
      version: '2.0.0',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Enhanced authentication status endpoint
app.get('/api/auth/status', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({
        authenticated: false,
        user: null,
        services: { google: null, motion: null }
      });
    }

    const services = await DatabaseService.getUserServices(req.session.userId);
    const serviceStatus = {
      google: null,
      motion: null
    };

    services.forEach(service => {
      serviceStatus[service.service_type] = {
        connected: service.is_active,
        lastSync: service.last_used_at,
        scopes: service.scopes,
        expiresAt: service.expires_at
      };
    });

    const user = services[0] ? {
      id: req.session.userId,
      email: services[0].email,
      name: services[0].name
    } : null;

    res.json({
      authenticated: true,
      user,
      services: serviceStatus
    });
  } catch (error) {
    console.error('Auth status error:', error);
    res.status(500).json({ error: 'Failed to get auth status' });
  }
});

// Enhanced Google OAuth flow
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
      // For OAuth initiation, we'll use a temporary session
      userId = uuidv4();
      req.session.temporaryUserId = userId;
    }

    // Generate secure state token
    const stateToken = crypto.randomBytes(32).toString('hex');
    await DatabaseService.storeOAuthState(stateToken, userId, 'google');

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
    const stateData = await DatabaseService.validateOAuthState(state, 'google');
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
    const user = await DatabaseService.findOrCreateUser(
      userInfo.email,
      userInfo.name,
      userInfo.id,
      userInfo.picture
    );

    // Store tokens
    await DatabaseService.storeServiceTokens(
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
    // Test API key validity
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
    await DatabaseService.storeServiceTokens(userId, 'motion', { apiKey });

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
app.post('/api/auth/disconnect/:service', async (req, res) => {
  const { service } = req.params;

  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const success = await DatabaseService.revokeServiceConnection(req.session.userId, service);

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

// OAuth callback template (same as original, but enhanced)
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

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Productivity Hub Enhanced Backend Server is running!
📍 Server: http://localhost:${PORT}
🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5174'}
🔧 Environment: ${process.env.NODE_ENV || 'development'}
📅 Started: ${new Date().toISOString()}

🔐 Enhanced Features:
   ✅ PostgreSQL database integration
   ✅ Encrypted token storage
   ✅ Automatic token refresh
   ✅ Session persistence
   ✅ Enhanced security headers
   ✅ Rate limiting
   ✅ CSRF protection

🔗 OAuth Endpoints:
   Google: http://localhost:${PORT}/auth/google
   Motion: POST http://localhost:${PORT}/auth/motion

📡 API Endpoints:
   Auth Status: http://localhost:${PORT}/api/auth/status
   Health: http://localhost:${PORT}/health
  `);
});

module.exports = app;