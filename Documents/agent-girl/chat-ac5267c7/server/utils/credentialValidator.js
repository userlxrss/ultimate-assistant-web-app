/**
 * Credential Validation Module
 * 
 * This module validates that required environment variables are properly configured
 * and provides security warnings for development vs production environments.
 */

const crypto = require('crypto');

/**
 * Validates if a string looks like a placeholder/development credential
 */
function isPlaceholderCredential(value, type) {
  if (!value || typeof value !== 'string') return true;
  
  const placeholderPatterns = [
    'placeholder',
    'your-',
    'change-this',
    'replace-with',
    'example',
    'test-',
    'demo-',
    'fake-',
    'mock-'
  ];
  
  const isPlaceholder = placeholderPatterns.some(pattern => 
    value.toLowerCase().includes(pattern)
  );
  
  if (isPlaceholder) {
    console.warn('🚨 SECURITY WARNING: Detected placeholder ' + type + ': "' + value.substring(0, 20) + '..."');
    return true;
  }
  
  return false;
}

/**
 * Validates credential strength and format
 */
function validateCredentialStrength(value, type, requirements = {}) {
  const result = {
    isValid: true,
    warnings: [],
    errors: []
  };
  
  if (!value) {
    result.isValid = false;
    result.errors.push(type + ' is required but not found');
    return result;
  }
  
  // Check minimum length
  const minLength = requirements.minLength || 16;
  if (value.length < minLength) {
    result.isValid = false;
    result.errors.push(type + ' must be at least ' + minLength + ' characters long');
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    'password',
    'secret',
    '123456',
    'qwerty',
    'admin',
    'test'
  ];
  
  if (weakPatterns.some(pattern => value.toLowerCase().includes(pattern))) {
    result.warnings.push(type + ' contains common weak patterns');
  }
  
  return result;
}

/**
 * Validates all required credentials
 */
function validateCredentials() {
  const results = {
    isValid: true,
    criticalIssues: [],
    warnings: [],
    details: {}
  };
  
  // Required credentials with their validation requirements
  const requiredCredentials = {
    GOOGLE_CLIENT_ID: {
      minLength: 30,
      pattern: /\.apps\.googleusercontent\.com$/,
      description: 'Google OAuth Client ID'
    },
    GOOGLE_CLIENT_SECRET: {
      minLength: 24,
      description: 'Google OAuth Client Secret'
    },
    SESSION_SECRET: {
      minLength: 32,
      description: 'Session secret key'
    },
    JWT_SECRET: {
      minLength: 32,
      description: 'JWT signing secret'
    },
    ENCRYPTION_KEY: {
      minLength: 32,
      description: 'Data encryption key'
    }
  };
  
  // Validate each required credential
  for (const [key, requirements] of Object.entries(requiredCredentials)) {
    const value = process.env[key];
    const validation = validateCredentialStrength(value, key, requirements);
    
    results.details[key] = validation;
    
    if (!validation.isValid) {
      results.isValid = false;
      results.criticalIssues.push(...validation.errors);
    }
    
    // Check for placeholder credentials
    if (isPlaceholderCredential(value, key)) {
      results.isValid = false;
      results.criticalIssues.push('CRITICAL: ' + key + ' appears to be a placeholder credential');
    }
    
    // Check pattern requirements
    if (requirements.pattern && value && !requirements.pattern.test(value)) {
      results.isValid = false;
      results.criticalIssues.push(key + ' does not match required format');
    }
    
    // Add warnings
    results.warnings.push(...validation.warnings);
  }
  
  // Environment-specific security checks
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (nodeEnv === 'production') {
    // In production, we need real credentials
    const productionWarnings = [
      'Ensure all secrets are cryptographically strong',
      'Use environment-specific secrets (not development secrets)',
      'Enable HTTPS and secure cookie settings',
      'Review rate limiting and security headers'
    ];
    
    results.warnings.push(...productionWarnings);
    
    // Check for development patterns in production
    for (const [key] of Object.entries(requiredCredentials)) {
      const value = process.env[key];
      if (value && (value.includes('localhost') || value.includes('development'))) {
        results.isValid = false;
        results.criticalIssues.push('PRODUCTION SECURITY ERROR: ' + key + ' contains development values');
      }
    }
  } else {
    // In development, warn about placeholder credentials but allow them
    console.log('🔧 Running in development mode');
    console.log('📝 Reminder: Configure real credentials before deploying to production');
  }
  
  return results;
}

/**
 * Generates secure random secrets for development
 */
function generateDevelopmentSecrets() {
  return {
    SESSION_SECRET: crypto.randomBytes(16).toString('hex'),
    JWT_SECRET: crypto.randomBytes(32).toString('base64'),
    ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex')
  };
}

/**
 * Displays credential validation results
 */
function displayValidationResults(results) {
  console.log('\n🔒 CREDENTIAL VALIDATION RESULTS');
  console.log('='.repeat(50));
  
  if (results.isValid) {
    console.log('✅ All credentials are properly configured');
  } else {
    console.log('❌ CRITICAL SECURITY ISSUES FOUND:');
    results.criticalIssues.forEach(issue => {
      console.log('   • ' + issue);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Security Warnings:');
    results.warnings.forEach(warning => {
      console.log('   • ' + warning);
    });
  }
  
  // Show credential details (sanitized)
  console.log('\n📋 Credential Details:');
  for (const [key, validation] of Object.entries(results.details)) {
    const value = process.env[key];
    const status = validation.isValid ? '✅' : '❌';
    const displayValue = value ? value.substring(0, 8) + '...' + value.substring(value.length - 4) : 'NOT SET';
    console.log('   ' + status + ' ' + key + ': ' + displayValue);
  }
  
  console.log('='.repeat(50));
  
  if (!results.isValid) {
    console.log('\n🚨 CRITICAL: Please fix the security issues before running the application');
    console.log('📖 See .env.example for configuration instructions');
  }
}

module.exports = {
  validateCredentials,
  displayValidationResults,
  generateDevelopmentSecrets,
  isPlaceholderCredential,
  validateCredentialStrength
};
