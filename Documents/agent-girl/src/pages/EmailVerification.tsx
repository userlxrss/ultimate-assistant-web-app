import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, ArrowRight, Mail, Clock } from 'lucide-react';
import { supabase } from '../supabase';

type VerificationStatus = 'loading' | 'success' | 'error' | 'already_verified' | 'expired';

interface EmailVerificationProps {
  onGoToSignIn?: () => void;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({ onGoToSignIn }) => {
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [countdown, setCountdown] = useState(5);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Process the email verification from URL params
    processEmailVerification();
  }, []);

  useEffect(() => {
    // Start countdown timer on success
    if (status === 'success' && countdown > 0 && !isRedirecting) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && status === 'success' && !isRedirecting) {
      handleRedirectToSignIn();
    }
  }, [countdown, status, isRedirecting]);

  const processEmailVerification = async () => {
    try {
      // Get the URL hash/parameters from Supabase email confirmation
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      // Look for access_token, refresh_token, and error in both search params and hash
      const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
      const error = urlParams.get('error') || hashParams.get('error');
      const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

      console.log('🔍 Email verification params:', {
        accessToken: !!accessToken,
        refreshToken: !!refreshToken,
        error,
        errorDescription,
        search: window.location.search,
        hash: window.location.hash
      });

      if (error) {
        console.error('❌ Email verification error:', error, errorDescription);

        if (error === 'expired_token' || errorDescription?.toLowerCase().includes('expired')) {
          setStatus('expired');
          setErrorMessage('This verification link has expired. Please request a new one.');
        } else {
          setStatus('error');
          setErrorMessage(errorDescription || 'Verification failed. Please try again.');
        }
        return;
      }

      if (!accessToken) {
        setStatus('error');
        setErrorMessage('Invalid verification link. Please request a new verification email.');
        return;
      }

      // Use the access token to verify the user session
      const { data: { user }, error: verifyError } = await supabase.auth.getUser(accessToken);

      if (verifyError) {
        console.error('❌ User verification error:', verifyError);

        if (verifyError.message?.toLowerCase().includes('already confirmed') ||
            verifyError.message?.toLowerCase().includes('verified')) {
          setStatus('already_verified');
        } else if (verifyError.message?.toLowerCase().includes('expired')) {
          setStatus('expired');
          setErrorMessage('This verification link has expired. Please request a new one.');
        } else {
          setStatus('error');
          setErrorMessage('Verification failed. Please try again.');
        }
        return;
      }

      if (user) {
        console.log('✅ Email verification successful for user:', user.email);

        // Check if email is confirmed
        if (user.email_confirmed_at) {
          setStatus('success');
        } else {
          // Try to confirm the email using the session
          const { error: confirmError } = await supabase.auth.updateUser({
            email_confirm: true
          });

          if (confirmError) {
            console.error('❌ Email confirmation error:', confirmError);
            setStatus('error');
            setErrorMessage('Failed to confirm email. Please try again.');
          } else {
            setStatus('success');
          }
        }
      } else {
        setStatus('error');
        setErrorMessage('No user found. Please sign up first.');
      }

    } catch (error) {
      console.error('❌ Unexpected verification error:', error);
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  const handleRedirectToSignIn = () => {
    setIsRedirecting(true);
    console.log('🚀 Redirecting to sign in...');

    // Clear the URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);

    if (onGoToSignIn) {
      onGoToSignIn();
    } else {
      // Fallback: redirect to sign in
      window.location.href = '/login';
    }
  };

  const renderLoadingState = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-6">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          Verifying Your Email...
        </h1>
        <p className="text-slate-600">
          Please wait while we confirm your email address.
        </p>
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg shadow-emerald-500/30 mb-6">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Email Verified Successfully!
        </h1>

        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
          Your email has been confirmed. You can now sign in to your account.
        </p>

        {/* Countdown Timer */}
        <div className="mb-6 p-4 bg-white/70 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg">
          <div className="flex items-center justify-center gap-2 text-emerald-700">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">
              Redirecting to sign in {countdown}...
            </span>
          </div>
        </div>

        {/* Manual Redirect Button */}
        <button
          onClick={handleRedirectToSignIn}
          disabled={isRedirecting}
          className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isRedirecting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Redirecting...</span>
            </>
          ) : (
            <>
              <span>Go to Sign In</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-sm text-slate-500 mt-4">
          You will be automatically redirected in {countdown} seconds
        </p>
      </div>
    </div>
  );

  const renderAlreadyVerifiedState = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-6">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          Email Already Verified
        </h1>

        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
          Your email is already verified. You can sign in to your account now.
        </p>

        <button
          onClick={handleRedirectToSignIn}
          className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all duration-300"
        >
          <span>Go to Sign In</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg shadow-red-500/30 mb-6">
          <AlertCircle className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          Verification Failed
        </h1>

        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
          {errorMessage || 'An error occurred during email verification.'}
        </p>

        {status === 'expired' ? (
          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/signup'}
              className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all duration-300"
            >
              <Mail className="w-5 h-5" />
              <span>Request New Verification Email</span>
            </button>

            <button
              onClick={() => window.location.href = '/login'}
              className="block mx-auto text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all duration-300"
            >
              <span>Try Again</span>
            </button>

            <button
              onClick={() => window.location.href = '/login'}
              className="block mx-auto text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Go to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );

  switch (status) {
    case 'loading':
      return renderLoadingState();
    case 'success':
      return renderSuccessState();
    case 'already_verified':
      return renderAlreadyVerifiedState();
    case 'error':
    case 'expired':
      return renderErrorState();
    default:
      return renderLoadingState();
  }
};

export default EmailVerification;