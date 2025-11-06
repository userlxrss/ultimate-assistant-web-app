# 🚀 OAuth Setup Instructions

Your Productivity Hub now has server-side OAuth authentication! This means you can connect your accounts with just one click - no manual API key entry required.

## 📋 What's Ready:

✅ **Backend Server**: Running on `http://localhost:3001`
✅ **Frontend App**: Running on `http://localhost:5174`
✅ **OAuth Components**: One-click Google & Motion integration
✅ **Secure Token Storage**: Server-side session management

## 🔧 Google OAuth Setup (Required for Gmail, Calendar, Contacts):

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "NEW PROJECT"
3. Enter project name: "Productivity Hub"
4. Click "CREATE"

### Step 2: Enable Required APIs
1. In your project, go to "APIs & Services" → "Library"
2. Search and enable these APIs:
   - **Gmail API**
   - **Google Calendar API**
   - **People API** (for Contacts)

### Step 3: Configure OAuth 2.0
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose **External** → Click "CREATE"
3. Fill in:
   - **App name**: Productivity Hub
   - **User support email**: your-email@gmail.com
   - **Developer contact**: your-email@gmail.com
4. Click "SAVE AND CONTINUE" through all steps
5. Add test users (your email) if needed

### Step 4: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "OAuth 2.0 Client IDs"
3. Select **Web application**
4. Name: "Productivity Hub Web Client"
5. **Authorized redirect URIs**: Click "+ ADD URI" → Add:
   ```
   http://localhost:3001/auth/google/callback
   ```
6. Click "CREATE"
7. **Copy your Client ID and Client Secret**

### Step 5: Configure Server
1. Stop the backend server (Ctrl+C in terminal)
2. Create `.env` file in `server/` directory:
   ```bash
   cd server
   cp .env.example .env
   ```
3. Edit `.env` and add your credentials:
   ```env
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   ```
4. Restart the server:
   ```bash
   npm start
   ```

## 🔗 Motion API Setup (Optional):

1. Go to [Motion.app](https://app.usemotion.com/)
2. Click your profile → Settings → API
3. Copy your API key (starts with `mot_`)
4. In the app Settings, enter the Motion API key

## 🎯 How to Use:

1. **Open your app**: Go to `http://localhost:5174`
2. **Navigate to Settings**: Click ⚙️ in the sidebar
3. **Connect Services**:
   - Click "Connect Google Account" → Authorize with Google
   - Enter Motion API key if needed
4. **Use Connected Services**:
   - **Email**: Access Gmail, send emails
   - **Calendar**: Sync Google Calendar events
   - **Tasks**: Use Motion task management

## 🔒 Security Features:

- ✅ **OAuth 2.0**: Industry-standard authentication
- ✅ **Server-side Storage**: No credentials in frontend
- ✅ **Session Management**: Secure token handling
- ✅ **Auto Refresh**: Tokens refreshed automatically
- ✅ **Limited Scopes**: Only access needed permissions

## 🚨 Troubleshooting:

### Google OAuth Issues:
- **Error 400**: Make sure redirect URI matches exactly `http://localhost:3001/auth/google/callback`
- **Error 403**: Check that APIs are enabled in Google Cloud Console
- **Unauthorized**: Add your email as a test user in OAuth consent screen

### Server Issues:
- **Port 3001 in use**: Run `lsof -ti:3001 | xargs kill`
- **Missing dependencies**: Run `npm install` in server directory

### Connection Issues:
- Check both servers are running (frontend on 5174, backend on 3001)
- Verify `.env` file has correct credentials
- Check browser console for error messages

## 📞 Need Help?

1. Check the server logs for detailed error messages
2. Verify your Google Cloud Console configuration
3. Ensure both servers are running properly
4. Test with a different browser or incognito mode

Your OAuth integration is now ready! 🎉