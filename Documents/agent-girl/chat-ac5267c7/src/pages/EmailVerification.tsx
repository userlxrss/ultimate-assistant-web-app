import React from 'react';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';

const EmailVerification: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Email Verified
          </h1>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your email has been successfully verified. You can now use all features of the application.
          </p>

          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Application
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;