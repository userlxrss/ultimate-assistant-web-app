require('dotenv').config();
const { validateCredentials, displayValidationResults } = require('./utils/credentialValidator');

// CRITICAL SECURITY: Validate credentials at startup
const credentialValidation = validateCredentials();
displayValidationResults(credentialValidation);

// Prevent server startup with critical security issues
if (!credentialValidation.isValid) {
  console.error('\n🚨 SERVER STARTUP BLOCKED: Critical security issues must be resolved');
  console.error('📖 Please configure your credentials in server/.env file');
  console.error('🔧 See .env.example for instructions');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Import route handlers
const authRoutes = require('./routes/auth');
const googleRoutes = require('./routes/google');
const motionRoutes = require('./routes/motion');
const calendarRoutes = require('./routes/calendar');

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Session configuration
app.use(session({
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'productivity-hub-session'
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Make session data available to templates
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'Productivity Hub Backend',
    version: '1.0.0'
  });
});

// OAuth status endpoint
app.get('/api/auth/status', (req, res) => {
  const connectedServices = {
    google: !!req.session.googleTokens,
    motion: !!req.session.motionApiKey
  };

  res.json({
    connected: Object.values(connectedServices).some(Boolean),
    services: connectedServices,
    user: req.session.user || null
  });
});

// Disconnect endpoint
app.post('/api/auth/disconnect/:service', (req, res) => {
  const { service } = req.params;

  switch (service) {
    case 'google':
      delete req.session.googleTokens;
      delete req.session.user;
      break;
    case 'motion':
      delete req.session.motionApiKey;
      break;
    default:
      return res.status(400).json({ error: 'Invalid service' });
  }

  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.status(500).json({ error: 'Failed to disconnect service' });
    }
    res.json({ success: true, message: `${service} disconnected successfully` });
  });
});

// Mount route handlers
app.use('/auth', authRoutes);
app.use('/api/google', googleRoutes);
app.use('/api/motion', motionRoutes);
app.use('/api/calendar', calendarRoutes);

// OAuth callback handler (for popup-based OAuth)
app.get('/oauth-callback', (req, res) => {
  const { success, service, error } = req.query;

  // Create HTML response that communicates with the parent window
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>OAuth Callback</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
            }
            .container {
                text-align: center;
                padding: 2rem;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .success { color: #10b981; }
            .error { color: #ef4444; }
            .spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #3b82f6;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    </head>
    <body>
        <div class="container">
            ${success === 'true' ?
                `<div class="spinner"></div>
                 <h2 class="success">✅ Successfully Connected!</h2>
                 <p>${service} has been connected to your account.</p>
                 <p>This window will close automatically...</p>` :
                `<h2 class="error">❌ Connection Failed</h2>
                 <p>${error || 'An error occurred during authentication.'}</p>
                 <p>You can close this window and try again.</p>`
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
            }, ${success === 'true' ? 2000 : 5000});
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

🔗 OAuth Endpoints:
   Google: http://localhost:${PORT}/auth/google
   Motion: Use Motion API key in Settings

📡 API Endpoints:
   Gmail: http://localhost:${PORT}/api/gmail/*
   Calendar: http://localhost:${PORT}/api/google/calendar/*
   Motion: http://localhost:${PORT}/api/motion/*
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

module.exports = app;