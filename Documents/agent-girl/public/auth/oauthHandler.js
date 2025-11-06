/**
 * OAuth Handler
 * Manages OAuth authentication flows for Google and Microsoft
 */

class OAuthHandler {
    constructor() {
        this.config = {
            google: {
                clientId: 'YOUR_GOOGLE_CLIENT_ID', // Replace with actual client ID
                redirectUri: `${window.location.origin}/oauth/google/callback`,
                scope: 'openid email profile',
                authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
            },
            microsoft: {
                clientId: 'YOUR_MICROSOFT_CLIENT_ID', // Replace with actual client ID
                redirectUri: `${window.location.origin}/oauth/microsoft/callback`,
                scope: 'openid email profile',
                authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
            }
        };

        this.state = null;
        this.popup = null;
        this.checkInterval = null;
    }

    /**
     * Initiate OAuth flow
     */
    async initiateOAuth(provider, mode = 'signin') {
        try {
            const config = this.config[provider];
            if (!config) {
                throw new Error(`Unsupported OAuth provider: ${provider}`);
            }

            // Generate state for security
            this.state = this.generateState();
            localStorage.setItem('oauthState', this.state);
            localStorage.setItem('oauthMode', mode);

            // Build authorization URL
            const authParams = new URLSearchParams({
                client_id: config.clientId,
                redirect_uri: config.redirectUri,
                scope: config.scope,
                response_type: 'code',
                state: this.state,
                access_type: 'offline',
                prompt: 'consent'
            });

            const authUrl = `${config.authUrl}?${authParams.toString()}`;

            // Open popup for OAuth flow
            this.popup = window.open(
                authUrl,
                'oauth_popup',
                'width=500,height=600,scrollbars=yes,resizable=yes'
            );

            if (!this.popup) {
                throw new Error('Popup blocked. Please allow popups and try again.');
            }

            // Listen for popup closure
            return new Promise((resolve, reject) => {
                this.checkInterval = setInterval(() => {
                    try {
                        if (this.popup.closed) {
                            clearInterval(this.checkInterval);
                            reject(new Error('OAuth flow cancelled'));
                            return;
                        }

                        // Check if popup has been redirected back
                        if (this.popup.location.href.includes(config.redirectUri)) {
                            clearInterval(this.checkInterval);
                            this.handleOAuthCallback(provider, this.popup.location.href)
                                .then(resolve)
                                .catch(reject)
                                .finally(() => this.popup.close());
                        }
                    } catch (e) {
                        // Cross-origin error is expected until redirect
                    }
                }, 1000);

                // Timeout after 5 minutes
                setTimeout(() => {
                    if (this.popup && !this.popup.closed) {
                        this.popup.close();
                    }
                    clearInterval(this.checkInterval);
                    reject(new Error('OAuth flow timed out'));
                }, 5 * 60 * 1000);
            });

        } catch (error) {
            console.error('OAuth initiation error:', error);
            throw error;
        }
    }

    /**
     * Handle OAuth callback
     */
    async handleOAuthCallback(provider, callbackUrl) {
        try {
            const urlParams = new URLSearchParams(callbackUrl.split('?')[1]);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');

            if (error) {
                throw new Error(`OAuth error: ${error}`);
            }

            if (!code || !state) {
                throw new Error('Invalid OAuth callback');
            }

            // Verify state
            const storedState = localStorage.getItem('oauthState');
            if (state !== storedState) {
                throw new Error('Invalid OAuth state');
            }

            // Exchange authorization code for tokens
            const tokenData = await this.exchangeCodeForTokens(provider, code);

            // Get user profile
            const userProfile = await this.getUserProfile(provider, tokenData.access_token);

            // Create or update user account
            const mode = localStorage.getItem('oauthMode') || 'signin';
            const result = await this.processOAuthUser(provider, userProfile, mode, tokenData);

            // Clean up
            localStorage.removeItem('oauthState');
            localStorage.removeItem('oauthMode');

            return result;

        } catch (error) {
            console.error('OAuth callback error:', error);
            throw error;
        }
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(provider, code) {
        try {
            const config = this.config[provider];

            // In production, this would be a server-side API call
            // For demo purposes, we'll simulate the token exchange
            const response = await fetch('/api/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider,
                    code,
                    redirect_uri: config.redirectUri,
                    client_id: config.clientId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to exchange authorization code');
            }

            return await response.json();

        } catch (error) {
            console.error('Token exchange error:', error);
            // For demo purposes, return mock token data
            return {
                access_token: 'mock_access_token_' + Date.now(),
                refresh_token: 'mock_refresh_token_' + Date.now(),
                expires_in: 3600,
                token_type: 'Bearer'
            };
        }
    }

    /**
     * Get user profile from OAuth provider
     */
    async getUserProfile(provider, accessToken) {
        try {
            const profileUrls = {
                google: 'https://www.googleapis.com/oauth2/v2/userinfo',
                microsoft: 'https://graph.microsoft.com/v1.0/me'
            };

            const response = await fetch(profileUrls[provider], {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }

            const profile = await response.json();
            return this.normalizeProfile(provider, profile);

        } catch (error) {
            console.error('Profile fetch error:', error);
            // For demo purposes, return mock profile data
            return {
                id: 'mock_oauth_id_' + Date.now(),
                email: 'user@example.com',
                name: 'Demo User',
                firstName: 'Demo',
                lastName: 'User',
                avatar: `https://ui-avatars.com/api/?name=Demo+User&background=9333ea&color=fff`,
                provider: provider
            };
        }
    }

    /**
     * Normalize profile data from different providers
     */
    normalizeProfile(provider, profile) {
        switch (provider) {
            case 'google':
                return {
                    id: profile.id,
                    email: profile.email,
                    name: profile.name,
                    firstName: profile.given_name,
                    lastName: profile.family_name,
                    avatar: profile.picture,
                    provider: 'google'
                };

            case 'microsoft':
                return {
                    id: profile.id,
                    email: profile.mail || profile.userPrincipalName,
                    name: profile.displayName,
                    firstName: profile.givenName,
                    lastName: profile.surname,
                    avatar: profile.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=9333ea&color=fff`,
                    provider: 'microsoft'
                };

            default:
                return {
                    ...profile,
                    provider: provider
                };
        }
    }

    /**
     * Process OAuth user (signin or signup)
     */
    async processOAuthUser(provider, profile, mode, tokenData) {
        try {
            // Check if user already exists
            const existingUser = await this.findUserByOAuthId(provider, profile.id);

            if (existingUser) {
                // Sign in existing user
                return await this.signInOAuthUser(existingUser, provider, tokenData);
            } else if (mode === 'signup') {
                // Create new user
                return await this.createOAuthUser(provider, profile, tokenData);
            } else {
                // User doesn't exist and in signin mode
                throw new Error(`No account found with this ${provider} account. Please sign up first.`);
            }

        } catch (error) {
            console.error('OAuth user processing error:', error);
            throw error;
        }
    }

    /**
     * Sign in existing OAuth user
     */
    async signInOAuthUser(user, provider, tokenData) {
        try {
            // Update OAuth tokens
            if (!user.oauthTokens) {
                user.oauthTokens = {};
            }
            user.oauthTokens[provider] = {
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                expiresAt: Date.now() + (tokenData.expires_in * 1000),
                updatedAt: new Date().toISOString()
            };

            user.lastLoginAt = new Date().toISOString();

            // Update user in storage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                users[userIndex] = user;
                localStorage.setItem('users', JSON.stringify(users));
            }

            // Create session
            await window.authManager.createSession(user, provider);

            return {
                success: true,
                message: `Signed in with ${provider} successfully`,
                user: window.authManager.sanitizeUser(user)
            };

        } catch (error) {
            console.error('OAuth sign in error:', error);
            throw error;
        }
    }

    /**
     * Create new OAuth user
     */
    async createOAuthUser(provider, profile, tokenData) {
        try {
            const user = {
                id: window.authManager.generateUserId(),
                fullName: profile.name,
                firstName: profile.firstName,
                lastName: profile.lastName,
                username: this.generateUsername(profile.name, profile.email),
                email: profile.email,
                avatar: profile.avatar,
                oauthProviders: {
                    [provider]: profile.id
                },
                oauthTokens: {
                    [provider]: {
                        accessToken: tokenData.access_token,
                        refreshToken: tokenData.refresh_token,
                        expiresAt: Date.now() + (tokenData.expires_in * 1000),
                        createdAt: new Date().toISOString()
                    }
                },
                createdAt: new Date().toISOString(),
                isEmailVerified: true, // OAuth users are pre-verified
                emailVerifiedAt: new Date().toISOString(),
                preferences: {
                    theme: 'dark',
                    notifications: true,
                    language: 'en'
                }
            };

            // Save user to storage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            users.push(user);
            localStorage.setItem('users', JSON.stringify(users));

            // Create session
            await window.authManager.createSession(user, provider);

            return {
                success: true,
                message: `Account created with ${provider} successfully`,
                user: window.authManager.sanitizeUser(user)
            };

        } catch (error) {
            console.error('OAuth user creation error:', error);
            throw error;
        }
    }

    /**
     * Find user by OAuth provider ID
     */
    async findUserByOAuthId(provider, oauthId) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(u => u.oauthProviders && u.oauthProviders[provider] === oauthId);
    }

    /**
     * Generate username from name/email
     */
    generateUsername(name, email) {
        let baseUsername;

        if (name) {
            baseUsername = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
        } else {
            baseUsername = email.split('@')[0];
        }

        // Ensure uniqueness
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        let username = baseUsername;
        let counter = 1;

        while (users.some(u => u.username === username)) {
            username = baseUsername + counter;
            counter++;
        }

        return username;
    }

    /**
     * Generate random state for OAuth security
     */
    generateState() {
        return Math.random().toString(36).substring(2, 15) +
               Math.random().toString(36).substring(2, 15);
    }

    /**
     * Refresh OAuth tokens
     */
    async refreshOAuthToken(provider, refreshToken) {
        try {
            // In production, this would be a server-side API call
            const response = await fetch('/api/oauth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider,
                    refresh_token: refreshToken
                })
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            return await response.json();

        } catch (error) {
            console.error('Token refresh error:', error);
            throw error;
        }
    }

    /**
     * Revoke OAuth access
     */
    async revokeOAuthAccess(provider) {
        try {
            const currentUser = window.authManager.getCurrentUser();
            if (!currentUser || !currentUser.oauthTokens || !currentUser.oauthTokens[provider]) {
                return { success: false, error: 'No OAuth token found for this provider' };
            }

            // In production, call provider's revoke endpoint
            const revokeUrls = {
                google: 'https://oauth2.googleapis.com/revoke',
                microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/logout'
            };

            // Revoke token (simulated)
            await fetch(revokeUrls[provider], {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `token=${currentUser.oauthTokens[provider].accessToken}`
            });

            // Remove OAuth data from user
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === currentUser.id);

            if (userIndex !== -1) {
                delete users[userIndex].oauthProviders[provider];
                delete users[userIndex].oauthTokens[provider];
                localStorage.setItem('users', JSON.stringify(users));

                // Update current user
                delete currentUser.oauthProviders[provider];
                delete currentUser.oauthTokens[provider];
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }

            return {
                success: true,
                message: `${provider} access revoked successfully`
            };

        } catch (error) {
            console.error('OAuth revoke error:', error);
            return {
                success: false,
                error: `Failed to revoke ${provider} access`
            };
        }
    }

    /**
     * Link OAuth account to existing user
     */
    async linkOAuthAccount(provider, profile, tokenData) {
        try {
            const currentUser = window.authManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('No authenticated user found');
            }

            // Check if OAuth account is already linked to another user
            const existingUser = await this.findUserByOAuthId(provider, profile.id);
            if (existingUser && existingUser.id !== currentUser.id) {
                throw new Error(`This ${provider} account is already linked to another user`);
            }

            // Link OAuth account to current user
            currentUser.oauthProviders = currentUser.oauthProviders || {};
            currentUser.oauthProviders[provider] = profile.id;

            currentUser.oauthTokens = currentUser.oauthTokens || {};
            currentUser.oauthTokens[provider] = {
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                expiresAt: Date.now() + (tokenData.expires_in * 1000),
                updatedAt: new Date().toISOString()
            };

            // Update user in storage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex] = currentUser;
                localStorage.setItem('users', JSON.stringify(users));
            }

            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            return {
                success: true,
                message: `${provider} account linked successfully`,
                user: window.authManager.sanitizeUser(currentUser)
            };

        } catch (error) {
            console.error('OAuth linking error:', error);
            throw error;
        }
    }

    /**
     * Unlink OAuth account
     */
    async unlinkOAuthAccount(provider) {
        try {
            const currentUser = window.authManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('No authenticated user found');
            }

            // Check if user has other auth methods
            const hasOtherProviders = Object.keys(currentUser.oauthProviders || {}).length > 1;
            const hasPassword = currentUser.password;

            if (!hasPassword && !hasOtherProviders) {
                throw new Error('Cannot unlink the only authentication method. Please set a password first.');
            }

            // Revoke OAuth access
            await this.revokeOAuthAccess(provider);

            return {
                success: true,
                message: `${provider} account unlinked successfully`
            };

        } catch (error) {
            console.error('OAuth unlinking error:', error);
            throw error;
        }
    }
}

// Export for use in other modules
window.OAuthHandler = OAuthHandler;