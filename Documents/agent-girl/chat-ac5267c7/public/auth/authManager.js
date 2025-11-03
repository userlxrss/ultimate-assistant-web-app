/**
 * Authentication Manager
 * Handles all authentication operations including signup, login, OAuth, and session management
 * NOW WITH REAL EMAIL VERIFICATION VIA EMAILJS
 */

class AuthManager {
    constructor() {
        this.apiBase = '/api/auth'; // In production, this would be your backend API
        this.currentUser = null;
        this.sessionTimeout = null;

        // EmailJS Configuration - UPDATE THESE WITH YOUR ACTUAL VALUES
        this.emailjs = {
            serviceId: 'service_your_emailjs_service_id', // Replace with your EmailJS service ID
            templateIdVerification: 'template_your_verification_template_id', // Replace with verification template ID
            templateIdPasswordReset: 'template_your_password_reset_template_id', // Replace with password reset template ID
            publicKey: 'your_emailjs_public_key' // Replace with your EmailJS public key
        };

        this.init();
    }

    /**
     * Initialize authentication manager
     */
    init() {
        this.checkExistingSession();
        this.setupSessionTimeout();
        this.setupStorageListeners();
        this.loadEmailJS();
    }

    /**
     * Load EmailJS SDK
     */
    loadEmailJS() {
        // Check if EmailJS is already loaded
        if (window.emailjs) {
            console.log('EmailJS already loaded');
            return;
        }

        // Load EmailJS SDK
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
        script.async = true;
        script.onload = () => {
            // Initialize EmailJS with your public key
            window.emailjs.init(this.emailjs.publicKey);
            console.log('EmailJS initialized successfully');
        };
        script.onerror = () => {
            console.error('Failed to load EmailJS SDK');
        };
        document.head.appendChild(script);
    }

    /**
     * Check for existing user session
     */
    checkExistingSession() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const currentUser = localStorage.getItem('currentUser');

        if (isLoggedIn && currentUser) {
            try {
                this.currentUser = JSON.parse(currentUser);
                this.validateSession();
            } catch (error) {
                console.error('Invalid session data:', error);
                this.clearSession();
            }
        }
    }

    /**
     * Validate current session
     */
    validateSession() {
        if (!this.currentUser) return false;

        const loginTimestamp = localStorage.getItem('loginTimestamp');
        const sessionAge = loginTimestamp ? Date.now() - new Date(loginTimestamp).getTime() : 0;
        const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

        if (sessionAge > maxSessionAge) {
            this.signOut();
            return false;
        }

        return true;
    }

    /**
     * Setup session timeout
     */
    setupSessionTimeout() {
        const checkSession = () => {
            if (!this.validateSession()) {
                console.log('Session expired');
            }
        };

        // Check session every 5 minutes
        this.sessionTimeout = setInterval(checkSession, 5 * 60 * 1000);
    }

    /**
     * Setup storage event listeners for multi-tab sync
     */
    setupStorageListeners() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'isLoggedIn' && e.newValue === 'false') {
                // User signed out in another tab
                window.location.reload();
            }
        });
    }

    /**
     * User registration
     */
    async signUp(userData) {
        try {
            // Validate input data
            const validation = this.validateSignUpData(userData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }

            // Check if user already exists
            if (await this.userExists(userData.email)) {
                throw new Error('An account with this email already exists');
            }

            if (await this.usernameExists(userData.username)) {
                throw new Error('This username is already taken');
            }

            // Hash password (in production, this would be done server-side)
            const hashedPassword = await this.hashPassword(userData.password);

            // Create user object
            const user = {
                id: this.generateUserId(),
                fullName: userData.fullName,
                username: userData.username,
                email: userData.email,
                password: hashedPassword,
                avatar: this.generateAvatar(userData.fullName),
                createdAt: new Date().toISOString(),
                isEmailVerified: false,
                preferences: {
                    theme: 'dark',
                    notifications: userData.marketing || false,
                    language: 'en'
                }
            };

            // Store user data (in production, this would be sent to backend)
            localStorage.setItem('pendingUser', JSON.stringify(user));
            localStorage.setItem('signupEmail', user.email);

            // Generate verification code
            const verificationCode = this.generateVerificationCode();
            localStorage.setItem('verificationCode', verificationCode);
            localStorage.setItem('verificationCodeExpiry', (Date.now() + 10 * 60 * 1000).toString());

            // Send verification email (REAL EMAIL VIA EMAILJS)
            const emailResult = await this.sendVerificationEmail(user.email, verificationCode, user.fullName);
            if (!emailResult.success) {
                throw new Error(`Failed to send verification email: ${emailResult.error}`);
            }

            return {
                success: true,
                message: 'Account created successfully. Please check your email to verify.',
                userId: user.id,
                emailSent: true
            };

        } catch (error) {
            console.error('Signup error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * User login
     */
    async signIn(email, password, rememberMe = false) {
        try {
            // Validate input
            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            // Get user from storage (in production, this would be from database)
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email);

            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Verify password
            const isPasswordValid = await this.verifyPassword(password, user.password);
            if (!isPasswordValid) {
                throw new Error('Invalid email or password');
            }

            // Check email verification
            if (!user.isEmailVerified) {
                throw new Error('Please verify your email before signing in');
            }

            // Create session
            await this.createSession(user, 'email', rememberMe);

            return {
                success: true,
                message: 'Sign in successful',
                user: this.sanitizeUser(user)
            };

        } catch (error) {
            console.error('Sign in error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * OAuth authentication
     */
    async oauthSignIn(provider, token, rememberMe = false) {
        try {
            // Verify OAuth token (in production, this would be done server-side)
            const oauthData = await this.verifyOAuthToken(provider, token);

            if (!oauthData.isValid) {
                throw new Error(`Invalid ${provider} authentication`);
            }

            // Check if user exists
            let user = await this.findUserByOAuth(provider, oauthData.id);

            if (!user) {
                // Create new user from OAuth data
                user = await this.createUserFromOAuth(provider, oauthData);
            }

            // Create session
            await this.createSession(user, provider, rememberMe);

            return {
                success: true,
                message: `${provider} authentication successful`,
                user: this.sanitizeUser(user)
            };

        } catch (error) {
            console.error('OAuth sign in error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Email verification
     */
    async verifyEmail(code) {
        try {
            const storedCode = localStorage.getItem('verificationCode');
            const codeExpiry = localStorage.getItem('verificationCodeExpiry');
            const pendingUser = JSON.parse(localStorage.getItem('pendingUser') || '{}');

            if (!storedCode || !pendingUser.id) {
                throw new Error('No pending verification found');
            }

            if (Date.now() > parseInt(codeExpiry)) {
                throw new Error('Verification code has expired');
            }

            if (code !== storedCode) {
                throw new Error('Invalid verification code');
            }

            // Mark user as verified
            pendingUser.isEmailVerified = true;
            pendingUser.emailVerifiedAt = new Date().toISOString();

            // Save to users database (in production, this would be server-side)
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            users.push(pendingUser);
            localStorage.setItem('users', JSON.stringify(users));

            // Create session
            await this.createSession(pendingUser, 'email');

            // Clean up
            localStorage.removeItem('pendingUser');
            localStorage.removeItem('verificationCode');
            localStorage.removeItem('verificationCodeExpiry');

            return {
                success: true,
                message: 'Email verified successfully',
                user: this.sanitizeUser(pendingUser)
            };

        } catch (error) {
            console.error('Email verification error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Resend verification email
     */
    async resendVerificationEmail() {
        try {
            const pendingUser = JSON.parse(localStorage.getItem('pendingUser') || '{}');
            const lastSent = localStorage.getItem('lastVerificationSent');
            const cooldown = 60 * 1000; // 1 minute cooldown

            if (lastSent && Date.now() - parseInt(lastSent) < cooldown) {
                throw new Error('Please wait before requesting another verification email');
            }

            if (!pendingUser.email) {
                throw new Error('No pending registration found');
            }

            const verificationCode = this.generateVerificationCode();
            localStorage.setItem('verificationCode', verificationCode);
            localStorage.setItem('verificationCodeExpiry', (Date.now() + 10 * 60 * 1000).toString());
            localStorage.setItem('lastVerificationSent', Date.now().toString());

            const emailResult = await this.sendVerificationEmail(pendingUser.email, verificationCode, pendingUser.fullName);
            if (!emailResult.success) {
                throw new Error(`Failed to resend verification email: ${emailResult.error}`);
            }

            return {
                success: true,
                message: 'Verification email sent successfully'
            };

        } catch (error) {
            console.error('Resend verification error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Sign out user
     */
    async signOut() {
        try {
            // Clear session data
            this.clearSession();

            // Notify other tabs
            localStorage.setItem('isLoggedIn', 'false');

            return {
                success: true,
                message: 'Signed out successfully'
            };

        } catch (error) {
            console.error('Sign out error:', error);
            return {
                success: false,
                error: 'Failed to sign out'
            };
        }
    }

    /**
     * Create user session
     */
    async createSession(user, method = 'email', rememberMe = false) {
        const sessionData = {
            userId: user.id,
            loginMethod: method,
            loginTimestamp: new Date().toISOString(),
            rememberMe: rememberMe,
            sessionId: this.generateSessionId()
        };

        // Store session data
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('sessionData', JSON.stringify(sessionData));
        localStorage.setItem('loginTimestamp', sessionData.loginTimestamp);
        localStorage.setItem('loginMethod', method);

        this.currentUser = user;

        // Set session expiration
        if (rememberMe) {
            localStorage.setItem('sessionExpiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString()); // 30 days
        } else {
            localStorage.setItem('sessionExpiry', (Date.now() + 24 * 60 * 60 * 1000).toString()); // 24 hours
        }
    }

    /**
     * Clear user session
     */
    clearSession() {
        const keysToRemove = [
            'isLoggedIn',
            'currentUser',
            'sessionData',
            'loginTimestamp',
            'loginMethod',
            'sessionExpiry',
            'oauthProvider',
            'oauthStatus'
        ];

        keysToRemove.forEach(key => localStorage.removeItem(key));
        this.currentUser = null;

        if (this.sessionTimeout) {
            clearInterval(this.sessionTimeout);
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.sanitizeUser(this.currentUser);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null && this.validateSession();
    }

    /**
     * Update user profile
     */
    async updateProfile(updates) {
        try {
            if (!this.currentUser) {
                throw new Error('No authenticated user');
            }

            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);

            if (userIndex === -1) {
                throw new Error('User not found');
            }

            // Update user data
            users[userIndex] = { ...users[userIndex], ...updates, updatedAt: new Date().toISOString() };
            localStorage.setItem('users', JSON.stringify(users));

            // Update current user
            this.currentUser = users[userIndex];
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            return {
                success: true,
                message: 'Profile updated successfully',
                user: this.sanitizeUser(this.currentUser)
            };

        } catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Password reset request
     */
    async requestPasswordReset(email) {
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email);

            if (!user) {
                // Don't reveal if email exists or not
                return {
                    success: true,
                    message: 'If an account exists with this email, a password reset link has been sent'
                };
            }

            const resetToken = this.generateResetToken();
            const resetExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

            localStorage.setItem('passwordResetToken', resetToken);
            localStorage.setItem('passwordResetExpiry', resetExpiry.toString());
            localStorage.setItem('passwordResetEmail', email);

            // Send reset email (REAL EMAIL VIA EMAILJS)
            const emailResult = await this.sendPasswordResetEmail(email, resetToken, user.fullName);
            if (!emailResult.success) {
                throw new Error(`Failed to send password reset email: ${emailResult.error}`);
            }

            return {
                success: true,
                message: 'Password reset link sent to your email'
            };

        } catch (error) {
            console.error('Password reset request error:', error);
            return {
                success: false,
                error: 'Failed to process password reset request'
            };
        }
    }

    /**
     * Reset password
     */
    async resetPassword(token, newPassword) {
        try {
            const storedToken = localStorage.getItem('passwordResetToken');
            const tokenExpiry = localStorage.getItem('passwordResetExpiry');
            const email = localStorage.getItem('passwordResetEmail');

            if (!storedToken || token !== storedToken || Date.now() > parseInt(tokenExpiry)) {
                throw new Error('Invalid or expired reset token');
            }

            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.email === email);

            if (userIndex === -1) {
                throw new Error('User not found');
            }

            // Update password
            const hashedPassword = await this.hashPassword(newPassword);
            users[userIndex].password = hashedPassword;
            users[userIndex].passwordResetAt = new Date().toISOString();

            localStorage.setItem('users', JSON.stringify(users));

            // Clean up
            localStorage.removeItem('passwordResetToken');
            localStorage.removeItem('passwordResetExpiry');
            localStorage.removeItem('passwordResetEmail');

            return {
                success: true,
                message: 'Password reset successfully'
            };

        } catch (error) {
            console.error('Password reset error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Helper methods

    validateSignUpData(data) {
        const errors = [];

        if (!data.fullName || data.fullName.length < 2) {
            errors.push('Full name must be at least 2 characters long');
        }

        if (!data.username || data.username.length < 3) {
            errors.push('Username must be at least 3 characters long');
        }

        if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
            errors.push('Username can only contain letters, numbers, and underscores');
        }

        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push('Please enter a valid email address');
        }

        if (!data.password || data.password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        if (data.password !== data.confirmPassword) {
            errors.push('Passwords do not match');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    async userExists(email) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.some(u => u.email === email);
    }

    async usernameExists(username) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.some(u => u.username === username);
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    generateResetToken() {
        return 'reset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
    }

    generateAvatar(fullName) {
        const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        return {
            initials,
            color: this.generateAvatarColor()
        };
    }

    generateAvatarColor() {
        const colors = ['#9333ea', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    sanitizeUser(user) {
        const { password, ...sanitized } = user;
        return sanitized;
    }

    async hashPassword(password) {
        // In production, use bcrypt or similar
        // This is a simple simulation
        return btoa(password + '_salt');
    }

    async verifyPassword(password, hashedPassword) {
        // In production, use bcrypt or similar
        return btoa(password + '_salt') === hashedPassword;
    }

    /**
     * REAL EMAIL VERIFICATION FUNCTION - SENDS ACTUAL EMAILS VIA EMAILJS
     */
    async sendVerificationEmail(email, code, fullName = '') {
        try {
            // Check if EmailJS is loaded
            if (!window.emailjs) {
                console.error('EmailJS not loaded. Please check your configuration.');
                return {
                    success: false,
                    error: 'Email service not available. Please try again later.'
                };
            }

            // Prepare email template parameters
            const templateParams = {
                to_email: email,
                to_name: fullName || 'User',
                verification_code: code,
                verification_link: `${window.location.origin}/verify-email.html`,
                company_name: 'Productivity Hub',
                support_email: 'support@productivityhub.com',
                current_year: new Date().getFullYear()
            };

            // Send email via EmailJS
            const response = await window.emailjs.send(
                this.emailjs.serviceId,
                this.emailjs.templateIdVerification,
                templateParams
            );

            console.log('Verification email sent successfully:', response);
            return {
                success: true,
                message: 'Verification email sent successfully',
                response: response
            };

        } catch (error) {
            console.error('EmailJS sendVerificationEmail error:', error);

            // Provide user-friendly error messages
            let errorMessage = 'Failed to send verification email';

            if (error.text === 'The user ID is not registered.') {
                errorMessage = 'Email service configuration error. Please contact support.';
            } else if (error.text === 'The template ID is not registered.') {
                errorMessage = 'Email template configuration error. Please contact support.';
            } else if (error.text === 'The service ID is not registered.') {
                errorMessage = 'Email service configuration error. Please contact support.';
            } else if (error.status === 429) {
                errorMessage = 'Too many email requests. Please wait and try again.';
            } else if (error.status >= 500) {
                errorMessage = 'Email service temporarily unavailable. Please try again later.';
            } else {
                errorMessage = error.text || error.message || 'Unknown email service error';
            }

            return {
                success: false,
                error: errorMessage,
                details: error
            };
        }
    }

    /**
     * REAL PASSWORD RESET EMAIL FUNCTION - SENDS ACTUAL EMAILS VIA EMAILJS
     */
    async sendPasswordResetEmail(email, token, fullName = '') {
        try {
            // Check if EmailJS is loaded
            if (!window.emailjs) {
                console.error('EmailJS not loaded. Please check your configuration.');
                return {
                    success: false,
                    error: 'Email service not available. Please try again later.'
                };
            }

            // Prepare email template parameters
            const templateParams = {
                to_email: email,
                to_name: fullName || 'User',
                reset_token: token,
                reset_link: `${window.location.origin}/reset-password.html?token=${token}`,
                company_name: 'Productivity Hub',
                support_email: 'support@productivityhub.com',
                current_year: new Date().getFullYear(),
                reset_expires: '1 hour'
            };

            // Send email via EmailJS
            const response = await window.emailjs.send(
                this.emailjs.serviceId,
                this.emailjs.templateIdPasswordReset,
                templateParams
            );

            console.log('Password reset email sent successfully:', response);
            return {
                success: true,
                message: 'Password reset email sent successfully',
                response: response
            };

        } catch (error) {
            console.error('EmailJS sendPasswordResetEmail error:', error);

            // Provide user-friendly error messages
            let errorMessage = 'Failed to send password reset email';

            if (error.text === 'The user ID is not registered.') {
                errorMessage = 'Email service configuration error. Please contact support.';
            } else if (error.text === 'The template ID is not registered.') {
                errorMessage = 'Email template configuration error. Please contact support.';
            } else if (error.text === 'The service ID is not registered.') {
                errorMessage = 'Email service configuration error. Please contact support.';
            } else if (error.status === 429) {
                errorMessage = 'Too many email requests. Please wait and try again.';
            } else if (error.status >= 500) {
                errorMessage = 'Email service temporarily unavailable. Please try again later.';
            } else {
                errorMessage = error.text || error.message || 'Unknown email service error';
            }

            return {
                success: false,
                error: errorMessage,
                details: error
            };
        }
    }

    /**
     * Update EmailJS configuration
     */
    updateEmailJSConfig(serviceId, verificationTemplateId, passwordResetTemplateId, publicKey) {
        this.emailjs = {
            serviceId: serviceId || this.emailjs.serviceId,
            templateIdVerification: verificationTemplateId || this.emailjs.templateIdVerification,
            templateIdPasswordReset: passwordResetTemplateId || this.emailjs.templateIdPasswordReset,
            publicKey: publicKey || this.emailjs.publicKey
        };

        // Reinitialize EmailJS if already loaded
        if (window.emailjs) {
            window.emailjs.init(this.emailjs.publicKey);
            console.log('EmailJS reinitialized with new configuration');
        }
    }

    async verifyOAuthToken(provider, token) {
        // Simulate OAuth verification
        // In production, this would verify with Google/Microsoft APIs
        return {
            isValid: true,
            id: 'oauth_' + Date.now(),
            email: 'user@example.com',
            name: 'OAuth User',
            avatar: 'https://example.com/avatar.jpg'
        };
    }

    async findUserByOAuth(provider, oauthId) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(u => u.oauthProviders && u.oauthProviders[provider] === oauthId);
    }

    async createUserFromOAuth(provider, oauthData) {
        const user = {
            id: this.generateUserId(),
            fullName: oauthData.name,
            username: oauthData.email.split('@')[0] + '_' + Date.now(),
            email: oauthData.email,
            avatar: oauthData.avatar,
            oauthProviders: {
                [provider]: oauthData.id
            },
            createdAt: new Date().toISOString(),
            isEmailVerified: true, // OAuth users are pre-verified
            preferences: {
                theme: 'dark',
                notifications: true,
                language: 'en'
            }
        };

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));

        return user;
    }
}

// Export for use in other modules
window.AuthManager = AuthManager;

// Initialize global auth manager
const authManager = new AuthManager();
window.authManager = authManager;