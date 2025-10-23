/**
 * Security Middleware Configuration
 * 
 * Provides comprehensive security headers and protections:
 * - Content Security Policy (CSP)
 * - XSS Protection
 * - CSRF Protection
 * - Rate Limiting
 * - Input Validation
 */

import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { generateCSPHeader, securityHeaders, CSRFProtection, RateLimiter } from '../src/security/securityUtils';

/**
 * Content Security Policy Middleware
 */
export const contentSecurityPolicyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const cspHeader = generateCSPHeader({
    allowInline: process.env.NODE_ENV === 'development',
    allowEval: false,
    customSources: [
      process.env.NODE_ENV === 'development' ? "ws://localhost:5173" : "",
      "https://apis.google.com",
      "https://accounts.google.com"
    ].filter(Boolean)
  });

  res.setHeader('Content-Security-Policy', cspHeader);
  next();
};

/**
 * Security Headers Middleware
 */
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Additional headers for API security
  if (req.path.startsWith('/api/')) {
    res.setHeader('X-API-Version', '1.0');
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', '99');
  }

  next();
};

/**
 * Rate Limiting Configuration
 */
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate Limit Exceeded',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Rate limiters for different endpoints
export const rateLimiters = {
  // General API rate limiting
  general: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests
    'Too many requests from this IP, please try again later.'
  ),

  // Strict rate limiting for sensitive operations
  auth: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // 5 requests
    'Too many authentication attempts, please try again later.'
  ),

  // Calendar operations rate limiting
  calendar: createRateLimit(
    60 * 1000, // 1 minute
    30, // 30 requests
    'Too many calendar operations, please slow down.'
  ),

  // Email operations rate limiting
  email: createRateLimit(
    60 * 1000, // 1 minute
    10, // 10 requests
    'Too many email operations, please wait before sending more.'
  )
};

/**
 * CSRF Protection Middleware
 */
export const csrfProtectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] as string;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      error: 'CSRF Token Invalid',
      message: 'Invalid or missing CSRF token'
    });
  }

  next();
};

/**
 * Input Sanitization Middleware
 */
export const inputSanitizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Basic XSS protection
        sanitized[key] = value
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

/**
 * Request Logging Middleware
 */
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

/**
 * Error Handling Middleware
 */
export const errorHandlingMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    path: req.path,
    ...(isDevelopment && { stack: err.stack })
  };

  // Log error
  console.error('Application Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Send error response
  res.status(500).json(errorResponse);
};

/**
 * Security Middleware Bundle
 */
export const applySecurityMiddleware = (app: express.Application) => {
  // Apply helmet for basic security headers
  app.use(helmet({
    contentSecurityPolicy: false, // We'll use our own CSP middleware
    crossOriginEmbedderPolicy: false
  }));

  // Custom security headers
  app.use(securityHeadersMiddleware);
  
  // Content Security Policy
  app.use(contentSecurityPolicyMiddleware);
  
  // Request logging
  app.use(requestLoggingMiddleware);
  
  // Input sanitization
  app.use(inputSanitizationMiddleware);
  
  // Apply rate limiting based on route
  app.use('/api/auth/', rateLimiters.auth);
  app.use('/api/calendar/', rateLimiters.calendar);
  app.use('/api/email/', rateLimiters.email);
  app.use('/api/', rateLimiters.general);
  
  // Error handling (must be last)
  app.use(errorHandlingMiddleware);
};

export default {
  applySecurityMiddleware,
  contentSecurityPolicyMiddleware,
  securityHeadersMiddleware,
  csrfProtectionMiddleware,
  inputSanitizationMiddleware,
  requestLoggingMiddleware,
  errorHandlingMiddleware,
  rateLimiters
};
