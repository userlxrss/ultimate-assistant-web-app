# Complete OAuth Authentication Setup Guide

## Overview

This productivitiy hub application includes a complete server-side OAuth authentication system for Google and Motion API integration with the following features:

- **Server-side OAuth implementation** - No manual API key entry required
- **One-click "Connect" buttons** for each service
- **Secure backend storage** of API credentials and tokens
- **Standard OAuth flow** with automatic redirect back to app
- **Token refresh mechanism** for long-lived access
- **CSRF protection** with state parameters
- **Session-based authentication** with secure cookies

## Architecture

```
┌─────────────────┐    OAuth Flow    ┌─────────────────┐
│   Frontend      │ ◄──────────────► │   Backend       │
│  (React App)    │                  │  (Express Server)│
│  Port: 5174     │                  │  Port: 3002     │
└─────────────────┘                  └─────────────────┘
         │                                   │
         │                                   ▼
         │                          ┌─────────────────┐
         │                          │  Google APIs    │
         │                          │  Motion API     │
         └──────────────────────────┴─────────────────┘
```

## Quick Start

### 1. Start the Backend Server

```bash
cd server
npm install
npm start
```

The server will start on `http://localhost:3002`

### 2. Start the Frontend

```bash
npm run dev
```

The frontend will start on `http://localhost:5174`

### 3. Configure OAuth Credentials

Follow the setup instructions below for each service.

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Gmail API
   - Google Calendar API
   - People API (for Contacts)

### 2. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client IDs**
3. Select **Web application** as application type
4. Add the following authorized redirect URIs:
   ```
   http://localhost:3002/auth/google/callback
   ```
5. Copy the **Client ID** and **Client Secret**

### 3. Configure Environment Variables

Update `server/.env` with your Google credentials:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
REDIRECT_URI=http://localhost:3002/auth/google/callback
```

### 4. Test Google OAuth

1. Navigate to the Settings tab in the app
2. Click "Connect Google Account"
3. Complete the OAuth flow in the popup window
4. Verify connection status shows as connected

## Motion API Setup

### 1. Get Motion API Key

1. Log in to your [Motion account](https://app.usemotion.com/)
2. Go to **Settings** → **API**
3. Generate a new API key
4. Copy the API key (starts with `mot_`)

### 2. Configure Environment Variables

Update `server/.env` with your Motion API key:

```env
MOTION_API_KEY=your-motion-api-key
```

### 3. Connect Motion in App

1. Navigate to the Settings tab
2. Find the Motion Integration section
3. Click "Connect Motion Account"
4. Enter your API key when prompted
5. Click "Connect"

## Environment Configuration

### Required Environment Variables

Create a `server/.env` file with the following:

```env
# Server Configuration
PORT=3002
NODE_ENV=development
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
REDIRECT_URI=http://localhost:3002/auth/google/callback

# Motion API Credentials
MOTION_API_KEY=your-motion-api-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5174
```

### Security Notes

- **SESSION_SECRET**: Use a random, long string in production
- **JWT_SECRET**: Use a different random string for JWT signing
- **HTTPS**: Use HTTPS URLs in production environments
- **Environment**: Set `NODE_ENV=production` in production

## API Endpoints

### Authentication

- `GET /api/auth/status` - Get current authentication status
- `POST /api/auth/disconnect/:service` - Disconnect a service
- `GET /auth/google` - Initiate Google OAuth flow
- `GET /auth/google/callback` - Google OAuth callback
- `POST /auth/motion` - Connect Motion API

### Google APIs

- `GET /api/google/gmail/profile` - Get Gmail profile
- `GET /api/google/gmail/messages` - Get Gmail messages
- `GET /api/google/calendar/events` - Get calendar events
- `POST /api/google/calendar/events` - Create calendar event
- `GET /api/google/contacts/connections` - Get contacts

### Motion APIs

- `GET /api/motion/tasks` - Get Motion tasks
- `POST /api/motion/tasks` - Create Motion task
- `GET /api/motion/projects` - Get Motion projects
- `GET /api/motion/workspace` - Get Motion workspace info

## Features Implemented

### ✅ Google OAuth Integration

- **One-click authentication** via popup window
- **Multi-service access**: Gmail, Calendar, Contacts
- **Automatic token refresh** for long-lived access
- **Secure session storage** with HTTP-only cookies
- **CSRF protection** with state parameters
- **User profile retrieval** and display

### ✅ Motion API Integration

- **API key authentication** with secure storage
- **Task and project synchronization**
- **Workspace information retrieval**
- **Connection status monitoring**

### ✅ Security Features

- **Server-side token storage** (no client-side exposure)
- **Session-based authentication** with secure cookies
- **CORS protection** with configured origins
- **Rate limiting** to prevent abuse
- **Helmet.js** security headers
- **Input validation** and sanitization

### ✅ User Experience

- **Popup-based OAuth flow** (no page redirects)
- **Real-time connection status** updates
- **Automatic service discovery** and integration
- **Error handling** with user-friendly messages
- **Loading states** and progress indicators

## Testing the Integration

### 1. Test Server Health

```bash
curl http://localhost:3002/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T15:53:25.995Z",
  "server": "Productivity Hub Backend",
  "version": "1.0.0"
}
```

### 2. Test Auth Status

```bash
curl http://localhost:3002/api/auth/status
```

### 3. Test Google OAuth

1. Start the frontend application
2. Navigate to Settings
3. Click "Connect Google Account"
4. Complete the OAuth flow
5. Verify success message and connection status

### 4. Test Motion API

1. Click "Connect Motion Account" in Settings
2. Enter a valid Motion API key
3. Verify connection success

## Troubleshooting

### Common Issues

**Issue**: "Google OAuth not configured" error
**Solution**: Verify your Google Client ID and Client Secret are correctly set in `.env`

**Issue**: "Invalid redirect URI" error
**Solution**: Ensure the redirect URI in Google Console matches `http://localhost:3002/auth/google/callback`

**Issue**: "CORS errors" in browser
**Solution**: Verify `FRONTEND_URL` in `.env` matches your frontend URL

**Issue**: "Session not saved" error
**Solution**: Check that your browser accepts cookies from localhost

**Issue**: "Motion API connection failed"
**Solution**: Verify your Motion API key is valid and has proper permissions

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

Server logs will show detailed OAuth flow information.

## Production Deployment

### 1. Environment Variables

Update all environment variables for production:

```env
NODE_ENV=production
PORT=3002
SESSION_SECRET=super-secure-random-string-production
JWT_SECRET=different-super-secure-random-string-production

# Use HTTPS URLs
REDIRECT_URI=https://your-domain.com/auth/google/callback
FRONTEND_URL=https://your-frontend-domain.com
```

### 2. HTTPS Configuration

- Use HTTPS for all URLs in production
- Configure SSL certificates for your domain
- Update OAuth redirect URIs to use HTTPS

### 3. Security Best Practices

- Use environment-specific secrets
- Enable rate limiting in production
- Monitor OAuth callback logs
- Implement log rotation for security logs
- Use a reverse proxy (nginx) for additional security

### 4. Database Integration (Optional)

For production use, consider integrating a database for persistent session storage:

```javascript
// Example with connect-mongo
const MongoStore = require('connect-mongo');
app.use(session({
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
  // ... other session config
}));
```

## File Structure

```
server/
├── .env                  # Environment variables
├── .env.example         # Environment template
├── package.json         # Server dependencies
├── server.js            # Main server file
└── routes/
    ├── auth.js          # OAuth authentication routes
    ├── google.js        # Google API routes
    └── motion.js        # Motion API routes

src/
├── components/
│   └── oauth/
│       ├── OAuthIntegration.tsx      # Main OAuth component
│       ├── GoogleOAuthIntegration.tsx # Google OAuth UI
│       └── MotionOAuthIntegration.tsx # Motion OAuth UI
├── utils/
│   └── serverAPI.ts    # API client for backend communication
└── components/
    └── Settings.tsx    # Settings panel with OAuth integration
```

## Support

For issues with the OAuth integration:

1. Check the server logs for detailed error messages
2. Verify all environment variables are correctly set
3. Ensure OAuth apps are properly configured in respective developer consoles
4. Test with incognito mode to rule out cookie issues

## License

This OAuth implementation follows industry best practices for security and user experience. Use in production requires proper security configuration and regular security audits.