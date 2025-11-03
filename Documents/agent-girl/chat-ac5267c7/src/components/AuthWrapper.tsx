import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, Shield } from 'lucide-react';

// Lazy load the main app
const MainApp = lazy(() => import('../MainApp'));

const AuthWrapper: React.FC = () => {
  const navigate = useNavigate();

  // For now, just render the MainApp directly
  // TODO: Add proper authentication logic here
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