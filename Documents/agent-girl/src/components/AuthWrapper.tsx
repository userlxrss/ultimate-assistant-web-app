import React, { Suspense, lazy, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, Shield } from 'lucide-react';
import AuthPage from '../pages/AuthPage';
import { getCurrentUser, onAuthStateChange } from '../supabase';

// Lazy load the main app
const MainApp = lazy(() => import('../MainApp'));

const AuthWrapper: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    console.log('🔥 AuthWrapper: Initializing real Supabase authentication...');

    // Check current auth status and listen for changes
    const checkAuthStatus = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const userData = {
            id: user.id,
            email: user.email,
            name: user.email?.split('@')[0] || 'User',
            picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email?.split('@')[0] || 'User')}&background=random`,
          };
          setUserInfo(userData);
          setIsAuthenticated(true);
          console.log('🔥 AuthWrapper: User authenticated:', userData);
        } else {
          console.log('🔥 AuthWrapper: No user authenticated, showing signup page');
          setIsAuthenticated(false);
        }
      } catch (err: any) {
        // Handle specific Supabase auth errors gracefully
        if (err?.message?.includes('AuthSessionMissing') || err?.message?.includes('session')) {
          console.log('🔥 AuthWrapper: No active session (normal for first-time visitors)');
        } else {
          console.error('🔥 AuthWrapper: Error checking auth status:', err);
        }
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      console.log('🔥 AuthWrapper: Auth state changed:', event, session);
      if (event === 'SIGNED_IN' && session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.email?.split('@')[0] || 'User',
          picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.email?.split('@')[0] || 'User')}&background=random`,
        };
        setUserInfo(userData);
        setIsAuthenticated(true);
        console.log('🔥 AuthWrapper: User signed in:', userData);
      } else if (event === 'SIGNED_OUT') {
        setUserInfo(null);
        setIsAuthenticated(false);
        console.log('🔥 AuthWrapper: User signed out');
      }
    });

    checkAuthStatus();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthSuccess = (user: any) => {
    setUserInfo(user);
    setIsAuthenticated(true);
  };

  const handleAuthError = () => {
    setIsAuthenticated(false);
    setUserInfo(null);
  };

  if (isLoading) {
    console.log('🔥 AuthWrapper: Rendering loading state');
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🔥 AuthWrapper: Rendering AuthPage - user not authenticated');
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  console.log('🔥 AuthWrapper: Rendering MainApp - user authenticated');
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }>
        <MainApp />
      </Suspense>
    </div>
  );
};

export default AuthWrapper;