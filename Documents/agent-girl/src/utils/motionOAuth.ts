/**
 * Motion OAuth Integration Service
 * Handles OAuth authentication for Motion API
 */

interface MotionOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
}

interface MotionUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  timezone: string;
}

class MotionOAuthService {
  private static instance: MotionOAuthService;
  private tokens: MotionOAuthTokens | null = null;
  private currentUser: MotionUser | null = null;

  // Motion OAuth configuration
  private readonly config = {
    clientId: import.meta.env.VITE_MOTION_CLIENT_ID || 'your-motion-client-id', // Replace with actual Motion client ID
    clientSecret: 'YOUR_MOTION_CLIENT_SECRET', // Replace with actual Motion client secret
    redirectUri: `${window.location.origin}/oauth/motion/callback`,
    scope: 'tasks:read tasks:write',
    authUrl: 'https://app.usemotion.com/oauth/authorize',
    tokenUrl: 'https://api.usemotion.com/oauth/token',
    profileUrl: 'https://api.usemotion.com/v1/users/me'
  };

  private constructor() {
    this.loadStoredTokens();
  }

  static getInstance(): MotionOAuthService {
    if (!MotionOAuthService.instance) {
      MotionOAuthService.instance = new MotionOAuthService();
    }
    return MotionOAuthService.instance;
  }

  /**
   * Check if user is authenticated with Motion
   */
  isAuthenticated(): boolean {
    if (!this.tokens) return false;

    // Check if token is expired
    const now = Date.now();
    const isExpired = now >= this.tokens.expiresAt;

    if (isExpired) {
      this.clearTokens();
      return false;
    }

    return true;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    if (!this.isAuthenticated()) return null;
    return this.tokens!.accessToken;
  }

  /**
   * Get current user info
   */
  getCurrentUser(): MotionUser | null {
    return this.currentUser;
  }

  /**
   * Initiate Motion OAuth flow
   */
  async initiateOAuth(): Promise<void> {
    try {
      // Generate state for security
      const state = this.generateState();
      localStorage.setItem('motion_oauth_state', state);

      // Build authorization URL
      const authParams = new URLSearchParams({
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        scope: this.config.scope,
        response_type: 'code',
        state: state,
        access_type: 'offline',
        prompt: 'consent'
      });

      const authUrl = `${this.config.authUrl}?${authParams.toString()}`;

      // Open popup for OAuth flow
      const popup = window.open(
        authUrl,
        'motion_oauth_popup',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      }

      // Listen for OAuth callback
      await this.listenForOAuthCallback(popup, state);

    } catch (error) {
      console.error('Motion OAuth initiation error:', error);
      throw error;
    }
  }

  /**
   * Listen for OAuth callback from popup
   */
  private async listenForOAuthCallback(popup: Window, expectedState: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkInterval);
            reject(new Error('OAuth flow cancelled'));
            return;
          }

          // Check if popup has been redirected back
          if (popup.location.href.includes(this.config.redirectUri)) {
            clearInterval(checkInterval);
            this.handleOAuthCallback(popup.location.href, expectedState)
              .then(() => resolve())
              .catch(reject)
              .finally(() => popup.close());
          }
        } catch (e) {
          // Cross-origin error is expected until redirect
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        if (popup && !popup.closed) {
          popup.close();
        }
        clearInterval(checkInterval);
        reject(new Error('OAuth flow timed out'));
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Handle OAuth callback
   */
  private async handleOAuthCallback(callbackUrl: string, expectedState: string): Promise<void> {
    try {
      const urlParams = new URLSearchParams(callbackUrl.split('?')[1]);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        throw new Error(`Motion OAuth error: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Invalid Motion OAuth callback');
      }

      // Verify state
      if (state !== expectedState) {
        throw new Error('Invalid OAuth state');
      }

      // Exchange authorization code for tokens
      const tokens = await this.exchangeCodeForTokens(code);

      // Get user profile
      const user = await this.getUserProfile(tokens.accessToken);

      // Store tokens and user info
      this.tokens = tokens;
      this.currentUser = user;
      this.saveTokensToStorage(tokens, user);

      console.log('✅ Motion OAuth successful:', { user: user.email });

    } catch (error) {
      console.error('Motion OAuth callback error:', error);
      throw error;
    } finally {
      // Clean up state
      localStorage.removeItem('motion_oauth_state');
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<MotionOAuthTokens> {
    try {
      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code: code,
          redirect_uri: this.config.redirectUri
        })
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const tokenData = await response.json();

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        scope: tokenData.scope
      };

    } catch (error) {
      console.error('Motion token exchange error:', error);
      throw error;
    }
  }

  /**
   * Get user profile from Motion API
   */
  private async getUserProfile(accessToken: string): Promise<MotionUser> {
    try {
      const response = await fetch(this.config.profileUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Motion user profile: ${response.status}`);
      }

      const profile = await response.json();

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name || profile.email,
        avatar: profile.avatar,
        timezone: profile.timezone || 'UTC'
      };

    } catch (error) {
      console.error('Motion profile fetch error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.tokens.refreshToken
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const tokenData = await response.json();

      this.tokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || this.tokens.refreshToken,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        scope: tokenData.scope
      };

      this.saveTokensToStorage(this.tokens, this.currentUser!);

    } catch (error) {
      console.error('Motion token refresh error:', error);
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Make authenticated API request with automatic token refresh
   */
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.isAuthenticated()) {
      // Try to refresh if we have a refresh token
      if (this.tokens?.refreshToken) {
        await this.refreshAccessToken();
      } else {
        throw new Error('Not authenticated with Motion');
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.getAccessToken()}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    // If token expired, try refresh once
    if (response.status === 401 && this.tokens?.refreshToken) {
      try {
        await this.refreshAccessToken();

        // Retry request with new token
        return fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
            'Content-Type': 'application/json',
            ...options.headers
          }
        });
      } catch (refreshError) {
        this.clearTokens();
        throw new Error('Motion authentication failed');
      }
    }

    return response;
  }

  /**
   * Disconnect from Motion
   */
  async disconnect(): Promise<void> {
    try {
      // Revoke tokens if possible
      if (this.tokens?.accessToken) {
        try {
          await fetch('https://api.usemotion.com/oauth/revoke', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              token: this.tokens.accessToken,
              client_id: this.config.clientId,
              client_secret: this.config.clientSecret
            })
          });
        } catch (error) {
          console.warn('Failed to revoke Motion tokens:', error);
        }
      }
    } catch (error) {
      console.warn('Motion disconnect error:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Clear tokens and user info
   */
  private clearTokens(): void {
    this.tokens = null;
    this.currentUser = null;
    localStorage.removeItem('motion_oauth_tokens');
    localStorage.removeItem('motion_oauth_user');
  }

  /**
   * Save tokens and user info to storage
   */
  private saveTokensToStorage(tokens: MotionOAuthTokens, user: MotionUser): void {
    localStorage.setItem('motion_oauth_tokens', JSON.stringify(tokens));
    localStorage.setItem('motion_oauth_user', JSON.stringify(user));
  }

  /**
   * Load stored tokens and user info
   */
  private loadStoredTokens(): void {
    try {
      const tokensStr = localStorage.getItem('motion_oauth_tokens');
      const userStr = localStorage.getItem('motion_oauth_user');

      if (tokensStr && userStr) {
        const tokens = JSON.parse(tokensStr);
        const user = JSON.parse(userStr);

        // Check if tokens are still valid
        if (Date.now() < tokens.expiresAt) {
          this.tokens = tokens;
          this.currentUser = user;
        } else {
          // Tokens expired, clear them
          this.clearTokens();
        }
      }
    } catch (error) {
      console.error('Failed to load Motion OAuth tokens:', error);
      this.clearTokens();
    }
  }

  /**
   * Generate random state for OAuth security
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}

// Export singleton instance
export const motionOAuthService = MotionOAuthService.getInstance();

// Export types
export type { MotionOAuthTokens, MotionUser };