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
      console.log('🔥 Attempting Supabase authentication...');
      // Real Supabase authentication
      const data = isSignUp
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);

      if (data.user) {
        console.log('🔥 Supabase authentication successful:', data.user);
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

    } catch (err) {
      console.error('🔥 Supabase authentication error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMsg);
      onAuthError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEmailAuth();
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('🔥 Signing out from Supabase...');
      await signOut();
      setIsAuthenticated(false);
      setUserInfo(null);
      setEmail('');
      setPassword('');
      onAuthError?.('Signed out successfully');
      console.log('🔥 Successfully signed out');
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  const renderAuthForm = () => (
    <div className="max-w-sm mx-auto">
      {/* Logo & Brand */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg shadow-indigo-500/30 mb-3">
          <User className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-slate-600 text-sm">
          {isSignUp ? 'Join Productivity Hub today' : 'Sign in to access your workspace'}
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/50 border border-white/20 p-6">
        {/* Error Notification */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-1 text-sm">Authentication Error</h4>
                <p className="text-xs text-red-700 leading-relaxed">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="you@company.com"
                className="w-full px-3 py-2 pl-9 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your password"
                className="w-full px-3 py-2 pl-9 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Sign In Button */}
          <button
            onClick={handleEmailAuth}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-sm font-semibold rounded-lg shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
              </>
            ) : (
              <>
                <User className="w-4 h-4" />
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              </>
            )}
          </button>

          {/* Sign Up Link */}
          <div className="text-center pt-3">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors duration-200 group"
            >
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <span className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors duration-200">
                    Sign in →
                  </span>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <span className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors duration-200">
                    Get started →
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-500 mt-6">
        © 2025 Productivity Hub. All rights reserved.
      </p>
    </div>
  );

  const renderUserInfo = () => (
    <div className="max-w-sm mx-auto">
      {/* Logo & Brand */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg shadow-emerald-500/30 mb-3">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          Welcome Back!
        </h2>
        <p className="text-slate-600 text-sm">
          You're successfully signed in to Productivity Hub
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/50 border border-white/20 p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          {userInfo?.picture && (
            <div className="relative">
              <img
                src={userInfo.picture}
                alt={userInfo.name}
                className="w-16 h-16 rounded-xl border-3 border-white shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-1">{userInfo?.name}</h3>
            <p className="text-slate-600 text-sm font-medium">{userInfo?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-emerald-600">Connected & Secure</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-emerald-900 mb-1 text-sm">Supabase Authentication Active</h4>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Your session is secure and managed by Supabase with enterprise-grade encryption and security protocols.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-md"
        >
          Sign Out
        </button>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-sm font-semibold rounded-lg shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 transition-all duration-200"
      >
        Continue to Dashboard →
      </button>

      {/* Footer */}
      <p className="text-center text-xs text-slate-500 mt-6">
        © 2025 Productivity Hub. All rights reserved.
      </p>
    </div>
  );

  return isAuthenticated && userInfo ? renderUserInfo() : renderAuthForm();
};

export default SupabaseAuth;