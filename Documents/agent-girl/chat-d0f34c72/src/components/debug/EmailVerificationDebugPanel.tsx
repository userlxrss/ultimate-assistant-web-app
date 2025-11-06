/**
 * Email Verification Debug Panel
 * Interactive debugging component for email verification issues
 */

import React, { useState, useEffect } from 'react';
import {
  Bug,
  CheckCircle,
  AlertTriangle,
  Info,
  Copy,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { emailVerificationDebugger, EmailVerificationDebugInfo } from '../../utils/emailVerificationDebugger';

export const EmailVerificationDebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<EmailVerificationDebugInfo | null>(null);
  const [redirectTest, setRedirectTest] = useState<any>(null);
  const [verificationTest, setVerificationTest] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedText, setCopiedText] = useState('');

  const refreshDebugInfo = async () => {
    setIsRefreshing(true);
    try {
      const info = emailVerificationDebugger.captureDebugInfo();
      const redirect = emailVerificationDebugger.testRedirectUrl();
      const verification = emailVerificationDebugger.testCurrentVerificationLink();

      setDebugInfo(info);
      setRedirectTest(redirect);
      setVerificationTest(verification);
    } catch (error) {
      console.error('Error refreshing debug info:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshDebugInfo();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(text);
      setTimeout(() => setCopiedText(''), 2000);
    });
  };

  const downloadDebugInfo = () => {
    const debugData = emailVerificationDebugger.exportDebugInfo();
    const blob = new Blob([debugData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-verification-debug-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openTestEmailFlow = () => {
    const testEmail = prompt('Enter test email address:', 'test@example.com');
    if (testEmail) {
      const simulation = emailVerificationDebugger.simulateEmailVerification(testEmail);
      alert(JSON.stringify(simulation, null, 2));
    }
  };

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <AlertTriangle className="w-5 h-5 text-red-600" />
    );
  };

  if (!debugInfo) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2">Loading debug information...</span>
        </div>
      </div>
    );
  }

  const totalIssues = [...(redirectTest?.issues || []), ...(verificationTest?.issues || [])].length;

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Bug className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Email Verification Debug Panel</h2>
          {totalIssues > 0 && (
            <span className="ml-3 px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full">
              {totalIssues} Issue{totalIssues > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshDebugInfo}
            disabled={isRefreshing}
            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center"
          >
            {showDetails ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>
      </div>

      {/* Quick Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg border ${redirectTest?.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Redirect URL</p>
              <p className="text-lg font-bold">{redirectTest?.isValid ? 'Valid' : 'Invalid'}</p>
            </div>
            {getStatusIcon(redirectTest?.isValid || false)}
          </div>
          <p className="text-xs text-gray-500 mt-2">{redirectTest?.url}</p>
        </div>

        <div className={`p-4 rounded-lg border ${verificationTest?.hasVerificationParams ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verification Params</p>
              <p className="text-lg font-bold">{verificationTest?.hasVerificationParams ? 'Present' : 'Missing'}</p>
            </div>
            {getStatusIcon(verificationTest?.hasVerificationParams)}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {Object.keys(verificationTest?.params || {}).length} parameters found
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${debugInfo.environment === 'production' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Environment</p>
              <p className="text-lg font-bold capitalize">{debugInfo.environment}</p>
            </div>
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{debugInfo.origin}</p>
        </div>
      </div>

      {/* Issues and Recommendations */}
      {totalIssues > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Issues Found</h3>
          <div className="space-y-2">
            {[...(redirectTest?.issues || []), ...(verificationTest?.issues || [])].map((issue, index) => (
              <div key={index} className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                <p className="text-sm text-red-800">{issue}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => copyToClipboard(debugInfo.expectedRedirectUrl)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Redirect URL
        </button>
        <button
          onClick={downloadDebugInfo}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Debug Info
        </button>
        <button
          onClick={openTestEmailFlow}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Test Email Flow
        </button>
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current URL Info */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Current URL Information</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current URL:</span>
                  <code className="bg-gray-100 px-1">{debugInfo.currentUrl}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Origin:</span>
                  <code className="bg-gray-100 px-1">{debugInfo.origin}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected Redirect:</span>
                  <code className="bg-gray-100 px-1">{debugInfo.expectedRedirectUrl}</code>
                </div>
              </div>
            </div>

            {/* Environment Info */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Environment Information</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Environment:</span>
                  <span className="font-medium">{debugInfo.environment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Supabase URL:</span>
                  <code className="bg-gray-100 px-1 text-xs">{debugInfo.supabaseUrl}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Timestamp:</span>
                  <span className="text-xs">{new Date(debugInfo.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Verification Parameters */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">URL Parameters</h4>
              {Object.keys(verificationTest?.params || {}).length > 0 ? (
                <div className="space-y-1 text-sm">
                  {Object.entries(verificationTest.params || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">{key}:</span>
                      <code className="bg-gray-100 px-1 text-xs">{String(value)}</code>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No verification parameters found</p>
              )}
            </div>

            {/* Session Information */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Session Information</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Has Session:</span>
                  <span className={debugInfo.sessionInfo?.hasSession ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.sessionInfo?.hasSession ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email Verified:</span>
                  <span className={debugInfo.sessionInfo?.emailVerified ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.sessionInfo?.emailVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Session Expired:</span>
                  <span className={debugInfo.sessionInfo?.isExpired ? 'text-red-600' : 'text-green-600'}>
                    {debugInfo.sessionInfo?.isExpired ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copied notification */}
      {copiedText && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
          <CheckCircle className="w-4 h-4 mr-2" />
          Copied to clipboard!
        </div>
      )}
    </div>
  );
};