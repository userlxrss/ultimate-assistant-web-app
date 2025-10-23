# Enhanced OAuth Implementation Guide

## Quick Start

This guide will help you implement the comprehensive OAuth authentication system for your Productivity Hub web application.

## Prerequisites

- Node.js 16+ and npm 8+
- PostgreSQL 14+
- Google Cloud Console account
- Motion.app account (optional)

## Step 1: Database Setup

### 1.1 Install PostgreSQL
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database
createdb productivity_hub
```

### 1.2 Run Database Migration
```bash
# Copy environment file
cp server/.env.enhanced.example server/.env

# Edit .env with your database credentials
nano server/.env

# Run migration
cd server
npm install
node scripts/migrate.js
```

## Step 2: Environment Configuration

### 2.1 Required Environment Variables
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/productivity_hub

# Security (Generate secure random strings)
SESSION_SECRET=your-256-bit-secret-key-here
JWT_SECRET=your-256-bit-jwt-secret-here
ENCRYPTION_KEY=your-32-byte-encryption-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
REDIRECT_URI=http://localhost:3002/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:5174
```

### 2.2 Generate Secure Keys
```bash
# Generate session secret
openssl rand -hex 32

# Generate JWT secret
openssl rand -hex 32

# Generate encryption key (32 bytes)
openssl rand -hex 32
```

## Step 3: Google OAuth Setup

### 3.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Productivity Hub"
3. Enable APIs:
   - Gmail API
   - Google Calendar API
   - People API

### 3.2 Configure OAuth 2.0
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client IDs**
3. Select **Web application**
4. Add authorized redirect URI: `http://localhost:3002/auth/google/callback`
5. Copy Client ID and Client Secret to your `.env` file

### 3.3 Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External**
3. Fill in:
   - App name: Productivity Hub
   - User support email: your-email@gmail.com
   - Developer contact: your-email@gmail.com
4. Add scopes:
   - `.../auth/gmail.readonly`
   - `.../auth/gmail.send`
   - `.../auth/calendar.readonly`
   - `.../auth/calendar.events`
   - `.../auth/contacts.readonly`

## Step 4: Backend Setup

### 4.1 Install Dependencies
```bash
cd server
npm install
```

### 4.2 Update Package References
Replace your current `package.json` with the enhanced version or merge the dependencies:

```bash
# Copy enhanced package.json
cp ../enhanced-package.json package.json

# Install new dependencies
npm install
```

### 4.3 Start Enhanced Server
```bash
# Development
npm run dev

# Production
npm start
```

### 4.4 Verify Server Health
```bash
curl http://localhost:3002/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "server": "Productivity Hub Backend Enhanced",
  "version": "2.0.0",
  "database": "connected"
}
```

## Step 5: Frontend Integration

### 5.1 Update Server API Client
Replace your existing `serverAPI.ts` with the enhanced version or update it to support the new endpoints:

```typescript
// src/utils/serverAPI.ts
const SERVER_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-production-server.com'
  : 'http://localhost:3002';

// Add the enhanced auth status endpoint
async getAuthStatus(): Promise<ServerResponse<AuthStatus>> {
  return this.request('/api/auth/status');
}
```

### 5.2 Integrate Enhanced OAuth Component
```typescript
// src/components/Settings.tsx
import { EnhancedOAuthIntegration } from './oauth/EnhancedOAuthIntegration';

export const Settings: React.FC = () => {
  const handleServiceConnected = (service: string, user?: User) => {
    console.log(`${service} connected for user:`, user?.email);
    // Update UI state, refresh data, etc.
  };

  const handleServiceDisconnected = (service: string) => {
    console.log(`${service} disconnected`);
    // Update UI state, clear cached data, etc.
  };

  const handleError = (service: string, error: string) => {
    console.error(`${service} error:`, error);
    // Show error notification
  };

  return (
    <div>
      {/* Other settings content */}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Connected Services</h2>
        <EnhancedOAuthIntegration
          onServiceConnected={handleServiceConnected}
          onServiceDisconnected={handleServiceDisconnected}
          onError={handleError}
        />
      </div>
    </div>
  );
};
```

## Step 6: Testing the Integration

### 6.1 Test OAuth Flow
1. Start both servers:
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev

   # Terminal 2 - Frontend
   npm run dev
   ```

2. Open browser to `http://localhost:5174`
3. Navigate to Settings
4. Click "Connect Google Account"
5. Complete OAuth flow in popup
6. Verify success message and connection status

### 6.2 Test API Endpoints
```bash
# Check auth status
curl http://localhost:3002/api/auth/status -c cookies.txt

# Test Google connection
curl http://localhost:3002/auth/test/google -c cookies.txt

# Test Motion connection
curl http://localhost:3002/auth/test/motion -c cookies.txt
```

### 6.3 Verify Database Storage
```sql
-- Check users table
SELECT * FROM users;

-- Check service connections
SELECT * FROM service_connections;

-- Verify encrypted tokens
SELECT user_id, service_type, is_active, created_at FROM service_connections;
```

## Step 7: Production Deployment

### 7.1 Environment Setup
```env
NODE_ENV=production
PORT=3002

# Use HTTPS URLs
REDIRECT_URI=https://your-domain.com/auth/google/callback
FRONTEND_URL=https://your-frontend-domain.com

# Production database
DATABASE_URL=postgresql://user:password@your-db-host:5432/productivity_hub

# SSL certificates
SSL_CERT_PATH=/path/to/fullchain.pem
SSL_KEY_PATH=/path/to/privkey.pem
```

### 7.2 Database Security
```sql
-- Create dedicated database user
CREATE USER productivity_hub WITH PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE productivity_hub TO productivity_hub;

-- Enable row-level security
ALTER TABLE service_connections ENABLE ROW LEVEL SECURITY;
```

### 7.3 Reverse Proxy Configuration (nginx)
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Step 8: Monitoring and Maintenance

### 8.1 Health Monitoring
```bash
# Add health check endpoint
curl https://your-domain.com/health

# Monitor with cron job
*/5 * * * * curl -f https://your-domain.com/health || alert-admin
```

### 8.2 Database Maintenance
```sql
-- Clean up expired OAuth states (run daily)
DELETE FROM oauth_states WHERE expires_at < CURRENT_TIMESTAMP;

-- Clean up old API usage records (run weekly)
DELETE FROM api_usage WHERE date_tracked < CURRENT_DATE - INTERVAL '30 days';

-- Update statistics
ANALYZE;
```

### 8.3 Token Refresh Monitoring
```javascript
// Add to your monitoring system
setInterval(async () => {
  const expiringSoon = await db.query(`
    SELECT COUNT(*) FROM service_connections
    WHERE expires_at < NOW() + INTERVAL '1 hour'
    AND is_active = true
  `);

  if (expiringSoon.rows[0].count > 0) {
    console.warn(`Warning: ${expiringSoon.rows[0].count} tokens expiring soon`);
  }
}, 60000); // Check every minute
```

## Troubleshooting

### Common Issues

**Google OAuth Redirect Error**
```
Error: redirect_uri_mismatch
```
Solution: Ensure redirect URI in Google Console matches exactly `http://localhost:3002/auth/google/callback`

**Database Connection Failed**
```
Error: connect ECONNREFUSED
```
Solution: Check PostgreSQL is running and DATABASE_URL is correct

**CORS Errors**
```
Error: Access-Control-Allow-Origin
```
Solution: Verify FRONTEND_URL in .env matches your frontend URL

**Token Encryption Errors**
```
Error: Unsupported state or unable to authenticate data
```
Solution: Ensure ENCRYPTION_KEY is consistent across server restarts

### Debug Mode
```env
DEBUG_OAUTH=true
LOG_LEVEL=debug
NODE_ENV=development
```

### Test Database Connection
```bash
# Test connection manually
psql $DATABASE_URL -c "SELECT 1;"

# Check tables
psql $DATABASE_URL -c "\dt"
```

## Security Checklist

- [ ] Strong, random session and JWT secrets
- [ ] HTTPS enabled in production
- [ ] Database credentials secured
- [ ] OAuth redirect URIs configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Regular database backups
- [ ] Monitoring for suspicious activity
- [ ] Regular security audits

## Performance Optimization

- Enable connection pooling for PostgreSQL
- Use Redis for session storage in production
- Implement caching for frequently accessed data
- Monitor database query performance
- Set up database indexes properly

This enhanced OAuth system provides enterprise-grade security with a seamless user experience for connecting external services to your Productivity Hub.