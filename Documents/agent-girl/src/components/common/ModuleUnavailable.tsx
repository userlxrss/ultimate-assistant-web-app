import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ModuleUnavailableProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  description?: string;
  status?: string;
}

const ModuleUnavailable: React.FC<ModuleUnavailableProps> = ({
  icon,
  title,
  message,
  description,
  status = "Under Maintenance"
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-dusty-blue-50 to-soft-lavender-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
      <div className="glass-card rounded-2xl p-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center text-white mx-auto mb-4">
          {icon}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h2>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {message}
              </p>
            </div>
          </div>
        </div>

        {description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            {description}
          </p>
        )}

        <div className="mt-6 text-xs text-gray-500 dark:text-gray-500">
          Status: {status}
        </div>
      </div>
    </div>
  );
};

export default ModuleUnavailable;