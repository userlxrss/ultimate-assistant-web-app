import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { logger } from './utils/logger'

logger.debug('🚀 main.tsx is loading...');
logger.debug('React version:', React.version);

// Security: HTML escaping utility to prevent XSS
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Secure Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to secure logging service in production
  }

  render() {
    if (this.state.hasError) {
      return React.createElement(
        'div',
        {
          style: {
            color: '#dc2626',
            padding: '20px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            border: '1px solid #dc2626',
            borderRadius: '8px',
            margin: '20px',
            backgroundColor: '#fef2f2'
          }
        },
        React.createElement('h1', { style: { margin: '0 0 16px 0' } }, '❌ Application Error'),
        React.createElement('p', { style: { margin: '8px 0' } }, 'An unexpected error occurred.'),
        React.createElement('p', { style: { margin: '8px 0', fontSize: '14px', color: '#7f1d1d' } }, 
          'Please refresh the page or contact support if the problem persists.')
      );
    }

    return this.props.children;
  }
}

// Secure Error Display Component (no innerHTML)
const SecureErrorDisplay: React.FC<{ error: Error }> = ({ error }) => {
  return React.createElement(
    'div',
    {
      style: {
        color: '#dc2626',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        border: '1px solid #dc2626',
        borderRadius: '8px',
        margin: '20px',
        backgroundColor: '#fef2f2'
      }
    },
    React.createElement('h1', { style: { margin: '0 0 16px 0' } }, '❌ Render Error'),
    React.createElement('p', { style: { margin: '8px 0' } }, 'Failed to render the application.'),
    React.createElement('p', { 
      style: { 
        margin: '8px 0', 
        fontSize: '14px', 
        color: '#7f1d1d',
        fontFamily: 'monospace'
      } 
    }, `Error: ${escapeHtml(error.message)}`),
    React.createElement('p', { 
      style: { 
        margin: '16px 0 0 0', 
        fontSize: '14px',
        color: '#991b1b'
      } 
    }, 'Please check the console for more details.')
  );
};

try {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  logger.info('✅ React root created successfully');

  // Wrap app with error boundary
  root.render(
    React.createElement(
      ErrorBoundary,
      {},
      React.createElement(App)
    )
  );

  logger.info('✅ App rendered successfully');
} catch (error) {
  console.error('❌ Error rendering app:', error);
  
  // Secure error display using React.createElement instead of innerHTML
  const errorRoot = ReactDOM.createRoot(document.getElementById('root')!);
  errorRoot.render(
    React.createElement(SecureErrorDisplay, { error: error as Error })
  );
  
  // Also set CSP meta tag for additional protection
  const cspMeta = document.createElement('meta');
  cspMeta.httpEquiv = 'Content-Security-Policy';
  cspMeta.content = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  document.head.appendChild(cspMeta);
}
