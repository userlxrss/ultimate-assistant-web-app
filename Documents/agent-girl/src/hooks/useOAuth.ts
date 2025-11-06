import { useState, useCallback } from 'react';

interface ConnectionState {
  google: boolean;
  motion: boolean;
}

interface UseOAuthReturn {
  initiateGoogleOAuth: () => Promise<boolean>;
  connectMotionApi: (apiKey: string) => Promise<boolean>;
  disconnectService: (service: 'google' | 'motion') => Promise<boolean>;
  isConnecting: ConnectionState;
  connectionError: string | null;
  clearError: () => void;
}

export const useOAuth = (): UseOAuthReturn => {
  const [isConnecting, setIsConnecting] = useState<ConnectionState>({
    google: false,
    motion: false
  });
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setConnectionError(null);
  }, []);

  const initiateGoogleOAuth = useCallback(async (): Promise<boolean> => {
    setIsConnecting(prev => ({ ...prev, google: true }));
    clearError();

    try {
      // Generate popup window dimensions
      const width = 500;
      const height = 600;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;

      // Open OAuth popup
      const popup = window.open(
        'http://localhost:3006/auth/google',
        'google-oauth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        throw new Error('Failed to open OAuth window. Please allow popups for this site.');
      }

      // Return a promise that resolves when OAuth completes
      return new Promise((resolve) => {
        const messageHandler = (event: MessageEvent) => {
          // Verify origin for security
          if (event.origin !== 'http://localhost:5174') return;

          if (event.data.type === 'oauth-callback') {
            window.removeEventListener('message', messageHandler);
            popup.close();

            if (event.data.success) {
              resolve(true);
            } else {
              setConnectionError(event.data.error || 'Google OAuth failed');
              resolve(false);
            }
          }
        };

        window.addEventListener('message', messageHandler);

        // Cleanup if popup is closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            setConnectionError('OAuth window was closed before completion');
            resolve(false);
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          if (!popup.closed) {
            popup.close();
          }
          setConnectionError('OAuth flow timed out');
          resolve(false);
        }, 5 * 60 * 1000);
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate Google OAuth';
      setConnectionError(errorMessage);
      return false;
    } finally {
      setIsConnecting(prev => ({ ...prev, google: false }));
    }
  }, [clearError]);

  const connectMotionApi = useCallback(async (apiKey: string): Promise<boolean> => {
    if (!apiKey.trim()) {
      setConnectionError('API key is required');
      return false;
    }

    // Accept both "mot_" and "AARv" prefixed API keys
    if (!apiKey.startsWith('mot_') && !apiKey.startsWith('AARv')) {
      setConnectionError('Invalid Motion API key format. API keys should start with "mot_" or "AARv"');
      return false;
    }

    setIsConnecting(prev => ({ ...prev, motion: true }));
    clearError();

    try {
      const response = await fetch('http://localhost:3006/auth/motion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to connect Motion API');
      }

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect Motion API';
      setConnectionError(errorMessage);
      return false;
    } finally {
      setIsConnecting(prev => ({ ...prev, motion: false }));
    }
  }, [clearError]);

  const disconnectService = useCallback(async (service: 'google' | 'motion'): Promise<boolean> => {
    clearError();

    try {
      const response = await fetch(`http://localhost:3006/api/auth/disconnect/${service}`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `Failed to disconnect ${service}`);
      }

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to disconnect ${service}`;
      setConnectionError(errorMessage);
      return false;
    }
  }, [clearError]);

  return {
    initiateGoogleOAuth,
    connectMotionApi,
    disconnectService,
    isConnecting,
    connectionError,
    clearError
  };
};