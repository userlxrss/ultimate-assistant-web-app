# OAuth Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Start PostgreSQL Database
```bash
# If using Docker
docker run --name postgres-oauth -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=productivity_hub -p 5432:5432 -d postgres:15

# If using local PostgreSQL
# Create database: createdb productivity_hub
```

### 2. Initialize Database Schema
```bash
cd server
psql postgresql://localhost:5432/productivity_hub < scripts/init-database.sql
```

### 3. Configure Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable APIs: Gmail, Calendar, Contacts
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:3002/auth/google/callback`
6. Copy Client ID and Client Secret to `.env` file

### 4. Update Environment Variables
```bash
cd server
cp .env.example .env
# Edit .env with your actual credentials:
# GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=your-actual-client-secret
# ENCRYPTION_KEY=generate-32-byte-key-here
```

### 5. Install Dependencies & Start Server
```bash
# In server directory
npm install
npm run enhanced  # or node enhanced-server.js
```

### 6. Test OAuth Flow
1. Open your webapp: http://localhost:5174
2. Navigate to OAuth page
3. Click "Connect Google Account"
4. Complete OAuth flow in popup
5. Verify connection status

## 📱 Testing One-Click Connection

### Google OAuth Flow
1. User clicks "Connect Google Account"
2. Popup opens to Google OAuth screen
3. User authorizes permissions
4. Tokens are encrypted and stored
5. Popup closes, UI shows connected status

### Motion API Flow
1. User clicks "Connect Motion API"
2. Input field appears for API key
3. User enters Motion API key (starts with "mot_")
4. API key is validated and stored
5. UI shows connected status

## 🔧 Available Endpoints

### Authentication
- `GET /health` - Server health check
- `GET /api/auth/status` - Get current auth status
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback
- `POST /auth/motion` - Connect Motion API
- `POST /api/auth/disconnect/:service` - Disconnect service

### Frontend Integration
```javascript
// Use the OAuth hook in your components
import { useOAuth } from '../hooks/useOAuth';

const { initiateGoogleOAuth, connectMotionApi, isConnecting } = useOAuth();

// Handle Google connection
await initiateGoogleOAuth();

// Handle Motion connection
await connectMotionApi('mot_your_api_key_here');
```

## 🛡️ Security Features

- ✅ AES-256-GCM encryption for token storage
- ✅ CSRF protection with state parameters
- ✅ Rate limiting (100 req/15min, 5 OAuth attempts/15min)
- ✅ Secure session management with HTTP-only cookies
- ✅ Automatic token refresh 5 minutes before expiry
- ✅ Comprehensive audit logging
- ✅ Input validation and sanitization

## 🔍 Debugging Tips

### Check Server Status
```bash
curl http://localhost:3002/health
```

### Check Auth Status
```bash
curl -c cookies.txt http://localhost:3002/api/auth/status
```

### View Database Connections
```sql
SELECT * FROM active_service_connections;
```

### Common Issues
1. **Popup blocked** - Allow popups for localhost
2. **CORS errors** - Check FRONTEND_URL in .env
3. **Database connection** - Verify PostgreSQL is running
4. **Google OAuth** - Ensure redirect URI matches exactly

## 📊 Production Deployment

1. **Environment Variables**
   - Generate secure random keys for secrets
   - Use HTTPS URLs for all endpoints
   - Set NODE_ENV=production

2. **Database**
   - Use PostgreSQL with connection pooling
   - Set up regular backups
   - Monitor performance and connections

3. **Security**
   - Enable HTTPS with valid SSL certificates
   - Set up monitoring and alerting
   - Regular security audits

## 🆘 Need Help?

- Check server logs for detailed error messages
- Verify all environment variables are set correctly
- Ensure database schema is properly initialized
- Test with incognito window to rule out cookie issues