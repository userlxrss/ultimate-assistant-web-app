import React, { useState, useCallback, useEffect } from 'react';
import {
  Calendar,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Link as LinkIcon,
  ExternalLink,
  Settings,
  RefreshCw,
  Shield
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  connected: boolean;
  scopes?: string[];
}

interface EnhancedOAuthIntegrationProps {
  onServiceConnected?: (service: string) => void;
  compact?: boolean;
}

export const EnhancedOAuthIntegration: React.FC<EnhancedOAuthIntegrationProps> = ({
  onServiceConnected,
  compact = false
}) => {
  const [services, setServices] = useState<Service[]>([
    {
      id: 'google',
      name: 'Google Services',
      description: 'Calendar & Gmail integration',
      icon: <Calendar className="w-5 h-5" />,
      color: 'blue',
      connected: false,
      scopes: ['calendar.readonly', 'gmail.readonly']
    },
    {
      id: 'motion',
      name: 'Motion',
      description: 'AI-powered task scheduling',
      icon: <Clock className="w-5 h-5" />,
      color: 'purple',
      connected: false
    }
  ]);

  const [isConnecting, setIsConnecting] = useState<{ [key: string]: boolean }>({});
  const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: string }>({});
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>>([]);

  // Check existing connections on mount
  useEffect(() => {
    checkExistingConnections();
  }, []);

  const checkExistingConnections = async () => {
    try {
      const [googleResponse, motionResponse] = await Promise.all([
        fetch('http://localhost:3006/api/auth/status/google', { credentials: 'include' }),
        fetch('http://localhost:3006/api/auth/status/motion', { credentials: 'include' })
      ]);

      const googleData = await googleResponse.json();
      const motionData = await motionResponse.json();

      setServices(prev => prev.map(service => ({
        ...service,
        connected: service.id === 'google' ? googleData.connected : motionData.connected
      })));
    } catch (error) {
      console.warn('Failed to check existing connections:', error);
    }
  };

  const showNotification = useCallback((
    type: 'success' | 'error' | 'info',
    title: string,
    message: string
  ) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, title, message }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const showError = useCallback((title: string, message: string) => {
    showNotification('error', title, message);
  }, [showNotification]);

  const showSuccess = useCallback((title: string, message: string) => {
    showNotification('success', title, message);
    onServiceConnected?.(title);
  }, [showNotification, onServiceConnected]);

  const handleOAuthCallback = useCallback((service: string, success: boolean, error?: string) => {
    setIsConnecting(prev => ({ ...prev, [service]: false }));

    if (success) {
      setServices(prev => prev.map(s =>
        s.id === service ? { ...s, connected: true } : s
      ));
      showSuccess(service.charAt(0).toUpperCase() + service.slice(1), 'Connected successfully');
    } else {
      showError('Connection Failed', error || `Failed to connect to ${service}`);
    }
  }, [showSuccess, showError]);

  // Connect Google OAuth
  const connectGoogle = useCallback(async () => {
    setIsConnecting(prev => ({ ...prev, google: true }));
    setConnectionStatus(prev => ({ ...prev, google: 'Initiating OAuth flow...' }));

    try {
      const width = 500;
      const height = 600;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;

      const popup = window.open(
        'http://localhost:3006/auth/google',
        'google-oauth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        throw new Error('Failed to open OAuth window. Please allow popups for this site.');
      }

      // Listen for OAuth callback
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== 'http://localhost:5174') return;

        if (event.data.type === 'oauth-callback') {
          window.removeEventListener('message', messageHandler);
          popup.close();
          handleOAuthCallback('google', event.data.success, event.data.error);
        }
      };

      window.addEventListener('message', messageHandler);

      // Handle popup closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          handleOAuthCallback('google', false, 'OAuth window was closed before completion');
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        if (!popup.closed) {
          popup.close();
        }
        handleOAuthCallback('google', false, 'OAuth flow timed out');
      }, 5 * 60 * 1000);

    } catch (error) {
      setIsConnecting(prev => ({ ...prev, google: false }));
      showError('Google OAuth Error', error instanceof Error ? error.message : 'Failed to start OAuth flow');
    }
  }, [handleOAuthCallback, showError]);

  // Connect Motion API
  const connectMotion = useCallback(() => {
    setIsConnecting(prev => ({ ...prev, motion: true }));
    setConnectionStatus(prev => ({ ...prev, motion: 'Redirecting to Motion OAuth...' }));

    try {
      // REAL OAuth: Redirect user to Motion's actual login page
      const MOTION_CLIENT_ID = import.meta.env.VITE_MOTION_CLIENT_ID || 'your-motion-client-id'; // Replace with your actual Motion client ID
      const REDIRECT_URI = encodeURIComponent('http://localhost:5175/auth/motion/callback');
      const SCOPE = 'tasks:read tasks:write calendar:read';
      const STATE = Math.random().toString(36).substring(7);

      // Build REAL OAuth URL - this will take user to Motion's login page
      const motionOAuthUrl = `https://app.usemotion.com/oauth/authorize?client_id=${MOTION_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}&state=${STATE}`;

      console.log('🔗 Redirecting to Motion OAuth page:', motionOAuthUrl);

      // REDIRECT USER TO MOTION'S ACTUAL LOGIN PAGE
      // Open OAuth popup
      const popup = window.open(
        motionOAuthUrl,
        'motion-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Check if popup was blocked
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        alert('Popup blocked! Please allow popups for this site and try again.');
        setIsConnecting(false);
        return;
      }

      // Listen for OAuth callback
      const handleOAuthCallback = (event) => {
        if (event.data.type === 'motion-oauth-callback') {
          window.removeEventListener('message', handleOAuthCallback);
          setIsConnecting(false);
        }
      };

      window.addEventListener('message', handleOAuthCallback);;
    } catch (error) {
      showError('Motion OAuth Error', error instanceof Error ? error.message : 'Failed to start Motion OAuth');
      setIsConnecting(prev => ({ ...prev, motion: false }));
      delete setConnectionStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus.motion;
        return newStatus;
      });
    }
  }, [showError]);

  // Disconnect service
  const disconnectService = useCallback(async (serviceId: string) => {
    try {
      const response = await fetch(`http://localhost:3006/api/auth/disconnect/${serviceId}`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `Failed to disconnect ${serviceId}`);
      }

      setServices(prev => prev.map(s =>
        s.id === serviceId ? { ...s, connected: false } : s
      ));

      if (serviceId === 'motion') {
        localStorage.removeItem('motion_api_key');
      }

      showNotification('info', serviceId.charAt(0).toUpperCase() + serviceId.slice(1), 'Disconnected successfully');

    } catch (error) {
      showError('Disconnection Error', error instanceof Error ? error.message : `Failed to disconnect ${serviceId}`);
    }
  }, [showError, showNotification]);

  const getApiKeyPrefix = (apiKey: string): string => {
    if (!apiKey) return '';
    if (apiKey.startsWith('mot_')) return 'mot_';
    if (apiKey.startsWith('AARv')) return 'AARv';
    return apiKey.substring(0, 4) + '...';
  };

  return (
    <div className={`space-y-4 ${compact ? 'p-4' : 'p-6'}`}>
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg border max-w-sm animate-slide-in-right ${
              notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-start gap-3">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : notification.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              ) : (
                <RefreshCw className="w-5 h-5 text-blue-600 mt-0.5" />
              )}
              <div>
                <h4 className="font-medium">{notification.title}</h4>
                <p className="text-sm opacity-90">{notification.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      {!compact && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Service Connections
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Connect your favorite services to unlock powerful features
          </p>
        </div>
      )}

      {/* Services Grid */}
      <div className={compact ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
        {services.map(service => (
          <div
            key={service.id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border ${
              service.connected
                ? 'border-green-200 dark:border-green-800'
                : 'border-gray-200 dark:border-gray-700'
            } p-6 transition-all duration-200 hover:shadow-xl`}
          >
            {/* Service Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 bg-${service.color}-100 dark:bg-${service.color}-900 rounded-lg flex items-center justify-center ${
                service.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                service.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {service.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {service.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {service.description}
                </p>
              </div>
              {service.connected && (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              )}
            </div>

            {/* Connection Status */}
            {isConnecting[service.id] && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-sm text-blue-800 dark:text-blue-200">
                    {connectionStatus[service.id] || 'Connecting...'}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {service.connected ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Successfully connected to {service.name}
                      {service.id === 'motion' && (
                        <span className="block text-xs mt-1">
                          Using {getApiKeyPrefix(localStorage.getItem('motion_api_key') || '')} key
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => disconnectService(service.id)}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => service.id === 'google' ? connectGoogle() : connectMotion()}
                  disabled={isConnecting[service.id]}
                  className={`w-full py-2 bg-${service.color}-600 hover:bg-${service.color}-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
                    service.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                    service.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                    'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {isConnecting[service.id] ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4" />
                      Connect {service.name}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Service-specific info */}
            {service.id === 'google' && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Permissions requested:</strong>
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                  <li>• Read calendar events</li>
                  <li>• Read Gmail messages</li>
                  <li>• Send emails on your behalf</li>
                </ul>
              </div>
            )}

            {service.id === 'motion' && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Get your API key:</strong>{' '}
                  <a
                    href="https://app.usemotion.com/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 underline flex items-center gap-1"
                  >
                    Motion Settings
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Security Notice */}
      {!compact && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Secure & Private
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                All connections are encrypted and your data is never shared with third parties.
                You can disconnect services at any time.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};