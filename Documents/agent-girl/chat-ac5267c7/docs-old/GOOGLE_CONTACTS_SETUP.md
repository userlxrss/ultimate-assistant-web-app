# Google Contacts Real Data Setup Guide

## Overview
This guide will help you set up real Google Contacts integration to fetch your actual Google Contacts instead of dummy/sample data.

## Problem Solved
- ❌ **Before**: Contacts tab showed dummy/sample data
- ✅ **After**: Contacts tab shows your REAL Google Contacts from your account

## Prerequisites
- Node.js and npm installed
- Google account with contacts
- Google Cloud Console access

## Step 1: Google Cloud Setup

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your Project ID

### 1.2 Enable Required APIs
1. In your project, go to "APIs & Services" -> "Library"
2. Search and enable:
   - **Google People API**
   - **OAuth2 API**

### 1.3 Create OAuth2 Credentials
1. Go to "APIs & Services" -> "Credentials"
2. Click "Create Credentials" -> "OAuth 2.0 Client IDs"
3. Select "Web application"
4. Application name: "My Google Contacts App" (or any name)
5. **Authorized redirect URIs**: Add `http://localhost:3013/auth/google/callback`
6. Click "Create"
7. Copy the **Client ID** and **Client Secret**

## Step 2: Environment Configuration

### 2.1 Create Environment File
```bash
cp .env.google.example .env.google
```

### 2.2 Update Environment File
Edit `.env.google` and add your credentials:
```env
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3013/auth/google/callback
```

## Step 3: Start the OAuth2 Server

### 3.1 Install Dependencies (if needed)
```bash
npm install
```

### 3.2 Start the OAuth2 Server
```bash
node google-contacts-oauth-server.cjs
```

You should see output like:
```
🚀 GOOGLE CONTACTS OAUTH2 SERVER IS RUNNING!
📍 Server: http://localhost:3013
🔐 OAuth URL: http://localhost:3013/api/auth/google
```

## Step 4: Authenticate with Google

### 4.1 Start Your Frontend App
```bash
npm run dev
```

### 4.2 Authenticate
1. Open your app and go to the Contacts tab
2. Click "Connect Google Account" or similar button
3. You'll be redirected to Google's OAuth page
4. Sign in with your Google account: `tuescalarina3@gmail.com`
5. Grant permissions for:
   - View your contacts
   - View your basic profile info
   - View your email address

### 4.3 Verification
After successful authentication, you should see:
- ✅ "Google Account Connected" message
- ✅ Your name and email displayed
- ✅ Your REAL Google Contacts (not dummy data!)

## Step 5: Update Frontend to Use Real Contacts

To use the new real contacts implementation, update your Contacts component:

```typescript
// Replace the import
import { realGoogleContacts } from '../utils/realGoogleContacts';

// Example usage in your Contacts component:
const [contacts, setContacts] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

// Initialize and authenticate
useEffect(() => {
  const initContacts = async () => {
    // Check if we're returning from OAuth
    const isAuth = await realGoogleContacts.initialize();

    if (isAuth) {
      fetchContacts();
    }
  };

  initContacts();
}, []);

// Fetch real contacts
const fetchContacts = async () => {
  setLoading(true);
  try {
    const result = await realGoogleContacts.getContacts();
    setContacts(result.connections);
    console.log(`Fetched ${result.connections.length} REAL Google Contacts!`);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

// Start OAuth flow
const handleConnectGoogle = async () => {
  await realGoogleContacts.startOAuthFlow();
};
```

## Step 6: Troubleshooting

### Common Issues

#### 1. "OAuth2 Required" Error
**Problem**: Trying to use app password instead of OAuth2
**Solution**: Google People API requires OAuth2. Use the OAuth flow instead.

#### 2. "Invalid redirect URI" Error
**Problem**: Redirect URI doesn't match what's configured in Google Cloud
**Solution**: Make sure `http://localhost:3013/auth/google/callback` is exactly added to your OAuth credentials.

#### 3. "Insufficient permissions" Error
**Problem**: Didn't grant Contacts permission during OAuth
**Solution**: Sign out and authenticate again, making sure to grant Contacts permission.

#### 4. Server connection issues
**Problem**: OAuth server not running
**Solution**: Make sure the OAuth server is running on port 3013:
```bash
node google-contacts-oauth-server.cjs
```

#### 5. CORS issues
**Problem**: Frontend can't connect to OAuth server
**Solution**: Ensure your frontend URL is in the CORS configuration in the server.

### Debug Tips
- Check browser console for errors
- Check OAuth server console for API logs
- Verify environment variables are loaded correctly
- Test OAuth server health: `http://localhost:3013/health`

## Step 7: Security Notes

- **Never commit** `.env.google` to version control
- **Never share** your Client Secret
- **Use different credentials** for development and production
- **Consider** using environment-specific redirect URIs

## Step 8: Production Deployment

For production:
1. Create production OAuth2 credentials in Google Cloud Console
2. Use your actual domain in redirect URIs (e.g., `https://yourapp.com/auth/google/callback`)
3. Use HTTPS in production
4. Consider storing sessions in Redis or database instead of memory

## What You Get

After setup, you'll have:
- ✅ Real Google Contacts from `tuescalarina3@gmail.com`
- ✅ No more dummy/sample data
- ✅ Contact photos, emails, phone numbers, organizations
- ✅ Search and filtering capabilities
- ✅ Secure OAuth2 authentication
- ✅ Session management

## Success Confirmation

You'll know it's working when:
1. OAuth authentication succeeds
2. You see your actual contacts in the Contacts tab
3. Contact names, emails, and phone numbers match your Google Contacts
4. No more "Sample contact for demonstration" messages

Enjoy your REAL Google Contacts! 🎉