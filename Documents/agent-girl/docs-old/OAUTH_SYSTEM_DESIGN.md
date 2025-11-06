# Comprehensive OAuth Authentication System Design

## Architecture Overview

This OAuth system provides secure server-side authentication for Google APIs (Gmail, Calendar, Contacts) and Motion API integration with the following key features:

- **Server-side OAuth flow** - No manual API key entry required for Google services
- **One-click "Connect" button** user experience with popup-based authentication
- **Secure credential storage** - Encrypted database storage with automatic token refresh
- **Automatic token management** - Refresh tokens handled seamlessly in the background
- **Multi-service support** - Single OAuth flow for multiple Google services
- **Enterprise-grade security** - CSRF protection, secure sessions, rate limiting

## System Architecture

```
┌─────────────────┐    OAuth Flow    ┌─────────────────┐    API Calls    ┌─────────────────┐
│   Frontend      │ ◄──────────────► │   Backend       │ ◄──────────────► │  Google APIs    │
│  (React App)    │                  │  (Express Server)│                  │  Motion API     │
│  Port: 5174     │                  │  Port: 3002     │                  │                 │
└─────────────────┘                  └─────────────────┘                  └─────────────────┘
         │                                   │                                   │
         │                                   ▼                                   ▼
         │                          ┌─────────────────┐               ┌─────────────────┐
         │                          │   Database      │               │   Token Store   │
         │                          │  (PostgreSQL)   │               │  (Encrypted)    │
         └──────────────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

## Database Schema Design

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Service Connections Table
```sql
CREATE TABLE service_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL, -- 'google', 'motion'
    encrypted_tokens TEXT NOT NULL, -- Encrypted JSON with tokens/keys
    scopes TEXT[], -- OAuth scopes for Google
    expires_at TIMESTAMP, -- Token expiry time
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, service_type)
);
```

### OAuth States Table (for CSRF protection)
```sql
CREATE TABLE oauth_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints Design

### Authentication Endpoints

#### GET /api/auth/status
Get current authentication status for all services
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": "https://..."
  },
  "services": {
    "google": {
      "connected": true,
      "lastSync": "2025-01-15T10:30:00Z",
      "expiresAt": "2025-02-15T10:30:00Z",
      "scopes": ["gmail.readonly", "calendar.readonly", "contacts.readonly"]
    },
    "motion": {
      "connected": true,
      "lastSync": "2025-01-15T10:30:00Z"
    }
  }
}
```

#### GET /auth/google
Initiate Google OAuth flow
- Generates secure state token
- Stores state in database with expiry
- Redirects to Google OAuth consent screen
- Scopes: Gmail (read/send), Calendar (read/write), Contacts (read)

#### GET /auth/google/callback
Handle Google OAuth callback
- Validates state parameter
- Exchanges authorization code for tokens
- Stores encrypted tokens in database
- Creates/updates user record
- Redirects to success/fallback page

#### POST /auth/motion
Connect Motion API with API key
- Validates API key format
- Tests API key with Motion API
- Stores encrypted API key in database

#### POST /api/auth/disconnect/:service
Disconnect a service
- Removes tokens from database
- Revokes Google tokens if needed
- Updates service connection status

### Service-Specific Endpoints

#### Google APIs
- `GET /api/google/gmail/profile` - Get Gmail profile
- `GET /api/google/gmail/messages` - List messages with pagination
- `POST /api/google/gmail/send` - Send email
- `GET /api/google/calendar/events` - List calendar events
- `POST /api/google/calendar/events` - Create calendar event
- `GET /api/google/contacts` - List contacts

#### Motion APIs
- `GET /api/motion/tasks` - Get Motion tasks
- `POST /api/motion/tasks` - Create Motion task
- `GET /api/motion/projects` - Get Motion projects
- `GET /api/motion/workspace` - Get workspace info

## Security Implementation

### 1. Token Encryption
- Use AES-256-GCM encryption for storing tokens
- Encryption keys stored in environment variables
- Each user's tokens encrypted with unique key derivation

### 2. CSRF Protection
- State parameter validation for OAuth flows
- Secure session management with httpOnly cookies
- SameSite cookie attributes

### 3. Token Refresh Strategy
- Background token refresh 5 minutes before expiry
- Automatic retry with exponential backoff
- Failed refresh notifications to user

### 4. Rate Limiting
- 100 requests per 15 minutes per IP
- Stricter limits for OAuth endpoints
- Dynamic rate limiting based on user tier

## Token Management System

### Automatic Token Refresh
```javascript
class TokenManager {
  async refreshIfNeeded(serviceType, userId) {
    const connection = await this.getConnection(serviceType, userId);

    if (this.isExpiringSoon(connection.expiresAt)) {
      const newTokens = await this.refreshTokens(connection);
      await this.updateTokens(connection.id, newTokens);
      return newTokens;
    }

    return this.decryptTokens(connection.encrypted_tokens);
  }

  isExpiringSoon(expiresAt) {
    return new Date(expiresAt) < new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  }
}
```

### Error Handling
- Network timeout handling with retries
- Token revocation detection
- Graceful degradation for expired tokens
- User-friendly error messages

## Frontend Integration

### OAuth Components
```typescript
interface OAuthIntegrationProps {
  onServiceConnected?: (service: string, user?: User) => void;
  onServiceDisconnected?: (service: string) => void;
  onError?: (service: string, error: string) => void;
}

// Usage in Settings component
<OAuthIntegration
  onServiceConnected={(service, user) => {
    // Update UI, show success message
    showNotification(`${service} connected successfully!`, 'success');
  }}
  onError={(service, error) => {
    // Show error message
    showNotification(`Failed to connect ${service}: ${error}`, 'error');
  }}
/>
```

### One-Click Connection Flow
1. User clicks "Connect Google Account"
2. Popup opens with OAuth URL
3. User authorizes with Google
4. Callback processes tokens
5. Popup closes automatically
6. Frontend receives success message
7. UI updates to show connected status

## Production Deployment

### Environment Variables
```env
# Server Configuration
NODE_ENV=production
PORT=3002
SESSION_SECRET=super-secure-random-string-256-bits
JWT_SECRET=different-super-secure-random-string-256-bits
ENCRYPTION_KEY=32-byte-encryption-key-for-token-storage

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/productivity_hub
REDIS_URL=redis://localhost:6379

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
REDIRECT_URI=https://your-domain.com/auth/google/callback

# Motion API
MOTION_API_BASE_URL=https://api.usemotion.com

# Frontend
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGINS=https://your-frontend-domain.com,https://admin.your-domain.com
```

### SSL/TLS Configuration
- HTTPS required for all OAuth flows
- HSTS headers enabled
- Secure cookie attributes in production

### Monitoring & Logging
- OAuth flow success/failure rates
- Token refresh success rates
- API usage monitoring
- Security event logging

## Implementation Checklist

### Backend Setup
- [ ] PostgreSQL database setup with schema
- [ ] Redis for session storage
- [ ] Token encryption implementation
- [ ] OAuth route handlers
- [ ] Token refresh background jobs
- [ ] API rate limiting
- [ ] Error handling and logging

### Frontend Setup
- [ ] OAuth integration components
- [ ] Service connection UI
- [ ] Loading and error states
- [ ] Success notifications
- [ ] Settings panel integration

### Security Configuration
- [ ] Environment variables setup
- [ ] SSL certificates
- [ ] Security headers (Helmet.js)
- [ ] CORS configuration
- [ ] Session security settings

### Testing
- [ ] OAuth flow end-to-end tests
- [ ] Token refresh tests
- [ ] Error scenario tests
- [ ] Security penetration testing
- [ ] Load testing for API endpoints

## Migration from Current System

### Step 1: Database Migration
1. Add PostgreSQL database
2. Create tables with schema above
3. Migration script for existing session data

### Step 2: Backend Updates
1. Update server to use database storage
2. Implement token encryption
3. Add token refresh mechanism
4. Update API endpoints

### Step 3: Frontend Updates
1. Update OAuth components
2. Add loading states for token refresh
3. Update error handling
4. Add disconnection confirmation

### Step 4: Production Deployment
1. Update environment configuration
2. Set up SSL certificates
3. Configure monitoring
4. Perform security audit

This comprehensive OAuth system provides enterprise-grade security while maintaining a simple, user-friendly experience for connecting external services.