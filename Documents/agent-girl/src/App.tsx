import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { AppearanceStorage } from './utils/appearanceStorage';

// 🚀 LAZY LOADING for instant initial load!
const AuthWrapper = lazy(() => import('./components/AuthWrapper'));
const EmailVerification = lazy(() => import('./pages/EmailVerification'));

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
  // EMERGENCY: DISABLE appearance initialization to prevent conflicts
  useEffect(() => {
    console.log('🚨 EMERGENCY: Skipping appearance initialization to prevent conflicts');

    // Apply simple stable defaults without async storage
    try {
      document.documentElement.classList.remove('dark', 'font-small', 'font-medium', 'font-large', 'compact-mode');
      document.documentElement.classList.add('font-medium');
      console.log('✅ Emergency: Applied stable appearance defaults');
    } catch (error) {
      console.error('❌ Emergency appearance setup failed:', error);
    }
  }, []);

  return (
    <ErrorBoundary>
      <div className="App">
        <style>{`
          /* Profile Dropdown Animations */
          .profile-dropdown-enter {
            animation: dropdownSlideIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          @keyframes dropdownSlideIn {
            from {
              opacity: 0;
              transform: translateY(-10px) scale(0.95);
              transform-origin: top right;
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
              transform-origin: top right;
            }
          }

          .profile-dropdown-exit {
            animation: dropdownSlideOut 150ms ease-in-out;
          }

          @keyframes dropdownSlideOut {
            from {
              opacity: 1;
              transform: translateY(0) scale(1);
              transform-origin: top right;
            }
            to {
              opacity: 0;
              transform: translateY(-10px) scale(0.95);
              transform-origin: top right;
            }
          }

          /* Enhanced hover states for dropdown items */
          .profile-dropdown-item {
            position: relative;
            overflow: hidden;
          }

          .profile-dropdown-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            transition: left 0.5s;
          }

          .profile-dropdown-item:hover::before {
            left: 100%;
          }

          /* Profile button active state */
          .profile-button-active {
            position: relative;
          }

          .profile-button-active::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 0.75rem;
            background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(99,102,241,0.1) 100%);
            animation: pulseActive 2s infinite;
          }

          @keyframes pulseActive {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/verify" element={<EmailVerification />} />
              <Route path="/login" element={<AuthWrapper />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/*" element={<AuthWrapper />} />
            </Routes>
          </Suspense>
        </Router>
      </div>
    </ErrorBoundary>
  );
}

export default App;
