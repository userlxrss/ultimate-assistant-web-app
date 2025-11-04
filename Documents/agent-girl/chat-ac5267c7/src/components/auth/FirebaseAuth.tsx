import React, { useState, useEffect } from 'react';
import { signInWithGoogle, logoutUser, onAuthStateChange } from '../../firebase';
import { CheckCircle, AlertCircle, Loader2, Shield, User, Mail } from 'lucide-react';

interface FirebaseAuthProps {
  onAuthSuccess?: (userInfo: any) => void;
  onAuthError?: (error: string) => void;
}

export const FirebaseAuth: React.FC<FirebaseAuthProps> = ({
  onAuthSuccess,
  onAuthError
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        const userData = {
          id: user.uid,
          email: user.email,
          name: user.displayName,
          picture: user.photoURL,
          accessToken: user.refreshToken
        };
        setUserInfo(userData);
        setIsAuthenticated(true);
        onAuthSuccess?.(userData);
      } else {
        setUserInfo(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [onAuthSuccess]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await signInWithGoogle();
      console.log('Successfully signed in with Google:', user);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(errorMsg);
      onAuthError?.(errorMsg);
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      console.log('Successfully signed out');
      onAuthError?.('Signed out successfully');
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderAuthButton = () => (
    <button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full max-w-sm mx-auto flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg shadow-md hover:shadow-lg border border-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Sign in with Google</span>
        </>
      )}
    </button>
  );

  const renderUserInfo = () => (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="flex items-center gap-4 mb-4">
        {userInfo?.picture && (
          <img
            src={userInfo.picture}
            alt={userInfo.name}
            className="w-16 h-16 rounded-full border-2 border-gray-200"
          />
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{userInfo?.name}</h3>
          <p className="text-sm text-gray-600">{userInfo?.email}</p>
        </div>
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Connected</span>
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Firebase Authentication Active</strong><br />
          Your session is secure and managed by Firebase.
        </p>
      </div>

      <button
        onClick={handleSignOut}
        disabled={isLoading}
        className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
      >
        {isLoading ? 'Signing out...' : 'Sign Out'}
      </button>
    </div>
  );

  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Secure Authentication
        </h2>
        <p className="text-gray-600">
          Sign in with Google to access your productivity dashboard
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium">Authentication Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Auth Button or User Info */}
      {isAuthenticated && userInfo ? renderUserInfo() : renderAuthButton()}

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Secure & Private</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Firebase-powered authentication</li>
              <li>• No backend servers needed</li>
              <li>• Works in both localhost and production</li>
              <li>• Industry-standard security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseAuth;