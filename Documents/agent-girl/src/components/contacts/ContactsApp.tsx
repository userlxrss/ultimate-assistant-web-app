import React from 'react';
import { Users, AlertCircle } from 'lucide-react';

const ContactsApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-dusty-blue-50 to-soft-lavender-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
      <div className="glass-card rounded-2xl p-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center text-white mx-auto mb-4">
          <Users className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Contacts Unavailable
        </h2>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                The Contacts module is currently unavailable due to technical issues. We're working to resolve this problem.
              </p>
            </div>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm">
          This feature has been temporarily disabled while we troubleshoot connectivity issues with Google Contacts integration.
        </p>

        <div className="mt-6 text-xs text-gray-500 dark:text-gray-500">
          Status: Under Maintenance
        </div>
      </div>
    </div>
  );
};

export default ContactsApp;