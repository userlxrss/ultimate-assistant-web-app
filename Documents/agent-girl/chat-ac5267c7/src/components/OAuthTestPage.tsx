/**
 * OAUTH TEST PAGE - Simple testing interface
 */

import React, { useState, useEffect } from 'react';
import SimpleGoogleAuth from './SimpleGoogleAuth';

const OAuthTestPage: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [serverInfo, setServerInfo] = useState<any>(null);

  const OAUTH_SERVER_URL = 'http://localhost:3006';

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${OAUTH_SERVER_URL}/api/health`);
      if (response.ok) {
        const data = await response.json();
        setServerInfo(data);
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      console.error('Server health check failed:', error);
      setServerStatus('offline');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            OAuth 2.0 Test Page
          </h1>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Server Status</h2>
            <div className="flex items-center space-x-2">
              {serverStatus === 'checking' && (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Checking server...</span>
                </>
              )}
              {serverStatus === 'online' && (
                <>
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-green-600">Server Online</span>
                  <span className="text-gray-500 text-sm ml-2">
                    ({serverInfo?.service} v{serverInfo?.version} on port {serverInfo?.port})
                  </span>
                </>
              )}
              {serverStatus === 'offline' && (
                <>
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-red-600">Server Offline</span>
                  <span className="text-gray-500 text-sm ml-2">
                    (Start with: npm run oauth-server)
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Configuration</h2>
            <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono">
              <div><strong>OAuth Server:</strong> {OAUTH_SERVER_URL}</div>
              <div><strong>Frontend:</strong> http://localhost:5173</div>
              <div><strong>Redirect URI:</strong> {OAUTH_SERVER_URL}/auth/google/callback</div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Test Authentication</h2>
            <SimpleGoogleAuth />
          </div>

          {serverStatus === 'online' && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">✅ Ready to Test</h3>
              <p className="text-blue-700 text-sm mb-3">
                The OAuth server is running and ready for testing. Click "Sign in with Google" above to test the authentication flow.
              </p>
              <div className="text-xs text-blue-600">
                <p><strong>Expected flow:</strong></p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Click "Sign in with Google"</li>
                  <li>OAuth popup opens to Google</li>
                  <li>Sign in and grant permissions</li>
                  <li>Popup closes automatically</li>
                  <li>Success message appears</li>
                </ol>
              </div>
            </div>
          )}

          {serverStatus === 'offline' && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">❌ Server Not Running</h3>
              <p className="text-red-700 text-sm mb-3">
                The OAuth server is not running. Please start it with the following command:
              </p>
              <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                npm run oauth-server
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthTestPage;