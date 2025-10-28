import React, { Suspense, lazy } from 'react';
import ErrorBoundary from './components/ErrorBoundary';

// 🚀 LAZY LOADING for instant initial load!
const MainApp = lazy(() => import('./MainApp'));

// 🎯 Loading component for better UX
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid rgba(255,255,255,0.3)',
        borderTop: '4px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px'
      }} />
      <h2 style={{ margin: '0', fontWeight: '600' }}>Loading Dashboard...</h2>
      <p style={{ margin: '10px 0 0', opacity: 0.8 }}>Optimizing your experience</p>
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <Suspense fallback={<LoadingSpinner />}>
          <MainApp />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

export default App;
