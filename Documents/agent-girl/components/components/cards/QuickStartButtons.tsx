import React from 'react';
import { useTheme } from '../../../index';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

export const QuickStartButtons: React.FC = () => {
  const { theme } = useTheme();

  const quickActions: QuickAction[] = [
    {
      id: 'journal',
      title: 'Write Journal',
      description: 'Record your thoughts and feelings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-blue-500 to-indigo-600',
      action: () => console.log('Opening journal...'),
    },
    {
      id: 'tasks',
      title: 'Add Task',
      description: 'Create a new task or reminder',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      color: 'from-green-500 to-emerald-600',
      action: () => console.log('Adding new task...'),
    },
    {
      id: 'meditation',
      title: 'Start Meditation',
      description: 'Begin a mindfulness session',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-700',
      action: () => console.log('Starting meditation...'),
    },
    {
      id: 'goals',
      title: 'Track Goal',
      description: 'Update your goal progress',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-amber-500 to-orange-600',
      action: () => console.log('Tracking goal...'),
    },
    {
      id: 'habits',
      title: 'Log Habit',
      description: 'Mark habit completion',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'from-cyan-500 to-blue-600',
      action: () => console.log('Logging habit...'),
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      description: 'Check your progress and insights',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'from-pink-500 to-rose-600',
      action: () => console.log('Opening analytics...'),
    },
  ];

  return (
    <div className="premium-glass-card premium-padding-lg premium-animate-in premium-glow-blue">
      <h3 className="premium-text-primary premium-heading-3 mb-6">Quick Start Actions</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={`
              premium-glass-card premium-padding-lg premium-hover-lift
              text-left transition-all duration-300 group
              relative overflow-hidden
            `}
          >
            {/* Gradient Background Overlay */}
            <div className={`
              absolute inset-0 bg-gradient-to-br ${action.color} opacity-0
              group-hover:opacity-10 transition-opacity duration-500
            `} />

            {/* Content */}
            <div className="relative z-10">
              <div className={`
                w-14 h-14 premium-rounded-xl
                flex items-center justify-center mb-4
                group-hover:scale-110 transition-transform duration-300
                bg-gradient-to-br ${action.color} text-white shadow-lg
              `}>
                {action.icon}
              </div>

              <h4 className="premium-text-primary font-semibold mb-2 group-hover:text-blue-300 transition-colors">
                {action.title}
              </h4>

              <p className="premium-text-tiny">
                {action.description}
              </p>

              {/* Hover Arrow */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Shimmer Effect */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:translate-x-full"></div>
            </div>
          </button>
        ))}
      </div>

      {/* Premium Bottom Action */}
      <div className="premium-padding-lg border-t premium-border-medium">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="premium-text-primary font-semibold mb-2">Need help getting started?</h4>
            <p className="premium-text-tiny">
              Take a guided tour of all premium features
            </p>
          </div>
          <button className="premium-button premium-hover-glow px-8">
            Start Tour
          </button>
        </div>
      </div>
    </div>
  );
};