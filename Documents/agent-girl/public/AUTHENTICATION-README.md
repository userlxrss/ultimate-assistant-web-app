# Analytics Dashboard Authentication System

A comprehensive, modern authentication system for the Analytics Dashboard application with manual signup, email verification, and OAuth integration (Google & Microsoft).

## 🚀 Features

### Core Authentication
- ✅ **Manual User Registration** (email, password, username, full name)
- ✅ **Email Verification** with 6-digit codes
- ✅ **Secure Login** with remember me functionality
- ✅ **Password Reset** with secure token-based flow
- ✅ **Session Management** with automatic expiration
- ✅ **Multi-tab Sync** for seamless user experience

### OAuth Integration
- ✅ **Google OAuth** authentication
- ✅ **Microsoft OAuth** authentication
- ✅ **OAuth Account Linking** to existing accounts
- ✅ **Token Refresh** and management
- ✅ **OAuth Account Unlinking**

### Security Features
- 🔒 **Password Strength** validation and visual indicators
- 🔒 **CSRF Protection** with state parameters
- 🔒 **Session Timeout** and automatic cleanup
- 🔒 **Input Validation** and sanitization
- 🔒 **Secure Storage** of user data
- 🔒 **Email Verification** for new accounts

### User Experience
- 🎨 **Modern Glassmorphism UI** design
- 🎨 **Responsive Design** for all devices
- 🎨 **Loading States** and progress indicators
- 🎨 **Error Handling** with user-friendly messages
- 🎨 **Keyboard Navigation** support
- 🎨 **Accessibility** compliant forms

## 📁 File Structure

```
public/
├── auth/
│   ├── authManager.js          # Core authentication logic
│   └── oauthHandler.js         # OAuth provider integration
├── loginpage.html              # Login page (updated)
├── signup.html                 # User registration page
├── verify-email.html           # Email verification page
├── reset-password.html         # Password reset page
├── oauth-google.html           # Google OAuth callback
├── oauth-microsoft.html        # Microsoft OAuth callback
└── AUTHENTICATION-README.md   # This documentation
```

## 🔧 Setup & Configuration

### 1. Basic Setup
The authentication system is ready to use out of the box with localStorage for development. For production deployment:

### 2. OAuth Provider Configuration

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google OAuth2 API
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URI: `https://yourdomain.com/oauth-google.html`
6. Update client ID in `oauthHandler.js`:
   ```javascript
   google: {
       clientId: 'YOUR_GOOGLE_CLIENT_ID',
       redirectUri: 'https://yourdomain.com/oauth-google.html',
       // ...
   }
   ```

#### Microsoft OAuth Setup
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory → App registrations
3. Create new app registration
4. Add Web platform with redirect URI: `https://yourdomain.com/oauth-microsoft.html`
5. Update client ID in `oauthHandler.js`:
   ```javascript
   microsoft: {
       clientId: 'YOUR_MICROSOFT_CLIENT_ID',
       redirectUri: 'https://yourdomain.com/oauth-microsoft.html',
       // ...
   }
   ```

### 3. Backend Integration (Production)

For production deployment, replace localStorage operations with your backend API:

```javascript
// Example backend integration in authManager.js
async function signUp(userData) {
    const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    });
    return await response.json();
}
```

## 🔄 Authentication Flow

### 1. User Registration Flow
```
 signup.html → [Form Submission] → authManager.signUp()
 → [Email Verification] → verify-email.html → [Code Verification]
 → [Account Created] → Dashboard
```

### 2. Login Flow
```
 loginpage.html → [Credentials/OAuth] → authManager.signIn()
 → [Session Created] → Dashboard
```

### 3. OAuth Flow
```
 [Provider Button] → oauthHandler.initiateOAuth()
 → [Provider Auth] → oauth-*.html → [Callback Processing]
 → [User Created/Logged In] → Dashboard
```

### 4. Password Reset Flow
```
 reset-password.html → [Email Request] → [Email with Token]
 → [Token Verification] → [New Password] → Login
```

## 🎯 API Reference

### AuthManager Class

#### Methods
- `signUp(userData)` - Register new user
- `signIn(email, password, rememberMe)` - Authenticate user
- `signOut()` - End user session
- `verifyEmail(code)` - Verify email address
- `requestPasswordReset(email)` - Request password reset
- `resetPassword(token, newPassword)` - Reset password
- `isAuthenticated()` - Check authentication status
- `getCurrentUser()` - Get current user data
- `updateProfile(updates)` - Update user profile

#### Usage Example
```javascript
// Sign up new user
const result = await authManager.signUp({
    fullName: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    password: 'securePassword123',
    confirmPassword: 'securePassword123',
    marketing: false
});

if (result.success) {
    // Redirect to email verification
    window.location.href = 'verify-email.html';
}
```

### OAuthHandler Class

#### Methods
- `initiateOAuth(provider, mode)` - Start OAuth flow
- `handleOAuthCallback(provider, callbackUrl)` - Process OAuth callback
- `linkOAuthAccount(provider, profile, tokenData)` - Link OAuth to existing account
- `unlinkOAuthAccount(provider)` - Unlink OAuth account

#### Usage Example
```javascript
// Initiate Google OAuth
const oauthHandler = new OAuthHandler();
try {
    const result = await oauthHandler.initiateOAuth('google', 'signin');
    // OAuth popup will open and handle the flow
} catch (error) {
    console.error('OAuth failed:', error);
}
```

## 🎨 UI Components

### Glassmorphism Design System
- **Premium Gradient**: Animated background with color shifts
- **Glass Cards**: Backdrop blur with semi-transparent backgrounds
- **Premium Inputs**: Focus states with colored borders and shadows
- **Premium Buttons**: Gradient backgrounds with hover effects
- **Loading States**: Animated spinners for async operations
- **Error/Success Messages**: Contextual notifications with auto-dismiss

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Touch-friendly button sizes and spacing
- Optimized for all screen sizes
- Smooth animations and transitions

## 🔒 Security Considerations

### Implemented Security Measures
1. **State Parameter** for OAuth CSRF protection
2. **Password Strength** validation with visual feedback
3. **Session Management** with automatic expiration
4. **Input Sanitization** and validation
5. **Secure Storage** of sensitive data
6. **Email Verification** to prevent fake accounts
7. **Token-based Password Reset** with expiration

### Production Security Recommendations
1. Implement server-side validation for all inputs
2. Use HTTPS for all authentication endpoints
3. Implement rate limiting for authentication attempts
4. Use secure HTTP-only cookies for session tokens
5. Implement proper password hashing (bcrypt/scrypt)
6. Add CSRF tokens for form submissions
7. Implement audit logging for security events

## 🚀 Deployment

### Development Setup
1. Clone the repository
2. Start the Vite dev server: `npm run dev`
3. Navigate to `http://localhost:5174/loginpage.html`

### Production Deployment
1. Update OAuth client IDs and redirect URIs
2. Replace localStorage with your backend API
3. Configure proper environment variables
4. Set up production email service for verification
5. Deploy to your web server with HTTPS

## 🔧 Customization

### Branding
Update colors and branding in CSS variables:
```css
:root {
    --primary-color: #9333ea;
    --secondary-color: #6366f1;
    --gradient-start: #0f172a;
    --gradient-end: #312e81;
}
```

### Email Templates
Customize email verification and reset templates in `authManager.js`:
```javascript
async sendVerificationEmail(email, code) {
    // Customize email content and styling
    const emailContent = `
        <h2>Verify Your Email</h2>
        <p>Your verification code is: <strong>${code}</strong></p>
    `;
    // Send via your email service
}
```

### OAuth Providers
Add additional OAuth providers by extending the OAuthHandler class:
```javascript
// Add to config in oauthHandler.js
github: {
    clientId: 'YOUR_GITHUB_CLIENT_ID',
    redirectUri: `${window.location.origin}/oauth-github.html`,
    scope: 'user:email',
    authUrl: 'https://github.com/login/oauth/authorize'
}
```

## 🐛 Troubleshooting

### Common Issues

1. **OAuth Popup Blocked**
   - Ensure popups are allowed for your domain
   - Check browser popup blocker settings

2. **Email Verification Not Working**
   - Check browser console for verification codes (development mode)
   - Verify email service configuration in production

3. **Session Not Persisting**
   - Check browser localStorage permissions
   - Verify session expiration settings

4. **OAuth Redirect Fails**
   - Verify redirect URIs in OAuth provider console
   - Check that callback URLs match exactly

### Debug Mode
Enable debug logging in browser console:
```javascript
localStorage.setItem('debugAuth', 'true');
```

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This authentication system is part of the Analytics Dashboard project. See main project license for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Create an issue in the project repository

---

**Built with precision for the Analytics Dashboard 🚀**