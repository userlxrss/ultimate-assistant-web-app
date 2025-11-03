/**
 * SUPABASE AUTHENTICATION SYSTEM
 * Replaces EmailJS with reliable Supabase authentication
 * Project URL: https://vacwojgxafujscxuqmpg.supabase.co
 */

class SupabaseAuth {
    constructor() {
        // Supabase configuration
        this.supabaseUrl = 'https://vacwojgxafujscxuqmpg.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhY3dvamd4YWZ1anNjeHVxbXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTU5MTksImV4cCI6MjA3Nzc3MTkxOX0.RniyufeNXF9h6a9u55zGIxLRFeFDCaJxQ1ZjLv6KgxI';

        this.supabase = null;
        this.currentUser = null;
        this.sessionTimeout = null;

        this.init();
    }

    /**
     * Initialize Supabase client
     */
    async init() {
        try {
            // Load Supabase client library
            await this.loadSupabaseSDK();

            // Initialize Supabase client
            this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);

            console.log('✅ Supabase initialized successfully');

            // Check for existing session
            await this.checkExistingSession();

            // Setup session listener
            this.setupSessionListener();

        } catch (error) {
            console.error('❌ Supabase initialization failed:', error);
        }
    }

    /**
     * Load Supabase JavaScript SDK
     */
    async loadSupabaseSDK() {
        return new Promise((resolve, reject) => {
            if (window.supabase) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.async = true;
            script.onload = () => {
                console.log('✅ Supabase SDK loaded');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load Supabase SDK'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Check for existing Supabase session
     */
    async checkExistingSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();

            if (session && !error) {
                this.currentUser = session.user;
                console.log('✅ Existing session found:', session.user.email);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Session check error:', error);
            return false;
        }
    }

    /**
     * Setup Supabase auth state listener
     */
    setupSessionListener() {
        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session);

            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                this.storeLocalSession(session.user);
                console.log('✅ User signed in:', session.user.email);

                // Trigger custom event for UI updates
                window.dispatchEvent(new CustomEvent('userSignedIn', {
                    detail: { user: session.user }
                }));

            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.clearLocalSession();
                console.log('✅ User signed out');

                // Trigger custom event for UI updates
                window.dispatchEvent(new CustomEvent('userSignedOut'));
            }
        });
    }

    /**
     * User registration with email verification
     */
    async signUp(userData) {
        try {
            // Validate input data
            const validation = this.validateSignUpData(userData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }

            console.log('🚀 Starting Supabase signup for:', userData.email);

            // Create user with Supabase - this automatically sends verification email
            const { data, error } = await this.supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        full_name: userData.fullName,
                        username: userData.username,
                        marketing_consent: userData.marketing || false
                    }
                }
            });

            if (error) {
                console.error('Supabase signup error:', error);
                throw new Error(this.formatSupabaseError(error));
            }

            // Store pending user data locally for verification page
            if (data.user && !data.user.email_confirmed_at) {
                localStorage.setItem('pendingUser', JSON.stringify({
                    id: data.user.id,
                    email: data.user.email,
                    fullName: userData.fullName,
                    username: userData.username
                }));
            }

            console.log('✅ Supabase signup successful:', data);

            return {
                success: true,
                message: data.user && !data.user.email_confirmed_at
                    ? 'Account created! Please check your email to verify your account.'
                    : 'Account created and verified successfully!',
                user: data.user,
                needsVerification: !data.user?.email_confirmed_at
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
     * User login - Enhanced with better error handling and debugging
     */
    async signIn(email, password, rememberMe = false) {
        try {
            // Validate input
            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            // Normalize email to handle case sensitivity
            const normalizedEmail = email.toLowerCase().trim();
            console.log('🔑 Starting Supabase sign in for:', normalizedEmail);

            // Clear any existing session to avoid conflicts
            await this.clearExistingSession();

            // Enhanced debugging: Check if user exists before sign-in
            console.log('🔍 Checking user status before sign-in...');
            const userStatus = await this.checkUserStatus(normalizedEmail);
            console.log('User status check result:', userStatus);

            // Sign in with Supabase with enhanced error handling
            console.log('🚀 Attempting signInWithPassword...');
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password: password
            });

            console.log('Supabase response:', { data, error });

            if (error) {
                console.error('Supabase sign in error:', error);

                // Enhanced error analysis
                const errorAnalysis = this.analyzeSignInError(error, normalizedEmail);
                console.log('Error analysis:', errorAnalysis);

                throw new Error(errorAnalysis.userMessage);
            }

            if (!data.user) {
                throw new Error('No user data returned from Supabase');
            }

            // Enhanced email verification check
            if (!data.user.email_confirmed_at) {
                console.log('Email not confirmed for user:', data.user.email);
                return {
                    success: false,
                    error: 'Please verify your email before signing in. Check your inbox for the verification link.',
                    needsVerification: true,
                    user: data.user
                };
            }

            // Update current user state
            this.currentUser = data.user;

            // Store local session data
            this.storeLocalSession(data.user, rememberMe);

            console.log('✅ Supabase sign in successful:', {
                email: data.user.email,
                userId: data.user.id,
                emailConfirmed: !!data.user.email_confirmed_at
            });

            return {
                success: true,
                message: 'Sign in successful',
                user: this.sanitizeUser(data.user)
            };

        } catch (error) {
            console.error('Sign in error:', error);
            return {
                success: false,
                error: error.message,
                debug: {
                    email: email.toLowerCase().trim(),
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    /**
     * Clear existing session to avoid conflicts
     */
    async clearExistingSession() {
        try {
            console.log('🧹 Clearing existing session...');
            const { error } = await this.supabase.auth.signOut();
            if (error && error.message !== 'no_session') {
                console.warn('Warning while clearing session:', error);
            }
        } catch (error) {
            console.warn('Session clearing error (non-critical):', error);
        }
    }

    /**
     * Check user status before sign-in attempt
     */
    async checkUserStatus(email) {
        try {
            // This is a diagnostic method to understand the user's state
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: 'diagnostic-check-' + Date.now()
            });

            if (error) {
                return {
                    exists: !error.message.includes('Invalid login credentials'),
                    error: error.message
                };
            }

            return { exists: true, error: null };
        } catch (error) {
            return {
                exists: false,
                error: error.message
            };
        }
    }

    /**
     * Enhanced error analysis for sign-in failures
     */
    analyzeSignInError(error, email) {
        const errorMessage = error.message || 'Unknown error';

        console.log('Analyzing error:', {
            message: errorMessage,
            email: email,
            errorDetails: error
        });

        // Common error patterns and their solutions
        if (errorMessage.includes('Invalid login credentials')) {
            return {
                type: 'INVALID_CREDENTIALS',
                userMessage: 'Invalid email or password. Please check your credentials and try again.',
                debug: 'User exists but password mismatch or account not fully verified',
                suggestion: 'Try resetting your password or check if email verification is complete'
            };
        }

        if (errorMessage.includes('Email not confirmed')) {
            return {
                type: 'EMAIL_NOT_VERIFIED',
                userMessage: 'Please verify your email before signing in. Check your inbox for the verification link.',
                debug: 'User exists but email verification is pending',
                suggestion: 'Resend verification email if needed'
            };
        }

        if (errorMessage.includes('User not found')) {
            return {
                type: 'USER_NOT_FOUND',
                userMessage: 'No account found with this email address.',
                debug: 'Email does not exist in the system',
                suggestion: 'Sign up for a new account'
            };
        }

        // Default case
        return {
            type: 'UNKNOWN_ERROR',
            userMessage: 'Sign in failed. Please try again or contact support if the issue persists.',
            debug: errorMessage,
            suggestion: 'Check network connection and try again'
        };
    }

    /**
     * OAuth authentication
     */
    async signInWithOAuth(provider, rememberMe = false) {
        try {
            console.log(`🔗 Starting ${provider} OAuth sign in`);

            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: provider.toLowerCase(),
                options: {
                    redirectTo: `${window.location.origin}/`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            });

            if (error) {
                console.error(`${provider} OAuth error:`, error);
                throw new Error(this.formatSupabaseError(error));
            }

            // OAuth flow will redirect user - no need to return anything
            return {
                success: true,
                message: `${provider} authentication initiated`
            };

        } catch (error) {
            console.error('OAuth error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Email verification
     */
    async verifyEmail(token) {
        try {
            console.log('📧 Verifying email with token');

            // Exchange token for session
            const { data, error } = await this.supabase.auth.verifyOtp({
                token: token,
                type: 'signup'
            });

            if (error) {
                console.error('Email verification error:', error);
                throw new Error(this.formatSupabaseError(error));
            }

            // Clear pending user data
            localStorage.removeItem('pendingUser');

            console.log('✅ Email verified successfully:', data.user.email);

            return {
                success: true,
                message: 'Email verified successfully',
                user: this.sanitizeUser(data.user)
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

            if (!pendingUser.email) {
                throw new Error('No pending registration found');
            }

            console.log('📧 Resending verification email to:', pendingUser.email);

            const { data, error } = await this.supabase.auth.resend({
                type: 'signup',
                email: pendingUser.email,
                options: {
                    emailRedirectTo: `${window.location.origin}/verify-email.html`
                }
            });

            if (error) {
                console.error('Resend verification error:', error);
                throw new Error(this.formatSupabaseError(error));
            }

            console.log('✅ Verification email resent successfully');

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
     * Password reset request
     */
    async requestPasswordReset(email) {
        try {
            console.log('🔑 Requesting password reset for:', email);

            const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });

            if (error) {
                console.error('Password reset request error:', error);
                throw new Error(this.formatSupabaseError(error));
            }

            console.log('✅ Password reset email sent successfully');

            return {
                success: true,
                message: 'Password reset link sent to your email'
            };

        } catch (error) {
            console.error('Password reset request error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Reset password with token (legacy method)
     */
    async resetPassword(token, newPassword) {
        try {
            console.log('🔑 Resetting password with token (legacy method)');

            // First verify the token
            const { data: { user }, error: verifyError } = await this.supabase.auth.getUser(token);

            if (verifyError) {
                throw new Error(this.formatSupabaseError(verifyError));
            }

            // Update password
            const { data, error } = await this.supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                console.error('Password reset error:', error);
                throw new Error(this.formatSupabaseError(error));
            }

            console.log('✅ Password reset successfully');

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

    /**
     * Reset password with access token (Supabase method)
     * This is the correct method for handling Supabase password reset links
     */
    async resetPasswordWithAccessToken(accessToken, newPassword) {
        try {
            console.log('🔑 Resetting password with Supabase access token');

            if (!accessToken) {
                throw new Error('Access token is required for password reset');
            }

            // Initialize Supabase client with the access token to create a temporary session
            const tempSupabase = window.supabase.createClient(
                this.supabaseUrl,
                this.supabaseKey,
                {
                    auth: {
                        persistSession: false
                    }
                }
            );

            // Set the session using the access token
            const { data: sessionData, error: sessionError } = await tempSupabase.auth.setSession({
                access_token: accessToken,
                refresh_token: window.resetTokens?.refreshToken || ''
            });

            if (sessionError) {
                console.error('Session setting error:', sessionError);
                throw new Error(this.formatSupabaseError(sessionError));
            }

            console.log('✅ Temporary session established, updating password...');

            // Now update the user's password
            const { data, error } = await tempSupabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                console.error('Password update error:', error);
                throw new Error(this.formatSupabaseError(error));
            }

            console.log('✅ Password reset successfully via access token');

            return {
                success: true,
                message: 'Password reset successfully! You can now sign in with your new password.',
                user: this.sanitizeUser(data.user)
            };

        } catch (error) {
            console.error('Password reset with access token error:', error);
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
            console.log('🚪 Signing out user');

            const { error } = await this.supabase.auth.signOut();

            if (error) {
                console.error('Sign out error:', error);
                throw new Error(this.formatSupabaseError(error));
            }

            // Clear local session (also handled by auth state listener)
            this.clearLocalSession();

            console.log('✅ User signed out successfully');

            return {
                success: true,
                message: 'Signed out successfully'
            };

        } catch (error) {
            console.error('Sign out error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser ? this.sanitizeUser(this.currentUser) : null;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null && this.currentUser.email_confirmed_at !== null;
    }

    /**
     * Update user profile
     */
    async updateProfile(updates) {
        try {
            if (!this.currentUser) {
                throw new Error('No authenticated user');
            }

            console.log('📝 Updating user profile:', updates);

            const { data, error } = await this.supabase.auth.updateUser({
                data: updates
            });

            if (error) {
                console.error('Profile update error:', error);
                throw new Error(this.formatSupabaseError(error));
            }

            this.currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(data.user));

            console.log('✅ Profile updated successfully');

            return {
                success: true,
                message: 'Profile updated successfully',
                user: this.sanitizeUser(data.user)
            };

        } catch (error) {
            console.error('Profile update error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Helper methods

    /**
     * Store session data locally
     */
    storeLocalSession(user, rememberMe = false) {
        const sessionData = {
            userId: user.id,
            email: user.email,
            loginMethod: 'supabase',
            loginTimestamp: new Date().toISOString(),
            rememberMe: rememberMe
        };

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('sessionData', JSON.stringify(sessionData));
        localStorage.setItem('loginTimestamp', sessionData.loginTimestamp);
        localStorage.setItem('loginMethod', 'supabase');

        if (rememberMe) {
            localStorage.setItem('sessionExpiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
        } else {
            localStorage.setItem('sessionExpiry', (Date.now() + 24 * 60 * 60 * 1000).toString());
        }
    }

    /**
     * Clear local session data
     */
    clearLocalSession() {
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
    }

    /**
     * Validate sign up data
     */
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

    /**
     * Format Supabase error messages
     */
    formatSupabaseError(error) {
        // Map common Supabase errors to user-friendly messages
        const errorMap = {
            'User already registered': 'An account with this email already exists',
            'Invalid login credentials': 'Invalid email or password',
            'Email not confirmed': 'Please verify your email before signing in',
            'Invalid email': 'Please enter a valid email address',
            'Password should be at least 6 characters': 'Password must be at least 6 characters long',
            'signup_disabled': 'Registration is currently disabled',
            'email_address_invalid': 'The email address is invalid',
            'password_too_short': 'Password is too short',
            'weak_password': 'Password is too weak. Please use a stronger password',
            'signup_limit_exceeded': 'Too many signup attempts. Please try again later'
        };

        return errorMap[error.message] || error.message || 'An unexpected error occurred';
    }

    /**
     * Sanitize user object (remove sensitive data)
     */
    sanitizeUser(user) {
        if (!user) return null;

        const { factors, ...sanitized } = user;
        return sanitized;
    }
}

// Create global instance
window.supabaseAuth = new SupabaseAuth();

// For backward compatibility with existing code
window.authManager = window.supabaseAuth;
window.emailJSEmailVerification = window.supabaseAuth;

console.log('🚀 Supabase Authentication initialized - Reliable auth system ready!');