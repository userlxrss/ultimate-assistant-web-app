import React, { useState } from 'react';
import { RefreshCw, Check, AlertCircle, Key, Link, Eye, EyeOff } from 'lucide-react';

interface MotionOAuthIntegrationProps {
  isConnected: boolean;
  onConnect: (apiKey: string) => void;
  onDisconnect: () => void;
}

export const MotionOAuthIntegration: React.FC<MotionOAuthIntegrationProps> = ({
  isConnected,
  onConnect,
  onDisconnect
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setConnectionStatus('Please enter your Motion API key');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('Connecting to Motion...');

    try {
      await onConnect(apiKey.trim());
      setConnectionStatus('Successfully connected to Motion!');
      setApiKey('');
    } catch (error) {
      setConnectionStatus(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    setConnectionStatus('Disconnected from Motion');
  };

  const copyInstructions = () => {
    const instructions = `To get your Motion API key:

1. Go to https://app.usemotion.com/
2. Click on your profile in the top-right corner
3. Select "Settings" from the dropdown menu
4. Navigate to the "API" section
5. Click "Generate API Key" if you don't have one
6. Copy your API key and paste it below

Your API key will start with "mot_" followed by random characters.`;

    navigator.clipboard.writeText(instructions);
  };

  return (
    <div className="glass-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Motion API
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Connect your Motion account for task management
          </p>
        </div>
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motion API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="mot_1234567890abcdef..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Your API key is secure and stored only on your device
            </p>
          </div>

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            disabled={isConnecting || !apiKey.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Link className="w-4 h-4" />
                Connect Motion Account
              </>
            )}
          </button>

          {/* Instructions */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-amber-900 dark:text-amber-100">
                How to get your API key:
              </h4>
              <button
                onClick={copyInstructions}
                className="p-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                title="Copy instructions"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <ol className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://app.usemotion.com/" target="_blank" rel="noopener noreferrer" className="underline font-medium">Motion.app</a></li>
              <li>Click your profile → Settings → API</li>
              <li>Generate or copy your API key</li>
              <li>Paste it in the field above</li>
            </ol>
          </div>

          {/* Connection Status */}
          {connectionStatus && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              connectionStatus.includes('Successfully') || connectionStatus.includes('Connected')
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : connectionStatus.includes('Failed') || connectionStatus.includes('Error')
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }`}>
              <div className="flex items-center gap-2">
                {connectionStatus.includes('Successfully') || connectionStatus.includes('Connected') ? (
                  <Check className="w-4 h-4" />
                ) : connectionStatus.includes('Failed') || connectionStatus.includes('Error') ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                )}
                <span>{connectionStatus}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected Status */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  Motion API Connected
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your Motion account is connected and ready to sync tasks
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                📋 Task Management
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Sync and manage your Motion tasks
              </p>
            </div>
            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                📅 Smart Scheduling
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                AI-powered task scheduling
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDisconnect}
              className="flex-1 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 font-medium"
            >
              Disconnect Motion
            </button>
            <button
              onClick={() => setApiKey('')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 font-medium"
            >
              Update API Key
            </button>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              🚀 <span className="font-medium">Ready to go:</span> Your Motion tasks will automatically sync in the Tasks module
            </p>
          </div>
        </div>
      )}
    </div>
  );
};