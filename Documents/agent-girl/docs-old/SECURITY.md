# Security Configuration and Guidelines

## 🚨 CRITICAL SECURITY NOTICE

This application has undergone a comprehensive security audit to address hardcoded credential vulnerabilities. All real Google OAuth credentials have been removed and replaced with secure placeholder values.

## Security Fixes Applied

### ✅ Fixed Vulnerabilities
- **Removed hardcoded Google OAuth credentials** from all source files
- **Implemented credential validation** that prevents server startup with placeholder credentials
- **Generated cryptographically secure secrets** for development environment
- **Added security warnings** and proper error handling
- **Created secure .env.example template** with configuration instructions

### 🔐 Credential Management

#### Required Environment Variables
```bash
# Server Configuration
PORT=3006
NODE_ENV=development
SESSION_SECRET=your-cryptographically-secure-session-secret
JWT_SECRET=your-cryptographically-secure-jwt-secret
ENCRYPTION_KEY=your-cryptographically-secure-encryption-key

# Google OAuth Credentials (REQUIRE REAL VALUES)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
REDIRECT_URI=http://localhost:3006/auth/google/callback

# Database
DATABASE_URL=postgresql://localhost:5432/productivity_hub

# Security Settings
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🛡️ Security Features

### 1. Credential Validation System
- **Startup validation**: Server won't start with placeholder credentials
- **Format validation**: Ensures credentials meet minimum security requirements
- **Entropy checking**: Validates secret strength and randomness
- **Environment-specific rules**: Different validation for dev vs production

### 2. Secure Session Management
- **Cryptographically secure session secrets** (256-bit)
- **Secure cookie settings** with httpOnly and secure flags
- **CSRF protection** through state parameters in OAuth flow
- **Session timeout** and secure session storage

### 3. OAuth Security
- **State parameter validation** to prevent CSRF attacks
- **Secure token storage** with encryption at rest
- **Proper scope limitation** requesting only necessary permissions
- **Token validation** and secure refresh mechanisms

### 4. API Security
- **Rate limiting** to prevent abuse
- **CORS configuration** for cross-origin security
- **Input validation** and sanitization
- **Helmet.js security headers**

## 🔧 Setup Instructions

### Initial Security Setup
1. **Run the security setup script:**
   ```bash
   ./scripts/setup-secure-credentials.sh
   ```

2. **Configure Google OAuth credentials:**
   - Visit [Google Cloud Console](https://console.developers.google.com/)
   - Create a new project or select existing one
   - Enable Gmail API, Google Calendar API, and People API
   - Create OAuth 2.0 Client ID credentials
   - Add authorized redirect URI: `http://localhost:3006/auth/google/callback`
   - Replace placeholder values in `server/.env`

3. **Validate configuration:**
   ```bash
   cd server && node -e "
   const { validateCredentials, displayValidationResults } = require('./utils/credentialValidator');
   const results = validateCredentials();
   displayValidationResults(results);
   "
   ```

### Production Deployment

#### Critical Production Security Steps:
1. **Generate new secrets for production:**
   ```bash
   # Generate cryptographically secure secrets
   openssl rand -hex 32  # For session and encryption secrets
   openssl rand -base64 32  # For JWT secrets
   ```

2. **Configure production environment variables:**
   ```bash
   NODE_ENV=production
   SESSION_SECRET=your-production-session-secret
   JWT_SECRET=your-production-jwt-secret
   ENCRYPTION_KEY=your-production-encryption-key
   GOOGLE_CLIENT_ID=your-production-google-client-id
   GOOGLE_CLIENT_SECRET=your-production-google-client-secret
   ```

3. **Enable HTTPS and secure cookies:**
   ```bash
   # Set secure cookie settings in production
   COOKIE_SECURE=true
   COOKIE_HTTP_ONLY=true
   COOKIE_SAME_SITE=strict
   ```

4. **Configure production CORS:**
   ```bash
   CORS_ORIGIN=https://yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```

## 🚨 Security Warnings

### Development vs Production
- **Development**: Placeholder credentials will show warnings but allow startup
- **Production**: Any placeholder or weak credentials will block server startup

### Common Security Mistakes to Avoid
1. ❌ **Never commit real credentials** to version control
2. ❌ **Never use development secrets** in production
3. ❌ **Never share credentials** through insecure channels
4. ❌ **Never use predictable secrets** (passwords, common words, etc.)
5. ❌ **Never disable security features** for convenience

### Security Best Practices
1. ✅ **Use cryptographically secure secrets** (minimum 256-bit)
2. ✅ **Rotate secrets regularly** (every 90 days recommended)
3. ✅ **Use environment-specific credentials** (dev vs prod)
4. ✅ **Store production secrets securely** (AWS Secrets Manager, etc.)
5. ✅ **Enable HTTPS** in all production environments
6. ✅ **Monitor for security incidents** and unusual activity
7. ✅ **Keep dependencies updated** to patch security vulnerabilities

## 🔍 Security Monitoring

### Credential Validation Output
The application provides detailed security feedback on startup:
- ✅ **Green**: All credentials properly configured
- ⚠️ **Yellow**: Security warnings (non-critical)
- ❌ **Red**: Critical security issues (server blocked)

### Security Headers
The application implements these security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (in production)
- `Content-Security-Policy` (configured per application needs)

## 📞 Security Issues

### Reporting Security Vulnerabilities
If you discover a security vulnerability, please:
1. **Do not create a public issue**
2. **Email security details** to the security team
3. **Include reproduction steps** and potential impact
4. **Allow reasonable time** for fixes before disclosure

### Security Contacts
- **Security Team**: [security@yourcompany.com]
- **Emergency Security**: [emergency@yourcompany.com]

## 🔒 Security Checklist

### Pre-Deployment Security Checklist
- [ ] All placeholder credentials replaced with real values
- [ ] Production secrets are cryptographically secure
- [ ] HTTPS is enabled and configured
- [ ] CORS settings are properly configured
- [ ] Rate limiting is enabled
- [ ] Security headers are implemented
- [ ] Session security is configured
- [ ] Database connections use secure authentication
- [ ] Logging and monitoring are enabled
- [ ] Backup and recovery procedures are tested

### Ongoing Security Maintenance
- [ ] Secrets rotation schedule established
- [ ] Dependency vulnerability scanning enabled
- [ ] Security monitoring and alerting configured
- [ ] Regular security audits scheduled
- [ ] Team security training conducted

---

**Last Updated**: $(date +%Y-%m-%d)  
**Security Version**: 1.0.0  
**Next Review**: $(date -v+3m +%Y-%m-%d)
