/**
 * Enhanced Error Boundary Component
 * Specifically handles email verification errors with comprehensive error reporting
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Mail, ExternalLink } from 'lucide-react';
import { handleEmailVerificationError, EmailVerificationErrorType } from '../utils/emailVerificationErrorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: EmailVerificationErrorType | null;
  canRetry: boolean;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: null,
      canRetry: true,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Handle email verification errors specifically
    const handledError = handleEmailVerificationError(error, 'ErrorBoundary');

    this.setState({
      errorType: handledError.type,
      canRetry: handledError.canRetry,
    });

    // Log error details
    console.error('Error Boundary caught an error:', {
      error,
      errorInfo,
      handledError,
      timestamp: new Date().toISOString(),
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Track error for analytics
    this.trackError(error, errorInfo, handledError);
  }

  private trackError = (error: Error, errorInfo: ErrorInfo, handledError: any) => {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorType: handledError.type,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Store error history (limited to last 50 errors)
      const errorHistory = JSON.parse(localStorage.getItem('error_boundary_errors') || '[]');
      errorHistory.push(errorData);

      if (errorHistory.length > 50) {
        errorHistory.splice(0, errorHistory.length - 50);
      }

      localStorage.setItem('error_boundary_errors', JSON.stringify(errorHistory));
    } catch (e) {
      // Ignore tracking errors
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries && this.state.canRetry) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorType: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleContactSupport = () => {
    const emailBody = this.generateSupportEmail();
    const mailtoUrl = `mailto:support@dailydeck.app?subject=Email Verification Error&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl);
  };

  private generateSupportEmail = (): string => {
    const { error, errorInfo, errorType, retryCount } = this.state;

    return `
Hello DailyDeck Support,

I'm experiencing an issue with email verification. Here are the details:

Error Type: ${errorType || 'Unknown'}
Error Message: ${error?.message || 'No message available'}
Retry Count: ${retryCount}

Technical Details:
${error?.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}

Page URL: ${window.location.href}
Browser: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}

Please help me resolve this issue.

Thank you,
${new Date().toLocaleDateString()}
    `.trim();
  };

  private downloadErrorReport = () => {
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: {
        message: this.state.error?.message,
        stack: this.state.error?.stack,
      },
      errorInfo: {
        componentStack: this.state.errorInfo?.componentStack,
      },
      errorType: this.state.errorType,
      canRetry: this.state.canRetry,
      retryCount: this.state.retryCount,
      browser: {
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    };

    const blob = new Blob([JSON.stringify(errorReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  private getErrorIcon = () => {
    switch (this.state.errorType) {
      case EmailVerificationErrorType.NETWORK_ERROR:
      case EmailVerificationErrorType.SUPABASE_ERROR:
        return <RefreshCw className="w-12 h-12 text-orange-500" />;
      case EmailVerificationErrorType.EXPIRED_LINK:
      case EmailVerificationErrorType.INVALID_TOKEN:
        return <Mail className="w-12 h-12 text-red-500" />;
      case EmailVerificationErrorType.ALREADY_VERIFIED:
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-12 h-12 text-red-500" />;
    }
  };

  private getErrorMessage = () => {
    const { errorType, error } = this.state;

    if (errorType) {
      const handledError = handleEmailVerificationError(error, 'ErrorBoundary');
      return handledError.userMessage;
    }

    return 'Something went wrong while processing your email verification. Please try again or contact support.';
  };

  private getSuggestedActions = () => {
    const { errorType, error } = this.state;

    if (errorType) {
      const handledError = handleEmailVerificationError(error, 'ErrorBoundary');
      return handledError.suggestedActions;
    }

    return [
      'Try refreshing the page',
      'Check your internet connection',
      'Clear your browser cache',
      'Contact support if the problem persists',
    ];
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.canRetry && this.state.retryCount < this.maxRetries;
      const suggestedActions = this.getSuggestedActions();

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
            {/* Icon */}
            <div className="text-center mb-6">
              <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                {this.getErrorIcon()}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
              Verification Error
            </h1>

            {/* Message */}
            <p className="text-center text-gray-600 mb-6">
              {this.getErrorMessage()}
            </p>

            {/* Error Details (Development Mode) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 p-4 bg-gray-50 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Technical Details
                </summary>
                <div className="text-xs text-gray-600 space-y-2">
                  <div>
                    <strong>Error Type:</strong> {this.state.errorType}
                  </div>
                  <div>
                    <strong>Retry Count:</strong> {this.state.retryCount}/{this.maxRetries}
                  </div>
                  <div>
                    <strong>Can Retry:</strong> {this.state.canRetry ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Error Message:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>Timestamp:</strong> {new Date().toLocaleString()}
                  </div>
                </div>
              </details>
            )}

            {/* Suggested Actions */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Suggested Actions:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {suggestedActions.map((action, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Retry Button */}
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                  {this.state.retryCount > 0 && ` (${this.state.retryCount}/${this.maxRetries})`}
                </button>
              )}

              {/* Go Home Button */}
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </button>

              {/* Contact Support Button */}
              <button
                onClick={this.handleContactSupport}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </button>

              {/* Download Error Report */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={this.downloadErrorReport}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Download Error Report
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-center text-gray-500">
                Error ID: {Date.now().toString(36)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;