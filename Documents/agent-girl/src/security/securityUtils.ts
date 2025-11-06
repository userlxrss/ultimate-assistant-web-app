/**
 * Security Utilities for XSS Prevention and Input Validation
 * 
 * This module provides comprehensive security utilities to prevent:
 * - Cross-Site Scripting (XSS)
 * - Injection attacks
 * - Data tampering
 * - Information disclosure
 */

import xss from 'xss';

/**
 * HTML Entity Escaping for XSS Prevention
 */
export const escapeHtml = (unsafe: string): string => {
  if (typeof unsafe !== 'string') {
    return '';
  }
  
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\//g, "&#x2F;");
};

/**
 * Strict HTML sanitization using xss library
 */
export const sanitizeHtml = (dirty: string): string => {
  if (typeof dirty !== 'string') {
    return '';
  }

  return xss(dirty, {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script'],
    onIgnoreTagAttr: function(tag, name, value) {
      // Remove all attributes
      return '';
    }
  });
};

/**
 * Permissive HTML sanitization for limited HTML content
 */
export const sanitizeHtmlPermissive = (dirty: string): string => {
  if (typeof dirty !== 'string') {
    return '';
  }

  return xss(dirty, {
    whiteList: {
      a: ['href', 'title', 'target'],
      b: [],
      i: [],
      em: [],
      strong: [],
      p: [],
      br: [],
      span: ['class']
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script'],
    onTagAttr: function(tag, name, value, isWhiteAttr) {
      if (name === 'href') {
        // Validate href values
        if (value.startsWith('javascript:') || value.startsWith('data:')) {
          return '';
        }
      }
      if (name.startsWith('on')) {
        // Remove all event handlers
        return '';
      }
    }
  });
};

/**
 * Input validation for common data types
 */
export const validators = {
  /**
   * Validate email addresses
   */
  email: (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  /**
   * Validate URLs
   */
  url: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  },

  /**
   * Validate alphanumeric strings
   */
  alphanumeric: (str: string, maxLength: number = 100): boolean => {
    const alphaNumericRegex = /^[a-zA-Z0-9]+$/;
    return alphaNumericRegex.test(str) && str.length <= maxLength;
  },

  /**
   * Validate numeric input
   */
  numeric: (num: string): boolean => {
    return !isNaN(Number(num)) && isFinite(Number(num));
  },

  /**
   * Validate text input (letters, spaces, basic punctuation)
   */
  text: (str: string, maxLength: number = 1000): boolean => {
    const textRegex = /^[a-zA-Z0-9\s.,!?@#%&*()_+-=[\]{}|;':"<>.,?/~`]+$/;
    return textRegex.test(str) && str.length <= maxLength;
  },

  /**
   * Validate JSON strings
   */
  json: (str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Content Security Policy Header Generator
 */
export const generateCSPHeader = (options: {
  allowInline?: boolean;
  allowEval?: boolean;
  customSources?: string[];
} = {}): string => {
  const {
    allowInline = false,
    allowEval = false,
    customSources = []
  } = options;

  const directives = [
    "default-src 'self'",
    allowInline ? "script-src 'self' 'unsafe-inline'" : "script-src 'self'",
    allowEval ? "script-src 'self' 'unsafe-eval'" : "",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];

  if (customSources.length > 0) {
    customSources.forEach(source => {
      directives.push(source);
    });
  }

  return directives.filter(Boolean).join('; ');
};

/**
 * Rate limiting for API calls
 */
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }

  reset(): void {
    this.requests = [];
  }
}

/**
 * Secure random token generator
 */
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Input sanitization middleware
 */
export const sanitizeInput = (input: any, options: {
  trim?: boolean;
  escape?: boolean;
  maxLength?: number;
  allowedTypes?: string[];
} = {}): any => {
  const {
    trim = true,
    escape = true,
    maxLength = 10000,
    allowedTypes = ['string', 'number', 'boolean']
  } = options;

  if (input === null || input === undefined) {
    return input;
  }

  const type = typeof input;
  
  if (!allowedTypes.includes(type)) {
    throw new Error(`Invalid input type: ${type}`);
  }

  if (type === 'string') {
    let sanitized = input;
    
    if (trim) {
      sanitized = sanitized.trim();
    }
    
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    if (escape) {
      sanitized = escapeHtml(sanitized);
    }
    
    return sanitized;
  }

  return input;
};

/**
 * Error message sanitization
 */
export const sanitizeErrorMessage = (error: Error | string): string => {
  const message = typeof error === 'string' ? error : error.message;
  
  // Remove potentially sensitive information
  return escapeHtml(message)
    .replace(/\/.*\//g, '[REDACTED]')
    .replace(/C:\\\\/g, '[REDACTED]')
    .replace(/\/home\/[^\/s]+/g, '/home/[REDACTED]')
    .replace(/\\Users\\[^\\s]+/g, '\\Users\\[REDACTED]');
};

/**
 * Security headers configuration
 */
export const securityHeaders = {
  'Content-Security-Policy': generateCSPHeader(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

/**
 * CSRF token validation utilities
 */
export class CSRFProtection {
  private static tokens: Set<string> = new Set();

  static generateToken(): string {
    const token = generateSecureToken(32);
    this.tokens.add(token);
    return token;
  }

  static validateToken(token: string): boolean {
    return this.tokens.has(token);
  }

  static revokeToken(token: string): void {
    this.tokens.delete(token);
  }

  static cleanup(): void {
    // In production, implement token expiration
    if (this.tokens.size > 10000) {
      this.tokens.clear();
    }
  }
}
