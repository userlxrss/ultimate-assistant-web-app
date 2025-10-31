/**
 * OAuth Callback Handler - Redirect Flow Support
 *
 * This component handles the redirect-based OAuth flow as a fallback
 * when popup authentication fails or is blocked.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authManager } from '../utils/authManager';

interface OAuthCallbackHandlerProps {
  onAuthSuccess?: (user: any) => void;
  onAuthError?: (error: string) => void;
}

const OAuthCallbackHandler: React.FC<OAuthCallbackHandlerProps> = ({
  onAuthSuccess,
  onAuthError
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const auth = searchParams.get('auth');
        const user = searchParams.get('user');
        const error = searchParams.get('error');
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        console.log('🔄 OAuth Callback Handler:', { auth, user, error, code, state });

        // Handle success from redirect fallback
        if (auth === 'success' && user) {
          console.log('✅ Redirect OAuth success:', user);

          const userData = {
            id: user,
            email: user,
            name: user.split('@')[0],
            picture: ''
          };

          // Save to auth manager
          authManager.saveGoogleSession(user);

          setStatus('success');
          setMessage('Authentication successful! Redirecting...');

          // Notify parent component
          if (onAuthSuccess) {
            onAuthSuccess(userData);
          }

          // Redirect to main app after a short delay
          setTimeout(() => {
            navigate('/');
          }, 2000);

          return;
        }

        // Handle Google OAuth redirect with code
        if (code && state) {
          console.log('🔄 Processing Google OAuth code exchange...');
          setMessage('Exchanging authorization code for tokens...');

          try {
            const response = await fetch(`http://localhost:3006/auth/google/callback?code=${code}&state=${state}`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
              }
            });

            if (response.ok) {
              // The callback should set session cookies
              // Check auth status to get user info
              const statusResponse = await fetch('http://localhost:3006/api/auth/status', {
                method: 'GET',
                credentials: 'include'
              });

              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                if (statusData.authenticated && statusData.user) {
                  console.log('✅ Code exchange successful:', statusData.user);

                  // Save to auth manager
                  authManager.saveGoogleSession(statusData.user.email);

                  setStatus('success');
                  setMessage('Authentication successful! Redirecting...');

                  if (onAuthSuccess) {
                    onAuthSuccess(statusData.user);
                  }

                  setTimeout(() => {
                    navigate('/');
                  }, 2000);

                  return;
                }
              }
            }
          } catch (exchangeError) {
            console.error('❌ Code exchange failed:', exchangeError);
          }
        }

        // Handle error
        if (error) {
          console.error('❌ OAuth error from redirect:', error);
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);

          if (onAuthError) {
            onAuthError(error);
          }

          setTimeout(() => {
            navigate('/');
          }, 3000);

          return;
        }

        // If no recognizable parameters, show error
        console.warn('⚠️ Unknown OAuth callback parameters');
        setStatus('error');
        setMessage('Invalid authentication callback');

        if (onAuthError) {
          onAuthError('Invalid callback parameters');
        }

        setTimeout(() => {
          navigate('/');
        }, 3000);

      } catch (error) {
        console.error('❌ OAuth callback handler error:', error);
        setStatus('error');
        setMessage('An error occurred during authentication');

        if (onAuthError) {
          onAuthError('Authentication callback error');
        }

        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, onAuthSuccess, onAuthError]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Processing Authentication
            </h2>
            <p className="text-gray-600 text-center">
              {message}
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              Authentication Successful!
            </h2>
            <p className="text-green-700 text-center">
              {message}
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-red-700 text-center mb-4">
              {message}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to App
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md">
        {renderContent()}
      </div>
    </div>
  );
};

export default OAuthCallbackHandler;