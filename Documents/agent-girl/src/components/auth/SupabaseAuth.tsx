import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, Shield, User, Mail, Eye, EyeOff } from 'lucide-react';
import { signUpWithEmail, signInWithEmail, signOut, getCurrentUser, onAuthStateChange, supabase } from '../../supabase';

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
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Additional states
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    checkAuthStatus();
  }, []);

  // Show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Only validate sign-up specific fields if signing up
    if (isSignUp) {
      if (!fullName.trim()) {
        errors.fullName = 'Full name is required';
      }

      if (!username.trim()) {
        errors.username = 'Username is required';
      } else if (username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
      }

      if (!confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    // Always validate email and password for both sign in and sign up
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (isSignUp && !validatePassword(password)) {
      errors.password = 'Password must be at least 8 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check username uniqueness
  const checkUsernameUniqueness = async (username: string) => {
    try {
      // This would require a profiles table in Supabase
      // For now, we'll skip this check but you can implement it later
      // const { data, error } = await supabase
      //   .from('profiles')
      //   .select('username')
      //   .eq('username', username)
      //   .single();

      // if (data) {
      //   return false; // Username already exists
      // }

      return true; // Username is available
    } catch (error) {
      console.error('Error checking username:', error);
      return true; // Assume available if check fails
    }
  };

  // Clear errors when user starts typing
  const clearErrors = () => {
    console.log('🧹 Clearing errors and notifications');
    setError(null);
    setNotification(null);
    setValidationErrors({});

    // Also notify parent component to clear any error states
    onAuthError?.('');
  };

  // Handle form submission with Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearErrors(); // Clear errors before attempting auth
      if (!showForgotPassword) {
        handleEmailAuth();
      } else {
        handleForgotPassword();
      }
    }
  };

  // Clear errors when user focuses on input fields
  const handleInputFocus = () => {
    clearErrors();
  };

  // Clear errors when user changes form mode
  const handleModeChange = () => {
    clearErrors();
    setIsSignUp(!isSignUp);
  };

  // Clear errors when switching to/forgot password
  const handleForgotPasswordToggle = () => {
    clearErrors();
    setShowForgotPassword(!showForgotPassword);
    if (!showForgotPassword) {
      // Moving to forgot password, set email from main form
      setForgotPasswordEmail(email);
    } else {
      // Moving back to main form, clear forgot password email
      setForgotPasswordEmail('');
    }
  };

  // Handle specific Supabase authentication errors
  const handleAuthError = (error: any) => {
    console.error('🔥 Authentication error:', error);
    console.error('🔥 Error details:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      name: error?.name
    });

    let errorMessage = 'An error occurred during authentication';

    // Handle specific Supabase error codes and messages
    if (error?.message) {
      const message = error.message.toLowerCase();

      console.log('🔍 Analyzing error message:', message);

      // Invalid credentials (most common)
      if (message.includes('invalid login credentials') ||
          message.includes('invalid credentials') ||
          message.includes('wrong password') ||
          message.includes('incorrect password')) {
        errorMessage = 'Invalid email or password. Please try again.';
        console.log('📍 Error type: Invalid credentials');
      }
      // Email not confirmed/verified
      else if (message.includes('email not confirmed') ||
                 message.includes('email not verified') ||
                 message.includes('email verification') ||
                 message.includes('confirmation required')) {
        errorMessage = 'Please verify your email before signing in. Check your inbox for the verification link.';
        console.log('📍 Error type: Email not verified');
      }
      // User not found
      else if (message.includes('user not found') ||
                 message.includes('no user found') ||
                 message.includes('user not registered') ||
                 message.includes('invalid email') ||
                 message.includes('no rows returned')) {
        errorMessage = 'No account found with this email. Please sign up first.';
        console.log('📍 Error type: User not found');
      }
      // Network/connection errors
      else if (message.includes('network') ||
                 message.includes('connection') ||
                 message.includes('fetch') ||
                 message.includes('timeout') ||
                 message.includes('failed to fetch') ||
                 message.includes('cors')) {
        errorMessage = 'Connection error. Please check your internet and try again.';
        console.log('📍 Error type: Network/connection error');
      }
      // Rate limiting
      else if (message.includes('too many requests') ||
                 message.includes('rate limit') ||
                 message.includes('too many attempts')) {
        errorMessage = 'Too many login attempts. Please try again in a few minutes.';
        console.log('📍 Error type: Rate limit exceeded');
      }
      // Email already registered (for sign up)
      else if (message.includes('email already registered') ||
                 message.includes('user already registered') ||
                 message.includes('duplicate')) {
        errorMessage = 'An account with this email already exists. Please sign in.';
        console.log('📍 Error type: Email already registered');
      }
      // Weak password (for sign up)
      else if (message.includes('weak password') ||
                 message.includes('password should be') ||
                 message.includes('password too weak')) {
        errorMessage = 'Password is too weak. Please choose a stronger password with at least 8 characters.';
        console.log('📍 Error type: Weak password');
      }
      // Generic auth errors
      else {
        // For security, show generic message for unknown auth errors
        errorMessage = 'Invalid email or password. Please try again.';
        console.log('📍 Error type: Generic auth error (security fallback)');
      }
    } else if (error?.code === 'PGRST116') {
      // PostgreSQL row-level security error
      errorMessage = 'Access denied. Please check your credentials and try again.';
      console.log('📍 Error type: PostgreSQL RLS error');
    } else {
      // Network or other errors without message
      errorMessage = 'Connection error. Please check your internet and try again.';
      console.log('📍 Error type: Unknown error (network fallback)');
    }

    console.log('📢 Final error message to user:', errorMessage);
    setError(errorMessage);
    showNotification('error', errorMessage);
    return errorMessage;
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      showNotification('error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(forgotPasswordEmail)) {
      showNotification('error', 'Please enter a valid email address');
      return;
    }

    setIsSendingReset(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        handleAuthError(error);
      } else {
        showNotification('success', 'Password reset link sent! Please check your email.');
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
      }
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsSendingReset(false);
    }
  };

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
    if (!validateForm()) {
      showNotification('error', 'Please fix the validation errors');
      return;
    }

    // For sign up, check username uniqueness
    if (isSignUp) {
      const isUsernameUnique = await checkUsernameUniqueness(username);
      if (!isUsernameUnique) {
        setValidationErrors(prev => ({ ...prev, username: 'Username is already taken' }));
        showNotification('error', 'Username is already taken');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Sign up flow with additional metadata
        const data = await signUpWithEmail(email, password);

        if (data.user) {
          // Store additional user data in metadata
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              full_name: fullName,
              username: username,
              display_name: fullName
            }
          });

          if (updateError) {
            console.error('Error updating user metadata:', updateError);
          }

          if (!data.user.email_confirmed_at) {
            showNotification('error', 'Please check your email and click the verification link before signing in.');
            onAuthError?.('Please verify your email before signing in. Check your inbox for the verification link.');
            return;
          }

          const userData = {
            id: data.user.id,
            email: data.user.email,
            name: fullName,
            username: username,
            picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
            provider: 'supabase'
          };

          setUserInfo(userData);
          setIsAuthenticated(true);
          onAuthSuccess?.(userData);
          showNotification('success', 'Account created successfully!');
        }
      } else {
        // Sign in flow
        const data = await signInWithEmail(email, password);

        if (data.user) {
          if (!data.user.email_confirmed_at) {
            showNotification('error', 'Please verify your email before signing in. Check your inbox for the verification link.');
            onAuthError?.('Please verify your email before signing in. Check your inbox for the verification link.');
            return;
          }

          const userData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
            username: data.user.user_metadata?.username || '',
            picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User')}&background=random`,
            provider: 'supabase'
          };

          setUserInfo(userData);
          setIsAuthenticated(true);
          onAuthSuccess?.(userData);
          showNotification('success', 'Signed in successfully!');
        }
      }

    } catch (err) {
      // Use the enhanced error handling
      const errorMessage = handleAuthError(err);
      onAuthError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setUserInfo(null);
      setFullName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setValidationErrors({});
      showNotification('success', 'Signed out successfully');
      onAuthError?.('Signed out successfully');
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  const renderAuthForm = () => (
    <div className="max-w-md mx-auto p-6 space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg border ${
          notification.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {showForgotPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Sign In')}
        </h2>
        <p className="text-gray-600">
          {showForgotPassword
            ? 'Enter your email to receive a password reset link'
            : isSignUp
              ? 'Join Productive Path today'
              : 'Welcome back to Productive Path'
          }
        </p>
      </div>

      {!showForgotPassword ? (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleEmailAuth(); }}>
          {/* Full Name Field - Only show for sign up */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setValidationErrors(prev => ({ ...prev, fullName: '' }));
                  clearErrors();
                }}
                onFocus={handleInputFocus}
                onKeyPress={handleKeyPress}
                placeholder="John Doe"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.fullName
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
              />
              {validationErrors.fullName && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.fullName}</p>
              )}
            </div>
          )}

          {/* Username Field - Only show for sign up */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setValidationErrors(prev => ({ ...prev, username: '' }));
                  clearErrors();
                }}
                onFocus={handleInputFocus}
                onKeyPress={handleKeyPress}
                placeholder="johndoe"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.username
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
              />
              {validationErrors.username && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.username}</p>
              )}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setValidationErrors(prev => ({ ...prev, email: '' }));
                clearErrors();
              }}
              onFocus={handleInputFocus}
              onKeyPress={handleKeyPress}
              placeholder="your@email.com"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.email
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
            />
            {validationErrors.email && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationErrors(prev => ({ ...prev, password: '' }));
                  clearErrors();
                }}
                onFocus={handleInputFocus}
                onKeyPress={handleKeyPress}
                placeholder="••••••••"
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.password
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {validationErrors.password && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
            )}
          </div>

          {/* Confirm Password Field - Only show for sign up */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
                    clearErrors();
                  }}
                  onFocus={handleInputFocus}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••••"
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.confirmPassword
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Remember Me and Forgot Password - Only show for sign in */}
          {!isSignUp && (
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember Me</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPasswordToggle}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
              type="button"
              onClick={handleModeChange}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </form>
      ) : (
        // Forgot Password Form
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={forgotPasswordEmail}
              onChange={(e) => {
                setForgotPasswordEmail(e.target.value);
                clearErrors();
              }}
              onFocus={handleInputFocus}
              onKeyPress={handleKeyPress}
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSendingReset}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSendingReset ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending Reset Link...</span>
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                <span>Send Reset Link</span>
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleForgotPasswordToggle}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      )}
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
        className="w-full py-2 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg font-medium transition-colors duration-200"
      >
        Continue to Dashboard
      </button>
    </div>
  );

  return isAuthenticated && userInfo ? renderUserInfo() : renderAuthForm();
};

export default SupabaseAuth;