import React, { Suspense, lazy, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, Shield } from 'lucide-react';
import AuthPage from '../pages/AuthPage';

// Lazy load the main app
const MainApp = lazy(() => import('../MainApp'));

const AuthWrapper: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    console.log('🔥 AuthWrapper: Initializing Supabase authentication...');

    // Check if user is already authenticated in localStorage
    const checkAuthStatus = () => {
      try {
        const storedUser = localStorage.getItem('supabase_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserInfo(user);
          setIsAuthenticated(true);
          console.log('🔥 AuthWrapper: User found in localStorage:', user);
        } else {
          console.log('🔥 AuthWrapper: No user found, showing signup page');
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('🔥 AuthWrapper: Error checking auth status:', err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
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