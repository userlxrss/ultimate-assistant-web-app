import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, Shield, User, Mail } from 'lucide-react';
import { signUpWithEmail, signInWithEmail, signOut, getCurrentUser, onAuthStateChange } from '../../supabase';

interface SupabaseAuthProps {
  onAuthSuccess?: (userInfo: any) => void;
  onAuthError?: (error: string) => void;
}

export const SupabaseAuth: React.FC<SupabaseAuthProps> = ({
  onAuthSuccess,
  onAuthError
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔥 Checking Supabase auth status...');
      // Use real Supabase authentication
      const user = await getCurrentUser();
      if (user) {
        console.log('🔥 User found:', user);
        const userData = {
          id: user.id,
          email: user.email,
          name: user.email?.split('@')[0] || 'User',
          picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email?.split('@')[0] || 'User')}&background=random`,
          provider: 'supabase'
        };
        setUserInfo(userData);
        setIsAuthenticated(true);
        onAuthSuccess?.(userData);
      } else {
        console.log('🔥 No authenticated user found');
      }
    } catch (err) {
      console.warn('Auth check failed:', err);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check email verification status for sign-up
      if (isSignUp) {
        const data = await signUpWithEmail(email, password);

        if (data.user) {
          // Check if email verification is required
          if (!data.user.email_confirmed_at) {
            setError('Please check your email and click the verification link before signing in.');
            onAuthError?.('Please verify your email before signing in. Check your inbox for the verification link.');
            return;
          }

          // Email is already confirmed, proceed with login
          const userData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.email?.split('@')[0] || 'User',
            picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.email?.split('@')[0] || 'User')}&background=random`,
            provider: 'supabase'
          };

          setUserInfo(userData);
          setIsAuthenticated(true);
          onAuthSuccess?.(userData);
        }
      } else {
        // Sign in flow
        const data = await signInWithEmail(email, password);

        if (data.user) {
          // Check if email is verified
          if (!data.user.email_confirmed_at) {
            setError('Please verify your email before signing in. Check your inbox for the verification link.');
            onAuthError?.('Please verify your email before signing in. Check your inbox for the verification link.');
            return;
          }

          const userData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.email?.split('@')[0] || 'User',
            picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.email?.split('@')[0] || 'User')}&background=random`,
            provider: 'supabase'
          };

          setUserInfo(userData);
          setIsAuthenticated(true);
          onAuthSuccess?.(userData);
        }
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMsg);
      onAuthError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setUserInfo(null);
      setEmail('');
      setPassword('');
      onAuthError?.('Signed out successfully');
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  const renderAuthForm = () => (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>
        <p className="text-gray-600">
          {isSignUp ? 'Join Productive Path today' : 'Welcome back to Productive Path'}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleEmailAuth}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
            </>
          ) : (
            <>
              <User className="w-5 h-5" />
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
            </>
          )}
        </button>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"
            }
          </button>
        </div>
      </div>

      {/* Demo Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-1">Demo Mode</h4>
            <p className="text-sm text-yellow-700">
              This is a demo authentication. In production, this will connect to your Supabase project.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserInfo = () => (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome Back!
        </h2>
        <p className="text-gray-600">
          You're successfully signed in to Productive Path
        </p>
      </div>

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

        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            <strong>Supabase Authentication Active</strong><br />
            Your session is secure and managed by Supabase.
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200"
        >
          Sign Out
        </button>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
      >
        Continue to Dashboard
      </button>
    </div>
  );

  return isAuthenticated && userInfo ? renderUserInfo() : renderAuthForm();
};

export default SupabaseAuth;