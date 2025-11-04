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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your Productivity Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect your Google account to sync your calendar, emails, and contacts in one secure place
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar Sync</h3>
            <p className="text-gray-600">
              Access all your Google Calendar events and manage your schedule effortlessly
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gmail Integration</h3>
            <p className="text-gray-600">
              Read and manage your Gmail messages without leaving the application
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Management</h3>
            <p className="text-gray-600">
              Access your Google Contacts and keep your professional network organized
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 mb-8">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                🔒 Enterprise-Grade Security
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span>OAuth 2.0 authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span>No app passwords required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span>Encrypted data transmission</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span>Secure session management</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <button
            onClick={() => setCurrentStep('auth')}
            className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-500 mt-3">
            One-click authentication with your Google account
          </p>
        </div>
      </div>
    </div>
  );

  const renderAuthStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <button
          onClick={() => setCurrentStep('welcome')}
          className="mb-8 text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to welcome
        </button>

        {/* Auth Component */}
        <SupabaseAuth
          onAuthSuccess={handleAuthSuccess}
          onAuthError={handleAuthError}
        />

        {/* Success Message */}
        {isAuthenticated && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 text-green-800 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Authentication successful! Redirecting to dashboard...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return currentStep === 'welcome' ? renderWelcomeStep() : renderAuthStep();
};

export default AuthPage;