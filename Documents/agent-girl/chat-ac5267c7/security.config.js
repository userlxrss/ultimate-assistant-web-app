/**
 * Security Configuration
 * 
 * Environment-specific security settings and configurations
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  // Content Security Policy Configuration
  csp: {
    development: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
        upgradeInsecureRequests: []
      }
    },
    production: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
        upgradeInsecureRequests: []
      }
    }
  },

  // Rate Limiting Configuration
  rateLimiting: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isDevelopment ? 1000 : 100, // More generous in development
      message: 'Too many requests from this IP, please try again later.'
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isDevelopment ? 50 : 5, // Stricter for authentication
      message: 'Too many authentication attempts, please try again later.'
    },
    api: {
      windowMs: 1 * 60 * 1000, // 1 minute
      max: isDevelopment ? 200 : 60,
      message: 'Too many API requests, please slow down.'
    }
  },

  // Session Configuration
  session: {
    name: 'secure-session',
    secret: process.env.SESSION_SECRET || 'development-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  },

  // CORS Configuration
  cors: {
    development: {
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true
    },
    production: {
      origin: process.env.ALLOWED_ORIGINS ? 
        process.env.ALLOWED_ORIGINS.split(',') : 
        ['https://yourdomain.com'],
      credentials: true
    }
  },

  // Security Headers
  headers: {
    contentSecurityPolicy: isDevelopment ? 
      false : // Handled by helmet-csp in production
      true,
    crossOriginEmbedderPolicy: false,
    hsts: isProduction ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    } : false,
    noSniff: true,
    frameguard: {
      action: 'deny'
    },
    xssFilter: true
  },

  // Input Validation Rules
  validation: {
    maxLength: {
      general: 1000,
      textarea: 10000,
      title: 100,
      email: 254,
      url: 2048
    },
    allowedTags: isDevelopment ? 
      ['b', 'i', 'em', 'strong', 'p', 'br', 'span'] :
      [], // No HTML allowed in production
    allowedAttributes: isDevelopment ? 
      ['class', 'style'] :
      []
  },

  // Logging Configuration
  logging: {
    level: isDevelopment ? 'debug' : 'info',
    format: isDevelopment ? 
      'dev' : 
      'combined',
    file: {
      enabled: isProduction,
      filename: 'security.log',
      maxSize: '10m',
      maxFiles: 5
    }
  },

  // OAuth Configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: isDevelopment ? 
        'http://localhost:3000/auth/google/callback' :
        'https://yourdomain.com/auth/google/callback',
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly']
    }
  },

  // API Security
  api: {
    version: '1.0',
    rateLimit: {
      windowMs: 60 * 1000, // 1 minute
      max: isDevelopment ? 200 : 60
    },
    timeout: 30000, // 30 seconds
    maxRequestSize: '10mb',
    enableCompression: true,
    enableBodyParser: true
  },

  // Error Handling
  errorHandling: {
    exposeStackTrace: isDevelopment,
    logErrors: true,
    sendErrorReports: isProduction,
    maxErrorHistory: 100
  }
};
