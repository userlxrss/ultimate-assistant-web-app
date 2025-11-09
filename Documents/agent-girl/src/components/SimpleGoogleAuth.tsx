/**
 * EMERGENCY OAUTH FIX - SimpleGoogleAuth Component
 *
 * CRITICAL FIXES:
 * 1. Correct frontend port detection
 * 2. Enhanced popup monitoring with better error handling
 * 3. Fallback to redirect-based OAuth if popup fails
 * 4. Improved message passing between popup and parent
 * 5. Better timeout and error recovery
 */

import React, { useState, useEffect, useRef } from 'react';
import { authManager } from '../utils/authManager';

interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface AuthResponse {
  success: boolean;
  authUrl?: string;
  state?: string;
  error?: string;
  details?: string;
}

const SimpleGoogleAuth: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [useRedirect, setUseRedirect] = useState(false);
  const popupMonitorRef = useRef<NodeJS.Timeout | null>(null);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic port detection
  const OAUTH_SERVER_URL = 'http://localhost:3006';
  const FRONTEND_URL = window.location.origin;
  const FRONTEND_PORT = window.location.port || '5173';

  console.log('🔧 OAuth Debug Info:', {
    frontendUrl: FRONTEND_URL,
    frontendPort: FRONTEND_PORT,
    oauthServer: OAUTH_SERVER_URL
  });

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();

    // Enhanced message listener for OAuth popup response
    const handleMessage = (event: MessageEvent) => {
      console.log('📨 Received message:', event.data, 'from origin:', event.origin);

      // Accept messages from OAuth server or any localhost origin for development
      const allowedOrigins = [
        OAUTH_SERVER_URL,
        'http://localhost:3006',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176'
      ];

      if (!allowedOrigins.includes(event.origin) && !event.origin.includes('localhost')) {
        console.warn('⚠️ Message from unexpected origin:', event.origin);
        return;
      }

      // Clear any pending timeouts
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }

      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        console.log('✅ OAuth success received:', event.data.user);
        handleAuthSuccess(event.data.user);
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        console.error('❌ OAuth error received:', event.data.error);
        handleAuthError(event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      // Cleanup any running monitors
      if (popupMonitorRef.current) {
        clearInterval(popupMonitorRef.current);
      }
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsCheckingAuth(true);
      console.log('🔍 Checking authentication status...');

      // First check local storage
      const googleSession = authManager.getGoogleSession();
      if (googleSession) {
        console.log('📱 Found local Google session:', googleSession.email);
        setUser({
          id: googleSession.email,
          email: googleSession.email,
          name: googleSession.email.split('@')[0],
          picture: ''
        });
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        return;
      }

      // Then check with server
      const response = await fetch(`${OAUTH_SERVER_URL}/api/auth/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Origin': FRONTEND_URL
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Server auth status:', data);

        if (data.authenticated && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          // Save to local storage
          authManager.saveGoogleSession(data.user.email);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        console.warn('⚠️ Auth status check failed, response:', response.status);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      setIsAuthenticated(false);
      // Don't show error to user on initial check, just log it
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleAuthSuccess = (userData: User) => {
    console.log('🎉 Authentication successful:', userData);
    setUser(userData);
    setIsAuthenticated(true);
    setError(null);
    setIsLoading(false);

    // Save to auth manager
    authManager.saveGoogleSession(userData.email);

    // Clean up popup monitor
    if (popupMonitorRef.current) {
      clearInterval(popupMonitorRef.current);
      popupMonitorRef.current = null;
    }
  };

  const handleAuthError = (errorMessage: string) => {
    console.error('❌ Authentication failed:', errorMessage);
    setError(errorMessage || 'Authentication failed');
    setIsLoading(false);

    // Clean up popup monitor
    if (popupMonitorRef.current) {
      clearInterval(popupMonitorRef.current);
      popupMonitorRef.current = null;
    }
  };

  const initiateGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🚀 Initiating Google OAuth...');

      const response = await fetch(`${OAUTH_SERVER_URL}/api/auth/google`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Origin': FRONTEND_URL
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AuthResponse = await response.json();
      console.log('📤 Auth URL response:', data);

      if (data.success && data.authUrl) {
        if (useRedirect) {
          // Use redirect-based OAuth as fallback
          console.log('🔄 Using redirect-based OAuth');
          window.location.href = data.authUrl;
        } else {
          // Try popup-based OAuth first
          console.log('🪟 Opening OAuth popup...');
          openOAuthPopup(data.authUrl);
        }
      } else {
        throw new Error(data.error || data.details || 'Failed to get authentication URL');
      }
    } catch (error) {
      console.error('❌ Error initiating Google auth:', error);
      handleAuthError(error instanceof Error ? error.message : 'Failed to initiate authentication');
    }
  };

  const openOAuthPopup = (authUrl: string) => {
    try {
      // Open OAuth popup with better positioning
      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        authUrl,
        'google-oauth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,dependent=yes`
      );

      if (!popup) {
        console.warn('⚠️ Popup blocked, offering redirect fallback');
        setUseRedirect(true);
        handleAuthError('Popup blocked. Please allow popups or click here to use redirect-based authentication.');
        return;
      }

      console.log('✅ Popup opened successfully');

      // Enhanced popup monitoring with timeout
      let popupClosed = false;
      const startTime = Date.now();
      const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes

      // Set auth timeout
      authTimeoutRef.current = setTimeout(() => {
        if (!popupClosed && !isAuthenticated) {
          console.log('⏰ Authentication timeout reached');
          popup.close();
          handleAuthError('Authentication timed out. Please try again.');
        }
      }, TIMEOUT_DURATION);

      // Monitor popup closure
      popupMonitorRef.current = setInterval(() => {
        if (popup.closed) {
          popupClosed = true;
          clearInterval(popupMonitorRef.current!);

          if (authTimeoutRef.current) {
            clearTimeout(authTimeoutRef.current);
          }

          if (!isAuthenticated) {
            const elapsedTime = Date.now() - startTime;
            console.log('❌ Popup closed without authentication, elapsed time:', elapsedTime);

            if (elapsedTime < 2000) {
              // User closed popup very quickly, likely blocked or accidental
              handleAuthError('Popup was closed too quickly. Please allow popups and try again.');
            } else {
              handleAuthError('Authentication was cancelled. Please try again.');
            }
          }
        } else {
          // Popup is still open, check if it's been too long
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime > TIMEOUT_DURATION) {
            console.log('⏰ Popup timeout, closing...');
            popup.close();
            handleAuthError('Authentication timed out. Please try again.');
          }
        }
      }, 1000);

      // Focus the popup
      if (popup.focus) {
        popup.focus();
      }

    } catch (error) {
      console.error('❌ Error opening popup:', error);
      setUseRedirect(true);
      handleAuthError('Failed to open popup. Click here to use redirect-based authentication.');
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);

      console.log('🚪 Logging out...');

      await fetch(`${OAUTH_SERVER_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      // Clear local state
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setUseRedirect(false);

      // Clear auth manager
      authManager.clearGoogleSession();

      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Checking authentication...</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Google Authentication
        </h2>

        {/* Debug Info */}
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <div>Frontend: {FRONTEND_URL}</div>
          <div>OAuth Server: {OAUTH_SERVER_URL}</div>
          <div>Mode: {useRedirect ? 'Redirect' : 'Popup'}</div>
        </div>

        {isAuthenticated && user ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div className="text-left">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 text-sm">
                ✅ Successfully connected to Google
              </p>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {isLoading ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Connect your Google account to access contacts, emails, and calendar.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  ❌ {error}
                </p>
                {error.includes('popup') && (
                  <button
                    onClick={() => setUseRedirect(true)}
                    className="mt-2 text-xs text-blue-600 hover:underline"
                  >
                    Click here to use redirect-based authentication instead
                  </button>
                )}
              </div>
            )}

            <button
              onClick={initiateGoogleAuth}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Sign in with Google ({useRedirect ? 'Redirect' : 'Popup'})</span>
                </>
              )}
            </button>

            {!useRedirect && (
              <button
                onClick={() => setUseRedirect(true)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Use Redirect-Based Authentication
              </button>
            )}

            {useRedirect && (
              <button
                onClick={() => setUseRedirect(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Try Popup Authentication
              </button>
            )}

            <div className="text-xs text-gray-500 mt-4">
              <p>This uses OAuth 2.0 for secure authentication.</p>
              <p>No app passwords required.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleGoogleAuth;