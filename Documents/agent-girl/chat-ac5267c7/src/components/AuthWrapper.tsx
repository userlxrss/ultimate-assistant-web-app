import React, { Suspense, lazy, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, Shield } from 'lucide-react';
import { onAuthStateChange } from '../firebase';
import AuthPage from '../pages/AuthPage';

// Lazy load the main app
const MainApp = lazy(() => import('../MainApp'));

const AuthWrapper: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // Use Firebase authentication - no backend needed!
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        const userData = {
          id: user.uid,
          email: user.email,
          name: user.displayName,
          picture: user.photoURL
        };
        setUserInfo(userData);
        setIsAuthenticated(true);
      } else {
        setUserInfo(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
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
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

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