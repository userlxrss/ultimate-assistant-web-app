import React, { useState, useEffect } from 'react';
import { serverAPI } from '../../utils/serverAPI';
import { useNotifications } from '../NotificationSystem';
import { GoogleOAuthIntegration } from './GoogleOAuthIntegration';
import { MotionOAuthIntegration } from './MotionOAuthIntegration';

interface OAuthIntegrationProps {
  onServiceConnected?: (service: string) => void;
}

function OAuthIntegration({ onServiceConnected }: OAuthIntegrationProps) {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showSuccess, showError, showInfo } = useNotifications();

  useEffect(() => {
    loadAuthStatus();

    // Listen for service connection events
    const handleServiceConnected = (event: CustomEvent) => {
      const { service } = event.detail;
      showSuccess(`${service} Connected`, `${service} has been successfully connected to your account`);
      loadAuthStatus(); // Refresh status
      onServiceConnected?.(service);
    };

    const handleServiceConnectionError = (event: CustomEvent) => {
      const { service, error } = event.detail;
      showError(`${service} Connection Failed`, error);
    };

    window.addEventListener('service-connected', handleServiceConnected as EventListener);
    window.addEventListener('service-connection-error', handleServiceConnectionError as EventListener);

    return () => {
      window.removeEventListener('service-connected', handleServiceConnected as EventListener);
      window.removeEventListener('service-connection-error', handleServiceConnectionError as EventListener);
    };
  }, [onServiceConnected]);

  const loadAuthStatus = async () => {
    try {
      setIsLoading(true);
      const response = await serverAPI.getAuthStatus();
      if (response.data) {
        setAuthStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to load auth status:', error);
      // Don't show error for missing server - it's expected when server isn't running
      if (!(error instanceof TypeError && error.message.includes('Failed to fetch'))) {
        showError('Error', 'Failed to load connection status');
      }
      // Set default auth status when server is unavailable
      setAuthStatus({
        google: { connected: false },
        motion: { connected: false }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (service: 'google' | 'motion') => {
    try {
      const response = await serverAPI.disconnectService(service);
      if (response.success) {
        showSuccess('Disconnected', `${service} has been disconnected`);
        loadAuthStatus(); // Refresh status
      } else {
        showError('Error', response.error || 'Failed to disconnect service');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      showError('Error', 'Failed to disconnect service');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Connect Your Services
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Securely connect your Google and Motion accounts for seamless integration
        </p>
        {authStatus?.connected && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            {Object.values(authStatus.services).filter(Boolean).length} service(s) connected
          </div>
        )}
      </div>

      {/* Google Integration */}
      <GoogleOAuthIntegration
        isConnected={authStatus?.services?.google || false}
        user={authStatus?.user}
        onConnect={() => serverAPI.connectGoogle()}
        onDisconnect={() => handleDisconnect('google')}
      />

      {/* Motion Integration */}
      <MotionOAuthIntegration
        isConnected={authStatus?.services?.motion || false}
        onConnect={async (apiKey) => {
          try {
            const response = await serverAPI.connectMotion(apiKey);
            if (response.success) {
              showSuccess('Motion Connected', 'Motion API has been connected successfully');
              loadAuthStatus();
              onServiceConnected?.('Motion');
            } else {
              showError('Connection Failed', response.error || 'Failed to connect Motion');
            }
          } catch (error) {
            console.error('Motion connection error:', error);
            showError('Connection Failed', 'Failed to connect Motion API');
          }
        }}
        onDisconnect={() => handleDisconnect('motion')}
      />

      {/* Security Notice */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Secure & Private Connection
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Your credentials are stored securely on our server using industry-standard OAuth 2.0 authentication.
              We never store your passwords and only access the data you explicitly authorize.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { OAuthIntegration };
