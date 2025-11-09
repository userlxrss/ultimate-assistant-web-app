import React, { useState } from 'react';
import { Mail, Calendar, Users, Check, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface GoogleOAuthIntegrationProps {
  isConnected: boolean;
  user?: any;
  onConnect: () => void;
  onDisconnect: () => void;
}

function GoogleOAuthIntegration({
  isConnected,
  user,
  onConnect,
  onDisconnect
}: GoogleOAuthIntegrationProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    onConnect();
    // The connection status will be updated via the OAuth callback
    setTimeout(() => setIsConnecting(false), 5000); // Fallback timeout
  };

  const handleDisconnect = () => {
    onDisconnect();
  };

  const googleServices = [
    {
      icon: <Mail className="w-5 h-5" />,
      name: 'Gmail',
      description: 'Read, send, and manage your emails',
      color: 'text-red-600 dark:text-red-400'
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      name: 'Calendar',
      description: 'Access and manage your calendar events',
      color: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      icon: <Users className="w-5 h-5" />,
      name: 'Contacts',
      description: 'Sync your contacts and address book',
      color: 'text-green-600 dark:text-green-400'
    }
  ];

  return (
    <div className="glass-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Google Workspace
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Connect Gmail, Calendar, and Contacts
          </p>
        </div>
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          {/* Services Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {googleServices.map((service, index) => (
              <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className={service.color}>{service.icon}</div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {service.name}
                  </h4>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {service.description}
                </p>
              </div>
            ))}
          </div>

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                Connect Google Account
              </>
            )}
          </button>

          {/* Instructions */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
              What happens when you connect:
            </h4>
            <ol className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-decimal list-inside">
              <li>You'll be redirected to Google's secure login page</li>
              <li>Sign in with your Google account</li>
              <li>Review and grant permissions for Gmail, Calendar, and Contacts</li>
              <li>You'll be automatically returned to this app</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected Status */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  Google Account Connected
                </h4>
                {user && (
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Connected as {user.name} ({user.email})
                  </p>
                )}
              </div>
              {user?.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
              )}
            </div>
          </div>

          {/* Connected Services */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {googleServices.map((service, index) => (
              <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={service.color}>{service.icon}</div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {service.name}
                  </h4>
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400 ml-auto" />
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDisconnect}
              className="flex-1 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 font-medium"
            >
              Disconnect Google
            </button>
            <button
              onClick={handleConnect}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 font-medium"
            >
              Reconnect
            </button>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              📡 <span className="font-medium">Auto-sync:</span> Your Google services will automatically sync when you use the Calendar and Email modules
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export { GoogleOAuthIntegration };
