import React, { useState } from 'react';
import { SupabaseAuth } from '../components/auth/SupabaseAuth';
import { CheckCircle, ArrowRight, Shield, Users, Mail, Calendar } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess?: (userInfo: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'auth'>('welcome');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthSuccess = (userInfo: any) => {
    setIsAuthenticated(true);
    onAuthSuccess?.(userInfo);
  };

  const handleAuthError = (error: string) => {
    console.error('Authentication error:', error);
  };

  const renderWelcomeStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">
            Welcome to Your Productivity Hub
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Connect your Google account to sync your calendar, emails, and contacts in one secure, beautifully designed workspace
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/50 border border-white/20 p-6 hover:shadow-xl hover:shadow-slate-300/60 transition-all duration-300 hover:-translate-y-0.5">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md shadow-blue-500/30">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Calendar Sync</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Access all your Google Calendar events and manage your schedule effortlessly with our intuitive interface
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/50 border border-white/20 p-6 hover:shadow-xl hover:shadow-slate-300/60 transition-all duration-300 hover:-translate-y-0.5">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-4 shadow-md shadow-emerald-500/30">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Gmail Integration</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Read and manage your Gmail messages without leaving the application with seamless email workflow
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/50 border border-white/20 p-6 hover:shadow-xl hover:shadow-slate-300/60 transition-all duration-300 hover:-translate-y-0.5">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-md shadow-violet-500/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Contact Management</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Access your Google Contacts and keep your professional network organized with smart contact tools
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/50 border border-white/20 p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/30 flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                🔒 Enterprise-Grade Security
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-medium">OAuth 2.0 authentication</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-medium">No app passwords required</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-medium">Encrypted data transmission</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-medium">Secure session management</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <button
            onClick={() => setCurrentStep('auth')}
            className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 transition-all duration-300 text-base"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-slate-500 mt-4 text-sm">
            One-click authentication with your Google account
          </p>
        </div>
      </div>
    </div>
  );

  const renderAuthStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Back Button */}
        <button
          onClick={() => setCurrentStep('welcome')}
          className="mb-6 text-slate-600 hover:text-slate-900 flex items-center gap-2 p-2 bg-white/50 backdrop-blur-sm rounded-lg hover:bg-white/70 transition-all duration-200 group"
        >
          <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="text-sm font-medium">Back to welcome</span>
        </button>

        {/* Auth Component */}
        <SupabaseAuth
          onAuthSuccess={handleAuthSuccess}
          onAuthError={handleAuthError}
        />

        {/* Success Message */}
        {isAuthenticated && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-800 rounded-xl shadow-md shadow-emerald-500/20">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-sm">Authentication successful! Redirecting to dashboard...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return currentStep === 'welcome' ? renderWelcomeStep() : renderAuthStep();
};

export default AuthPage;