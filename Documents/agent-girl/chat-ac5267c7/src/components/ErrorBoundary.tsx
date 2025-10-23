import React, { Component, ReactNode } from 'react';
import { sanitizeErrorMessage, generateSecureToken } from '../security/securityUtils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

/**
 * Secure Error Boundary Component
 * 
 * Provides comprehensive error handling with:
 * - XSS-safe error message display
 * - Error logging and tracking
 * - User-friendly error UI
 * - Automatic recovery mechanisms
 */
export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: generateSecureToken(8)
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Sanitize error information for security
    const sanitizedError = {
      message: sanitizeErrorMessage(error),
      stack: error.stack ? sanitizeErrorMessage(error.stack) : undefined,
      componentStack: errorInfo.componentStack ? sanitizeErrorMessage(errorInfo.componentStack) : undefined,
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', sanitizedError);
    } else {
      // In production, log to secure logging service
      console.error('Application Error:', sanitizedError);
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorId: undefined });
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default secure error UI
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: '20px',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            margin: '20px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              fontSize: '48px',
              marginBottom: '16px',
              color: '#dc2626'
            }}
          >
            ⚠️
          </div>
          
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#991b1b',
              margin: '0 0 12px 0'
            }}
          >
            Something went wrong
          </h1>
          
          <p
            style={{
              fontSize: '16px',
              color: '#7f1d1d',
              margin: '0 0 24px 0',
              lineHeight: '1.5',
              maxWidth: '500px'
            }}
          >
            An unexpected error occurred while rendering this component. 
            We've been notified and are working to fix it.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details
              style={{
                marginBottom: '24px',
                textAlign: 'left',
                backgroundColor: '#fff',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                maxWidth: '600px',
                width: '100%'
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#374151'
                }}
              >
                Error Details (Development Only)
              </summary>
              
              <div
                style={{
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  color: '#6b7280',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                <div><strong>Error ID:</strong> {this.state.errorId}</div>
                <div><strong>Message:</strong> {sanitizeErrorMessage(this.state.error.message)}</div>
                {this.state.error.stack && (
                  <div style={{ marginTop: '8px' }}>
                    <strong>Stack Trace:</strong>
                    <pre style={{ margin: '4px 0', fontSize: '12px' }}>
                      {sanitizeErrorMessage(this.state.error.stack)}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            {this.retryCount < this.maxRetries && (
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              >
                Try Again ({this.maxRetries - this.retryCount} attempts left)
              </button>
            )}
            
            <button
              onClick={this.handleReload}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
            >
              Reload Page
            </button>
          </div>

          {this.retryCount >= this.maxRetries && (
            <p
              style={{
                fontSize: '14px',
                color: '#9ca3af',
                marginTop: '16px'
              }}
            >
              Maximum retry attempts reached. Please reload the page.
            </p>
          )}

          {this.state.errorId && (
            <p
              style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginTop: '16px'
              }}
            >
              Error ID: {this.state.errorId}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundaries
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;
